import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';
import '../models/lesson_models.dart';
import '../models/school_models.dart';

class SchoolApiException implements Exception {
  SchoolApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class SchoolApiService {
  const SchoolApiService();

  Future<SchoolSession> registerTeacher({
    required String name,
    required String email,
    required String password,
    required String schoolName,
    required String schoolCode,
    required String classroomName,
    required String subject,
  }) async {
    final data = await _request(
      '/school/auth/register-teacher',
      method: 'POST',
      body: {
        'name': name,
        'email': email,
        'password': password,
        'schoolName': schoolName,
        'schoolCode': schoolCode,
        'classroomName': classroomName,
        'subject': subject,
      },
    );

    return SchoolSession.fromJson(data);
  }

  Future<SchoolSession> registerStudent({
    required String name,
    required String email,
    required String password,
    required String schoolCode,
    required String classroomCode,
    String? rollNumber,
  }) async {
    final data = await _request(
      '/school/auth/register-student',
      method: 'POST',
      body: {
        'name': name,
        'email': email,
        'password': password,
        'schoolCode': schoolCode,
        'classroomCode': classroomCode,
        if (rollNumber != null && rollNumber.trim().isNotEmpty)
          'rollNumber': rollNumber,
      },
    );

    return SchoolSession.fromJson(data);
  }

  Future<SchoolSession> login({
    required String email,
    required String password,
  }) async {
    final data = await _request(
      '/school/auth/login',
      method: 'POST',
      body: {
        'email': email,
        'password': password,
      },
    );

    return SchoolSession.fromJson(data);
  }

  Future<SchoolUser> getMe(String token) async {
    final data = await _request('/school/auth/me', token: token);
    return SchoolUser.fromJson((data['user'] as Map<String, dynamic>?) ?? const {});
  }

  Future<TeacherDashboard> getTeacherDashboard(String token) async {
    final data = await _request('/school/dashboard/teacher', token: token);
    return TeacherDashboard.fromJson(data);
  }

  Future<StudentDashboard> getStudentDashboard(String token) async {
    final data = await _request('/school/dashboard/student', token: token);
    return StudentDashboard.fromJson(data);
  }

  Future<List<SchoolClassroom>> getTeacherClassrooms(String token) async {
    final data = await _request('/school/classrooms/teacher', token: token);
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => SchoolClassroom.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<List<ClassroomSubjectSummary>> getClassroomSubjects({
    required String token,
    required String classroomId,
  }) async {
    final data = await _request(
      '/school/classrooms/$classroomId/subjects',
      token: token,
    );
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => ClassroomSubjectSummary.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<List<SyllabusChapterSummary>> getSubjectChapters({
    required String token,
    required String subjectId,
  }) async {
    final data = await _request('/school/subjects/$subjectId/chapters', token: token);
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => SyllabusChapterSummary.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<LessonChapter> getLesson({
    required String token,
    required String chapterKey,
  }) async {
    final data = await _request('/school/lessons/$chapterKey', token: token);
    final normalized = <String, dynamic>{
      ...data,
      'sourceLabel': 'Source',
      'sourceName': data['chapterTitle'] == null
          ? 'NCERT Chapter'
          : 'NCERT ${data['subject'] ?? 'Science'} - ${data['chapterTitle']}',
      'subjectLine': '${data['subject'] ?? 'Subject'} - ${data['chapterTitle'] ?? ''}',
      'topics': (data['topics'] as List<dynamic>? ?? const []).map((item) {
        final topic = item as Map<String, dynamic>;
        return {
          'id': topic['id'],
          'timestampLabel': topic['timestampLabel'],
          'startSeconds': topic['startSeconds'] ?? 0,
          'endSeconds': topic['endSeconds'] ?? 0,
          'title': topic['title'],
          'mission': topic['mission'],
          'recap': topic['mission'],
          'observation': topic['sourceAnchor'],
          'sourceAnchor': topic['sourceAnchor'],
          'quiz': {
            'title': 'Quick Quiz',
            'prompt': (topic['quiz'] as Map<String, dynamic>?)?['prompt'],
            'options': ((topic['quiz'] as Map<String, dynamic>?)?['options']
                        as List<dynamic>? ??
                    const [])
                .map((option) {
              final optionMap = option as Map<String, dynamic>;
              final correctChoiceId =
                  (topic['quiz'] as Map<String, dynamic>?)?['correctChoiceId'];
              return {
                'id': optionMap['id'],
                'label': optionMap['label'],
                'feedback':
                    (topic['quiz'] as Map<String, dynamic>?)?['explanation'] ?? '',
                'isCorrect': optionMap['id'] == correctChoiceId,
              };
            }).toList(),
          },
          'coach': {
            'simple': (topic['quiz'] as Map<String, dynamic>?)?['explanation'] ?? '',
            'analogy':
                (topic['scenario'] as Map<String, dynamic>?)?['explanation'] ?? '',
            'mistake': (topic['quiz'] as Map<String, dynamic>?)?['explanation'] ?? '',
          },
          'scenario': {
            'title': 'Real-life Application',
            'prompt': (topic['scenario'] as Map<String, dynamic>?)?['prompt'],
            'options': ((topic['scenario'] as Map<String, dynamic>?)?['options']
                        as List<dynamic>? ??
                    const [])
                .map((option) {
              final optionMap = option as Map<String, dynamic>;
              final correctChoiceId =
                  (topic['scenario'] as Map<String, dynamic>?)?['correctChoiceId'];
              return {
                'id': optionMap['id'],
                'label': optionMap['label'],
                'feedback': (topic['scenario'] as Map<String, dynamic>?)?[
                        'explanation'] ??
                    '',
                'isCorrect': optionMap['id'] == correctChoiceId,
              };
            }).toList(),
          },
        };
      }).toList(),
    };

    return LessonChapter.fromJson(normalized);
  }

  Future<AssessmentSummary> generateDraftAssessment({
    required String token,
    required String classroomId,
    required String chapterKey,
    required List<String> topicIds,
    required int totalMarks,
    required String difficulty,
  }) async {
    final data = await _request(
      '/school/assessments/drafts',
      method: 'POST',
      token: token,
      body: {
        'classroomId': classroomId,
        'chapterKey': chapterKey,
        'topicIds': topicIds,
        'totalMarks': totalMarks,
        'difficulty': difficulty,
      },
    );

    return AssessmentSummary.fromJson(
      (data['assessment'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Future<AssessmentSummary> publishAssessment({
    required String token,
    required String assessmentId,
  }) async {
    final data = await _request(
      '/school/assessments/$assessmentId/publish',
      method: 'POST',
      token: token,
    );

    return AssessmentSummary.fromJson(
      (data['assessment'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Future<List<AssessmentSummary>> getTeacherAssessments(String token) async {
    final data = await _request('/school/assessments/teacher', token: token);
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => AssessmentSummary.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<List<AssessmentSummary>> getStudentAssessments(String token) async {
    final data = await _request('/school/assessments/student', token: token);
    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => AssessmentSummary.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<AssessmentSummary> getAssessment({
    required String token,
    required String assessmentId,
  }) async {
    final data = await _request(
      '/school/assessments/$assessmentId',
      token: token,
    );
    return AssessmentSummary.fromJson(
      (data['assessment'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Future<AssessmentSummary> regenerateAssessmentQuestion({
    required String token,
    required String assessmentId,
    required String questionId,
    String? topicId,
  }) async {
    final data = await _request(
      '/school/assessments/$assessmentId/questions/regenerate',
      method: 'POST',
      token: token,
      body: {
        'questionId': questionId,
        if (topicId != null && topicId.isNotEmpty) 'topicId': topicId,
      },
    );

    return AssessmentSummary.fromJson(
      (data['assessment'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Future<AssessmentSummary> addManualQuestion({
    required String token,
    required String assessmentId,
    required String topicTitle,
    required String prompt,
    required String correctChoiceId,
    required String explanation,
    required List<Map<String, String>> options,
    int? marks,
  }) async {
    final data = await _request(
      '/school/assessments/$assessmentId/questions/manual',
      method: 'POST',
      token: token,
      body: {
        'topicTitle': topicTitle,
        'prompt': prompt,
        'correctChoiceId': correctChoiceId,
        'explanation': explanation,
        'options': options,
        if (marks != null) 'marks': marks,
      },
    );

    return AssessmentSummary.fromJson(
      (data['assessment'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Future<AssessmentAttemptSummary> startAttempt({
    required String token,
    required String assessmentId,
  }) async {
    final data = await _request(
      '/school/assessments/$assessmentId/attempts',
      method: 'POST',
      token: token,
    );
    return AssessmentAttemptSummary.fromJson(
      (data['attempt'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Future<AssessmentAttemptSummary> saveAttemptAnswer({
    required String token,
    required String attemptId,
    required String questionId,
    String? selectedChoiceId,
  }) async {
    final data = await _request(
      '/school/attempts/$attemptId/answers',
      method: 'PATCH',
      token: token,
      body: {
        'questionId': questionId,
        if (selectedChoiceId != null && selectedChoiceId.isNotEmpty)
          'selectedChoiceId': selectedChoiceId,
      },
    );
    return AssessmentAttemptSummary.fromJson(
      (data['attempt'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Future<AssessmentAttemptSummary> submitAttempt({
    required String token,
    required String attemptId,
  }) async {
    final data = await _request(
      '/school/attempts/$attemptId/submit',
      method: 'POST',
      token: token,
    );
    return AssessmentAttemptSummary.fromJson(
      (data['attempt'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Future<TeacherAttendanceSnapshot> getClassroomAttendance({
    required String token,
    required String classroomId,
  }) async {
    final data = await _request(
      '/school/attendance/classrooms/$classroomId',
      token: token,
    );
    return TeacherAttendanceSnapshot.fromJson(data);
  }

  Future<TeacherAttendanceSnapshot> saveClassroomAttendance({
    required String token,
    required String classroomId,
    required String attendanceDate,
    required List<Map<String, String>> entries,
  }) async {
    final data = await _request(
      '/school/attendance/classrooms/$classroomId',
      method: 'POST',
      token: token,
      body: {
        'attendanceDate': attendanceDate,
        'entries': entries,
      },
    );
    return TeacherAttendanceSnapshot.fromJson(data);
  }

  Future<Map<String, dynamic>> shareAssessmentResults({
    required String token,
    required String assessmentId,
    String? groupId,
  }) async {
    return _request(
      '/school/assessments/$assessmentId/share-results',
      method: 'POST',
      token: token,
      body: {
        if (groupId != null && groupId.isNotEmpty) 'groupId': groupId,
      },
    );
  }

  Future<StudentDashboard> getStudentResults(String token) async {
    final data = await _request('/school/students/me/results', token: token);
    return StudentDashboard.fromJson(data);
  }

  Future<Map<String, dynamic>> _request(
    String path, {
    String method = 'GET',
    String? token,
    Map<String, dynamic>? body,
  }) async {
    final headers = <String, String>{};
    if (body != null) {
      headers['Content-Type'] = 'application/json';
    }
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    late http.Response response;

    try {
      final uri = Uri.parse('${_baseUrl()}$path');
      response = switch (method) {
        'POST' => await http.post(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          ),
        'PATCH' => await http.patch(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          ),
        _ => await http.get(uri, headers: headers),
      };
    } catch (error) {
      throw SchoolApiException(
        'Cannot reach the Gurukul API server.',
        statusCode: 0,
      );
    }

    final data = _decode(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw SchoolApiException(
        _messageFrom(data, 'The request failed.'),
        statusCode: response.statusCode,
      );
    }

    return data;
  }

  Map<String, dynamic> _decode(http.Response response) {
    final body = response.body.trim();
    if (body.isEmpty) {
      return <String, dynamic>{};
    }

    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return <String, dynamic>{'data': decoded};
  }

  String _messageFrom(Map<String, dynamic> data, String fallback) {
    final message = data['message'];
    if (message is String && message.isNotEmpty) {
      return message;
    }
    return fallback;
  }

  String _baseUrl() {
    final trimmed = AppConfig.schoolApiUrl.trim().replaceAll(RegExp(r'/$'), '');
    if (trimmed.endsWith('/api/v1')) {
      return trimmed;
    }
    return '$trimmed/api/v1';
  }
}
