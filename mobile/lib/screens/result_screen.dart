import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/hairstyle.dart';
import '../services/api_service.dart';

class ResultScreen extends StatefulWidget {
  final File faceImage;
  final HairstylePreset preset;

  const ResultScreen({
    super.key,
    required this.faceImage,
    required this.preset,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  bool _isLoading = true;
  String? _generatedImageBase64;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _generateHairstyle();
  }

  Future<void> _generateHairstyle() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await ApiService.generateHairstyle(
        faceImage: widget.faceImage,
        preset: widget.preset.prompt,
        presetName: widget.preset.name,
        gender: widget.preset.gender,
      );

      setState(() {
        _generatedImageBase64 = result.imageBase64;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Widget _buildGeneratedImage() {
    if (_generatedImageBase64 == null) return const SizedBox();

    // Remove data URL prefix if present
    String base64Data = _generatedImageBase64!;
    if (base64Data.contains('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(Radii.xl),
      child: Image.memory(
        base64Decode(base64Data),
        fit: BoxFit.cover,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(widget.preset.name),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_generatedImageBase64 != null)
            IconButton(
              icon: const Icon(Icons.share_outlined),
              onPressed: () {
                // TODO: Implement share
              },
            ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Spacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Result image
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(Radii.xl),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: _isLoading
                      ? const _LoadingView()
                      : _errorMessage != null
                          ? _ErrorView(
                              message: _errorMessage!,
                              onRetry: _generateHairstyle,
                            )
                          : _buildGeneratedImage(),
                ),
              ),
              const SizedBox(height: Spacing.lg),
              // Info card
              Container(
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
                          padding: const EdgeInsets.symmetric(
                            horizontal: Spacing.sm,
                            vertical: Spacing.xs,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.circular(Radii.sm),
                          ),
                          child: Text(
                            widget.preset.category,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          widget.preset.gender == 'mens' ? 'メンズ' : 'レディース',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                    const SizedBox(height: Spacing.sm),
                    Text(
                      widget.preset.name,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: Spacing.xs),
                    Text(
                      widget.preset.prompt,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Spacing.lg),
              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _generateHairstyle,
                      child: const Text('再生成'),
                    ),
                  ),
                  const SizedBox(width: Spacing.md),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _generatedImageBase64 != null
                          ? () {
                              // TODO: Save to gallery
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('画像を保存しました'),
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            }
                          : null,
                      child: const Text('保存'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(
          width: 48,
          height: 48,
          child: CircularProgressIndicator(
            strokeWidth: 3,
            valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
          ),
        ),
        const SizedBox(height: Spacing.lg),
        Text(
          '髪型を生成中...',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: Spacing.xs),
        Text(
          'AIが画像を処理しています',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(Spacing.lg),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
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
          const SizedBox(height: Spacing.xs),
          Text(
            message,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.lg),
          OutlinedButton(
            onPressed: onRetry,
            child: const Text('再試行'),
          ),
        ],
      ),
    );
  }
}
