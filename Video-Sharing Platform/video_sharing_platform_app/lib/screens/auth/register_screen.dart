import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../constants.dart';
import '../../widgets/gradient_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _fullNameController = TextEditingController();
  final _channelNameController = TextEditingController();
  final _handleController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _isLoading = false;
  bool _obscurePassword = true;
  String _errorMsg = '';
  String _successMsg = '';

  String _logoUrl = '';
  bool _isLoadingLogo = true;
  bool _agreedToTerms = false;

  @override
  void initState() {
    super.initState();
    _fetchSettings();
  }

  Future<void> _fetchSettings() async {
    final settings = await AuthService.getPublicSettings();
    if (mounted) {
      setState(() {
        _isLoadingLogo = false;
        if (settings['logoUrl'] != null) {
          String url = settings['logoUrl'];
          if (url.contains('localhost')) {
            url = url.replaceAll('localhost', '192.168.24.11');
          } else if (!url.startsWith('http')) {
            url = '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
          }
          _logoUrl = url;
        }
      });
    }
  }

  Future<void> _handleRegister() async {
    if (!_agreedToTerms) {
      setState(() {
        _errorMsg = 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMsg = '';
      _successMsg = '';
    });

    final formData = {
      'fullName': _fullNameController.text.trim(),
      'channelName': _channelNameController.text.trim(),
      'handle': _handleController.text.trim(),
      'email': _emailController.text.trim(),
      'phoneNumber': _phoneController.text.trim(),
      'password': _passwordController.text,
    };

    final res = await AuthService.register(formData);

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (res['success'] == true) {
      setState(() {
        _successMsg = 'Đăng ký thành công! Vui lòng đăng nhập.';
      });
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.of(context).pop(); // Quay lại màn hình đăng nhập
        }
      });
    } else {
      setState(() {
        _errorMsg = res['message'];
      });
    }
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hintText,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            obscureText: isPassword && _obscurePassword,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: const TextStyle(color: Colors.grey),
              prefixIcon: Icon(icon, color: Colors.grey),
              suffixIcon: isPassword
                  ? IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    )
                  : null,
              filled: true,
              fillColor: Colors.black.withValues(alpha: 0.3),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
              ),
            ),
          ),
        ],
      ),
    );
  }

   Widget _buildSocialButton({required Widget icon, required String text}) {
    return SizedBox(
      height: 50,
      child: OutlinedButton.icon(
        onPressed: () {},
        icon: icon,
        label: Text(text, style: const TextStyle(color: Colors.white, fontSize: 16)),
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.black.withValues(alpha: 0.5),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Stack(
        children: [
          // Background Image
          Positioned.fill(
            child: Image.asset(
              'assets/photo-1598550476439-6847785fcea6.avif',
              fit: BoxFit.cover,
            ),
          ),
          // Dark Overlay
          Positioned.fill(
            child: Container(
              color: Colors.black.withValues(alpha: 0.85),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo
                    if (_isLoadingLogo)
                      const SizedBox(height: 100, child: Center(child: CircularProgressIndicator(color: AppConstants.accentColor)))
                    else if (_logoUrl.isNotEmpty)
                      Image.network(_logoUrl, height: 100, errorBuilder: (c, e, s) => Image.asset('assets/logo.png', height: 100))
                    else
                      Image.asset('assets/logo.png', height: 100),
                    
                    const SizedBox(height: 20),

                    RichText(
                      textAlign: TextAlign.center,
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'Đăng ký ',
                            style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                          ),
                          TextSpan(
                            text: 'tài khoản',
                            style: TextStyle(color: AppConstants.accentColor, fontSize: 32, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Bắt đầu hành trình, sáng tạo không giới hạn',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    const SizedBox(height: 24),
                    
                    if (_errorMsg.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.1),
                          border: Border.all(color: Colors.red.withValues(alpha: 0.5)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _errorMsg,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                      ),

                    if (_successMsg.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.1),
                          border: Border.all(color: Colors.green.withValues(alpha: 0.5)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _successMsg,
                          style: const TextStyle(color: Colors.green),
                          textAlign: TextAlign.center,
                        ),
                      ),

                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _fullNameController,
                            label: 'Họ và tên',
                            hintText: 'Nguyễn Văn A',
                            icon: Icons.person_outline,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _emailController,
                            label: 'Email',
                            hintText: 'nhap@email.com',
                            icon: Icons.email_outlined,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _phoneController,
                            label: 'Số điện thoại',
                            hintText: '0987654321',
                            icon: Icons.phone_outlined,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _passwordController,
                            label: 'Mật khẩu',
                            hintText: '••••••••',
                            icon: Icons.lock_outline,
                            isPassword: true,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _channelNameController,
                            label: 'Tên Kênh',
                            hintText: 'Kênh của tôi',
                            icon: Icons.tv,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _handleController,
                            label: 'Tên định danh (Handle)',
                            hintText: '@user',
                            icon: Icons.alternate_email,
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: Checkbox(
                            value: _agreedToTerms,
                            onChanged: (val) {
                              setState(() {
                                _agreedToTerms = val ?? false;
                              });
                            },
                            fillColor: WidgetStateProperty.resolveWith((states) => 
                              states.contains(WidgetState.selected) ? AppConstants.accentColor : Colors.white),
                            checkColor: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: RichText(
                            text: const TextSpan(
                              style: TextStyle(color: Colors.white70, fontSize: 13),
                              children: [
                                TextSpan(text: 'Tôi đồng ý với '),
                                TextSpan(text: 'Điều khoản dịch vụ', style: TextStyle(color: AppConstants.accentColor)),
                                TextSpan(text: ' và '),
                                TextSpan(text: 'Chính sách bảo mật', style: TextStyle(color: AppConstants.accentColor)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    GradientButton(
                      text: 'Đăng ký ngay',
                      isLoading: _isLoading,
                      onPressed: _handleRegister,
                    ),
                    
                    const SizedBox(height: 16),
                    
                     // Divider
                    Row(
                      children: [
                        Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.1))),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text('hoặc tiếp tục với', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        ),
                        Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.1))),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Social
                    Row(
                      children: [
                        Expanded(child: _buildSocialButton(icon: Image.network('https://img.icons8.com/color/48/000000/google-logo.png', width: 24, height: 24), text: 'Google')),
                        const SizedBox(width: 16),
                        Expanded(child: _buildSocialButton(icon: const Icon(Icons.facebook, color: Colors.blue, size: 24), text: 'Facebook')),
                      ],
                    ),

                    const SizedBox(height: 16),
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Đã có tài khoản? ', style: TextStyle(color: Colors.white70)),
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                          },
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(50, 30),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text('Đăng nhập ngay', style: TextStyle(color: AppConstants.accentColor, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
