#!/usr/bin/env python3
"""
プリセット髪型サンプル画像を生成するスクリプト
Gemini 2.5 Flash Image を使用して統一感のあるサンプル画像を生成
"""

import os
import sys
import json
import tempfile
import base64
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 環境変数の設定
GCP_CREDENTIALS_JSON = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID')

if GCP_CREDENTIALS_JSON:
    try:
        creds_dict = json.loads(GCP_CREDENTIALS_JSON)
        if not GCP_PROJECT_ID:
            GCP_PROJECT_ID = creds_dict.get('project_id')

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(GCP_CREDENTIALS_JSON)
            credentials_path = f.name

        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
        print(f"認証設定完了: {credentials_path}")
    except Exception as e:
        print(f"認証設定エラー: {e}")
        sys.exit(1)

if not GCP_PROJECT_ID:
    print("エラー: GCP_PROJECT_ID が設定されていません")
    print("export GCP_PROJECT_ID='your-project-id'")
    sys.exit(1)

os.environ['GOOGLE_CLOUD_PROJECT'] = GCP_PROJECT_ID
os.environ['GOOGLE_CLOUD_LOCATION'] = 'global'
os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

from google import genai
from google.genai.types import GenerateContentConfig, Modality

# プリセット定義
PRESETS = {
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

# 出力ディレクトリ
BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / 'frontend' / 'images' / 'presets'

def generate_preset_image(gender: str, preset: dict) -> bytes:
    """プリセット画像を生成"""

    if preset['prompt'] is None:
        # 「なし」の場合はプレースホルダー画像を返す
        return None

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

    for part in response.candidates[0].content.parts:
        if hasattr(part, 'inline_data') and part.inline_data:
            return part.inline_data.data

    return None

def create_none_placeholder(gender: str) -> bytes:
    """「なし」用のプレースホルダー画像を作成"""
    from PIL import Image, ImageDraw, ImageFont
    import io

    # 72x72のグレー画像を作成
    img = Image.new('RGB', (144, 144), color='#F5F5F5')
    draw = ImageDraw.Draw(img)

    # 円を描画
    draw.ellipse([22, 22, 122, 122], outline='#CCCCCC', width=2)

    # 斜線を描画（禁止マーク風）
    draw.line([40, 40, 104, 104], fill='#CCCCCC', width=2)

    # バイトに変換
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def main():
    print("=" * 50)
    print("プリセット髪型画像生成スクリプト")
    print("=" * 50)
    print(f"Project: {GCP_PROJECT_ID}")
    print(f"出力先: {OUTPUT_DIR}")
    print()

    # 出力ディレクトリ作成
    (OUTPUT_DIR / 'mens').mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / 'ladies').mkdir(parents=True, exist_ok=True)

    total = sum(len(presets) for presets in PRESETS.values())
    current = 0

    for gender, presets in PRESETS.items():
        print(f"\n--- {gender.upper()} ---")

        for preset in presets:
            current += 1
            print(f"[{current}/{total}] {preset['name']}...", end=' ', flush=True)

            output_path = OUTPUT_DIR / gender / f"{preset['id']}.png"

            try:
                if preset['prompt'] is None:
                    # 「なし」の場合
                    image_data = create_none_placeholder(gender)
                else:
                    image_data = generate_preset_image(gender, preset)

                if image_data:
                    with open(output_path, 'wb') as f:
                        f.write(image_data)
                    print("✓")
                else:
                    print("✗ (画像生成失敗)")

            except Exception as e:
                print(f"✗ ({e})")

    print("\n" + "=" * 50)
    print("完了！")
    print(f"生成された画像: {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
