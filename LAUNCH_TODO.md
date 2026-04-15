# Hair Style Simulator - ローンチ TODO チェックリスト

## 戦略: Web先行ローンチ 🌐
- Googleログイン + クレジット制 + Stripe課金
- Google AI Studio（無料API）でコスト削減
- 反応を見てからアプリ化を検討

## 現状サマリ
- バックエンド (Flask + Gemini): ✅完成
- フロントエンド (HTML/CSS/JS): ✅完成
- セキュリティ (レート制限, CORS): ✅完成
- 法的文書 (プラポリ, 利用規約): ✅完成
- Coolifyデプロイ: ✅完成
- **Googleログイン + Supabase: ✅コード実装済み**
- **クレジット制: ✅コード実装済み**
- **Stripe課金: ✅コード実装済み**
- **Google AI Studio切替: ✅コード実装済み**

---

## Phase 1: バックエンドデプロイ ✅完了
- [x] Coolifyでhairstyle-appをデプロイ（VPS: 162.43.45.208）
- [x] ヘルスチェック確認（/health）
- [x] API_BASE_URL修正

## Phase 2: 外部サービス設定 👈 あなたの作業
- [ ] **Supabase設定**
  - [ ] https://supabase.com でアカウント作成
  - [ ] プロジェクト作成
  - [ ] Google認証プロバイダー有効化（Authentication → Providers → Google）
  - [ ] GCPでOAuth同意画面 & クライアントID作成
  - [ ] SQLエディタで `supabase_schema.sql` を実行
  - [ ] URL, Anon Key, Service Key, JWT Secretを控える
- [ ] **Google AI Studio APIキー取得**
  - [ ] https://aistudio.google.com/apikey でキー取得
- [ ] **Stripeアカウント設定**
  - [ ] https://stripe.com でアカウント作成
  - [ ] テスト環境のAPIキー取得（sk_test_, pk_test_）
  - [ ] Webhook設定（checkout.session.completed）

## Phase 3: Coolify環境変数設定 👈 あなたの作業
- [ ] Coolifyの環境変数に以下を追加:
  ```
  GEMINI_API_KEY=取得したAPIキー
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_KEY=eyJ...
  SUPABASE_JWT_SECRET=your-jwt-secret
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- [ ] Redeploy

## Phase 4: 動作テスト
- [ ] Googleログインテスト
- [ ] 初回3クレジット付与確認
- [ ] 髪型生成テスト（クレジット消費確認）
- [ ] クレジット0で生成拒否 → 購入画面表示確認
- [ ] Stripe決済テスト（テストカード: 4242 4242 4242 4242）
- [ ] Webhook → クレジット付与確認
- [ ] スマホブラウザでの動作確認

## Phase 5: Webローンチ 🚀
- [ ] ドメイン設定（hair.working-class-hero.net）
- [ ] HTTPS有効化（Let's Encrypt）
- [ ] Stripe本番切替 👈 あなたの作業
- [ ] OGP画像設定
- [ ] 公開

## Phase 6: 集客・改善
- [ ] X（Twitter）で告知
- [ ] Google Analytics導入
- [ ] SEO対策（「髪型 シミュレーション AI」等）
- [ ] お気に入り髪型の保存機能

## Phase 7: アプリ化（Web版の反応を見てから）
- [ ] Google Play Developerアカウント登録（$25）👈 あなたの作業
- [ ] クローズドテスト → 製品版公開
- [ ] Apple Developer Program（$99/年）→ iOS版 👈 あなたの作業

---

### 課金モデル（クレジット制）
| プラン | 料金 | クレジット | 単価 |
|--------|------|-----------|------|
| 無料 | ¥0 | 3（初回のみ） | - |
| スターター | ¥300 | 10 | ¥30/回 |
| スタンダード | ¥980 | 50 | ¥19.6/回 |
| プレミアム | ¥2,980 | 200 | ¥14.9/回 |

## 技術スタック
- **API**: Google AI Studio（無料枠: 15リクエスト/分）
- **認証**: Supabase Auth（Google OAuth）
- **DB**: Supabase PostgreSQL
- **決済**: Stripe Checkout
- **デプロイ**: Coolify on VPS (162.43.45.208)
- **URL**: http://trv3ofrl3xm2vyfpyr7to423.162.43.45.208.sslip.io
