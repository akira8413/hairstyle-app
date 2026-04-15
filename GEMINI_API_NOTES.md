# Gemini API キー設定メモ

## 経緯

### 最初の状態（課金されていた）
- Google AI Studio (aistudio.google.com) で作成したキー `...2IGs` を使用
- しかしこのキーは GCP の請求先アカウントに紐付いていたため **Tier 1（後払い）** になっていた
- 4月から課金が発生し始めた（¥157/12日間）

### なぜ課金されていたか
- `genai.Client(api_key=...)` はキーの取得元に関わらず、GCP の請求先アカウントが紐付いていると有料 Tier になる
- 無料にするには GCP 請求先アカウントとプロジェクトのリンクを切る必要がある

### 対処（2026/04/14）
- GCP Console → お支払い → 請求先アカウントを**閉鎖**
- その結果、キー `...2IGs` の請求階層が「無料枠」に変わった

---

## 現在の状態
- キー `...2IGs`（Default Gemini API Key）→ **無料枠** ✅
- hair-app / shuan-webapp 両方でこのキーを使い回せる

## 不要な環境変数
- `GCP_PROJECT_ID` → 昔の Vertex AI 版の名残。**現在のコードでは不要**
- 今のコードは `genai.Client(api_key=GEMINI_API_KEY)` で Google AI Studio を使用

## 必要な環境変数（hair-app）
```
GEMINI_API_KEY          # Google AI Studio キー（無料枠）
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
SUPABASE_JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

## 無料枠の制限（gemini-2.5-flash）
- 15 リクエスト / 分
- 1,500 リクエスト / 日
- 月 100 万トークンまで

## 課金リスクへの注意
- GCP で新しいプロジェクトを作るとき、**請求先アカウントを紐付けない**こと
- aistudio.google.com でキーを作っても、裏の GCP プロジェクトに請求先アカウントがあれば課金される
- 定期的に aistudio.google.com/apikey の「請求階層」列を確認すること（「無料枠」になっているか）
