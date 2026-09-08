import 'package:flutter/material.dart';
import '../../services/video_service.dart';
import '../../widgets/video_list_tile.dart';
import '../../widgets/shorts_card.dart';
import '../video/short/short_detail_screen.dart';

class CategoriesScreen extends StatefulWidget {
  final List<dynamic> categories;
  final String? initialCategory;

  const CategoriesScreen({super.key, required this.categories, this.initialCategory});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late List<dynamic> _allCategories;
  late String _selectedCategory;
  bool _isLoading = false;

  List<dynamic> _videos = [];
  List<dynamic> _shorts = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    _selectedCategory = widget.initialCategory ?? 'Tất cả';

    // Thêm danh mục 'Tất cả' vào đầu danh sách
    _allCategories = [
      {'name': 'Tất cả', 'icon': 'LayoutGrid', 'color': 'blue'}
    ];
    _allCategories.addAll(widget.categories);

    _fetchVideosByCategory(_selectedCategory);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchVideosByCategory(String categoryName) async {
    setState(() {
      _isLoading = true;
      _selectedCategory = categoryName;
    });

    final results = await VideoService.getVideosByCategory(categoryName);
    
    if (mounted) {
      setState(() {
        _videos = results.where((v) => v['isShort'] != true).toList();
        _shorts = results.where((v) => v['isShort'] == true).toList();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1115),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F1115),
        title: const Text('Danh mục Video', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
          child: Column(
            children: [
              // Category chips
              SizedBox(
                height: 50,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: _allCategories.length,
                  itemBuilder: (context, index) {
                    final cat = _allCategories[index];
                    final isSelected = _selectedCategory == cat['name'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(
                          cat['name']?.toString() ?? '',
                          style: TextStyle(
                            color: isSelected ? Colors.black : Colors.white,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: Colors.white,
                        backgroundColor: const Color(0xFF1E212A),
                        side: BorderSide.none,
                        onSelected: (selected) {
                          if (selected && !isSelected) {
                            _fetchVideosByCategory(cat['name']);
                          }
                        },
                      ),
                    );
                  },
                ),
              ),
              // Tabs
              TabBar(
                controller: _tabController,
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.grey,
                tabs: const [
                  Tab(text: 'Video'),
                  Tab(text: 'Shorts'),
                ],
              ),
            ],
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.redAccent))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildVideoList(),
                _buildShortsGrid(),
              ],
            ),
    );
  }

  Widget _buildVideoList() {
    if (_videos.isEmpty) {
      return _buildEmptyState('Không có video nào trong danh mục này.');
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _videos.length,
      itemBuilder: (context, index) {
        return VideoListTile(
          video: _videos[index],
        );
      },
    );
  }

  Widget _buildShortsGrid() {
    if (_shorts.isEmpty) {
      return _buildEmptyState('Không có Shorts nào trong danh mục này.');
    }
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.5625, // 9/16
      ),
      itemCount: _shorts.length,
      itemBuilder: (context, index) {
        return ShortsCard(
          video: _shorts[index],
          width: double.infinity,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ShortDetailScreen(shorts: _shorts, initialIndex: index),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.video_library_outlined, size: 64, color: Colors.grey[700]),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(color: Colors.white54, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
