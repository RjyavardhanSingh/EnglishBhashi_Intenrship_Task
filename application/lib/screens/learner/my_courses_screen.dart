import 'package:flutter/material.dart';
import 'package:application/services/api_service.dart';
import 'package:application/models/course_models.dart';
import 'package:application/screens/course_detail_screen.dart';

class MyCoursesScreen extends StatefulWidget {
  const MyCoursesScreen({Key? key}) : super(key: key);

  @override
  _MyCoursesScreenState createState() => _MyCoursesScreenState();
}

class _MyCoursesScreenState extends State<MyCoursesScreen> {
  late ApiService _apiService;
  Future<List<UserProgress>>? _userProgressFuture; // Changed to Future<List<UserProgress>>
  Map<String, Course> _courseDetailsCache = {}; // Cache for course details

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _loadUserProgressAndCourseDetails();
  }

  void _loadUserProgressAndCourseDetails() {
    setState(() {
      _userProgressFuture = _apiService.getUserProgress(); // Use the correct method
    });
    // After fetching progress, fetch course details
    _userProgressFuture?.then((progressList) async {
      for (var progress in progressList) {
        if (!_courseDetailsCache.containsKey(progress.courseId)) {
          try {
            final course = await _apiService.getCourseById(progress.courseId);
            if (mounted) {
              setState(() {
                _courseDetailsCache[progress.courseId] = course;
              });
            }
          } catch (e) {
            print("Error fetching course details for ${progress.courseId}: $e");
            // Optionally handle error for individual course fetching
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Courses'),
      ),
      body: FutureBuilder<List<UserProgress>>(
        future: _userProgressFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting && _courseDetailsCache.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('You are not enrolled in any courses yet or no progress found.'));
          }

          final userProgressList = snapshot.data!;

          return ListView.builder(
            itemCount: userProgressList.length,
            itemBuilder: (context, index) {
              final progress = userProgressList[index];
              final course = _courseDetailsCache[progress.courseId];

              if (course == null) {
                // Show a loading indicator or placeholder while course details are being fetched
                return Card(
                  margin: const EdgeInsets.all(8.0),
                  child: ListTile(
                    title: Text('Loading course: ${progress.courseId}...'),
                    subtitle: LinearProgressIndicator(value: progress.overallProgress / 100),
                  ),
                );
              }

              return Card(
                margin: const EdgeInsets.all(8.0),
                child: ListTile(
                  leading: course.imageUrl != null && course.imageUrl!.isNotEmpty
                      ? Image.network(course.imageUrl!, width: 50, height: 50, fit: BoxFit.cover)
                      : const Icon(Icons.book, size: 40),
                  title: Text(course.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(course.description ?? 'No description.', maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value: progress.overallProgress / 100,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).primaryColor),
                      ),
                      const SizedBox(height: 4),
                      Text('${progress.overallProgress.toStringAsFixed(0)}% complete'),
                    ],
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios),
                  isThreeLine: true,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CourseDetailScreen(
                          courseId: course.id,
                          apiService: _apiService,
                        ),
                      ),
                    ).then((_) => _loadUserProgressAndCourseDetails()); // Refresh on return
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
