# AI Hair Style Simulator

AI-powered hairstyle simulator app for iOS and Android.

## Features

- Face analysis to suggest suitable hairstyles
- AI-generated hairstyle previews using Gemini 2.5 Flash
- Adjustable hairstyle parameters (length, color, style)
- Preset hairstyles for quick simulation

## Project Structure

```
hairstyle-app/
├── backend/          # Flask API server
│   └── server.py
├── frontend/         # Web frontend (legacy)
│   ├── hairstyle.html
│   ├── hairstyle.js
│   └── style.css
├── mobile/           # Flutter mobile app
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── theme/
│   │   └── widgets/
│   └── pubspec.yaml
├── Dockerfile
└── requirements.txt
```

## Backend Setup

### Prerequisites

- Python 3.9+
- Google Cloud Project with Vertex AI enabled
- Service account with Vertex AI permissions

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GCP_PROJECT_ID=your-project-id
export GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type": "service_account", ...}'

# Run the server
cd backend
python server.py
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| GCP_PROJECT_ID | Google Cloud Project ID |
| GCP_LOCATION | Vertex AI location (default: us-central1) |
| GOOGLE_APPLICATION_CREDENTIALS_JSON | Service account JSON |
| PORT | Server port (default: 8080) |

## Mobile App (Flutter)

### Prerequisites

- Flutter SDK 3.0+
- Dart SDK 3.0+
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
cd mobile

# Get dependencies
flutter pub get

# Run on iOS simulator
flutter run -d ios

# Run on Android emulator
flutter run -d android

# Build for release
flutter build ios
flutter build apk
```

### Design System

The app follows SHIG (Sociomedia Human Interface Guidelines) principles:
- Clean, minimal design
- High contrast (white background, dark text)
- Clear visual hierarchy
- Reduced cognitive load

## API Endpoints

- `POST /api/v1/vision/hairstyle` - Analyze face and suggest hairstyles
- `POST /api/v1/vision/hairstyle/generate` - Generate hairstyle preview image
- `POST /api/v1/vision/hairstyle/adjust` - Adjust generated hairstyle
- `GET /health` - Health check

## License

MIT
