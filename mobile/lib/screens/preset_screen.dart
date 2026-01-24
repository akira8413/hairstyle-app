import 'dart:io';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/hairstyle.dart';
import 'result_screen.dart';

class PresetScreen extends StatefulWidget {
  final File faceImage;

  const PresetScreen({
    super.key,
    required this.faceImage,
  });

  @override
  State<PresetScreen> createState() => _PresetScreenState();
}

class _PresetScreenState extends State<PresetScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedGender = 'mens';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _selectedGender = _tabController.index == 0 ? 'mens' : 'ladies';
        });
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<HairstylePreset> get _currentPresets {
    return _selectedGender == 'mens' ? Presets.mens : Presets.ladies;
  }

  Map<String, List<HairstylePreset>> get _groupedPresets {
    final presets = _currentPresets;
    final grouped = <String, List<HairstylePreset>>{};
    for (final preset in presets) {
      grouped.putIfAbsent(preset.category, () => []).add(preset);
    }
    return grouped;
  }

  void _selectPreset(HairstylePreset preset) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ResultScreen(
          faceImage: widget.faceImage,
          preset: preset,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('髪型を選択'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Gender tabs
          Container(
            margin: const EdgeInsets.all(Spacing.lg),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(Radii.md),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(Radii.md - 2),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              labelColor: Colors.white,
              unselectedLabelColor: AppTheme.secondary,
              labelStyle: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
              tabs: const [
                Tab(text: 'メンズ'),
                Tab(text: 'レディース'),
              ],
            ),
          ),
          // Preset list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: Spacing.lg),
              itemCount: _groupedPresets.length,
              itemBuilder: (context, index) {
                final category = _groupedPresets.keys.elementAt(index);
                final presets = _groupedPresets[category]!;
                return _CategorySection(
                  title: category,
                  presets: presets,
                  onPresetTap: _selectPreset,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CategorySection extends StatelessWidget {
  final String title;
  final List<HairstylePreset> presets;
  final Function(HairstylePreset) onPresetTap;

  const _CategorySection({
    required this.title,
    required this.presets,
    required this.onPresetTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(
            top: Spacing.lg,
            bottom: Spacing.md,
          ),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        ...presets.map((preset) => _PresetCard(
              preset: preset,
              onTap: () => onPresetTap(preset),
            )),
        const SizedBox(height: Spacing.sm),
      ],
    );
  }
}

class _PresetCard extends StatelessWidget {
  final HairstylePreset preset;
  final VoidCallback onTap;

  const _PresetCard({
    required this.preset,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.md),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Radii.lg),
        child: Container(
          padding: const EdgeInsets.all(Spacing.md),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(Radii.lg),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              // Icon placeholder
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(Radii.md),
                ),
                child: const Icon(
                  Icons.face,
                  color: AppTheme.secondary,
                  size: 28,
                ),
              ),
              const SizedBox(width: Spacing.md),
              // Text content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      preset.name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: Spacing.xs),
                    Text(
                      preset.prompt,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: Spacing.sm),
              const Icon(
                Icons.arrow_forward_ios,
                color: AppTheme.secondary,
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
