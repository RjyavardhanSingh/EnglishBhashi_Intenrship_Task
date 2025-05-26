import 'package:flutter/material.dart';
import '../models/course_models.dart';
import '../services/api_service.dart';
import './lesson_screen.dart'; // Will be ChapterScreen or similar

class CourseDetailScreen extends StatefulWidget {
  final String courseId;
  final ApiService apiService;

  const CourseDetailScreen(
      {Key? key, required this.courseId, required this.apiService})
      : super(key: key);

  @override
  _CourseDetailScreenState createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  Course? _course;
  UserProgress? _userProgress;
  bool _isLoading = true;
  bool _isEnrolling = false;
  bool _isEnrolled = false;
  String? _error;
  final Set<String> _completedChapters = {}; // Changed from _completedLessons

  @override
  void initState() {
    super.initState();
    _loadCourseDetails();
  }

  Future<void> _loadCourseDetails({bool forceRefresh = false}) async {
    if (!forceRefresh && mounted) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    } else if (forceRefresh && mounted) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final courseDetails = await widget.apiService.getCourseById(widget.courseId);
      UserProgress? progress;
      bool enrolledStatus = false;

      try {
        final userProfile = await widget.apiService.getProfile();
        if (userProfile.enrolledCourses.any((enrolledCourseId) => enrolledCourseId == widget.courseId)) {
          enrolledStatus = true;
          try {
            progress = await widget.apiService.getUserProgressForCourse(widget.courseId);
            if (progress != null) {
              _completedChapters.clear();
              _completedChapters.addAll(progress.completedChapters);
            }
          } catch (e) {
            print('CourseDetailScreen: Could not fetch progress for enrolled course ${widget.courseId}: $e');
          }
        }
      } catch (e) {
        print('CourseDetailScreen: Error checking enrollment status or fetching progress: $e');
      }
      
      if (mounted) {
        setState(() {
          _course = courseDetails;
          _userProgress = progress;
          _isEnrolled = enrolledStatus;
          _isLoading = false;
        });
      }

    } catch (e) {
      print('CourseDetailScreen: Error loading course details: $e');
      if (mounted) {
        setState(() {
          _error = 'Failed to load course details: ${e.toString()}';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _enrollInCourse() async {
    if(mounted) {
      setState(() {
        _isEnrolling = true; 
      });
    }
    try {
      await widget.apiService.enrollCourse(widget.courseId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Successfully enrolled!')),
      );
      await _loadCourseDetails(forceRefresh: true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to enroll: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isEnrolling = false;
        });
      }
    }
  }

  Future<void> _handleMarkChapterComplete(String chapterId) async { // Renamed from _handleMarkLessonComplete
    if (!_isEnrolled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You must be enrolled to mark chapters complete.')),
      );
      return;
    }
    try {
      // Use the new markChapterAsComplete method
      final updatedProgress = await widget.apiService.markChapterAsComplete(chapterId);
      if (mounted) {
        setState(() {
          _completedChapters.add(chapterId);
          _userProgress = updatedProgress; // Update user progress with the response
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chapter marked as complete!')),
        );
        // Update current chapter
        await widget.apiService.updateCurrentChapter(widget.courseId, chapterId);

      }
    } catch (e) {
      print("Failed to mark chapter complete from CourseDetailScreen: $e");
      if(mounted){
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating chapter progress: $e')),
        );
      }
      // Do not rethrow here unless you want to propagate it further up,
      // which might not be necessary if it's handled by showing a SnackBar.
    }
  }

  void _navigateToChapter(ChapterModel chapter) { // Renamed from _navigateToLesson, takes ChapterModel
    if (!_isEnrolled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enroll in the course to view chapters.')),
      );
      return;
    }

    final allChapters = _course?.sections
        .expand((s) => s.units)
        .expand((u) => u.chapters)
        .toList() ?? [];
    final currentChapterIndex = allChapters.indexWhere((c) => c.id == chapter.id);
    
    // Navigate to a new screen, let's call it ChapterScreen for now
    // This screen will be similar to the old LessonScreen but adapted for ChapterModel
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => LessonScreen( // TODO: Rename LessonScreen to ChapterScreen and update its internals
          lesson: chapter, // Pass ChapterModel, LessonScreen needs to be adapted
          courseId: widget.courseId,
          onMarkAsComplete: _handleMarkChapterComplete, // Pass the new handler
          isCompleted: _completedChapters.contains(chapter.id),
          onNextLesson: currentChapterIndex != -1 && currentChapterIndex < allChapters.length - 1
              ? () {
                  if (Navigator.canPop(context)) Navigator.pop(context);
                  _navigateToChapter(allChapters[currentChapterIndex + 1]);
                }
              : null,
          onPreviousLesson: currentChapterIndex != -1 && currentChapterIndex > 0
              ? () {
                  if (Navigator.canPop(context)) Navigator.pop(context);
                  _navigateToChapter(allChapters[currentChapterIndex - 1]);
                }
              : null,
        ),
      ),
    ).then((_) {
      // Refresh progress after returning from a chapter, as it might have been updated
      _loadCourseDetails(forceRefresh: true); 
    });
  }

  Widget _buildCourseHeader() {
    if (_course == null) return const SizedBox.shrink();

    int totalChapters = _course!.sections
        .expand((s) => s.units)
        .expand((u) => u.chapters)
        .length;
    int completedChaptersCount = _completedChapters.length;
    
    // Use overallProgress from _userProgress if available, otherwise calculate locally
    double progressPercentage = _userProgress?.overallProgress != null && _userProgress!.overallProgress > 0
        ? _userProgress!.overallProgress / 100.0 // Assuming overallProgress is 0-100
        : (totalChapters > 0 ? completedChaptersCount / totalChapters : 0.0);


    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(_course!.title, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(_course!.description, style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: 16),
        if (_isEnrolled && totalChapters > 0)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Your Progress: $completedChaptersCount / $totalChapters chapters', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: progressPercentage,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
                minHeight: 10,
              ),
              const SizedBox(height: 20),
            ],
          ),
        if (!_isEnrolled)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                textStyle: const TextStyle(fontSize: 16)
              ),
              onPressed: _isEnrolling ? null : _enrollInCourse,
              child: _isEnrolling 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                  : const Text('Enroll in this Course'),
            ),
          )
        else if (totalChapters > 0)
          Padding(
            padding: const EdgeInsets.only(top: 16.0),
            child: Text('You are enrolled in this course.', style: TextStyle(color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold)),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Loading Course...')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(_error!, style: const TextStyle(color: Colors.red)),
          ),
        ),
      );
    }

    if (_course == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Not Found')),
        body: const Center(child: Text('The course details could not be loaded.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_course!.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _loadCourseDetails(forceRefresh: true),
            tooltip: 'Refresh Course Details',
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadCourseDetails(forceRefresh: true),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildCourseHeader(),
              const SizedBox(height: 24),
              Text('Course Content', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 10),
              if (_course!.sections.isEmpty)
                const Text('No content available for this course yet.')
              else
                ListView.builder( // Outer list for Sections
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _course!.sections.length,
                  itemBuilder: (context, sectionIndex) {
                    final section = _course!.sections[sectionIndex];
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 8.0),
                      elevation: 2,
                      child: ExpansionTile(
                        title: Text(section.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                        subtitle: Text(section.description, style: Theme.of(context).textTheme.bodySmall),
                        initiallyExpanded: true, // Consider managing expansion state
                        childrenPadding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 0),
                        children: section.units.map((unit) { // Inner list for Units
                          return ExpansionTile(
                            title: Text(unit.title, style: Theme.of(context).textTheme.titleMedium),
                            subtitle: Text(unit.description, style: Theme.of(context).textTheme.bodySmall),
                            initiallyExpanded: false, // Units can be collapsed by default
                             childrenPadding: const EdgeInsets.only(left: 16.0, right: 8.0, bottom: 8.0),
                            children: unit.chapters.map((chapter) { // Innermost list for Chapters
                              final isCompleted = _completedChapters.contains(chapter.id);
                              return ListTile(
                                leading: Icon(
                                  isCompleted ? Icons.check_circle : Icons.play_circle_outline,
                                  color: isCompleted ? Colors.green : Theme.of(context).colorScheme.primary,
                                ),
                                title: Text(chapter.title),
                                subtitle: Text('Type: ${chapter.type}'), // Display chapter type
                                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                                onTap: () => _navigateToChapter(chapter),
                                tileColor: isCompleted ? Colors.green.withOpacity(0.05) : null,
                              );
                            }).toList(),
                          );
                        }).toList(),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
