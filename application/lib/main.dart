import 'package:flutter/material.dart';
import 'services/api_service.dart'; // Import the ApiService
import 'screens/dashboard_screen.dart'; // Import the DashboardScreen
import 'widgets/app_drawer.dart'; // Import the AppDrawer
import 'screens/admin/create_course_screen.dart'; // Import CreateCourseScreen
import 'screens/course_detail_screen.dart'; // Import CourseDetailScreen
// Import new screens
import 'screens/learner/my_courses_screen.dart';
import 'screens/learner/browse_courses_screen.dart';
import 'screens/admin/manage_courses_screen.dart';
import 'screens/admin/manage_users_screen.dart';
import 'screens/settings_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EnglishBhashi',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
        // Basic theming to somewhat match the web app
        scaffoldBackgroundColor: const Color(
          0xFFF0F2F5,
        ), // Light grey background
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 1,
          iconTheme: IconThemeData(color: Colors.black54),
          titleTextStyle: TextStyle(
            color: Colors.black87,
            fontSize: 20,
            fontWeight: FontWeight.w500,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF007BFF), // Blue buttons
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: const BorderSide(color: Colors.grey),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: const BorderSide(color: Color(0xFF007BFF), width: 2),
          ),
          labelStyle: const TextStyle(color: Colors.black54),
        ),
        cardTheme: CardThemeData(
          // Changed CardTheme to CardThemeData
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
        ),
        textTheme: const TextTheme(
          headlineSmall: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
          titleMedium: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black54,
          ),
          bodyMedium: TextStyle(fontSize: 16, color: Colors.black87),
        ),
      ),
      home: const InitialScreen(), // Changed to InitialScreen
      routes: {
        '/login': (context) => const LoginPage(),
        '/dashboard': (context) => const DashboardScreen(),
        '/create_course': (context) => const CreateCourseScreen(),
        // Define routes for new screens
        '/my_courses': (context) => const MyCoursesScreen(),
        '/browse_courses': (context) => const BrowseCoursesScreen(),
        '/admin_manage_courses': (context) => const AdminManageCoursesScreen(),
        '/admin_manage_users': (context) => const AdminManageUsersScreen(),
        '/settings': (context) => const SettingsScreen(),
        // CourseDetailScreen will be navigated to using onGenerateRoute or by passing arguments
        // if direct navigation with ID in path is needed. For now, it's often pushed with arguments.
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/course_detail') {
          final args = settings.arguments as Map<String, dynamic>?;
          if (args != null && args.containsKey('courseId') && args.containsKey('apiService')) {
            return MaterialPageRoute(
              builder: (context) {
                return CourseDetailScreen(
                  courseId: args['courseId'] as String,
                  apiService: args['apiService'] as ApiService,
                );
              },
            );
          }
          // Handle error or return a default page if args are not correct
          return MaterialPageRoute(builder: (_) => const Scaffold(body: Center(child: Text('Error: Course ID not provided'))));
        }
        // Handle other routes or return null for default behavior
        return null;
      },
    );
  }
}

// New widget to check token and navigate
class InitialScreen extends StatefulWidget {
  const InitialScreen({super.key});

  @override
  State<InitialScreen> createState() => _InitialScreenState();
}

class _InitialScreenState extends State<InitialScreen> {
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    String? token = await _apiService
        .getToken(); // Use the public getToken method
    if (token != null) {
      // Potentially validate token here by making a lightweight API call (e.g., getProfile)
      try {
        // Validate token by fetching profile, if successful navigate to dashboard
        await _apiService.getProfile(); // Add this line to validate token
        Navigator.of(context).pushReplacementNamed('/dashboard');
      } catch (e) {
        // If token is invalid or profile fetch fails, go to login
        await _apiService.deleteToken(); // Clear invalid token
        Navigator.of(context).pushReplacementNamed('/login');
      }
    } else {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ), // Show loading while checking token
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  String _email = '';
  String _password = '';
  bool _isLoading = false; // To show loading indicator
  final ApiService _apiService =
      ApiService(); // Create an instance of ApiService

  Future<void> _login() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      setState(() {
        _isLoading = true;
      });
      try {
        print('Logging in with Email: $_email, Password: $_password');
        final response = await _apiService.login(_email, _password);
        print('Login successful: $response');

        // Navigate to Dashboard on successful login
        // You might want to pass user data or store it globally/provider
        Navigator.of(context).pushReplacementNamed('/dashboard');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login Successful: ${response['message']}')),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login Failed: $e')),
        );
      } finally {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(
        // Center the login form
        child: SingleChildScrollView(
          // Allow scrolling if content overflows
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: 400,
            ), // Max width for the form
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Text(
                    'Welcome Back!',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Sign in to continue to EnglishBhashi',
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 32),
                  TextFormField(
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.email),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your email';
                      }
                      if (!value.contains('@')) {
                        return 'Please enter a valid email';
                      }
                      return null;
                    },
                    onSaved: (value) {
                      _email = value!;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      prefixIcon: Icon(Icons.lock),
                    ),
                    obscureText: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your password';
                      }
                      return null;
                    },
                    onSaved: (value) {
                      _password = value!;
                    },
                  ),
                  const SizedBox(height: 24),
                  _isLoading
                      ? const CircularProgressIndicator()
                      : SizedBox(
                          width: double.infinity, // Make button full width
                          child: ElevatedButton(
                            onPressed: _login,
                            child: const Text('Login'),
                          ),
                        ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
