import 'package:flutter/material.dart';

class CategoryItem {
  final int id;
  final String name;
  final IconData icon;
  final Color iconColor;

  CategoryItem(this.id, this.name, this.icon, this.iconColor);
}

class CategoryFilter extends StatefulWidget {
  final Function(int)? onSelect;
  const CategoryFilter({super.key, this.onSelect});

  @override
  State<CategoryFilter> createState() => _CategoryFilterState();
}

class _CategoryFilterState extends State<CategoryFilter> {
  int _activeCategory = 0;
  final ScrollController _scrollController = ScrollController();

  final List<CategoryItem> categories = [
    CategoryItem(0, 'Tất cả', Icons.local_fire_department, Colors.orangeAccent),
    CategoryItem(1, 'Công nghệ', Icons.monitor, Colors.blue),
    CategoryItem(2, 'Âm nhạc', Icons.music_note, Colors.pinkAccent),
    CategoryItem(3, 'Trò chơi', Icons.sports_esports, Colors.greenAccent),
    CategoryItem(4, 'Tin tức', Icons.language, Colors.blueAccent),
    CategoryItem(5, 'Thể thao', Icons.fitness_center, Colors.orange),
    CategoryItem(6, 'Ẩm thực', Icons.restaurant, Colors.deepOrange),
    CategoryItem(7, 'Giáo dục', Icons.menu_book, Colors.purpleAccent),
    CategoryItem(8, 'Du lịch', Icons.flight, Colors.cyanAccent),
    CategoryItem(9, 'Giải trí', Icons.tv, Colors.yellowAccent),
  ];



  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Stack(
        alignment: Alignment.centerRight,
        children: [
          SizedBox(
            height: 40,
            child: ListView.builder(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(left: 16, right: 48), // leave space for right arrow
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final isActive = _activeCategory == category.id;
                
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        _activeCategory = category.id;
                      });
                      if (widget.onSelect != null) {
                        widget.onSelect!(category.id);
                      }
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: isActive
                            ? const LinearGradient(
                                colors: [Colors.deepOrangeAccent, Colors.pinkAccent],
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                              )
                            : null,
                        color: isActive ? null : const Color(0xFF18181C),
                        border: isActive ? null : Border.all(color: Colors.white.withValues(alpha: 0.05)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            category.icon,
                            color: category.iconColor,
                            size: 22,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            category.name,
                            style: TextStyle(
                              color: isActive ? Colors.white : Colors.white70,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          
          // // Scroll arrow button on the right
          // Positioned(
          //   right: 16,
          //   child: GestureDetector(
          //     onTap: _scrollRight,
          //     child: Container(
          //       width: 32,
          //       height: 32,
          //       decoration: BoxDecoration(
          //         color: const Color(0xFF1A1A1A),
          //         shape: BoxShape.circle,
          //         border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          //         boxShadow: [
          //           BoxShadow(
          //             color: Colors.black.withValues(alpha: 0.8),
          //             blurRadius: 10,
          //             offset: const Offset(-8, 0),
          //           )
          //         ],
          //       ),
          //       child: const Icon(Icons.chevron_right, color: Colors.white70, size: 20),
          //     ),
          //   ),
          // ),
        ],
      ),
    );
  }
}
