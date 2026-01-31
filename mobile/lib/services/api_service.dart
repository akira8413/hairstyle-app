import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/hairstyle.dart';

class ApiService {
  /// API base URL - configurable via build-time environment variable.
  /// Usage: flutter run --dart-define=API_URL=https://your-api.example.com
  /// Defaults to http://localhost:8080 for local development only.
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:8080',
  );

  /// API key for authenticating requests to the backend.
  /// Usage: flutter run --dart-define=API_KEY=your-secret-key
  static const String _apiKey =
      String.fromEnvironment('API_KEY', defaultValue: '');

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_apiKey.isNotEmpty) 'X-API-Key': _apiKey,
      };

  /// Analyze face and get hairstyle suggestions
  static Future<AnalysisResult> analyzeHairstyle(File imageFile) async {
    final bytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(bytes);

    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/vision/hairstyle'),
      headers: _headers,
      body: jsonEncode({
        'face': 'data:image/jpeg;base64,$base64Image',
      }),
    );

    if (response.statusCode == 200) {
      return AnalysisResult.fromJson(jsonDecode(response.body));
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Analysis failed');
    }
  }

  /// Generate hairstyle preview image
  static Future<GeneratedImage> generateHairstyle({
    required File faceImage,
    File? referenceImage,
    String? preset,
    String? presetName,
    String gender = 'mens',
  }) async {
    final faceBytes = await faceImage.readAsBytes();
    final faceBase64 = base64Encode(faceBytes);

    final Map<String, dynamic> body = {
      'face': 'data:image/jpeg;base64,$faceBase64',
      'gender': gender,
    };

    if (preset != null) {
      body['preset'] = preset;
      body['presetName'] = presetName;
    }

    if (referenceImage != null) {
      final refBytes = await referenceImage.readAsBytes();
      final refBase64 = base64Encode(refBytes);
      body['hairstyle'] = 'data:image/jpeg;base64,$refBase64';
    }

    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/vision/hairstyle/generate'),
      headers: _headers,
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      return GeneratedImage.fromJson(jsonDecode(response.body));
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Generation failed');
    }
  }

  /// Adjust generated hairstyle
  static Future<GeneratedImage> adjustHairstyle({
    required File faceImage,
    required String currentImageBase64,
    String? lengthAdjustment,
    String? colorAdjustment,
    String? styleAdjustment,
  }) async {
    final faceBytes = await faceImage.readAsBytes();
    final faceBase64 = base64Encode(faceBytes);

    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/vision/hairstyle/adjust'),
      headers: _headers,
      body: jsonEncode({
        'face': 'data:image/jpeg;base64,$faceBase64',
        'currentImage': currentImageBase64,
        'adjustments': {
          if (lengthAdjustment != null) 'length': lengthAdjustment,
          if (colorAdjustment != null) 'color': colorAdjustment,
          if (styleAdjustment != null) 'style': styleAdjustment,
        },
      }),
    );

    if (response.statusCode == 200) {
      return GeneratedImage.fromJson(jsonDecode(response.body));
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Adjustment failed');
    }
  }

  /// Health check
  static Future<bool> healthCheck() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: _headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
