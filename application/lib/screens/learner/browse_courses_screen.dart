import 'package:flutter/material.dart';
import 'package:application/services/api_service.dart';
import 'package:application/models/course_models.dart';
import 'package:application/screens/course_detail_screen.dart';

class BrowseCoursesScreen extends StatefulWidget {
  const BrowseCoursesScreen({Key? key}) : super(key: key);

  @override
  _BrowseCoursesScreenState createState() => _BrowseCoursesScreenState();
}

class _BrowseCoursesScreenState extends State<BrowseCoursesScreen> {
  late ApiService _apiService;
  Future<List<Course>>? _allCoursesFuture;
  User? _currentUser;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadAllCourses();
    _loadUserProfile();
  }

  void _loadAllCourses() {
    setState(() {
      _allCoursesFuture = _apiService.getCourses();
    });
  }

  Future<void> _loadUserProfile() async {
    try {
      final user = await _apiService.getProfile();
      setState(() {
        _currentUser = user;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load user profile: $e')),
      );
    }
  }

  Future<void> _handleEnrollCourse(String courseId) async {
    if (_currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User profile not loaded. Cannot enroll.')),
      );
      return;
    }
    // Check if already enrolled
    bool isEnrolled = _currentUser!.enrolledCourses.any((cId) => cId == courseId);
    if (isEnrolled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You are already enrolled in this course.')),
      );
      // Optionally navigate to the course directly
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CourseDetailScreen(courseId: courseId, apiService: _apiService),
        ),
      );
      return;
    }

    try {
      await _apiService.enrollCourse(courseId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Successfully enrolled in the course!')),
      );
      // Refresh user profile to update enrolled courses list
      await _loadUserProfile(); 
      // Refresh all courses (in case enrollment status changes how they are displayed or to update UI if needed)
      // _loadAllCourses(); // Consider if this is strictly necessary or if UI updates via user profile are enough
      
      // Navigate to the course details page after successful enrollment
      Navigator.pushReplacement( // Use pushReplacement if you don't want user to go "back" to browse screen for this item
        context,
        MaterialPageRoute(
          builder: (context) => CourseDetailScreen(courseId: courseId, apiService: _apiService),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to enroll: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Browse Courses'),
      ),
      body: FutureBuilder<List<Course>>(
        future: _allCoursesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No courses available at the moment.'));
          }

          final courses = snapshot.data!;
          return ListView.builder(
            itemCount: courses.length,
            itemBuilder: (context, index) {
              final course = courses[index];
              // Determine if the user is already enrolled in this course
              bool isEnrolled = _currentUser?.enrolledCourses.any((cId) => cId == course.id) ?? false;

              return Card(
                margin: const EdgeInsets.all(8.0),
                child: ListTile(
                  leading: course.imageUrl != null && course.imageUrl!.isNotEmpty
                      ? Image.network(course.imageUrl!, width: 60, height: 60, fit: BoxFit.cover, errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, size: 40))
                      : const Icon(Icons.book, size: 40),
                  title: Text(course.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(course.description),
                      const SizedBox(height: 4),
                      Text('Category: ${course.category} | Level: ${course.level}'),
                      Text('Price: \$${course.price.toStringAsFixed(2)}'),
                    ],
                  ),
                  trailing: isEnrolled
                      ? ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => CourseDetailScreen(courseId: course.id, apiService: _apiService),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.grey),
                          child: const Text('View'),
                        )
                      : ElevatedButton(
                          onPressed: () => _handleEnrollCourse(course.id),
                          child: const Text('Enroll'),
                        ),
                  onTap: () {
                     Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CourseDetailScreen(courseId: course.id, apiService: _apiService),
                        ),
                      );
                  },
                  isThreeLine: true, // Adjust if content makes it taller
                ),
              );
            },
          );
        },
      ),
    );
  }
}
