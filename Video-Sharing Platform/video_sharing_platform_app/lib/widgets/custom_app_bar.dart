import 'package:flutter/material.dart';
import '../constants.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';
import '../screens/search/search_screen.dart';
import '../screens/notifications/notifications_screen.dart';

class CustomAppBar extends StatefulWidget implements PreferredSizeWidget {
  final Widget? title;
  final List<Widget>? actions;
  final bool showLogo;

  const CustomAppBar({
    super.key,
    this.title,
    this.actions,
    this.showLogo = true,
  });

  @override
  State<CustomAppBar> createState() => _CustomAppBarState();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _CustomAppBarState extends State<CustomAppBar> {
  String _logoUrl = '';
  bool _isLoadingLogo = true;
  int _unreadNotifications = 0;

  @override
  void initState() {
    super.initState();
    if (widget.showLogo && widget.title == null) {
      _fetchLogo();
    } else {
      _isLoadingLogo = false;
    }
    _loadUnreadNotifications();
  }

  Future<void> _loadUnreadNotifications() async {
    try {
      final count = await NotificationService.getUnreadCount();
      if (mounted) setState(() => _unreadNotifications = count);
    } catch (_) {}
  }

  Future<void> _fetchLogo() async {
    try {
      final settings = await AuthService.getPublicSettings();
      if (mounted) {
        setState(() {
          _isLoadingLogo = false;
          if (settings['logoUrl'] != null) {
            String url = settings['logoUrl'];
            if (url.contains('localhost')) {
              url = url.replaceAll('localhost', AppConstants.serverIp);
            } else if (!url.startsWith('http')) {
              url = '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
            }
            _logoUrl = url;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingLogo = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget? titleWidget = widget.title;

    if (titleWidget == null && widget.showLogo) {
      if (_isLoadingLogo) {
        titleWidget = const SizedBox(
            height: 30,
            width: 30,
            child: CircularProgressIndicator(
                color: AppConstants.accentColor, strokeWidth: 2));
      } else if (_logoUrl.isNotEmpty) {
        titleWidget = Image.network(_logoUrl,
            height: 60,
            errorBuilder: (c, e, s) =>
                Image.asset('assets/logo.png', height: 60));
      } else {
        titleWidget = Image.asset('assets/logo.png', height: 60);
      }
    }

    return AppBar(
      backgroundColor: AppConstants.primaryColor,
      elevation: 0,
      title: titleWidget,
      actions: [
        if (widget.actions != null) ...widget.actions!,
        IconButton(
          icon: const Icon(Icons.search, color: Colors.white),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SearchScreen()),
            );
          },
        ),
        IconButton(
          icon: Badge(
            isLabelVisible: _unreadNotifications > 0,
            backgroundColor: Colors.red,
            textColor: Colors.white,
            label: Text(
              _unreadNotifications > 99 ? '99+' : '$_unreadNotifications',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 9,
                fontWeight: FontWeight.bold,
              ),
            ),
            child: const Icon(Icons.notifications_none, color: Colors.white),
          ),
          onPressed: () async {
            await Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            );
            _loadUnreadNotifications();
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}
