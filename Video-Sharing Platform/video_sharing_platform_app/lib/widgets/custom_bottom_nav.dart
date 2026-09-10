import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_sharing_platform_app/constants.dart';
import 'package:video_sharing_platform_app/services/auth_service.dart';

class CustomBottomNavBar extends StatefulWidget {
  final int currentIndex;
  final Function(int) onTap;

  const CustomBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  State<CustomBottomNavBar> createState() => _CustomBottomNavBarState();
}

class _CustomBottomNavBarState extends State<CustomBottomNavBar> {
  Map<String, dynamic>? _currentUser;

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    final user = await AuthService.getCurrentUser();
    if (mounted) {
      setState(() => _currentUser = user);
    }
  }

  String? _getAvatarUrl() {
    final rawUrl = _currentUser?['avatarUrl']?.toString();
    if (rawUrl == null || rawUrl.isEmpty) return null;
    if (rawUrl.contains('localhost')) {
      return rawUrl.replaceAll('localhost', AppConstants.serverIp);
    }
    if (!rawUrl.startsWith('http')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$rawUrl';
    }
    return rawUrl;
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = _currentUser != null;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F1115),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.08), width: 0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(
                icon: Icons.home_outlined,
                activeIcon: Icons.home_rounded,
                label: 'Trang chủ',
                isActive: widget.currentIndex == 0,
                onTap: () {
                  HapticFeedback.lightImpact();
                  widget.onTap(0);
                },
              ),
              _NavItem(
                icon: Icons.play_circle_outline_rounded,
                activeIcon: Icons.play_circle_rounded,
                label: 'Shorts',
                isActive: widget.currentIndex == 1,
                onTap: () {
                  HapticFeedback.lightImpact();
                  widget.onTap(1);
                },
              ),
              // Center Add Button
              _CenterAddButton(
                onTap: () {
                  HapticFeedback.mediumImpact();
                  widget.onTap(2);
                },
              ),
              _NavItem(
                icon: Icons.subscriptions_outlined,
                activeIcon: Icons.subscriptions_rounded,
                label: 'Kênh Đăng ký',
                isActive: widget.currentIndex == 3,
                onTap: () {
                  HapticFeedback.lightImpact();
                  widget.onTap(3);
                },
              ),
              _NavItem(
                icon: Icons.person_outline_rounded,
                activeIcon: Icons.person_rounded,
                label: 'Cá nhân',
                isActive: widget.currentIndex == 4,
                customIcon: isLoggedIn
                    ? _ProfileAvatar(
                        avatarUrl: _getAvatarUrl(),
                        name: _currentUser?['fullName']?.toString() ??
                            _currentUser?['handle']?.toString() ??
                            'U',
                      )
                    : null,
                onTap: () {
                  HapticFeedback.lightImpact();
                  widget.onTap(4);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final Widget? customIcon;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    this.customIcon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            customIcon ??
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  transitionBuilder: (child, animation) => ScaleTransition(
                    scale: animation,
                    child: child,
                  ),
                  child: Icon(
                    isActive ? activeIcon : icon,
                    key: ValueKey(isActive),
                    color: isActive ? Colors.white : Colors.grey[600],
                    size: 26,
                  ),
                ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                color: isActive ? Colors.white : Colors.grey[600],
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              ),
              child: Text(label),
            ),
            const SizedBox(height: 2),
            // Active dot indicator
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              height: 3,
              width: isActive ? 18 : 0,
              decoration: BoxDecoration(
                color: Colors.redAccent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  final String? avatarUrl;
  final String name;

  const _ProfileAvatar({
    required this.avatarUrl,
    required this.name,
  });

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'U';

    return CircleAvatar(
      radius: 14,
      backgroundColor: Colors.green.shade700,
      backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : null,
      child: avatarUrl == null
          ? Text(
              initial,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            )
          : null,
    );
  }
}

class _CenterAddButton extends StatelessWidget {
  final VoidCallback onTap;

  const _CenterAddButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 52,
        height: 44,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFF3B30), Color(0xFFFF6B6B)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.redAccent.withValues(alpha: 0.5),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(
          Icons.add_rounded,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }
}
