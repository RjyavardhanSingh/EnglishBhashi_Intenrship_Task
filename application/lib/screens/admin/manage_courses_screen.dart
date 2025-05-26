
import 'package:flutter/material.dart';
import 'package:application/services/api_service.dart';
import 'package:application/models/course_models.dart';
// import 'package:application/screens/admin/edit_course_screen.dart'; // Will be created later

class AdminManageCoursesScreen extends StatefulWidget {
  const AdminManageCoursesScreen({Key? key}) : super(key: key);

  @override
  _AdminManageCoursesScreenState createState() => _AdminManageCoursesScreenState();
}

class _AdminManageCoursesScreenState extends State<AdminManageCoursesScreen> {
  late ApiService _apiService;
  Future<List<Course>>? _coursesFuture;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadCourses();
  }

  void _loadCourses() {
    setState(() {
      _coursesFuture = _apiService.getCourses(); // Assuming admin sees all courses
    });
  }

  void _navigateToCreateCourse() async {
    final result = await Navigator.pushNamed(context, '/create_course');
    if (result == true) { // Assuming create course screen returns true on success
      _loadCourses(); // Refresh the list
    }
  }

  void _navigateToEditCourse(Course course) {
    // Navigator.push(
    //   context,
    //   MaterialPageRoute(
    //     builder: (context) => EditCourseScreen(course: course, apiService: _apiService),
    //   ),
    // ).then((value) {
    //   if (value == true) _loadCourses(); // Refresh if changes were made
    // });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Edit for ${course.title} - Not implemented yet')),
    );
  }

  Future<void> _deleteCourse(String courseId) async {
    // try {
    //   await _apiService.deleteCourse(courseId); // Assuming this method exists
    //   ScaffoldMessenger.of(context).showSnackBar(
    //     const SnackBar(content: Text('Course deleted successfully')),
    //   );
    //   _loadCourses(); // Refresh list
    // } catch (e) {
    //   ScaffoldMessenger.of(context).showSnackBar(
    //     SnackBar(content: Text('Failed to delete course: $e')),
    //   );
    // }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Delete course - Not implemented yet')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Courses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _navigateToCreateCourse,
            tooltip: 'Create New Course',
          ),
        ],
      ),
      body: FutureBuilder<List<Course>>(
        future: _coursesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No courses found. Add some!'));
          }

          final courses = snapshot.data!;
          return ListView.builder(
            itemCount: courses.length,
            itemBuilder: (context, index) {
              final course = courses[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                child: ListTile(
                  title: Text(course.title),
                  subtitle: Text(course.description ?? 'No description'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        onPressed: () => _navigateToEditCourse(course),
                        tooltip: 'Edit Course',
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _deleteCourse(course.id),
                        tooltip: 'Delete Course',
                      ),
                    ],
                  ),
                  onTap: () {
                    // Maybe navigate to a detailed admin view of the course or directly to edit
                    _navigateToEditCourse(course);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
