import 'package:flutter/material.dart';

class VerifiedBadge extends StatelessWidget {
  final double size;

  const VerifiedBadge({super.key, this.size = 16});

  @override
  Widget build(BuildContext context) {
    return Icon(
      Icons.verified,
      color: const Color(0xFF03A9F4),
      size: size,
    );
  }
}