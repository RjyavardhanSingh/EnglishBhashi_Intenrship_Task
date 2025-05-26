import 'package:flutter/material.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../models/course_models.dart';

class LessonScreen extends StatefulWidget {
  final dynamic lesson; // Can be either Lesson or ChapterModel
  final String courseId;
  final Future<void> Function(String lessonId) onMarkAsComplete;
  final bool isCompleted;
  final VoidCallback? onNextLesson;
  final VoidCallback? onPreviousLesson;

  const LessonScreen({
    Key? key,
    required this.lesson,
    required this.courseId,
    required this.onMarkAsComplete,
    required this.isCompleted,
    this.onNextLesson,
    this.onPreviousLesson,
  }) : super(key: key);

  @override
  _LessonScreenState createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  YoutubePlayerController? _youtubeController;
  bool _isLoadingMarkComplete = false;
  late bool _isLessonCompleted;

  @override
  void initState() {
    super.initState();
    _isLessonCompleted = widget.isCompleted;
    _initializeYoutubeController();
  }

  void _initializeYoutubeController() {
    if (videoUrl != null && videoUrl!.isNotEmpty) {
      String? videoId = YoutubePlayer.convertUrlToId(videoUrl!);
      if (videoId != null) {
        _youtubeController = YoutubePlayerController(
          initialVideoId: videoId,
          flags: const YoutubePlayerFlags(
            autoPlay: false,
            mute: false,
          ),
        );
      } else {
        _youtubeController = null;
        print("Could not extract videoId from URL: $videoUrl");
      }
    } else {
      _youtubeController = null;
    }
  }

  @override
  void didUpdateWidget(covariant LessonScreen oldWidget) {
    super.didUpdateWidget(oldWidget);

    String? oldVideoUrlValue;
    if (oldWidget.lesson is Lesson) {
      oldVideoUrlValue = (oldWidget.lesson as Lesson).videoUrl;
    } else if (oldWidget.lesson is ChapterModel) {
      oldVideoUrlValue = (oldWidget.lesson as ChapterModel).videoUrl;
    }

    // Use the getter 'this.videoUrl' which correctly handles dynamic type
    if (this.videoUrl != oldVideoUrlValue) {
      _youtubeController?.dispose();
      _initializeYoutubeController();
    }

    if (widget.isCompleted != oldWidget.isCompleted) {
      setState(() {
        _isLessonCompleted = widget.isCompleted;
      });
    }
  }

  @override
  void dispose() {
    _youtubeController?.dispose();
    super.dispose();
  }

  Future<void> _handleMarkAsComplete() async {
    if (_isLessonCompleted || _isLoadingMarkComplete) return;

    setState(() {
      _isLoadingMarkComplete = true;
    });

    try {
      await widget.onMarkAsComplete(lessonId);
      // The parent (CourseDetailScreen) will show the SnackBar and update its state.
      // No need for a SnackBar here if the parent handles it upon successful completion of the future.
      // However, if onMarkAsComplete itself doesn't trigger a state update in parent that rebuilds this widget
      // with new isCompleted status, we might need to set it locally.
      // For now, assume parent updates `widget.isCompleted` which `didUpdateWidget` handles.
    } catch (e) {
      if (mounted) { // Check if the widget is still in the tree
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to mark as complete: $e')),
        );
      }
    } finally {
      if (mounted) { // Check if the widget is still in the tree
        setState(() {
          _isLoadingMarkComplete = false;
        });
      }
    }
  }

  // Helper methods to handle both Lesson and ChapterModel
  String get lessonTitle {
    if (widget.lesson is Lesson) {
      return (widget.lesson as Lesson).title;
    } else if (widget.lesson is ChapterModel) {
      return (widget.lesson as ChapterModel).title;
    }
    return 'Unknown Title';
  }

  String get lessonDescription {
    if (widget.lesson is Lesson) {
      return (widget.lesson as Lesson).description;
    } else if (widget.lesson is ChapterModel) {
      return (widget.lesson as ChapterModel).content ?? 'No description available';
    }
    return 'No description available';
  }

  String? get videoUrl {
    if (widget.lesson is Lesson) {
      return (widget.lesson as Lesson).videoUrl;
    } else if (widget.lesson is ChapterModel) {
      return (widget.lesson as ChapterModel).videoUrl;
    }
    return null;
  }

  String? get content {
    if (widget.lesson is Lesson) {
      return (widget.lesson as Lesson).content;
    } else if (widget.lesson is ChapterModel) {
      return (widget.lesson as ChapterModel).content;
    }
    return null;
  }

  String get lessonId {
    if (widget.lesson is Lesson) {
      return (widget.lesson as Lesson).id;
    } else if (widget.lesson is ChapterModel) {
      return (widget.lesson as ChapterModel).id;
    }
    return 'unknown';
  }

  String? get lessonType {
    if (widget.lesson is Lesson) {
      return (widget.lesson as Lesson).lessonType;
    } else if (widget.lesson is ChapterModel) {
      return (widget.lesson as ChapterModel).type; // Correctly use 'type' for ChapterModel
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(lessonTitle),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_youtubeController != null)
                    YoutubePlayer(
                      controller: _youtubeController!,
                      showVideoProgressIndicator: true,
                      progressIndicatorColor: Theme.of(context).colorScheme.primary,
                      progressColors: ProgressBarColors(
                        playedColor: Theme.of(context).colorScheme.primary,
                        handleColor: Theme.of(context).colorScheme.secondary,
                      ),
                      onReady: () {
                        // print('Player is ready.');
                      },
                    )
                  else if (videoUrl != null && videoUrl!.isNotEmpty)
                     Center(child: Text("Invalid YouTube Video URL: $videoUrl")),


                  const SizedBox(height: 16),
                  Text(
                    lessonTitle,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  // Use lesson.content if description is null or empty, otherwise use description
                  Text(
                    lessonDescription,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                  if (widget.lesson.lessonType == 'quiz')
                    Text("Quiz content would go here.", style: Theme.of(context).textTheme.bodyMedium),
                  // _buildQuizSection(widget.lesson.quiz), // If you have quiz data
                ],
              ),
            ),
          ),
          _buildBottomNavigationBar(),
        ],
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            spreadRadius: 0,
            blurRadius: 10,
            offset: const Offset(0, -2), // changes position of shadow
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          if (widget.onPreviousLesson != null)
            TextButton.icon(
              icon: const Icon(Icons.skip_previous),
              label: const Text('Previous'),
              onPressed: widget.onPreviousLesson,
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
            )
          else
            const SizedBox(width: 48), // Placeholder for alignment

          Expanded(
            child: Center(
              child: _isLoadingMarkComplete
                  ? const CircularProgressIndicator(strokeWidth: 3)
                  : ElevatedButton.icon(
                      icon: Icon(_isLessonCompleted ? Icons.check_circle : Icons.check_circle_outline),
                      label: Text(_isLessonCompleted ? 'Completed' : 'Mark Complete'),
                      onPressed: _isLessonCompleted ? null : _handleMarkAsComplete,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isLessonCompleted ? Colors.green : Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
            ),
          ),

          if (widget.onNextLesson != null)
            TextButton.icon(
              icon: const Icon(Icons.skip_next),
              label: const Text('Next'),
              onPressed: widget.onNextLesson,
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
            )
          else
            const SizedBox(width: 48), // Placeholder for alignment
        ],
      ),
    );
  }

  // Widget _buildQuizSection(Quiz quiz) { // Assuming Quiz model exists
  //   return Column(
  //     crossAxisAlignment: CrossAxisAlignment.start,
  //     children: [
  //       Text('Quiz', style: Theme.of(context).textTheme.headlineMedium),
  //       // ... implement quiz display and interaction ...
  //     ],
  //   );
  // }
}
