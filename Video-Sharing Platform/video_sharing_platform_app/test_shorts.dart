import 'dart:convert';
import 'dart:io';

void main() async {
  final url = Uri.parse('http://192.168.24.20:5139/api/videos/shorts');
  try {
    final response = await HttpClient().getUrl(url)
      .then((req) => req.close());
    final stringData = await response.transform(utf8.decoder).join();
    print('Response status: ${response.statusCode}');
    print('Data: $stringData');
  } catch (e) {
    print('Error: $e');
  }
}
