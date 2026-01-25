#!/usr/bin/env python3
"""
AI髪型シミュレーター - バックエンドサーバー
Vertex AI (Gemini) を使用して髪型シミュレーションを行います
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import os
import json
import base64
from datetime import datetime, timedelta
import re
from PIL import Image
import io
import hashlib
import tempfile

# Get the base directory (where Dockerfile copies files)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# サービスアカウントキー（JSON）を環境変数から読み込み
GCP_CREDENTIALS_JSON = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID')
GCP_LOCATION = os.environ.get('GCP_LOCATION', 'us-central1')

# サービスアカウントキーがある場合、一時ファイルに書き出して認証
if GCP_CREDENTIALS_JSON:
    try:
        # JSONをパースしてプロジェクトIDを取得
        creds_dict = json.loads(GCP_CREDENTIALS_JSON)
        if not GCP_PROJECT_ID:
            GCP_PROJECT_ID = creds_dict.get('project_id')

        # 一時ファイルに書き出し
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(GCP_CREDENTIALS_JSON)
            credentials_path = f.name

        # 環境変数に設定
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
        print(f"サービスアカウント認証設定完了: {credentials_path}")
    except Exception as e:
        print(f"認証設定エラー: {e}")

# Vertex AIの初期化
if GCP_PROJECT_ID:
    vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION)
    print(f"Vertex AI初期化完了: project={GCP_PROJECT_ID}, location={GCP_LOCATION}")
else:
    print("警告: GCP_PROJECT_IDが設定されていません")
    print("export GCP_PROJECT_ID='your-project-id' を実行してください")

# キャッシュ管理（メモリ内辞書）
cache = {}
CACHE_TTL_HOURS = 24


def generate_image_hash(image_data: str) -> str:
    """画像データからSHA256ハッシュを生成"""
    if 'base64,' in image_data:
        image_data = image_data.split('base64,')[1]
    image_bytes = base64.b64decode(image_data)
    return hashlib.sha256(image_bytes).hexdigest()


def get_cached_result(image_hash: str) -> dict:
    """キャッシュから結果を取得"""
    if image_hash not in cache:
        return None

    cached_item = cache[image_hash]
    timestamp = cached_item['timestamp']

    if datetime.now() - timestamp > timedelta(hours=CACHE_TTL_HOURS):
        del cache[image_hash]
        return None

    return cached_item['result']


def set_cached_result(image_hash: str, result_id: str, result: dict):
    """結果をキャッシュに保存"""
    cache[image_hash] = {
        'result': result,
        'result_id': result_id,
        'timestamp': datetime.now()
    }


@app.route('/')
def index():
    """トップページを表示"""
    return send_from_directory(FRONTEND_DIR, 'hairstyle.html')


@app.route('/<path:path>')
def serve_static(path):
    """静的ファイルを配信"""
    return send_from_directory(FRONTEND_DIR, path)


@app.route('/api/v1/vision/hairstyle', methods=['POST'])
def analyze_hairstyle():
    """
    顔写真から似合う髪型を5つ提案

    リクエスト:
        face: 顔写真（Base64エンコード）

    レスポンス:
        faceAnalysis: 顔の分析結果
        suggestions: 5つの髪型提案
    """
    try:
        data = request.get_json()
        if not data or 'face' not in data:
            return jsonify({'error': '顔写真が必要です'}), 400

        face_data = data['face']

        # ハッシュを生成
        face_hash = generate_image_hash(face_data)
        analysis_id = f"hairstyle_{face_hash[:32]}"

        print(f"ヘアスタイル分析ID: {analysis_id}")

        if not GCP_PROJECT_ID:
            return jsonify({
                'error': 'API設定エラー',
                'message': 'GCP_PROJECT_IDが設定されていません。環境変数を確認してください。'
            }), 500

        print("Vertex AI (Gemini) で顔分析・髪型提案中...")

        model = GenerativeModel('gemini-2.0-flash-lite')

        if 'base64,' in face_data:
            face_data = face_data.split('base64,')[1]

        face_bytes = base64.b64decode(face_data)
        face_image = Part.from_data(face_bytes, mime_type="image/jpeg")

        prompt = """この顔写真を分析して、似合う髪型を5つ提案してください。

以下の情報をJSON形式で返してください:

{
  "faceAnalysis": {
    "faceShape": "顔型（卵型、丸型、四角型、逆三角型、面長、ベース型のいずれか）",
    "features": "顔の特徴（目、鼻、輪郭、額の広さなど）",
    "currentHair": "現在の髪型の説明",
    "skinTone": "肌の色味"
  },
  "suggestions": [
    {
      "rank": 1,
      "name": "髪型名（例：ショートボブ）",
      "length": "ショート/ミディアム/ロング",
      "description": "髪型の詳細説明",
      "whyGood": "この顔型に似合う理由",
      "styling": "スタイリング方法",
      "bangs": "前髪のおすすめ（あり/なし/シースルー等）",
      "color": "おすすめカラー",
      "matchScore": 95
    },
    // ... 5つ提案
  ],
  "salonOrder": "美容院でのオーダー方法（最も似合う髪型について）"
}

JSON形式のみ返してください。"""

        response = model.generate_content([prompt, face_image])
        response_text = response.text

        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)

        result = json.loads(response_text)
        result['analysisId'] = analysis_id

        print(f"分析完了: {len(result.get('suggestions', []))}個の髪型を提案")

        return jsonify(result), 200

    except json.JSONDecodeError as e:
        print(f"JSON パースエラー: {e}")
        print(f"レスポンス: {response_text}")
        return jsonify({
            'error': 'JSONパースエラー',
            'message': 'Gemini APIからの応答を解析できませんでした。'
        }), 500
    except Exception as e:
        print(f"ヘアスタイル分析エラー: {e}")
        return jsonify({'error': f'分析エラー: {str(e)}'}), 500


@app.route('/api/v1/vision/hairstyle/generate', methods=['POST'])
def generate_hairstyle():
    """
    顔写真とプリセット/参照画像から、髪型を変更した画像を生成

    リクエスト:
        face: 顔写真（Base64エンコード）
        hairstyle: 髪型参照画像（Base64エンコード、オプション）
        preset: プリセットのプロンプト（オプション）
        presetName: プリセット名（オプション）
        gender: メンズ/レディース（オプション）

    レスポンス:
        generatedImage: 生成された画像（Base64エンコード）
    """
    try:
        data = request.get_json()
        if not data or 'face' not in data:
            return jsonify({'error': '顔写真が必要です'}), 400

        face_data = data['face']
        hairstyle_data = data.get('hairstyle')
        preset = data.get('preset')
        preset_name = data.get('presetName')
        gender = data.get('gender', 'mens')

        if not preset and not hairstyle_data:
            return jsonify({'error': '髪型を選択するか参照画像をアップロードしてください'}), 400

        if not GCP_PROJECT_ID:
            return jsonify({
                'error': 'API設定エラー',
                'message': 'GCP_PROJECT_IDが設定されていません。'
            }), 500

        print(f"Gemini 2.5 Flash Image で髪型合成中... (プリセット: {preset_name or '画像参照'})")

        os.environ['GOOGLE_CLOUD_PROJECT'] = GCP_PROJECT_ID
        os.environ['GOOGLE_CLOUD_LOCATION'] = 'global'
        os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

        from google import genai
        from google.genai.types import GenerateContentConfig, Modality

        client = genai.Client()

        if 'base64,' in face_data:
            face_data = face_data.split('base64,')[1]

        face_bytes = base64.b64decode(face_data)
        face_image = Image.open(io.BytesIO(face_bytes))

        contents = [face_image]

        if hairstyle_data:
            if 'base64,' in hairstyle_data:
                hairstyle_data = hairstyle_data.split('base64,')[1]
            hairstyle_bytes = base64.b64decode(hairstyle_data)
            hairstyle_image = Image.open(io.BytesIO(hairstyle_bytes))
            contents.append(hairstyle_image)

            if preset:
                prompt = f"""この人物の顔写真の髪型を変更してください。

髪型スタイル: {preset_name} ({preset})
2枚目の画像は雰囲気の参考です。

指示:
- 顔の特徴（目、鼻、口、肌など）は完全に維持
- 髪型のみを指定されたスタイルに変更
- 自然で違和感のない仕上がりに
- 画像を1枚生成してください"""
            else:
                prompt = """1枚目は人物の顔写真です。2枚目は髪型の参考画像です。
1枚目の人物の髪型を、2枚目の雰囲気を参考に変更した画像を生成してください。
※完全なコピーではなく、似た雰囲気のスタイルにしてください。
顔の特徴はそのまま維持し、髪型のみを変更してください。
自然で違和感のない仕上がりにしてください。"""
        else:
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
            model="gemini-2.5-flash-image",
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

        print("髪型合成完了！")

        return jsonify({
            'generatedImage': f'data:image/png;base64,{generated_image_base64}',
            'message': response_text
        }), 200

    except Exception as e:
        print(f"髪型生成エラー: {e}")
        return jsonify({'error': f'生成エラー: {str(e)}'}), 500


@app.route('/api/v1/vision/hairstyle/adjust', methods=['POST'])
def adjust_hairstyle():
    """
    生成済み画像の髪型を調整して再生成

    リクエスト:
        face: 顔写真（Base64エンコード）
        currentImage: 現在の生成画像（Base64エンコード）
        preset: 元のプリセットプロンプト（オプション）
        adjustments: 調整内容
            - length: 長さの調整
            - color: 色の調整
            - style: スタイルの調整

    レスポンス:
        generatedImage: 調整後の画像（Base64エンコード）
    """
    try:
        data = request.get_json()
        if not data or 'face' not in data:
            return jsonify({'error': '顔写真が必要です'}), 400

        face_data = data['face']
        current_image_data = data.get('currentImage')
        preset = data.get('preset', '')
        adjustments = data.get('adjustments', {})

        if not GCP_PROJECT_ID:
            return jsonify({
                'error': 'API設定エラー',
                'message': 'GCP_PROJECT_IDが設定されていません。'
            }), 500

        print("髪型調整中...")

        os.environ['GOOGLE_CLOUD_PROJECT'] = GCP_PROJECT_ID
        os.environ['GOOGLE_CLOUD_LOCATION'] = 'global'
        os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

        from google import genai
        from google.genai.types import GenerateContentConfig, Modality

        client = genai.Client()

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
            model="gemini-2.5-flash-image",
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

        print("髪型調整完了！")

        return jsonify({
            'generatedImage': f'data:image/png;base64,{generated_image_base64}',
            'message': response_text
        }), 200

    except Exception as e:
        print(f"髪型調整エラー: {e}")
        return jsonify({'error': f'調整エラー: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({
        'status': 'ok',
        'api_configured': GCP_PROJECT_ID is not None,
        'project_id': GCP_PROJECT_ID,
        'location': GCP_LOCATION
    }), 200


# プリセット定義
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


@app.route('/api/v1/admin/generate-preset/<gender>/<preset_id>', methods=['POST'])
def generate_preset_image(gender, preset_id):
    """
    プリセットサムネイル画像を生成（管理用）

    パス:
        gender: mens または ladies
        preset_id: プリセットID（short, bob など）
    """
    try:
        if gender not in HAIRSTYLE_PRESETS:
            return jsonify({'error': '無効なジェンダー'}), 400

        preset = next((p for p in HAIRSTYLE_PRESETS[gender] if p['id'] == preset_id), None)
        if not preset:
            return jsonify({'error': '無効なプリセットID'}), 400

        if preset['prompt'] is None:
            # 「なし」の場合はプレースホルダーを返す
            img = Image.new('RGB', (144, 144), color='#F5F5F5')
            from PIL import ImageDraw
            draw = ImageDraw.Draw(img)
            draw.ellipse([22, 22, 122, 122], outline='#CCCCCC', width=2)
            draw.line([40, 40, 104, 104], fill='#CCCCCC', width=2)

            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

            return jsonify({
                'image': f'data:image/png;base64,{image_base64}',
                'preset': preset
            }), 200

        if not GCP_PROJECT_ID:
            return jsonify({'error': 'GCP_PROJECT_IDが設定されていません'}), 500

        os.environ['GOOGLE_CLOUD_PROJECT'] = GCP_PROJECT_ID
        os.environ['GOOGLE_CLOUD_LOCATION'] = 'global'
        os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

        from google import genai
        from google.genai.types import GenerateContentConfig, Modality

        gender_ja = 'メンズ' if gender == 'mens' else 'レディース'
        gender_en = 'man' if gender == 'mens' else 'woman'

        prompt = f"""Generate a hairstyle sample image for a mobile app preset button.

Requirements:
- Show ONLY the hairstyle on a simple mannequin head silhouette
- Pure white background (#FFFFFF)
- Front-facing view, slightly angled
- {gender_en}'s hairstyle
- Hairstyle: {preset['name']} - {preset['prompt']}
- Natural hair color (dark brown or black)
- Clean, professional look suitable for a beauty app
- The image should be square, suitable for a small thumbnail (72x72px display)
- Focus on the hair shape and style, not facial features
- Minimal, modern aesthetic

Style reference: Beauty app preset thumbnails like BeautyPlus or SNOW app"""

        client = genai.Client()

        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[prompt],
            config=GenerateContentConfig(
                response_modalities=[Modality.TEXT, Modality.IMAGE]
            ),
        )

        image_base64 = None
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                image_base64 = base64.b64encode(part.inline_data.data).decode('utf-8')
                break

        if not image_base64:
            return jsonify({'error': '画像生成に失敗しました'}), 500

        # 画像を保存
        output_dir = os.path.join(FRONTEND_DIR, 'images', 'presets', gender)
        os.makedirs(output_dir, exist_ok=True)

        output_path = os.path.join(output_dir, f'{preset_id}.png')
        with open(output_path, 'wb') as f:
            f.write(base64.b64decode(image_base64))

        print(f"プリセット画像生成完了: {output_path}")

        return jsonify({
            'image': f'data:image/png;base64,{image_base64}',
            'path': f'/images/presets/{gender}/{preset_id}.png',
            'preset': preset
        }), 200

    except Exception as e:
        print(f"プリセット画像生成エラー: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/admin/generate-all-presets', methods=['POST'])
def generate_all_preset_images():
    """
    全プリセットサムネイル画像を一括生成（管理用）
    """
    results = {'success': [], 'failed': []}

    for gender in ['mens', 'ladies']:
        for preset in HAIRSTYLE_PRESETS[gender]:
            try:
                # 内部的にgenerate_preset_imageを呼び出す
                with app.test_request_context():
                    response = generate_preset_image(gender, preset['id'])
                    if response[1] == 200:
                        results['success'].append(f"{gender}/{preset['id']}")
                    else:
                        results['failed'].append(f"{gender}/{preset['id']}")
            except Exception as e:
                results['failed'].append(f"{gender}/{preset['id']}: {str(e)}")

    return jsonify(results), 200


if __name__ == '__main__':
    port = 8080  # Fixed port for Coolify
    print(f"サーバーを起動しています: http://localhost:{port}")
    if GCP_PROJECT_ID:
        print(f"Vertex AI設定済み: project={GCP_PROJECT_ID}, location={GCP_LOCATION}")
    else:
        print("警告: GCP_PROJECT_IDが未設定です")

    app.run(host='0.0.0.0', port=port, debug=True)
