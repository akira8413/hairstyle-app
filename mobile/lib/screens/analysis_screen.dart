import 'dart:io';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/hairstyle.dart';
import '../services/api_service.dart';

class AnalysisScreen extends StatefulWidget {
  final File faceImage;

  const AnalysisScreen({
    super.key,
    required this.faceImage,
  });

  @override
  State<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends State<AnalysisScreen> {
  bool _isLoading = true;
  AnalysisResult? _result;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _analyzeImage();
  }

  Future<void> _analyzeImage() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await ApiService.analyzeHairstyle(widget.faceImage);
      setState(() {
        _result = result;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('顔分析結果'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                  ),
                  SizedBox(height: Spacing.lg),
                  Text('顔を分析中...'),
                ],
              ),
            )
          : _errorMessage != null
              ? _buildErrorView()
              : _buildResultView(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Spacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 48,
              color: AppTheme.error,
            ),
            const SizedBox(height: Spacing.md),
            Text(
              'エラーが発生しました',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              _errorMessage!,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.lg),
            OutlinedButton(
              onPressed: _analyzeImage,
              child: const Text('再試行'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultView() {
    if (_result == null) return const SizedBox();

    return ListView(
      padding: const EdgeInsets.all(Spacing.lg),
      children: [
        // Face image
        ClipRRect(
          borderRadius: BorderRadius.circular(Radii.lg),
          child: AspectRatio(
            aspectRatio: 1,
            child: Image.file(
              widget.faceImage,
              fit: BoxFit.cover,
            ),
          ),
        ),
        const SizedBox(height: Spacing.lg),
        // Face analysis card
        _AnalysisCard(analysis: _result!.faceAnalysis),
        const SizedBox(height: Spacing.lg),
        // Suggestions header
        Text(
          'おすすめヘアスタイル',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: Spacing.md),
        // Suggestion list
        ..._result!.suggestions.map((suggestion) => Padding(
              padding: const EdgeInsets.only(bottom: Spacing.md),
              child: _SuggestionCard(suggestion: suggestion),
            )),
        // Salon order
        if (_result!.salonOrder.isNotEmpty) ...[
          const SizedBox(height: Spacing.md),
          _SalonOrderCard(order: _result!.salonOrder),
        ],
        const SizedBox(height: Spacing.lg),
      ],
    );
  }
}

class _AnalysisCard extends StatelessWidget {
  final FaceAnalysis analysis;

  const _AnalysisCard({required this.analysis});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(Radii.lg),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '顔分析',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: Spacing.md),
          _InfoRow(label: '顔型', value: analysis.faceShape),
          _InfoRow(label: '特徴', value: analysis.features),
          _InfoRow(label: '現在の髪型', value: analysis.currentHair),
          _InfoRow(label: '肌の色', value: analysis.skinTone),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.primary,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SuggestionCard extends StatelessWidget {
  final HairstyleSuggestion suggestion;

  const _SuggestionCard({required this.suggestion});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(Radii.lg),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(Radii.sm),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${suggestion.rank}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: Spacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      suggestion.name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      suggestion.length,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Spacing.sm,
                  vertical: Spacing.xs,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.success.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(Radii.sm),
                ),
                child: Text(
                  '${suggestion.matchScore}%',
                  style: TextStyle(
                    color: AppTheme.success,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.md),
          Text(
            suggestion.description,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: Spacing.sm),
          Text(
            suggestion.whyGood,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _SalonOrderCard extends StatelessWidget {
  final String order;

  const _SalonOrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.md),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(Radii.lg),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.content_cut,
                size: 20,
                color: AppTheme.secondary,
              ),
              const SizedBox(width: Spacing.sm),
              Text(
                '美容院でのオーダー方法',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
          const SizedBox(height: Spacing.sm),
          Text(
            order,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
