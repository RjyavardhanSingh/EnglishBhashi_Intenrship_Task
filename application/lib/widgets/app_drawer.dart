import 'package:flutter/material.dart';
import 'package:application/services/api_service.dart';
import 'package:application/models/course_models.dart';

// Import screen files for navigation
// Note: CourseDetailScreen is typically navigated to with arguments, not directly from drawer usually.
// import '../screens/course_detail_screen.dart'; 

class AppDrawer extends StatelessWidget {
  final ApiService apiService;
  final User? currentUser; // Make currentUser nullable as it might not be available immediately

  const AppDrawer({Key? key, required this.apiService, this.currentUser}) : super(key: key);

  Future<void> _logout(BuildContext context) async {
    try {
      await apiService.deleteToken();
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (Route<dynamic> route) => false);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Logout failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          UserAccountsDrawerHeader(
            accountName: Text(currentUser?.username ?? 'Guest'),
            accountEmail: Text(currentUser?.email ?? 'No email'),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                currentUser?.username.isNotEmpty == true ? currentUser!.username[0].toUpperCase() : 'G',
                style: const TextStyle(fontSize: 40.0),
              ),
            ),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard),
            title: const Text('Dashboard'),
            onTap: () {
              Navigator.pop(context); // Close drawer
              // Avoid pushing if already on dashboard, or use pushReplacementNamed
              if (ModalRoute.of(context)?.settings.name != '/dashboard') {
                Navigator.pushReplacementNamed(context, '/dashboard');
              }
            },
          ),
          if (currentUser?.role == 'learner') ...[
            ListTile(
              leading: const Icon(Icons.school), // Icon for My Courses
              title: const Text('My Courses'),
              onTap: () {
                Navigator.pop(context); // Close drawer
                Navigator.pushNamed(context, '/my_courses');
              },
            ),
            ListTile(
              leading: const Icon(Icons.search), // Icon for Browse Courses
              title: const Text('Browse Courses'),
              onTap: () {
                Navigator.pop(context); // Close drawer
                Navigator.pushNamed(context, '/browse_courses');
              },
            ),
          ],
          if (currentUser?.role == 'admin') ...[
            ListTile(
              leading: const Icon(Icons.library_books), // Icon for Manage Courses
              title: const Text('Manage Courses'),
              onTap: () {
                Navigator.pop(context); // Close drawer
                Navigator.pushNamed(context, '/admin_manage_courses');
              },
            ),
            ListTile(
              leading: const Icon(Icons.people), // Icon for Manage Users
              title: const Text('Manage Users'),
              onTap: () {
                Navigator.pop(context); // Close drawer
                Navigator.pushNamed(context, '/admin_manage_users');
              },
            ),
             ListTile(
              leading: const Icon(Icons.add_circle_outline), // Icon for Create Course
              title: const Text('Create Course'),
              onTap: () {
                Navigator.pop(context); // Close drawer
                Navigator.pushNamed(context, '/create_course');
              },
            ),
          ],
          const Divider(),
          ListTile(
            leading: const Icon(Icons.settings), // Icon for Settings
            title: const Text('Settings'),
            onTap: () {
              Navigator.pop(context); // Close drawer
              Navigator.pushNamed(context, '/settings');
            },
          ),
          ListTile(
            leading: const Icon(Icons.exit_to_app),
            title: const Text('Logout'),
            onTap: () => _logout(context),
          ),
        ],
      ),
    );
  }
}
