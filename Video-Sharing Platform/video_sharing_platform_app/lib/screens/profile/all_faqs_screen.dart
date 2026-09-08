import 'package:flutter/material.dart';

class AllFaqsScreen extends StatefulWidget {
  final List<dynamic> faqs;

  const AllFaqsScreen({super.key, required this.faqs});

  @override
  State<AllFaqsScreen> createState() => _AllFaqsScreenState();
}

class _AllFaqsScreenState extends State<AllFaqsScreen> {
  int? _expandedFaqIndex;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        elevation: 0,
        title: const Text('Tất cả câu hỏi', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        itemCount: widget.faqs.length,
        itemBuilder: (context, idx) {
          final faq = widget.faqs[idx];
          final isExpanded = _expandedFaqIndex == idx;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF161618),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
            ),
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                onExpansionChanged: (expanded) {
                  setState(() {
                    _expandedFaqIndex = expanded ? idx : null;
                  });
                },
                initiallyExpanded: isExpanded,
                title: Text(faq['question'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                iconColor: Colors.blueAccent,
                collapsedIconColor: Colors.white24,
                childrenPadding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
                children: [
                  Text(faq['answer'] ?? '', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.5)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
