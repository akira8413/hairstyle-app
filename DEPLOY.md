# Coolify Deployment Guide

## Prerequisites

1. Coolify server running
2. Google Cloud Project with Vertex AI enabled
3. Service account JSON key

## Deploy Steps

### 1. Add New Resource in Coolify

1. Go to Coolify dashboard
2. Click **+ New Resource** > **Docker Compose**
3. Select **GitHub** and connect your repository
4. Repository: `akira8413/hairstyle-app`
5. Branch: `master`

### 2. Configure Environment Variables

In Coolify, add these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | Yes |
| `GCP_LOCATION` | Vertex AI region (default: us-central1) | No |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Full service account JSON (single line) | Yes |

**Important**: For `GOOGLE_APPLICATION_CREDENTIALS_JSON`, paste the entire JSON as a single line:
```
{"type":"service_account","project_id":"your-project",...}
```

### 3. Configure Domain

1. In Coolify, go to **Settings** > **Domain**
2. Add your domain: `hairstyle.yourdomain.com`
3. Enable HTTPS (Let's Encrypt)

### 4. Deploy

Click **Deploy** and wait for the build to complete.

## Health Check

The app exposes a health endpoint:
```
GET /health
```

Returns:
```json
{
  "status": "ok",
  "api_configured": true,
  "project_id": "your-project-id",
  "location": "us-central1"
}
```

## Mobile App Configuration

After deployment, update the API URL in the Flutter app:

```dart
// mobile/lib/services/api_service.dart
static const String baseUrl = 'https://hairstyle.yourdomain.com';
```

## Troubleshooting

### API returns 500 error
- Check `GCP_PROJECT_ID` is set correctly
- Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is valid JSON
- Ensure Vertex AI API is enabled in GCP

### Image generation fails
- Verify service account has `Vertex AI User` role
- Check GCP billing is enabled

### Connection timeout
- Ensure port 8080 is exposed
- Check Coolify proxy settings
