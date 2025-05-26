// Corresponds to frontend/src/lib/api.ts Course, Section, Unit, Chapter, UserProgress

// Helper function to safely parse ID values to String
String _parseId(dynamic idValue, String fieldNameForContext) {
  if (idValue == null) {
    print('Warning: ID field "$fieldNameForContext" was null.');
    return ''; // Default to empty string, consider if error throwing is better
  }
  return idValue.toString();
}

class Course {
  final String id;
  final String title;
  final String description;
  final String? instructor; // Instructor's ID or name
  final List<SectionModel> sections; // Changed from modules
  final double price; // Course price
  final String? category; // Optional
  final String? level; // Optional: 'Beginner', 'Intermediate', 'Advanced'
  final bool isPublished;
  final String createdAt;
  final String? imageUrl; // Optional: for course images

  Course({
    required this.id,
    required this.title,
    required this.description,
    this.instructor,
    required this.sections,
    required this.price,
    this.category,
    this.level,
    required this.isPublished,
    required this.createdAt,
    this.imageUrl,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    List<SectionModel> parsedSections = [];
    if (json['sections'] is List) {
      for (var sectionJson in json['sections']) {
        if (sectionJson is Map<String, dynamic>) {
          try {
            parsedSections.add(SectionModel.fromJson(sectionJson));
          } catch (e, s) {
            print('Error parsing a section for course "${json['title']}": $e\n$s\nJSON: $sectionJson');
          }
        } else {
          print('Skipping non-map item in sections list for course "${json['title']}": $sectionJson');
        }
      }
    } else if (json['sections'] != null) {
        print('Warning: Course sections field was not a list for course "${json['title']}": ${json['sections']}');
    }

    dynamic instructorData = json['instructor'];
    String? instructorString;
    if (instructorData is String) {
      instructorString = instructorData;
    } else if (instructorData is Map) {
      instructorString = (instructorData['_id'] ?? instructorData['name'] ?? instructorData['username'] ?? instructorData.toString())?.toString();
    } else if (instructorData != null) {
      instructorString = instructorData.toString();
    }

    return Course(
      id: _parseId(json['_id'] ?? json['id'], 'Course ID'),
      title: json['title']?.toString() ?? 'No Title',
      description: json['description']?.toString() ?? 'No Description',
      instructor: instructorString,
      sections: parsedSections,
      price: (json['price'] as num?)?.toDouble() ?? 0.0, // Ensure price is parsed as num then toDouble
      category: json['category']?.toString(),
      level: json['level']?.toString(),
      isPublished: json['isPublished'] as bool? ?? false,
      createdAt: json['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
      imageUrl: json['imageUrl']?.toString(),
    );
  }
}

// Renaming Module to SectionModel for clarity with frontend API
class SectionModel { // Was Module
  final String id;
  final String courseId; // Added from frontend API spec
  final String title;
  final String description; // Added from frontend API spec
  final int order; // Added from frontend API spec
  final List<UnitModel> units; // Changed from lessons to units

  SectionModel({
    required this.id,
    required this.courseId,
    required this.title,
    required this.description,
    required this.order,
    required this.units,
  });

  factory SectionModel.fromJson(Map<String, dynamic> json) {
    List<UnitModel> parsedUnits = [];
    if (json['units'] is List) {
      for (var unitJson in json['units']) {
        if (unitJson is Map<String, dynamic>) {
          try {
            parsedUnits.add(UnitModel.fromJson(unitJson));
          } catch (e, s) {
            print('Error parsing a unit for section "${json['title']}": $e\n$s\nJSON: $unitJson');
          }
        } else {
          print('Skipping non-map item in units list for section "${json['title']}": $unitJson');
        }
      }
    } else if (json['units'] != null) {
        print('Warning: Section units field was not a list for section "${json['title']}": ${json['units']}');
    }

    return SectionModel(
      id: _parseId(json['_id'] ?? json['id'], 'Section ID'),
      courseId: _parseId(json['courseId'], 'Section Course ID'),
      title: json['title']?.toString() ?? 'No Title',
      description: json['description']?.toString() ?? '',
      order: (json['order'] as num?)?.toInt() ?? 0, // Ensure order is parsed as num then toInt
      units: parsedUnits,
    );
  }
}

// New UnitModel
class UnitModel {
  final String id;
  final String sectionId; // Added from frontend API spec
  final String title;
  final String description; // Added from frontend API spec
  final int order; // Added from frontend API spec
  final List<ChapterModel> chapters; // Changed from lessons

  UnitModel({
    required this.id,
    required this.sectionId,
    required this.title,
    required this.description,
    required this.order,
    required this.chapters,
  });

  factory UnitModel.fromJson(Map<String, dynamic> json) {
    List<ChapterModel> parsedChapters = [];
    if (json['chapters'] is List) {
      for (var chapterJson in json['chapters']) {
        if (chapterJson is Map<String, dynamic>) {
          try {
            parsedChapters.add(ChapterModel.fromJson(chapterJson));
          } catch (e, s) {
            print('Error parsing a chapter for unit "${json['title']}": $e\n$s\nJSON: $chapterJson');
          }
        } else {
          print('Skipping non-map item in chapters list for unit "${json['title']}": $chapterJson');
        }
      }
    } else if (json['chapters'] != null) {
        print('Warning: Unit chapters field was not a list for unit "${json['title']}": ${json['chapters']}');
    }

    return UnitModel(
      id: _parseId(json['_id'] ?? json['id'], 'Unit ID'),
      sectionId: _parseId(json['sectionId'], 'Unit Section ID'),
      title: json['title']?.toString() ?? 'No Title',
      description: json['description']?.toString() ?? '',
      order: (json['order'] as num?)?.toInt() ?? 0, // Ensure order is parsed as num then toInt
      chapters: parsedChapters,
    );
  }
}

// Renaming Lesson to ChapterModel for clarity with frontend API
class ChapterModel { // Was Lesson
  final String id;
  final String unitId; // Added from frontend API spec
  final String title;
  final String content; // This is the main content
  final String? description; // Retained, though frontend Chapter has 'content'
  final String type; // 'text', 'video', 'audio', 'quiz' - from frontend API spec
  final String? videoUrl;
  final String? audioUrl; // Added from frontend API spec
  final List<QuestionModel>? questions; // Added from frontend API spec
  final int order; // Added from frontend API spec


  ChapterModel({
    required this.id,
    required this.unitId,
    required this.title,
    required this.content,
    this.description,
    required this.type,
    this.videoUrl,
    this.audioUrl,
    this.questions,
    required this.order,
  });

  factory ChapterModel.fromJson(Map<String, dynamic> json) {
    List<QuestionModel> parsedQuestions = [];
    if (json['questions'] is List) {
      for (var questionJson in json['questions']) {
        if (questionJson is Map<String, dynamic>) {
          try {
            parsedQuestions.add(QuestionModel.fromJson(questionJson));
          } catch (e, s) {
            print('Error parsing a question for chapter "${json['title']}": $e\n$s\nJSON: $questionJson');
          }
        } else {
          print('Skipping non-map item in questions list for chapter "${json['title']}": $questionJson');
        }
      }
    } else if (json['questions'] != null) {
      print('Warning: Chapter questions field was present but not a list for chapter "${json['title']}": ${json['questions']}');
    }
    
    return ChapterModel(
      id: _parseId(json['_id'] ?? json['id'], 'Chapter ID'),
      unitId: _parseId(json['unitId'], 'Chapter Unit ID'),
      title: json['title']?.toString() ?? 'Untitled Chapter',
      content: json['content']?.toString() ?? '',
      description: json['description']?.toString(),
      type: json['type']?.toString() ?? 'text',
      videoUrl: json['videoUrl']?.toString(),
      audioUrl: json['audioUrl']?.toString(),
      questions: parsedQuestions.isNotEmpty ? parsedQuestions : null,
      order: (json['order'] as num?)?.toInt() ?? 0, // Ensure order is parsed as num then toInt
    );
  }
}

// New QuestionModel for Chapter quizzes
class QuestionModel {
  final String id;
  final String questionText;
  final String type; // 'mcq', 'fill-in-blank', 'text'
  final List<String>? options;
  final String correctAnswer;

  QuestionModel({
    required this.id,
    required this.questionText,
    required this.type,
    this.options,
    required this.correctAnswer,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedOptions = [];
    if (json['options'] is List) {
      for (var optionItem in json['options']) {
        if (optionItem != null) { // Ensure option items are not null before toString
          parsedOptions.add(optionItem.toString());
        }
      }
    } else if (json['options'] != null) {
        print('Warning: Question options field was not a list for question "${json['questionText']}": ${json['options']}');
    }

    return QuestionModel(
      id: _parseId(json['_id'] ?? json['id'], 'Question ID'),
      questionText: json['questionText']?.toString() ?? '',
      type: json['type']?.toString() ?? 'text',
      options: parsedOptions.isNotEmpty ? parsedOptions : null,
      correctAnswer: json['correctAnswer']?.toString() ?? '',
    );
  }
}


// UserProgress can remain simpler if detailed progress is fetched separately
// or expanded if the backend provides more details directly with the user profile.
// For now, assuming enrolledCourses in User model are just IDs.
// This UserProgress model is for when we fetch specific progress for a course.
class UserProgress {
  final String id;
  final String userId;
  final dynamic courseId; // String or CourseStub
  final List<String> completedChapters; // IDs of completed chapters
  final double overallProgress; // Percentage
  final bool completed;
  final String? currentChapterId;
  final ChapterModel? currentChapter; // Full ChapterModel object, fetched separately
  final String lastAccessed;
  final List<SectionProgressModel>? sectionsProgress;

  UserProgress({
    required this.id,
    required this.userId,
    required this.courseId,
    required this.completedChapters,
    required this.overallProgress,
    required this.completed,
    required this.lastAccessed,
    this.currentChapterId,
    this.currentChapter, // This is the ChapterModel object, should be optional
    this.sectionsProgress,
  });

  factory UserProgress.fromJson(Map<String, dynamic> json) {
    var courseData = json['courseId'];
    dynamic parsedCourseId;
    if (courseData is String) {
      parsedCourseId = courseData;
    } else if (courseData is Map<String, dynamic>) {
      parsedCourseId = CourseStub.fromJson(courseData);
    } else {
      parsedCourseId = null; 
    }

    List<String> completedChaptersList = [];
    if (json['completedChapters'] != null && json['completedChapters'] is List) {
      completedChaptersList = List<String>.from(
          (json['completedChapters'] as List).map((item) => item.toString()));
    }
    
    List<SectionProgressModel>? sectionsProgressList;
    if (json['sectionsProgress'] != null && json['sectionsProgress'] is List) {
        sectionsProgressList = (json['sectionsProgress'] as List)
            .map((s) => SectionProgressModel.fromJson(s as Map<String, dynamic>))
            .toList();
    }

    // Robust parsing for currentChapterId
    dynamic currentChapterData = json['currentChapter']; // API might send this as 'currentChapter' (ID)
    String? parsedCurrentChapterId;
    if (currentChapterData is String) {
      parsedCurrentChapterId = currentChapterData;
    } else if (currentChapterData is Map && currentChapterData.containsKey('_id')) {
      // If it's an object with an _id, extract the id
      parsedCurrentChapterId = currentChapterData['_id']?.toString();
    } else if (currentChapterData is Map && currentChapterData.containsKey('id')) {
      // If it's an object with an id, extract the id
      parsedCurrentChapterId = currentChapterData['id']?.toString();
    } else if (currentChapterData != null) {
      print("Warning: UserProgress.fromJson - currentChapter field was an unexpected type: ${currentChapterData.runtimeType}, value: $currentChapterData. Treating as null.");
      // parsedCurrentChapterId = currentChapterData.toString(); // Or leave as null
    }
    // End robust parsing for currentChapterId

    return UserProgress(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      courseId: parsedCourseId,
      completedChapters: completedChaptersList,
      overallProgress: (json['overallProgress'] as num?)?.toDouble() ?? 0.0,
      completed: json['completed'] ?? false,
      currentChapterId: parsedCurrentChapterId, // Use the robustly parsed ID
      currentChapter: null, // Initialize as null; to be fetched separately
      lastAccessed: json['lastAccessed'] ?? DateTime.now().toIso8601String(),
      sectionsProgress: sectionsProgressList,
    );
  }

  String get courseIdString {
    if (courseId is CourseStub) {
      return (courseId as CourseStub).id;
    } else if (courseId is String) {
      return courseId as String;
    }
    return '';
  }
}

// New SectionProgressModel
class SectionProgressModel {
  final String sectionId;
  final List<UnitProgressModel>? unitsProgress;

  SectionProgressModel({
    required this.sectionId,
    this.unitsProgress,
  });

  factory SectionProgressModel.fromJson(Map<String, dynamic> json) {
    var unitsProgressList = json['unitsProgress'] as List? ?? [];
    List<UnitProgressModel> unitsProgress = unitsProgressList.map((i) => UnitProgressModel.fromJson(i)).toList();
    return SectionProgressModel(
      sectionId: json['sectionId'] ?? '',
      unitsProgress: unitsProgress.isNotEmpty ? unitsProgress : null,
    );
  }
}

// New UnitProgressModel
class UnitProgressModel {
  final String unitId;
  final List<ChapterProgressModel>? chaptersProgress;

  UnitProgressModel({
    required this.unitId,
    this.chaptersProgress,
  });

  factory UnitProgressModel.fromJson(Map<String, dynamic> json) {
    var chaptersProgressList = json['chaptersProgress'] as List? ?? [];
    List<ChapterProgressModel> chaptersProgress = chaptersProgressList.map((i) => ChapterProgressModel.fromJson(i)).toList();
    return UnitProgressModel(
      unitId: json['unitId'] ?? '',
      chaptersProgress: chaptersProgress.isNotEmpty ? chaptersProgress : null,
    );
  }
}

// New ChapterProgressModel
class ChapterProgressModel {
  final String chapterId;
  final bool completed;
  final int? score;

  ChapterProgressModel({
    required this.chapterId,
    required this.completed,
    this.score,
  });

  factory ChapterProgressModel.fromJson(Map<String, dynamic> json) {
    return ChapterProgressModel(
      chapterId: json['chapterId'] ?? '',
      completed: json['completed'] ?? false,
      score: (json['score'] as num?)?.toInt(),
    );
  }
}


// A simpler CourseStub for lists where full details are not needed immediately
class CourseStub {
  final String id;
  final String title;
  final String description; // Added from frontend API spec
  final String? imageUrl; // Optional

  CourseStub({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
  });

  factory CourseStub.fromJson(Map<String, dynamic> json) {
    return CourseStub(
      id: json['_id'] ?? json['id'],
      title: json['title'] ?? 'No Title',
      description: json['description'] ?? 'No Description', // Added
      imageUrl: json['imageUrl'],
    );
  }
}

// Lesson class for individual lessons within chapters
class Lesson {
  final String id;
  final String title;
  final String description;
  final String? content; // Text content
  final String? videoUrl; // Video URL if available
  final String? resourceUrl; // Additional resource URL
  final int order; // Order within the chapter
  final bool isCompleted; // Completion status
  final String? lessonType; // 'video', 'text', 'quiz', etc.

  Lesson({
    required this.id,
    required this.title,
    required this.description,
    this.content,
    this.videoUrl,
    this.resourceUrl,
    required this.order,
    this.isCompleted = false,
    this.lessonType,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['_id'] ?? json['id'],
      title: json['title'] ?? 'No Title',
      description: json['description'] ?? 'No Description',
      content: json['content'],
      videoUrl: json['videoUrl'],
      resourceUrl: json['resourceUrl'],
      order: json['order'] ?? 0,
      isCompleted: json['isCompleted'] ?? false,
      lessonType: json['lessonType'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'content': content,
      'videoUrl': videoUrl,
      'resourceUrl': resourceUrl,
      'order': order,
      'isCompleted': isCompleted,
      'lessonType': lessonType,
    };
  }
}
