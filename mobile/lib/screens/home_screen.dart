import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_theme.dart';
import '../models/hairstyle.dart';
import 'preset_screen.dart';
import 'result_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    final XFile? image = await _picker.pickImage(
      source: source,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );

    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
      });
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.lg)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Spacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: Spacing.lg),
              Text(
                '写真を選択',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: Spacing.lg),
              _ImageSourceOption(
                icon: Icons.camera_alt_outlined,
                label: 'カメラで撮影',
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              const SizedBox(height: Spacing.md),
              _ImageSourceOption(
                icon: Icons.photo_library_outlined,
                label: 'ライブラリから選択',
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
              const SizedBox(height: Spacing.md),
            ],
          ),
        ),
      ),
    );
  }

  void _navigateToPresets() {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('まず顔写真を選択してください'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PresetScreen(faceImage: _selectedImage!),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Spacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: Spacing.xl),
              // Header
              Text(
                'Hair Style\nSimulator',
                style: Theme.of(context).textTheme.displayLarge,
              ),
              const SizedBox(height: Spacing.sm),
              Text(
                'AIがあなたに似合う髪型を提案します',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const Spacer(),
              // Image area
              GestureDetector(
                onTap: _showImageSourceDialog,
                child: AspectRatio(
                  aspectRatio: 1,
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(Radii.xl),
                      border: Border.all(
                        color: AppTheme.border,
                        width: 1,
                      ),
                    ),
                    child: _selectedImage != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(Radii.xl - 1),
                            child: Image.file(
                              _selectedImage!,
                              fit: BoxFit.cover,
                            ),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: AppTheme.background,
                                  borderRadius: BorderRadius.circular(Radii.lg),
                                ),
                                child: const Icon(
                                  Icons.add_photo_alternate_outlined,
                                  size: 40,
                                  color: AppTheme.secondary,
                                ),
                              ),
                              const SizedBox(height: Spacing.md),
                              Text(
                                '顔写真を選択',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: Spacing.xs),
                              Text(
                                'タップして写真を追加',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                  ),
                ),
              ),
              const Spacer(),
              // Action buttons
              ElevatedButton(
                onPressed: _navigateToPresets,
                child: const Text('髪型を選ぶ'),
              ),
              const SizedBox(height: Spacing.md),
              if (_selectedImage != null)
                OutlinedButton(
                  onPressed: _showImageSourceDialog,
                  child: const Text('写真を変更'),
                ),
              const SizedBox(height: Spacing.lg),
            ],
          ),
        ),
      ),
    );
  }
}

class _ImageSourceOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ImageSourceOption({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Radii.md),
      child: Container(
        padding: const EdgeInsets.all(Spacing.md),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(Radii.md),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppTheme.primary),
            const SizedBox(width: Spacing.md),
            Text(
              label,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Spacer(),
            const Icon(
              Icons.chevron_right,
              color: AppTheme.secondary,
            ),
          ],
        ),
      ),
    );
  }
}
