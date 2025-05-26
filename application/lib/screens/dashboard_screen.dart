import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/course_models.dart'; // For Course, UserProgress, User
import '../widgets/app_drawer.dart'; // Import AppDrawer
import 'course_detail_screen.dart'; // Import CourseDetailScreen

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  late Future<User> _userProfileFuture;
  late Future<List<Course>> _allCoursesFuture;
  late Future<List<UserProgress>> _userProgressFuture; // Changed from _enrolledCoursesProgress
  User? _currentUser;
  List<UserProgress> _userProgress = []; // Changed from _enrolledCoursesProgress
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _userProfileFuture = _apiService.getProfile();
      _currentUser = await _userProfileFuture;

      _allCoursesFuture = _apiService.getCourses(); // Fetch all courses
      // Fetch user progress (includes courses they are enrolled in and their progress)
      _userProgressFuture = _apiService.getUserProgress(); 
      _userProgress = await _userProgressFuture;

    } catch (e) {
      print("Error loading dashboard data: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load dashboard data: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleEnrollCourse(String courseId) async {
    try {
      await _apiService.enrollCourse(courseId);
      // Refresh data after enrollment
      _loadDashboardData(); 
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Successfully enrolled!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to enroll: $e')),
      );
    }
  }

  Future<void> _logout() async {
    await _apiService.deleteToken();
    Navigator.of(context).pushReplacementNamed('/login');
  }

  Widget _buildDashboardContent() {
    // Add null check for _currentUser
    if (_currentUser == null) {
      return Center(child: CircularProgressIndicator());
    }
    
    // Determine content based on user role
    if (_currentUser!.role == 'admin') {
      return AdminDashboardContent(coursesFuture: _allCoursesFuture, apiService: _apiService);
    } else {
      return FutureBuilder<List<Course>>(
        future: _allCoursesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error loading courses: ${snapshot.error}'));
          } else {
            final allCourses = snapshot.data ?? [];
            // Create a course details cache for quick lookup
            final Map<String, Course> courseDetailsCache = {
              for (var course in allCourses) course.id: course
            };
            
            return LearnerDashboardContent(
              user: _currentUser!,
              enrolledCoursesProgress: _userProgress,
              allCourses: allCourses,
              courseDetailsCache: courseDetailsCache,
              onEnroll: _handleEnrollCourse,
              onViewCourse: (courseId) {
                Navigator.pushNamed(
                  context,
                  '/course_detail',
                  arguments: courseId,
                );
              },
            );
          }
        },
      );
    }
  }

  Widget _buildWelcomeSection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back, ${_currentUser?.firstName ?? _currentUser?.username ?? 'User'}!',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            _currentUser?.role == 'admin' ? 'Manage your platform.' : 'Continue your learning journey.',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Logout',
          ),
        ],
      ),
      drawer: AppDrawer(currentUser: _currentUser, apiService: _apiService), // Added apiService
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorView()
              : RefreshIndicator(
                  onRefresh: _loadDashboardData,
                  child: ListView( // Changed to ListView to make it scrollable
                    children: [
                      _buildWelcomeSection(),
                      _buildDashboardContent(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 50),
            const SizedBox(height: 16),
            Text(
              'Failed to load dashboard data.',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _loadDashboardData,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

// --- Admin Specific Content ---
class AdminDashboardContent extends StatelessWidget {
  final Future<List<Course>> coursesFuture;
  final ApiService apiService;
  const AdminDashboardContent({super.key, required this.coursesFuture, required this.apiService});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Course>>(
      future: coursesFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Center(child: Text('No courses available.'));
        } else {
          final courses = snapshot.data!;

          // Example Stats - Replace with actual data fetching and models
          final stats = [
            StatCardData('Total Courses', courses.length.toString(), Icons.school, Colors.orange),
            StatCardData('Published Courses', courses.where((c) => c.isPublished).length.toString(), Icons.check_circle, Colors.green),
            StatCardData('Users', 'N/A', Icons.people, Colors.blue), // Placeholder
            StatCardData('Enrollments', 'N/A', Icons.bar_chart, Colors.purple), // Placeholder
          ];

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Stats Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, 
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.7, // Adjusted from 1.8 to give more height
                ),
                itemCount: stats.length,
                itemBuilder: (context, index) {
                  return StatCard(data: stats[index]);
                },
              ),
              const SizedBox(height: 24),
              // Course Management Section
              Text('Manage Courses', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 16),
              courses.isEmpty
                  ? const Text('No courses available.')
                  : ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: courses.length,
                      itemBuilder: (context, index) {
                        final course = courses[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          child: ListTile(
                            leading: course.imageUrl != null && course.imageUrl!.isNotEmpty
                              ? Image.network(course.imageUrl!, width: 50, height: 50, fit: BoxFit.cover, errorBuilder: (context, error, stackTrace) => Icon(Icons.broken_image, size: 50))
                              : Icon(Icons.school, size: 50, color: Theme.of(context).primaryColor),
                            title: Text(course.title, style: TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(course.category ?? 'N/A'), // Handle nullable category
                            trailing: Icon(Icons.arrow_forward_ios),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => CourseDetailScreen(courseId: course.id, apiService: apiService),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
            ],
          );
        }
      },
    );
  }
}

// --- Learner Specific Content ---
class LearnerDashboardContent extends StatelessWidget {
  final User user;
  final List<UserProgress> enrolledCoursesProgress;
  final List<Course> allCourses; // All courses for the 'explore' section
  final Map<String, Course> courseDetailsCache; // Pass the cache here
  final Function(String) onEnroll;
  final Function(String) onViewCourse; // Callback to view course details

  const LearnerDashboardContent({
    super.key,
    required this.user,
    required this.enrolledCoursesProgress,
    required this.allCourses,
    required this.courseDetailsCache,
    required this.onEnroll,
    required this.onViewCourse,
  });

  @override
  Widget build(BuildContext context) {
    // Use the user's direct enrollment list for filtering 'availableToEnroll'
    final Set<String> trulyEnrolledCourseIds = user.enrolledCourses.toSet();
    
    // Filter out courses that are not published OR are already in the user's direct enrollment list
    final availableToEnroll = allCourses
        .where((c) =>
            !trulyEnrolledCourseIds.contains(c.id) && c.isPublished)
        .toList();

    // Stats are based on courses with progress records
    final stats = [
      StatCardData('Enrolled Courses', enrolledCoursesProgress.length.toString(), Icons.book_online, Colors.blueAccent),
      StatCardData('Courses Completed', enrolledCoursesProgress.where((p) => p.completed).length.toString(), Icons.check_circle_outline, Colors.green),
      StatCardData('Avg. Progress', '${enrolledCoursesProgress.isNotEmpty ? (enrolledCoursesProgress.map((p)=>p.overallProgress).fold(0.0, (a,b)=>a+b)/enrolledCoursesProgress.length).toStringAsFixed(0) : 0}%', Icons.trending_up, Colors.teal),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Stats Grid
        GridView.count(
          crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 2, // Responsive grid
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: MediaQuery.of(context).size.width > 600 ? 2.2 : 1.8, // Adjusted: Made cards taller
          children: stats.map((stat) => StatCard(data: stat)).toList(),
        ),
        const SizedBox(height: 24),

        // My Courses Section
        if (enrolledCoursesProgress.isNotEmpty)...[
          _buildSectionTitle(context, 'My Courses', onViewMore: () {
            // TODO: Navigate to a dedicated "My Courses" screen if needed
          }),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: enrolledCoursesProgress.length,
            itemBuilder: (context, index) {
              final progress = enrolledCoursesProgress[index];
              final course = courseDetailsCache[progress.courseId];
              if (course == null) {
                // Show a placeholder or loading for this specific card if details are missing
                return Card(child: ListTile(title: Text('Loading course: ${progress.courseId}...')));
              }
              return CourseProgressCard(
                progress: progress,
                course: course, 
                onTap: () => onViewCourse(course.id) // Navigate to course detail
              );
            },          
          ),
          const SizedBox(height: 24),
        ],

        // Explore Courses Section
        _buildSectionTitle(context, 'Explore Courses', onViewMore: () {
          // TODO: Navigate to a dedicated "Browse Courses" screen
        }),
        if (availableToEnroll.isNotEmpty)
          SizedBox(
            height: 280, // Give a fixed height or use other constraints
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: availableToEnroll.length,
              itemBuilder: (context, index) {
                final course = availableToEnroll[index];
                return CourseDiscoveryCard(
                  course: course, 
                  onEnroll: onEnroll, 
                  onTap: () => onViewCourse(course.id) // Navigate to course detail
                );
              },
            ),
          )
        else if (allCourses.where((c) => c.isPublished).isEmpty) // Check if there are any published courses at all
           _buildEmptyState(
              context,
              icon: Icons.cloud_off_outlined,
              title: 'No Courses Available',
              message: 'Please check back later for new courses.',
            )
        else // All published courses are enrolled
           _buildEmptyState(
              context,
              icon: Icons.sentiment_very_satisfied,
              title: "You've Enrolled in All Available Published Courses!",
              message: 'Great job! Check back later for new content.',
            ),
      ],
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title, {VoidCallback? onViewMore}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: Theme.of(context).textTheme.headlineSmall),
          if (onViewMore != null)
            TextButton(
              onPressed: onViewMore,
              child: const Text('View More'),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, {required IconData icon, required String title, required String message}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor)
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 60, color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.6)),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.8)),
            ),
          ],
        ),
      ),
    );
  }
}

// --- Reusable Widgets (StatCard, CourseCard etc.) ---
class StatCardData {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  StatCardData(this.title, this.value, this.icon, this.color);
}

class StatCard extends StatelessWidget {
  final StatCardData data;
  const StatCard({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Icon(data.icon, size: 18, color: data.color),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    data.title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontSize: Theme.of(context).textTheme.titleSmall!.fontSize! * 0.9,
                          color: Theme.of(context).textTheme.titleSmall?.color ?? Colors.black54,
                          fontWeight: FontWeight.w500,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Expanded(
              child: Center(
                child: FittedBox(
                  fit: BoxFit.contain,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2.0),
                    child: Text(
                      data.value,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 26,
                        color: data.color,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CourseProgressCard extends StatelessWidget {
  final UserProgress progress;
  final Course course;
  final VoidCallback onTap;

  const CourseProgressCard({super.key, required this.progress, required this.course, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      course.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    '${progress.overallProgress.toStringAsFixed(0)}%',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(color: Colors.green),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: progress.overallProgress / 100,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
              ),
              const SizedBox(height: 8),
              // Use currentChapterId to fetch and display title, or show 'Not started'
              // This assumes you might fetch the chapter details elsewhere or pass them if available
              // For now, we'll just use the ID if the full object isn't populated.
              Text(
                'Current Chapter ID: ${progress.currentChapterId ?? "Not started"}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CourseDiscoveryCard extends StatelessWidget {
  final Course course;
  final Function(String) onEnroll;
  final VoidCallback onTap;

  const CourseDiscoveryCard({super.key, required this.course, required this.onEnroll, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 230,
      child: Card(
        clipBehavior: Clip.antiAlias,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.only(right: 12, bottom: 4, top: 4),
        child: InkWell(
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Course Image
              Container(
                height: 120,
                width: double.infinity,
                child: course.imageUrl != null && course.imageUrl!.isNotEmpty
                    ? Image.network(
                        course.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: Colors.grey[300],
                          child: Icon(Icons.school_outlined, size: 40, color: Colors.grey[500]),
                        ),
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Center(
                            child: CircularProgressIndicator(
                              value: loadingProgress.expectedTotalBytes != null
                                  ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                  : null,
                            ),
                          );
                        },
                      )
                    : Container(
                        color: Colors.grey[300],
                        child: Icon(Icons.school_outlined, size: 40, color: Colors.grey[500]),
                      ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(10.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            course.title,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            course.description,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 12, color: Colors.grey[700]),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => onEnroll(course.id),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text('Enroll Now'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
