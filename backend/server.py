#!/usr/bin/env python3
"""
AI髪型シミュレーター - バックエンドサーバー
Google AI Studio (Gemini) + Supabase認証 + Stripe課金 + クレジット制
"""

from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
import os
import json
import base64
import re
import time
import io
import hashlib
import stripe
import jwt
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict
from PIL import Image

# Get the base directory (where Dockerfile copies files)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR)

# CORS設定
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
CORS(app, origins=ALLOWED_ORIGINS)

# 画像アップロード制限 (10MB)
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

# レート制限設定
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX_REQUESTS = int(os.environ.get('RATE_LIMIT_MAX', '30'))
rate_limit_store = defaultdict(list)

# --- Supabase設定 ---
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET', '')

# --- Stripe設定 ---
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
stripe.api_key = STRIPE_SECRET_KEY

# --- Google AI Studio設定（無料API）---
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# --- 課金プラン ---
CREDIT_PLANS = {
    'starter': {'credits': 10, 'price': 300, 'name': 'スターター (10回)'},
    'standard': {'credits': 50, 'price': 980, 'name': 'スタンダード (50回)'},
    'premium': {'credits': 200, 'price': 2980, 'name': 'プレミアム (200回)'},
}

# Supabaseクライアント
supabase_auth_client = None
supabase_client = None

if SUPABASE_URL and (SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY):
    from supabase import create_client

    if SUPABASE_ANON_KEY:
        supabase_auth_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print(f"Supabase Auth接続完了: {SUPABASE_URL}")

    if SUPABASE_SERVICE_KEY:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print(f"Supabase管理接続完了: {SUPABASE_URL}")

if SUPABASE_JWT_SECRET and not (supabase_auth_client or supabase_client):
    print("Supabase JWT Secretで認証検証を有効化")

if not (supabase_auth_client or supabase_client or SUPABASE_JWT_SECRET):
    print("警告: 認証検証手段が未設定（SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SUPABASE_JWT_SECRET）")

if not supabase_client:
    print("警告: Supabase管理クライアント未設定（SUPABASE_URL, SUPABASE_SERVICE_KEY）")

if GEMINI_API_KEY:
    print("Google AI Studio API設定完了")
else:
    print("警告: GEMINI_API_KEY未設定")

if STRIPE_SECRET_KEY:
    print("Stripe設定完了")
else:
    print("警告: Stripe未設定")


# --- 認証ミドルウェア ---

def is_auth_validation_configured():
    """JWT検証手段が設定されているか"""
    return bool(supabase_auth_client or supabase_client or SUPABASE_JWT_SECRET)


def get_user_from_token(token):
    """JWTトークンからユーザー情報を取得"""
    # 方式1: Supabase APIで検証（新形式ECC対応）
    for client in (supabase_auth_client, supabase_client):
        if not client:
            continue
        try:
            result = client.auth.get_user(token)
            if result and result.user:
                return result.user.id
        except Exception:
            pass

    # 方式2: HS256シークレットで検証（Legacy）
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                audience='authenticated'
            )
            return payload.get('sub')
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            pass

    return None


def require_auth(f):
    """認証必須デコレータ"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'ログインが必要です'}), 401

        if not is_auth_validation_configured():
            return jsonify({'error': '認証サーバー設定が不足しています'}), 503

        token = auth_header.split('Bearer ')[1]
        user_id = get_user_from_token(token)

        if not user_id:
            return jsonify({'error': 'セッションが切れました。再ログインしてください'}), 401

        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated_function


def rate_limit(f):
    """レート制限デコレータ"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        now = time.time()
        rate_limit_store[client_ip] = [
            t for t in rate_limit_store[client_ip]
            if now - t < RATE_LIMIT_WINDOW
        ]
        if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            return jsonify({
                'error': 'レート制限超過',
                'message': f'{RATE_LIMIT_WINDOW}秒間に{RATE_LIMIT_MAX_REQUESTS}回までリクエストできます'
            }), 429
        rate_limit_store[client_ip].append(now)
        return f(*args, **kwargs)
    return decorated_function


def validate_image_size(image_data: str) -> bool:
    """Base64画像データのサイズを検証"""
    if 'base64,' in image_data:
        image_data = image_data.split('base64,')[1]
    try:
        decoded = base64.b64decode(image_data)
        return len(decoded) <= MAX_IMAGE_SIZE_BYTES
    except Exception:
        return False


# --- クレジット管理 ---

def get_user_credits(user_id):
    """ユーザーのクレジット残高を取得"""
    if not supabase_client:
        return 999  # Supabase未設定時は無制限
    result = supabase_client.table('profiles').select('credits, is_premium, premium_expires_at').eq('id', user_id).single().execute()
    if result.data:
        profile = result.data
        # プレミアムユーザーは無制限
        if profile.get('is_premium'):
            expires = profile.get('premium_expires_at')
            if expires and datetime.fromisoformat(expires.replace('Z', '+00:00')) > datetime.now(tz=__import__('datetime').timezone.utc):
                return -1  # -1 = 無制限
        return profile.get('credits', 0)
    return 0


def use_credit(user_id):
    """クレジットを1消費"""
    if not supabase_client:
        return True

    credits = get_user_credits(user_id)
    if credits == -1:  # プレミアム
        # 使用回数だけカウント
        supabase_client.rpc('increment_generations', {'user_id_input': user_id}).execute()
        return True
    if credits <= 0:
        return False

    # クレジット減算 & 使用回数加算
    supabase_client.table('profiles').update({
        'credits': credits - 1,
        'total_generations': supabase_client.table('profiles').select('total_generations').eq('id', user_id).single().execute().data.get('total_generations', 0) + 1,
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', user_id).execute()

    # 履歴追加
    supabase_client.table('credit_history').insert({
        'user_id': user_id,
        'amount': -1,
        'reason': '髪型生成'
    }).execute()

    return True


def add_credits(user_id, amount, reason):
    """クレジットを追加"""
    if not supabase_client:
        return
    result = supabase_client.table('profiles').select('credits').eq('id', user_id).single().execute()
    current = result.data.get('credits', 0) if result.data else 0

    supabase_client.table('profiles').update({
        'credits': current + amount,
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', user_id).execute()

    supabase_client.table('credit_history').insert({
        'user_id': user_id,
        'amount': amount,
        'reason': reason
    }).execute()


# --- ルート ---

@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'hairstyle.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)


@app.route('/api/v1/config', methods=['GET'])
def get_config():
    """フロントエンド用の設定を返す"""
    return jsonify({
        'supabaseUrl': SUPABASE_URL,
        'supabaseAnonKey': SUPABASE_ANON_KEY,
        'stripePublishableKey': STRIPE_PUBLISHABLE_KEY,
        'creditPlans': CREDIT_PLANS,
    }), 200


@app.route('/api/v1/user/profile', methods=['GET'])
@require_auth
def get_profile():
    """ユーザープロフィールとクレジット情報を取得"""
    if not supabase_client:
        return jsonify({'credits': 999, 'is_premium': False, 'total_generations': 0}), 200

    result = supabase_client.table('profiles').select('*').eq('id', request.user_id).single().execute()
    if not result.data:
        return jsonify({'error': 'プロフィールが見つかりません'}), 404

    profile = result.data
    return jsonify({
        'credits': profile.get('credits', 0),
        'is_premium': profile.get('is_premium', False),
        'total_generations': profile.get('total_generations', 0),
        'display_name': profile.get('display_name', ''),
        'avatar_url': profile.get('avatar_url', ''),
        'email': profile.get('email', ''),
    }), 200


# --- 髪型生成API ---

@app.route('/api/v1/vision/hairstyle/generate', methods=['POST'])
@require_auth
@rate_limit
def generate_hairstyle():
    """顔写真とプリセットから髪型変更画像を生成"""
    try:
        data = request.get_json()
        if not data or 'face' not in data:
            return jsonify({'error': '顔写真が必要です'}), 400

        face_data = data['face']
        preset = data.get('preset')
        preset_name = data.get('presetName')
        gender = data.get('gender', 'mens')

        if not validate_image_size(face_data):
            return jsonify({'error': f'画像サイズは{MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB以下にしてください'}), 413

        if not preset:
            return jsonify({'error': '髪型を選択してください'}), 400

        # クレジットチェック
        credits = get_user_credits(request.user_id)
        if credits == 0:
            return jsonify({
                'error': 'クレジット不足',
                'message': 'クレジットを購入してください',
                'credits': 0,
                'needCredits': True
            }), 402

        if not GEMINI_API_KEY:
            return jsonify({'error': 'API未設定', 'message': 'GEMINI_API_KEYが設定されていません'}), 500

        print(f"Gemini (AI Studio) で髪型合成中... (プリセット: {preset_name or '画像参照'})")

        from google import genai
        from google.genai.types import GenerateContentConfig, Modality

        client = genai.Client(api_key=GEMINI_API_KEY)

        if 'base64,' in face_data:
            face_data = face_data.split('base64,')[1]

        face_bytes = base64.b64decode(face_data)
        face_image = Image.open(io.BytesIO(face_bytes))

        contents = [face_image]

        gender_ja = 'メンズ' if gender == 'mens' else 'レディース'
        prompt = f"""この人物の顔写真の髪型を変更してください。

髪型スタイル: {preset_name}
詳細: {preset}
ジェンダー: {gender_ja}

指示:
- 顔の特徴（目、鼻、口、肌など）は完全に維持
- 髪型のみを指定されたスタイルに変更
- 自然で違和感のない仕上がりに
- 画像を1枚生成してください"""

        contents.append(prompt)

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-05-20",
            contents=contents,
            config=GenerateContentConfig(
                response_modalities=[Modality.TEXT, Modality.IMAGE]
            ),
        )

        generated_image_base64 = None
        response_text = ""

        for part in response.candidates[0].content.parts:
            if hasattr(part, 'text') and part.text:
                response_text = part.text
            elif hasattr(part, 'inline_data') and part.inline_data:
                image_data = part.inline_data.data
                generated_image_base64 = base64.b64encode(image_data).decode('utf-8')

        if not generated_image_base64:
            return jsonify({
                'error': '画像生成に失敗しました',
                'message': response_text or '画像が生成されませんでした'
            }), 500

        # クレジット消費
        if not use_credit(request.user_id):
            return jsonify({'error': 'クレジット不足'}), 402

        remaining_credits = get_user_credits(request.user_id)
        print("髪型合成完了！")

        return jsonify({
            'generatedImage': f'data:image/png;base64,{generated_image_base64}',
            'message': response_text,
            'credits': remaining_credits
        }), 200

    except Exception as e:
        print(f"髪型生成エラー: {e}")
        return jsonify({'error': f'生成エラー: {str(e)}'}), 500


@app.route('/api/v1/vision/hairstyle/adjust', methods=['POST'])
@require_auth
@rate_limit
def adjust_hairstyle():
    """生成済み画像の髪型を調整"""
    try:
        data = request.get_json()
        if not data or 'face' not in data:
            return jsonify({'error': '顔写真が必要です'}), 400

        face_data = data['face']
        current_image_data = data.get('currentImage')
        adjustments = data.get('adjustments', {})

        if not validate_image_size(face_data):
            return jsonify({'error': f'画像サイズは{MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB以下にしてください'}), 413

        # クレジットチェック
        credits = get_user_credits(request.user_id)
        if credits == 0:
            return jsonify({
                'error': 'クレジット不足',
                'message': 'クレジットを購入してください',
                'credits': 0,
                'needCredits': True
            }), 402

        if not GEMINI_API_KEY:
            return jsonify({'error': 'GEMINI_API_KEYが設定されていません'}), 500

        print("髪型調整中...")

        from google import genai
        from google.genai.types import GenerateContentConfig, Modality

        client = genai.Client(api_key=GEMINI_API_KEY)

        if 'base64,' in face_data:
            face_data = face_data.split('base64,')[1]
        face_bytes = base64.b64decode(face_data)
        face_image = Image.open(io.BytesIO(face_bytes))

        contents = [face_image]
        if current_image_data:
            if 'base64,' in current_image_data:
                current_image_data = current_image_data.split('base64,')[1]
            current_bytes = base64.b64decode(current_image_data)
            current_image = Image.open(io.BytesIO(current_bytes))
            contents.append(current_image)

        adj_parts = []
        if adjustments.get('length'):
            adj_parts.append(adjustments['length'])
        if adjustments.get('color'):
            adj_parts.append(adjustments['color'])
        if adjustments.get('style'):
            adj_parts.append(adjustments['style'])

        adjustment_text = ', '.join(adj_parts) if adj_parts else ''

        prompt = f"""1枚目は人物の顔写真、2枚目は現在の髪型画像です。

現在の髪型をベースに、以下の調整を加えた画像を生成してください:
{adjustment_text}

指示:
- 顔の特徴は完全に維持
- 指定された調整のみ適用
- 自然で違和感のない仕上がりに
- 画像を1枚生成してください"""

        contents.append(prompt)

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-05-20",
            contents=contents,
            config=GenerateContentConfig(
                response_modalities=[Modality.TEXT, Modality.IMAGE]
            ),
        )

        generated_image_base64 = None
        response_text = ""

        for part in response.candidates[0].content.parts:
            if hasattr(part, 'text') and part.text:
                response_text = part.text
            elif hasattr(part, 'inline_data') and part.inline_data:
                image_data = part.inline_data.data
                generated_image_base64 = base64.b64encode(image_data).decode('utf-8')

        if not generated_image_base64:
            return jsonify({
                'error': '画像生成に失敗しました',
                'message': response_text or '画像が生成されませんでした'
            }), 500

        # クレジット消費
        if not use_credit(request.user_id):
            return jsonify({'error': 'クレジット不足'}), 402

        remaining_credits = get_user_credits(request.user_id)
        print("髪型調整完了！")

        return jsonify({
            'generatedImage': f'data:image/png;base64,{generated_image_base64}',
            'message': response_text,
            'credits': remaining_credits
        }), 200

    except Exception as e:
        print(f"髪型調整エラー: {e}")
        return jsonify({'error': f'調整エラー: {str(e)}'}), 500


# --- Stripe課金API ---

@app.route('/api/v1/stripe/checkout', methods=['POST'])
@require_auth
def create_checkout():
    """Stripe Checkoutセッション作成"""
    try:
        data = request.get_json()
        plan_id = data.get('plan')

        if plan_id not in CREDIT_PLANS:
            return jsonify({'error': '無効なプランです'}), 400

        plan = CREDIT_PLANS[plan_id]
        app_url = request.host_url.rstrip('/')

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'jpy',
                    'product_data': {
                        'name': f'Hair Style Simulator - {plan["name"]}',
                        'description': f'{plan["credits"]}クレジット',
                    },
                    'unit_amount': plan['price'],
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{app_url}/?payment=success&credits={plan["credits"]}',
            cancel_url=f'{app_url}/?payment=cancel',
            metadata={
                'user_id': request.user_id,
                'plan_id': plan_id,
                'credits': str(plan['credits']),
            },
        )

        return jsonify({'url': session.url}), 200

    except Exception as e:
        print(f"Checkoutエラー: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Stripe Webhookでクレジット付与"""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            event = json.loads(payload)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            metadata = session.get('metadata', {})
            user_id = metadata.get('user_id')
            plan_id = metadata.get('plan_id')
            credits = int(metadata.get('credits', 0))

            if user_id and credits > 0:
                add_credits(user_id, credits, f'購入: {plan_id}')

                # 購入履歴記録
                if supabase_client:
                    supabase_client.table('purchases').insert({
                        'user_id': user_id,
                        'stripe_session_id': session.get('id'),
                        'stripe_payment_intent_id': session.get('payment_intent'),
                        'plan': plan_id,
                        'amount': session.get('amount_total', 0),
                        'credits_added': credits,
                        'status': 'completed',
                    }).execute()

                print(f"クレジット付与完了: user={user_id}, credits={credits}")

        return jsonify({'received': True}), 200

    except Exception as e:
        print(f"Webhookエラー: {e}")
        return jsonify({'error': str(e)}), 400


# --- ヘルスチェック ---

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'gemini_configured': bool(GEMINI_API_KEY),
        'supabase_configured': bool(supabase_auth_client or supabase_client or SUPABASE_JWT_SECRET),
        'supabase_auth_configured': is_auth_validation_configured(),
        'supabase_db_configured': bool(supabase_client),
        'stripe_configured': bool(STRIPE_SECRET_KEY),
    }), 200


@app.route('/debug/auth', methods=['POST'])
def debug_auth():
    """一時デバッグ用: トークン検証の詳細エラーを返す"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'no_bearer'}), 400
    token = auth_header.split('Bearer ')[1]

    results = {}

    for name, client in [('auth_client', supabase_auth_client), ('service_client', supabase_client)]:
        if not client:
            results[name] = 'not_configured'
            continue
        try:
            result = client.auth.get_user(token)
            if result and result.user:
                results[name] = f'ok: {result.user.id}'
            else:
                results[name] = 'no_user'
        except Exception as e:
            results[name] = f'error: {str(e)}'

    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=['HS256'], audience='authenticated')
            results['jwt'] = f'ok: {payload.get("sub")}'
        except Exception as e:
            results['jwt'] = f'error: {str(e)}'
    else:
        results['jwt'] = 'no_secret'

    return jsonify(results), 200


# --- プリセット定義 ---

HAIRSTYLE_PRESETS = {
    'mens': [
        {'id': 'none', 'name': 'なし', 'prompt': None},
        {'id': 'short', 'name': 'ショート', 'prompt': '清潔感のある短髪、サイドすっきり、トップに軽い動き'},
        {'id': 'twoblock', 'name': 'ツーブロック', 'prompt': 'サイドを刈り上げたツーブロック、トップは長めで流す'},
        {'id': 'mash', 'name': 'マッシュ', 'prompt': '丸みのあるマッシュヘア、前髪重め、柔らかい印象'},
        {'id': 'center', 'name': 'センターパート', 'prompt': 'センター分け、顔周りをフレーミング、韓国風'},
        {'id': 'wolf', 'name': 'ウルフ', 'prompt': 'ウルフカット、襟足長め、レイヤー多め、動きのあるスタイル'},
        {'id': 'perm', 'name': 'パーマ', 'prompt': 'ゆるめのパーマ、ナチュラルなウェーブ、こなれ感'},
        {'id': 'long', 'name': 'ロング', 'prompt': '肩につく長さ、ナチュラルなストレート、清潔感'},
    ],
    'ladies': [
        {'id': 'none', 'name': 'なし', 'prompt': None},
        {'id': 'short', 'name': 'ショート', 'prompt': '耳が出るショートヘア、すっきりシルエット、女性らしい'},
        {'id': 'bob', 'name': 'ボブ', 'prompt': 'あご下ラインのボブ、内巻き、清楚な印象'},
        {'id': 'lob', 'name': 'ロブ', 'prompt': '肩につくロングボブ、外ハネ、こなれ感'},
        {'id': 'medium', 'name': 'ミディアム', 'prompt': '鎖骨ラインのミディアム、レイヤー入り、ナチュラル'},
        {'id': 'layer', 'name': 'レイヤー', 'prompt': 'たっぷりレイヤーの動きのあるスタイル、顔周りに軽さ'},
        {'id': 'long', 'name': 'ロング', 'prompt': '胸下までのロングヘア、つやつやストレート、清楚'},
        {'id': 'wave', 'name': 'ウェーブ', 'prompt': 'ゆるふわウェーブ、巻き髪、華やかな印象'},
    ]
}


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    print(f"サーバーを起動しています: http://localhost:{port}")
    print(f"Gemini API: {'設定済み' if GEMINI_API_KEY else '未設定'}")
    print(f"Supabase Auth: {'設定済み' if is_auth_validation_configured() else '未設定'}")
    print(f"Supabase DB: {'設定済み' if supabase_client else '未設定'}")
    print(f"Stripe: {'設定済み' if STRIPE_SECRET_KEY else '未設定'}")
    app.run(host='0.0.0.0', port=port, debug=debug)
