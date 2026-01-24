import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/hairstyle.dart';

class ApiService {
  // Change this to your backend URL
  static const String baseUrl = 'http://localhost:8080';

  /// Analyze face and get hairstyle suggestions
  static Future<AnalysisResult> analyzeHairstyle(File imageFile) async {
    final bytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(bytes);

    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/vision/hairstyle'),
      headers: {'Content-Type': 'application/json'},
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
      headers: {'Content-Type': 'application/json'},
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
      headers: {'Content-Type': 'application/json'},
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
      final response = await http.get(Uri.parse('$baseUrl/health'));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
