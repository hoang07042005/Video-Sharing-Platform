import 'package:flutter/material.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../constants.dart';
import '../home/home_screen.dart';
import '../video/short/shorts_feed_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  Widget? _shortsFeedScreen;

  List<Widget> get _screens => [
    const HomeScreen(),
    _shortsFeedScreen ??= ShortsFeedScreen(
      onBack: () {
        setState(() {
          _currentIndex = 0;
        });
      },
    ),
    const Scaffold(backgroundColor: AppConstants.primaryColor, body: Center(child: Text('Tải lên', style: TextStyle(color: Colors.white)))),
    const Scaffold(backgroundColor: AppConstants.primaryColor, body: Center(child: Text('Kênh đăng ký', style: TextStyle(color: Colors.white)))),
    const Scaffold(backgroundColor: AppConstants.primaryColor, body: Center(child: Text('Hồ sơ', style: TextStyle(color: Colors.white)))),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: _currentIndex == 1 
        ? null 
        : CustomBottomNavBar(
            currentIndex: _currentIndex,
            onTap: (index) {
              if (index == 2) {
                // TODO: Hiển thị BottomSheet tải video lên
              } else {
                setState(() {
                  _currentIndex = index;
                });
              }
            },
          ),
    );
  }
}
