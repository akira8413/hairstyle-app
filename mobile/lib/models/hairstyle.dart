/// Face analysis result model
class FaceAnalysis {
  final String faceShape;
  final String features;
  final String currentHair;
  final String skinTone;

  FaceAnalysis({
    required this.faceShape,
    required this.features,
    required this.currentHair,
    required this.skinTone,
  });

  factory FaceAnalysis.fromJson(Map<String, dynamic> json) {
    return FaceAnalysis(
      faceShape: json['faceShape'] ?? '',
      features: json['features'] ?? '',
      currentHair: json['currentHair'] ?? '',
      skinTone: json['skinTone'] ?? '',
    );
  }
}

/// Hairstyle suggestion model
class HairstyleSuggestion {
  final int rank;
  final String name;
  final String length;
  final String description;
  final String whyGood;
  final String styling;
  final String bangs;
  final String color;
  final int matchScore;

  HairstyleSuggestion({
    required this.rank,
    required this.name,
    required this.length,
    required this.description,
    required this.whyGood,
    required this.styling,
    required this.bangs,
    required this.color,
    required this.matchScore,
  });

  factory HairstyleSuggestion.fromJson(Map<String, dynamic> json) {
    return HairstyleSuggestion(
      rank: json['rank'] ?? 0,
      name: json['name'] ?? '',
      length: json['length'] ?? '',
      description: json['description'] ?? '',
      whyGood: json['whyGood'] ?? '',
      styling: json['styling'] ?? '',
      bangs: json['bangs'] ?? '',
      color: json['color'] ?? '',
      matchScore: json['matchScore'] ?? 0,
    );
  }
}

/// Analysis result model
class AnalysisResult {
  final String analysisId;
  final FaceAnalysis faceAnalysis;
  final List<HairstyleSuggestion> suggestions;
  final String salonOrder;

  AnalysisResult({
    required this.analysisId,
    required this.faceAnalysis,
    required this.suggestions,
    required this.salonOrder,
  });

  factory AnalysisResult.fromJson(Map<String, dynamic> json) {
    return AnalysisResult(
      analysisId: json['analysisId'] ?? '',
      faceAnalysis: FaceAnalysis.fromJson(json['faceAnalysis'] ?? {}),
      suggestions: (json['suggestions'] as List?)
              ?.map((e) => HairstyleSuggestion.fromJson(e))
              .toList() ??
          [],
      salonOrder: json['salonOrder'] ?? '',
    );
  }
}

/// Generated image result
class GeneratedImage {
  final String imageBase64;
  final String? message;

  GeneratedImage({
    required this.imageBase64,
    this.message,
  });

  factory GeneratedImage.fromJson(Map<String, dynamic> json) {
    return GeneratedImage(
      imageBase64: json['generatedImage'] ?? '',
      message: json['message'],
    );
  }
}

/// Hairstyle preset
class HairstylePreset {
  final String id;
  final String name;
  final String prompt;
  final String category;
  final String gender;

  const HairstylePreset({
    required this.id,
    required this.name,
    required this.prompt,
    required this.category,
    required this.gender,
  });
}

/// Preset data
class Presets {
  static const List<HairstylePreset> mens = [
    HairstylePreset(
      id: 'mens_short_1',
      name: 'ナチュラルショート',
      prompt: '自然な束感のあるショートヘア、サイドは短めでトップに動きを出す',
      category: 'ショート',
      gender: 'mens',
    ),
    HairstylePreset(
      id: 'mens_short_2',
      name: 'ツーブロック',
      prompt: 'サイドを刈り上げたツーブロック、トップは長めで流す',
      category: 'ショート',
      gender: 'mens',
    ),
    HairstylePreset(
      id: 'mens_medium_1',
      name: 'マッシュ',
      prompt: '丸みのあるマッシュヘア、前髪は重めで目にかかる程度',
      category: 'ミディアム',
      gender: 'mens',
    ),
    HairstylePreset(
      id: 'mens_medium_2',
      name: 'センターパート',
      prompt: 'センター分けのミディアムヘア、自然な毛流れ',
      category: 'ミディアム',
      gender: 'mens',
    ),
    HairstylePreset(
      id: 'mens_perm_1',
      name: 'スパイラルパーマ',
      prompt: 'ゆるめのスパイラルパーマ、動きと立体感のある髪型',
      category: 'パーマ',
      gender: 'mens',
    ),
  ];

  static const List<HairstylePreset> ladies = [
    HairstylePreset(
      id: 'ladies_short_1',
      name: 'ショートボブ',
      prompt: 'あごラインのショートボブ、毛先は内巻きで丸みを出す',
      category: 'ショート',
      gender: 'ladies',
    ),
    HairstylePreset(
      id: 'ladies_medium_1',
      name: 'レイヤーミディアム',
      prompt: 'レイヤーを入れたミディアムヘア、毛先に動きを出す',
      category: 'ミディアム',
      gender: 'ladies',
    ),
    HairstylePreset(
      id: 'ladies_long_1',
      name: 'ロングストレート',
      prompt: 'サラサラのロングストレート、毛先は自然なワンカール',
      category: 'ロング',
      gender: 'ladies',
    ),
    HairstylePreset(
      id: 'ladies_long_2',
      name: 'ゆるふわウェーブ',
      prompt: '大きめのゆるいウェーブをかけたロングヘア',
      category: 'ロング',
      gender: 'ladies',
    ),
    HairstylePreset(
      id: 'ladies_bob_1',
      name: '外ハネボブ',
      prompt: '肩につく長さの外ハネボブ、軽やかな印象',
      category: 'ボブ',
      gender: 'ladies',
    ),
  ];
}
