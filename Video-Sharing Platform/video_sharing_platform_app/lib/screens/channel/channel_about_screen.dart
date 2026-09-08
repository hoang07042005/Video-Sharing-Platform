import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import 'dart:convert';

class ChannelAboutScreen extends StatelessWidget {
  final Map<String, dynamic> channel;

  const ChannelAboutScreen({super.key, required this.channel});

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  String _formatCount(dynamic count) {
    if (count == null) return '0';
    if (count is int) return count.toString();
    return count.toString();
  }

  List<Map<String, String>> _parseLinks() {
    List<Map<String, String>> activeLinks = [];
    try {
      dynamic rawLinks = channel['socialLinks'];
      if (rawLinks is String) {
        try {
          rawLinks = jsonDecode(rawLinks);
        } catch (_) {}
      }
      if (rawLinks is Map) {
        rawLinks.forEach((key, value) {
          if (value != null && value.toString().isNotEmpty) {
            activeLinks.add({'platform': key.toString(), 'url': value.toString()});
          }
        });
      } else if (rawLinks is List) {
        for (var item in rawLinks) {
          if (item is Map) {
            final p = item['platform']?.toString() ?? item['name']?.toString() ?? item['title']?.toString() ?? 'link';
            final u = item['url']?.toString() ?? item['link']?.toString() ?? '';
            if (u.isNotEmpty) {
              activeLinks.add({'platform': p, 'url': u});
            }
          }
        }
      }
    } catch (_) {}
    return activeLinks;
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF4FC3F7), size: 20),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildOtherInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.white70, size: 20),
          const SizedBox(width: 16),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 14))),
        ],
      ),
    );
  }

  Widget _buildSocialLink(BuildContext context, String title, String url, IconData icon, Color iconColor) {
    return InkWell(
      onTap: () async {
        final uri = Uri.parse(url.startsWith('http') ? url : 'https://$url');
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 16.0),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(url, style: const TextStyle(color: Color(0xFF4FC3F7), fontSize: 12), overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final description = channel['description']?.toString() ?? '';
    final country = channel['country']?.toString();
    final links = _parseLinks();
    
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Giới thiệu về kênh', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Mô tả ──
            if (description.isNotEmpty) ...[
              _buildSectionTitle('Mô tả', Icons.notes),
              const SizedBox(height: 16),
              Text(
                description,
                style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 32),
              const Divider(color: Color(0xFF1C1C1E)),
              const SizedBox(height: 24),
            ],

            // ── Đường liên kết ──
            if (links.isNotEmpty) ...[
              _buildSectionTitle('Đường liên kết', Icons.link_rounded),
              const SizedBox(height: 16),
              ...links.map((link) {
                final platform = link['platform']!.toLowerCase();
                IconData icon = Icons.link;
                Color iconColor = Colors.white54;
                
                if (platform.contains('facebook')) {
                  icon = FontAwesomeIcons.facebook;
                  iconColor = Colors.blueAccent;
                } else if (platform.contains('instagram')) {
                  icon = FontAwesomeIcons.instagram;
                  iconColor = Colors.pinkAccent;
                } else if (platform.contains('youtube')) {
                  icon = FontAwesomeIcons.youtube;
                  iconColor = Colors.red;
                } else if (platform.contains('tiktok')) {
                  icon = FontAwesomeIcons.tiktok;
                  iconColor = Colors.white;
                } else if (platform.contains('website')) {
                  icon = Icons.language;
                  iconColor = Colors.white;
                } else if (platform.contains('email')) {
                  icon = Icons.email;
                  iconColor = Colors.white;
                 } else if (platform.contains('discord')) {
                  icon = FontAwesomeIcons.discord;
                  iconColor = const Color.fromARGB(255, 109, 21, 249);
                 } else if (platform.contains('telegram')) {
                  icon = FontAwesomeIcons.telegram;
                  iconColor = const Color.fromARGB(255, 2, 140, 247);
                } else if (platform.contains('twitter') || platform.contains('x')) {
                  icon = FontAwesomeIcons.xTwitter;
                  iconColor = Colors.white;
                }
                
                String title = platform.substring(0, 1).toUpperCase() + platform.substring(1);
                if (platform.contains('youtube')) title = 'YouTube';
                else if (platform.contains('facebook')) title = 'Facebook';
                
                return _buildSocialLink(context, title, link['url']!, icon, iconColor);
              }),
              const SizedBox(height: 16),
              const Divider(color: Color(0xFF1C1C1E)),
              const SizedBox(height: 24),
            ],

            // ── Thông tin khác ──
            _buildSectionTitle('Thông tin khác', Icons.info_outline),
            const SizedBox(height: 16),
            _buildOtherInfoRow(Icons.tv_outlined, 'www.videoplatform.com/@${channel['handle']}'),
            if (country != null && country.isNotEmpty)
              _buildOtherInfoRow(Icons.language, country),
            _buildOtherInfoRow(Icons.info_outline, 'Đã tham gia ${_formatDate(channel['createdAt'])}'),
            _buildOtherInfoRow(Icons.people_outline, '${_formatCount(channel['subscriberCount'])} người đăng ký'),
            if (channel['videoCount'] != null)
              _buildOtherInfoRow(Icons.video_library_outlined, '${_formatCount(channel['videoCount'])} video'),
            _buildOtherInfoRow(Icons.trending_up, '${_formatCount(channel['totalViews'])} lượt xem'),
            
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
