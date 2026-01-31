# Hair Style Simulator - Android リリース準備 TODO

## 概要
Flutter製ヘアスタイルシミュレーターアプリをGoogle Play Storeにリリースするための準備タスク一覧。

---

## 1. Android プロジェクト構成
- [x] Flutter Android プロジェクト構造を生成 (`mobile/android/`)
- [x] `build.gradle` (ルート & アプリ) を設定
- [x] `settings.gradle` を設定
- [x] `gradle.properties` を設定
- [x] `AndroidManifest.xml` を作成（パーミッション含む）
- [x] `MainActivity.kt` を作成

## 2. セキュリティ修正
- [x] API URL を環境変数 / ビルド設定で切り替え可能にする (`api_service.dart`)
- [x] HTTPS 強制化（cleartext traffic 無効化）
- [x] Capacitor 設定からテストサーバー URL / cleartext 設定を削除
- [x] バックエンドに API キー認証を追加
- [x] レート制限を実装
- [x] CORS オリジンを制限
- [x] 画像アップロードサイズのバリデーション追加

## 3. アプリアセット
- [x] アプリアイコン用のプレースホルダー画像を配置（各密度: mdpi〜xxxhdpi）
- [x] スプラッシュ画面のレイアウトを設定
- [x] Adaptive Icon 対応 (`ic_launcher_foreground.xml`, `ic_launcher_background.xml`)

## 4. アプリ署名設定
- [x] `key.properties` テンプレートを作成
- [x] `build.gradle` にリリース署名設定を追加
- [x] `.gitignore` に署名関連ファイルを追加

## 5. リリース設定
- [x] `minSdkVersion`, `targetSdkVersion`, `versionCode`, `versionName` を適切に設定
- [x] ProGuard / R8 設定を追加
- [x] リリースビルドタイプの最適化設定

## 6. 法的文書
- [x] プライバシーポリシーを作成 (`PRIVACY_POLICY.md`)
- [x] 利用規約を作成 (`TERMS_OF_SERVICE.md`)

## 7. CI/CD パイプライン
- [x] GitHub Actions ワークフロー: Android ビルド (`android-build.yml`)
- [x] GitHub Actions ワークフロー: リリース自動化 (`android-release.yml`)

## 8. ドキュメント
- [x] Android ビルド手順のドキュメント（本ファイル下部に記載）

---

## Android ビルド手順

### 前提条件
- Flutter SDK 3.x 以上
- Android SDK (API 34)
- Java 17

### 開発ビルド
```bash
cd mobile
flutter pub get
flutter run
```

### リリースビルド (APK)
```bash
cd mobile

# key.properties を作成（初回のみ）
cp android/key.properties.template android/key.properties
# key.properties を編集して実際のキーストア情報を記入

# APK ビルド
flutter build apk --release

# 出力: build/app/outputs/flutter-apk/app-release.apk
```

### リリースビルド (App Bundle - Google Play 推奨)
```bash
flutter build appbundle --release
# 出力: build/app/outputs/bundle/release/app-release.aab
```

### キーストア生成
```bash
keytool -genkey -v \
  -keystore hairstyle-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias hairstyle_key
```

---

## Google Play Store チェックリスト
- [ ] 署名済み AAB ファイルの生成
- [ ] スクリーンショット撮影 (電話・タブレット)
- [ ] フィーチャーグラフィック (1024x500)
- [ ] ストア説明文 (日本語・英語)
- [ ] カテゴリ: 美容
- [ ] コンテンツレーティング申請
- [ ] プライバシーポリシー URL の設定
- [ ] テスト配布 (内部テスト → クローズドベータ → オープンベータ)
