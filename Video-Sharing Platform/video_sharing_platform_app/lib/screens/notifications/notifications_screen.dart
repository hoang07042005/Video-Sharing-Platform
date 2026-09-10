import 'package:flutter/material.dart';
import '../../constants.dart';
import '../../services/notification_service.dart';
import 'notification_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String _query = '';
  String _selectedCategory = 'Tất cả';

  List<dynamic> get _filteredNotifications {
    final query = _query.toLowerCase().trim();
    return _notifications.where((item) {
      final title = item['title']?.toString().toLowerCase() ?? '';
      final message = item['message']?.toString().toLowerCase() ?? '';
      final matchesQuery =
          query.isEmpty || title.contains(query) || message.contains(query);
      final matchesCategory = _selectedCategory == 'Tất cả' ||
          _notificationCategory(item) == _selectedCategory;
      return matchesQuery && matchesCategory;
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _searchController.addListener(() {
      if (mounted) setState(() => _query = _searchController.text);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final notifications = await NotificationService.getNotifications();
      if (mounted) setState(() => _notifications = notifications);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(error.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await NotificationService.markAllAsRead();
      if (mounted) {
        setState(() {
          for (final item in _notifications) {
            item['isRead'] = true;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Đã đánh dấu tất cả thông báo là đã đọc.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(error.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  Future<void> _openNotification(Map<String, dynamic> notification) async {
    final id = notification['id']?.toString();
    if (id != null && notification['isRead'] != true) {
      try {
        await NotificationService.markAsRead(id);
        if (mounted) {
          setState(() {
            final index = _notifications.indexWhere(
              (item) => item['id']?.toString() == id,
            );
            if (index != -1) {
              _notifications[index]['isRead'] = true;
            }
            notification['isRead'] = true;
          });
        }
      } catch (_) {}
    }
    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
          builder: (_) => NotificationDetailScreen(notification: notification)),
    );
  }

  String _formatDate(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
    if (date == null) return '';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _notificationCategory(dynamic item) {
    final type = item['type']?.toString().toLowerCase();
    final title = item['title']?.toString().toLowerCase() ?? '';
    if (type == 'donation' ||
        (type == 'system' &&
            (title.contains('rút tiền') ||
                title.contains('hội viên') ||
                title.contains('vip')))) {
      return 'Kiếm tiền';
    }
    if (type == 'comment' ||
        type == 'communitypost' ||
        type == 'follow' ||
        type == 'subscribe') {
      return 'Cộng đồng';
    }
    return 'Hệ thống';
  }

  String _dateGroup(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
    if (date == null) return 'Khác';
    final today = DateTime.now();
    final currentDay = DateTime(today.year, today.month, today.day);
    final notificationDay = DateTime(date.year, date.month, date.day);
    final difference = currentDay.difference(notificationDay).inDays;
    if (difference == 0) return 'Hôm nay';
    if (difference == 1) return 'Hôm qua';
    if (difference <= 7) return '7 ngày qua';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  Widget _categoryChip(String category) {
    final selected = _selectedCategory == category;
    final count = category == 'Tất cả'
        ? _notifications.length
        : _notifications
            .where((item) => _notificationCategory(item) == category)
            .length;
    return GestureDetector(
      onTap: () => setState(() => _selectedCategory = category),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? null : const Color.fromARGB(31, 97, 97, 97),
          gradient: selected
              ? const LinearGradient(
                  colors: [
                    Color.fromARGB(255, 255, 119, 77),
                    Color.fromARGB(255, 226, 70, 43)
                  ],
                )
              : null,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(category,
                style: TextStyle(
                    color: selected ? Colors.white : Colors.white70,
                    fontSize: 11,
                    fontWeight: FontWeight.w600)),
            const SizedBox(width: 7),
            Text('$count',
                style: TextStyle(
                    color: selected ? Colors.white : Colors.white54,
                    fontSize: 9,
                    fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _notificationTile(Map<String, dynamic> notification) {
    final isRead = notification['isRead'] == true;
    final category = _notificationCategory(notification);
    final color = _notificationColor(
      notification['type']?.toString(),
      notification['title']?.toString(),
    );
    return InkWell(
      onTap: () => _openNotification(notification),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        margin: const EdgeInsets.only(bottom: 7),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: const Color.fromARGB(31, 97, 97, 97),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.22), shape: BoxShape.circle),
              child: Icon(
                  _notificationIcon(notification['type']?.toString(),
                      notification['title']?.toString()),
                  color: color,
                  size: 19),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          notification['title']?.toString() ?? 'Thông báo',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight:
                                  isRead ? FontWeight.w500 : FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(_formatDate(notification['createdAt']),
                          style: const TextStyle(
                              color: Colors.white54, fontSize: 9)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.22),
                            borderRadius: BorderRadius.circular(5)),
                        child: Text(category,
                            style: TextStyle(
                                color: color,
                                fontSize: 8,
                                fontWeight: FontWeight.bold)),
                      ),
                      if (!isRead) ...[
                        const SizedBox(width: 5),
                        Container(
                            width: 5,
                            height: 5,
                            decoration: const BoxDecoration(
                                color: Color(0xFFA855F7),
                                shape: BoxShape.circle)),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(notification['message']?.toString() ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white60, fontSize: 10, height: 1.2)),
                ],
              ),
            ),
            const SizedBox(width: 5),
            const Padding(
                padding: EdgeInsets.only(top: 15),
                child:
                    Icon(Icons.chevron_right, color: Colors.white38, size: 17)),
          ],
        ),
      ),
    );
  }

  IconData _notificationIcon(String? type, String? title) {
    switch (type?.toLowerCase()) {
      case 'subscribe':
      case 'follow':
        return Icons.person_add_alt_1;
      case 'comment':
      case 'communitypost':
        return Icons.chat_bubble_outline;
      case 'donation':
        return Icons.attach_money;
      case 'stream':
        return Icons.play_circle_outline;
      case 'feedbackreply':
        return Icons.check_circle_outline;
      case 'system':
        final normalizedTitle = title?.toLowerCase() ?? '';
        if (normalizedTitle.contains('rút tiền')) {
          return Icons.account_balance_wallet_outlined;
        }
        if (normalizedTitle.contains('hội viên') ||
            normalizedTitle.contains('vip')) {
          return Icons.workspace_premium_outlined;
        }
        if (normalizedTitle.contains('bảo mật') ||
            normalizedTitle.contains('đăng nhập')) {
          return Icons.shield_outlined;
        }
        return Icons.notifications_none;
      default:
        return Icons.notifications_none;
    }
  }

  Color _notificationColor(String? type, String? title) {
    switch (type?.toLowerCase()) {
      case 'subscribe':
      case 'follow':
        return const Color(0xFF3B82F6);
      case 'comment':
        return const Color(0xFFF97316);
      case 'donation':
        return const Color(0xFFEAB308);
      case 'stream':
      case 'communitypost':
        return const Color(0xFFA855F7);
      case 'feedbackreply':
        return const Color(0xFF14B8A6);
      case 'system':
        final normalizedTitle = title?.toLowerCase() ?? '';
        if (normalizedTitle.contains('rút tiền')) {
          return const Color(0xFFEF4444);
        }
        if (normalizedTitle.contains('hội viên') ||
            normalizedTitle.contains('vip')) {
          return const Color(0xFFEAB308);
        }
        if (normalizedTitle.contains('bảo mật') ||
            normalizedTitle.contains('đăng nhập')) {
          return Colors.grey;
        }
        return const Color(0xFFF97316);
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final notifications = _filteredNotifications;
    final grouped = <String, List<dynamic>>{};
    for (final notification in notifications) {
      grouped
          .putIfAbsent(_dateGroup(notification['createdAt']), () => [])
          .add(notification);
    }
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      appBar: AppBar(
        backgroundColor: AppConstants.primaryColor,
        leading: const BackButton(color: Colors.white),
        titleSpacing: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Thông báo',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            
          ],
        ),
        actions: [
          Badge(
            isLabelVisible: _notifications
                .where((item) => item['isRead'] != true)
                .isNotEmpty,
            backgroundColor: Colors.red,
            textColor: Colors.white,
            label: Text(
                '${_notifications.where((item) => item['isRead'] != true).length}',
                style: const TextStyle(fontSize: 8)),
            child: const Icon(Icons.notifications_none,
                color: Colors.white, size: 22),
          ),
          const SizedBox(width: 12),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (value) {
              if (value == 'read_all') _markAllAsRead();
            },
            itemBuilder: (_) => const [
              PopupMenuItem(
                value: 'read_all',
                child: Text('Đánh dấu tất cả đã đọc'),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
              children: [
                'Tất cả',
                'Hệ thống',
                'Cộng đồng',
                'Kiếm tiền',
              ].map(_categoryChip).toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Tìm kiếm thông báo...',
                        hintStyle: const TextStyle(
                            color: Colors.white54, fontSize: 13),
                        prefixIcon: const Icon(Icons.search,
                            color: Colors.white54, size: 19),
                        filled: true,
                        fillColor: const Color.fromARGB(31, 97, 97, 97),
                        contentPadding: EdgeInsets.zero,
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide.none),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadNotifications,
                    child: notifications.isEmpty
                        ? ListView(
                            children: const [
                              SizedBox(height: 140),
                              Center(
                                  child: Text('Không có thông báo nào.',
                                      style: TextStyle(color: Colors.white54))),
                            ],
                          )
                        : ListView(
                            padding: const EdgeInsets.fromLTRB(12, 2, 12, 24),
                            children: [
                              for (final entry in grouped.entries) ...[
                                Padding(
                                  padding:
                                      const EdgeInsets.fromLTRB(2, 8, 2, 6),
                                  child: Row(
                                    children: [
                                      Container(
                                          width: 3,
                                          height: 15,
                                          decoration: BoxDecoration(
                                              color: const Color(0xFFB14DFF),
                                              borderRadius:
                                                  BorderRadius.circular(2))),
                                      const SizedBox(width: 7),
                                      Text(entry.key,
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                                for (final item in entry.value)
                                  _notificationTile(
                                      Map<String, dynamic>.from(item)),
                              ],
                            ],
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
