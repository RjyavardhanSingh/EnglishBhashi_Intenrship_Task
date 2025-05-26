import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/course_models.dart'; // Import course models

// Define User model based on your backend response
class User {
  final String id;
  final String username;
  final String email;
  final String role;
  final String? firstName;
  final String? lastName;
  final List<String> enrolledCourses; // Added to match backend response

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    this.firstName,
    this.lastName,
    required this.enrolledCourses,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'],
      username: json['username'],
      email: json['email'],
      role: json['role'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      enrolledCourses: List<String>.from(json['enrolledCourses'] ?? []),
    );
  }
}

class ApiService {
  static const String _baseUrl =
      'http://192.168.0.12:5000/api'; // Base URL now includes /api
  final _storage = const FlutterSecureStorage();
  static const String _tokenKey = 'auth_token';

  Future<void> _saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  // Made getToken public
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  Future<Map<String, String>> _getHeaders() async {
    String? token = await getToken();
    if (token != null) {
      return {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      };
    }
    return {'Content-Type': 'application/json; charset=UTF-8'};
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final loginUri = Uri.parse('$_baseUrl/auth/login');
    print('ApiService: Attempting to POST to $loginUri');

    try {
      final response = await http.post(
        loginUri,
        headers: {'Content-Type': 'application/json; charset=UTF-8'},
        body: jsonEncode(<String, String>{
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          await _saveToken(data['token']);
        }
        return data;
      } else {
        print('ApiService: Login failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to login: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Login request timed out: $e');
      throw Exception('Login request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Login error: $e');
      throw Exception('Failed to login. Please try again. ($e)');
    }
  }

  Future<User> getProfile() async {
    final profileUri = Uri.parse('$_baseUrl/auth/profile');
    print('ApiService: Attempting to GET $profileUri');
    try {
      final response = await http.get(
        profileUri,
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        // Backend returns user data directly, not wrapped in 'user' field
        return User.fromJson(jsonDecode(response.body));
      } else {
        print('ApiService: Get profile failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to load profile: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Get profile request timed out: $e');
      throw Exception('Get profile request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Get profile error: $e');
      throw Exception('Failed to load profile. Please try again. ($e)');
    }
  }

  // Create a new course (Admin)
  Future<Course> createCourse(Map<String, dynamic> courseData) async {
    final createCourseUri = Uri.parse('$_baseUrl/courses');
    print('ApiService: Attempting to POST to $createCourseUri with data: $courseData');
    try {
      final response = await http.post(
        createCourseUri,
        headers: await _getHeaders(),
        body: jsonEncode(courseData),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 201 || response.statusCode == 200) { // 201 for created, 200 if it returns the course
        return Course.fromJson(jsonDecode(response.body));
      } else {
        print('ApiService: Create course failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to create course: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Create course request timed out: $e');
      throw Exception('Create course request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Create course error: $e');
      throw Exception('Failed to create course. Please try again. ($e)');
    }
  }

  // Fetch all courses (for admin or browse)
  Future<List<Course>> getCourses() async {
    final coursesUri = Uri.parse('$_baseUrl/courses');
    print('ApiService: Attempting to GET $coursesUri');
    try {
      final response = await http.get(
        coursesUri,
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final dynamic decodedBody = jsonDecode(response.body);
        List<dynamic> courseListJson;

        if (decodedBody is Map<String, dynamic> && decodedBody.containsKey('courses')) {
          // Handles responses like { "courses": [...] }
          final coursesData = decodedBody['courses'];
          if (coursesData is List) {
            courseListJson = coursesData;
          } else {
            print('ApiService: Get courses expected a list for "courses" key, but got: ${coursesData.runtimeType}');
            throw Exception('Failed to parse courses: "courses" key did not contain a list.');
          }
        } else if (decodedBody is List) {
          // Handles responses like [...]
          courseListJson = decodedBody;
        } else {
          print('ApiService: Get courses received unexpected JSON format: ${response.body}');
          throw Exception('Failed to parse courses: Unexpected JSON format. Expected a List or a Map with a "courses" key.');
        }
        
        return courseListJson.map((json) {
          if (json is Map<String, dynamic>) {
            return Course.fromJson(json);
          } else {
            print('ApiService: Get courses found an item in the list that is not a Map: $json');
            throw Exception('Failed to parse courses: Invalid item in course list.');
          }
        }).toList();
      } else {
        print('ApiService: Get courses failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to load courses: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Get courses request timed out: $e');
      throw Exception('Get courses request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Get courses error: $e');
      throw Exception('Failed to load courses. Please try again. ($e)');
    }
  }

  // Fetch a single course by ID
  Future<Course> getCourseById(String courseId) async {
    final courseUri = Uri.parse('$_baseUrl/courses/$courseId');
    print('ApiService: Attempting to GET $courseUri');
    try {
      final response = await http.get(
        courseUri,
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return Course.fromJson(jsonDecode(response.body));
      } else {
        print('ApiService: Get course by ID failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to load course details: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Get course by ID request timed out: $e');
      throw Exception('Get course by ID request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Get course by ID error: $e');
      throw Exception('Failed to load course details. Please try again. ($e)');
    }
  }

  // Enroll in a course
  Future<void> enrollCourse(String courseId) async {
    final enrollUri = Uri.parse('$_baseUrl/courses/$courseId/enroll');
    print('ApiService: Attempting to POST to $enrollUri');
    try {
      final response = await http.post(
        enrollUri,
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Enrollment successful, no specific data usually returned, or could be a success message
        print('Enrollment successful for course $courseId');
        return;
      } else {
        print('ApiService: Failed to enroll in course. Status Code: ${response.statusCode}, Body: ${response.body}');
        throw Exception('Failed to enroll in course: ${response.body}');
      }
    } on TimeoutException catch (_) {
      print('ApiService: Enroll course request timed out for course $courseId.');
      throw Exception('Enroll course request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Error enrolling in course $courseId: $e');
      throw Exception('Error enrolling in course: $e');
    }
  }

  // Get user progress for all enrolled courses
  // Maps to progressAPI.getUserProgress
  Future<List<UserProgress>> getUserProgress() async {
    final progressUri = Uri.parse('$_baseUrl/progress');
    print('ApiService: Attempting to GET $progressUri');
    try {
      final response = await http.get(
        progressUri,
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (data is List) {
          return data.map((item) => UserProgress.fromJson(item as Map<String, dynamic>)).toList();
        } else {
          print('ApiService: Expected a list from getUserProgress, got: ${response.body}');
          throw Exception('Failed to parse user progress: Unexpected response format');
        }
      } else {
        print('ApiService: Failed to get user progress. Status Code: ${response.statusCode}, Body: ${response.body}');
        throw Exception('Failed to load user progress: ${response.body}');
      }
    } on TimeoutException catch (_) {
      print('ApiService: Get user progress request timed out.');
      throw Exception('Get user progress request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Error getting user progress: $e');
      throw Exception('Error fetching user progress: $e');
    }
  }

  // Get progress for a specific course
  Future<UserProgress> getCourseProgress(String courseId) async {
    final courseProgressUri = Uri.parse('$_baseUrl/progress/$courseId');
    print('ApiService: Attempting to GET $courseProgressUri');
    try {
      final response = await http.get(
        courseProgressUri,
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return UserProgress.fromJson(data);
      } else {
        print('ApiService: Failed to get course progress for $courseId. Status Code: ${response.statusCode}, Body: ${response.body}');
        throw Exception('Failed to load course progress for $courseId: ${response.body}');
      }
    } on TimeoutException catch (_) {
      print('ApiService: Get course progress request timed out for $courseId.');
      throw Exception('Get course progress request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Error getting course progress for $courseId: $e');
      throw Exception('Error fetching course progress for $courseId: $e');
    }
  }

  // Fetch sections for a course (Not strictly needed if getCourseById returns full course data)
  Future<List<SectionModel>> getSectionsForCourse(String courseId) async {
    final sectionsUri = Uri.parse('$_baseUrl/courses/$courseId/sections');
    print('ApiService: Attempting to GET $sectionsUri');
    try {
      final response = await http.get(
        sectionsUri,
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> sectionsListJson = jsonDecode(response.body);
        return sectionsListJson.map((json) => SectionModel.fromJson(json)).toList();
      } else {
        print('ApiService: Get sections for course failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to load sections: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Get sections for course request timed out: $e');
      throw Exception('Get sections for course request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Get sections for course error: $e');
      throw Exception('Failed to load sections. Please try again. ($e)');
    }
  }

  // Fetch a single chapter by ID (renamed from getChapterById to getChapterDetails)
  // Maps to chapterAPI.getChapter
  Future<ChapterModel> getChapterDetails(String chapterId) async {
    final chapterUri = Uri.parse('$_baseUrl/chapters/$chapterId');
    print('ApiService: Attempting to GET $chapterUri');
    try {
      final response = await http.get(
        chapterUri,
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return ChapterModel.fromJson(jsonDecode(response.body));
      } else {
        print('ApiService: Get chapter details failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to load chapter details: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Get chapter details request timed out: $e');
      throw Exception('Get chapter details request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Get chapter details error: $e');
      throw Exception('Failed to load chapter details. Please try again. ($e)');
    }
  }

  // Mark a chapter as complete (renamed from markLessonAsComplete)
  // Maps to progressAPI.markChapterCompleted
  Future<UserProgress> markChapterAsComplete(String chapterId) async {
    final completeChapterUri = Uri.parse('$_baseUrl/progress/complete-chapter');
    print('ApiService: Attempting to POST to $completeChapterUri for chapter $chapterId');
    try {
      final response = await http.post(
        completeChapterUri,
        headers: await _getHeaders(),
        body: jsonEncode({'chapterId': chapterId}),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return UserProgress.fromJson(jsonDecode(response.body));
      } else {
        print('ApiService: Mark chapter complete failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to mark chapter as complete: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Mark chapter complete request timed out: $e');
      throw Exception('Mark chapter complete request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Mark chapter complete error: $e');
      throw Exception('Failed to mark chapter as complete. Please try again. ($e)');
    }
  }

  // Update current chapter for a course
  // Maps to progressAPI.updateCurrentChapter
  Future<void> updateCurrentChapter(String courseId, String chapterId) async {
    final updateChapterUri = Uri.parse('$_baseUrl/progress/current-chapter/$courseId');
    print('ApiService: Attempting to POST to $updateChapterUri with chapter $chapterId');
    try {
      final response = await http.post(
        updateChapterUri,
        headers: await _getHeaders(),
        body: jsonEncode({'chapterId': chapterId}),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        // Successfully updated
        return;
      } else {
        print('ApiService: Update current chapter failed with status ${response.statusCode}, body: ${response.body}');
        throw Exception('Failed to update current chapter: ${response.statusCode} ${response.reasonPhrase}');
      }
    } on TimeoutException catch (e) {
      print('ApiService: Update current chapter request timed out: $e');
      throw Exception('Update current chapter request timed out. Please check your connection.');
    } catch (e) {
      print('ApiService: Update current chapter error: $e');
      throw Exception('Failed to update current chapter. Please try again. ($e)');
    }
  }

  // Get user progress for a specific course
  Future<UserProgress?> getUserProgressForCourse(String courseId) async {
    try {
      print('ApiService: Getting user progress for course $courseId');
      
      final token = await _storage.read(key: 'auth_token');
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final response = await http.get(
        Uri.parse('$_baseUrl/api/user/progress/$courseId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 30));

      print('ApiService: Get user progress response: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return UserProgress.fromJson(data);
      } else if (response.statusCode == 404) {
        // No progress found for this course
        return null;
      } else {
        print('ApiService: Get user progress error: ${response.body}');
        throw Exception('Failed to get user progress');
      }
    } catch (e) {
      print('ApiService: Get user progress error: $e');
      throw Exception('Failed to get user progress. Please try again. ($e)');
    }
  }

  // Get enrolled courses for the current user
  Future<List<Course>> getEnrolledCourses() async {
    try {
      print('ApiService: Getting enrolled courses');
      
      final token = await _storage.read(key: 'auth_token');
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final response = await http.get(
        Uri.parse('$_baseUrl/api/user/enrolled-courses'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 30));

      print('ApiService: Get enrolled courses response: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> coursesData = data['courses'] ?? data;
        return coursesData.map((json) => Course.fromJson(json)).toList();
      } else {
        print('ApiService: Get enrolled courses error: ${response.body}');
        throw Exception('Failed to get enrolled courses');
      }
    } catch (e) {
      print('ApiService: Get enrolled courses error: $e');
      throw Exception('Failed to get enrolled courses. Please try again. ($e)');
    }
  }
}
