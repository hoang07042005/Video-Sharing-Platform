import 'dart:convert';
import 'dart:io';

void main() async {
  final url = Uri.parse('http://192.168.24.20:5139/api/videos/recommended');
  try {
    final response = await HttpClient().getUrl(url)
      .then((req) => req.close());
    final stringData = await response.transform(utf8.decoder).join();
    final data = jsonDecode(stringData);
    if (data is List && data.isNotEmpty) {
      print(jsonEncode(data.first));
    } else {
      print('Empty list or not a list');
    }
  } catch (e) {
    print('Error: $e');
  }
}
