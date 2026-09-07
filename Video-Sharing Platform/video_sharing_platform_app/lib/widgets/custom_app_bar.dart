import 'package:flutter/material.dart';
import '../constants.dart';
import '../services/auth_service.dart';

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

  @override
  void initState() {
    super.initState();
    if (widget.showLogo && widget.title == null) {
      _fetchLogo();
    } else {
      _isLoadingLogo = false;
    }
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
          child: CircularProgressIndicator(color: AppConstants.accentColor, strokeWidth: 2)
        );
      } else if (_logoUrl.isNotEmpty) {
        titleWidget = Image.network(
          _logoUrl, 
          height: 60, 
          errorBuilder: (c, e, s) => Image.asset('assets/logo.png', height: 60)
        );
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
            // TODO: Navigate to search screen
          },
        ),
        IconButton(
          icon: const Icon(Icons.notifications_none, color: Colors.white),
          onPressed: () {
            // TODO: Navigate to notifications
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}
