# Hair Style Simulator - Mobile App (Capacitor)

✅ **セットアップ完了済み** - Android/iOS プラットフォーム追加済み

WebアプリをiOS/Androidアプリとしてビルドします。

## 必要な環境

- Node.js 18+
- Android Studio (Android向け)
- Xcode (iOS向け、Macのみ)

## 🔄 今後のワークフロー（デザイン変更時）

```bash
# 1. frontend/ フォルダでHTML/CSS/JSを編集
cd ../frontend
# ... ファイルを編集 ...

# 2. Capacitorに同期（これだけ！）
cd ../capacitor
npm run cap:sync

# Web版、iOS版、Android版すべてに自動反映されます
```

## 📱 初回セットアップ（完了済み）

```bash
cd capacitor

# 依存関係インストール ✅
npm install

# プラットフォーム追加 ✅
npx cap add android
npx cap add ios

# 同期 ✅
npx cap sync
```

## ビルド & 実行

### Android

```bash
# Android Studioで開く
npm run cap:open:android

# Android Studioで:
# 1. Build > Build Bundle(s) / APK(s) > Build APK(s)
# 2. Run > Run 'app' (エミュレータ or 実機)
```

### iOS (Macのみ)

```bash
# Xcodeで開く
npm run cap:open:ios

# Xcodeで:
# 1. Product > Archive (リリース用)
# 2. Product > Run (シミュレータ or 実機)
```

## 本番API設定

`capacitor.config.json` の `server.url` を本番URLに変更:

```json
{
  "server": {
    "url": "https://your-production-url.com"
  }
}
```

## ストア公開

### Google Play Store
1. Android Studio で署名付きAPK/AABを生成
2. Google Play Console でアプリを登録
3. AABファイルをアップロード

### Apple App Store
1. Xcode で Archive を作成
2. App Store Connect でアプリを登録
3. Xcode Organizer から配布

## アイコン設定

`android/app/src/main/res/` と `ios/App/App/Assets.xcassets/` にアイコンを配置。

[capacitor-assets](https://github.com/ionic-team/capacitor-assets) で自動生成可能:

```bash
npx capacitor-assets generate --iconBackgroundColor #ffffff
```
