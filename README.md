# AI Hair Style Simulator

AI-powered hairstyle simulator app for iOS and Android.

## Features

- Face analysis to suggest suitable hairstyles
- AI-generated hairstyle previews using Gemini 2.5 Flash
- Adjustable hairstyle parameters (length, color, style)
- Preset hairstyles for quick simulation

## Setup

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

## API Endpoints

- `POST /api/v1/vision/hairstyle` - Analyze face and suggest hairstyles
- `POST /api/v1/vision/hairstyle/generate` - Generate hairstyle preview image
- `POST /api/v1/vision/hairstyle/adjust` - Adjust generated hairstyle
- `GET /health` - Health check

## Mobile App (Coming Soon)

- iOS (Swift/SwiftUI)
- Android (Kotlin/Jetpack Compose)

## License

MIT
