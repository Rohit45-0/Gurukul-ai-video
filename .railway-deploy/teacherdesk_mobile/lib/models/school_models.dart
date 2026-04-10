import 'lesson_models.dart';

enum SchoolRole { teacher, student, platformAdmin }

SchoolRole parseSchoolRole(String value) {
  return switch (value) {
    'student' => SchoolRole.student,
    'platform_admin' => SchoolRole.platformAdmin,
    _ => SchoolRole.teacher,
  };
}

class SchoolOrganization {
  const SchoolOrganization({
    required this.id,
    required this.name,
    required this.slug,
    required this.schoolCode,
  });

  final String id;
  final String name;
  final String slug;
  final String? schoolCode;

  factory SchoolOrganization.fromJson(Map<String, dynamic> json) {
    return SchoolOrganization(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      schoolCode: json['schoolCode'] as String?,
    );
  }
}

class SchoolClassroom {
  const SchoolClassroom({
    required this.id,
    required this.name,
    required this.subject,
    required this.joinCode,
    this.studentCount,
    this.rollNumber,
    this.subjectCount,
    this.chapterCount,
    this.attendancePending,
  });

  final String id;
  final String name;
  final String? subject;
  final String joinCode;
  final int? studentCount;
  final String? rollNumber;
  final int? subjectCount;
  final int? chapterCount;
  final bool? attendancePending;

  factory SchoolClassroom.fromJson(Map<String, dynamic> json) {
    return SchoolClassroom(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      subject: json['subject'] as String?,
      joinCode: json['joinCode'] as String? ?? '',
      studentCount: (json['studentCount'] as num?)?.toInt(),
      rollNumber: json['rollNumber'] as String?,
      subjectCount: (json['subjectCount'] as num?)?.toInt(),
      chapterCount: (json['chapterCount'] as num?)?.toInt(),
      attendancePending: json['attendancePending'] as bool?,
    );
  }
}

class SchoolUser {
  const SchoolUser({
    required this.id,
    required this.name,
    required this.email,
    required this.handle,
    required this.role,
    required this.organization,
    required this.classrooms,
    this.organizationRole,
  });

  final String id;
  final String name;
  final String email;
  final String handle;
  final SchoolRole role;
  final String? organizationRole;
  final SchoolOrganization? organization;
  final List<SchoolClassroom> classrooms;

  factory SchoolUser.fromJson(Map<String, dynamic> json) {
    final organizationJson = json['organization'] as Map<String, dynamic>?;
    final classroomsJson = json['classrooms'] as List<dynamic>? ?? const [];

    return SchoolUser(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      handle: json['handle'] as String? ?? '',
      role: parseSchoolRole(json['role'] as String? ?? 'teacher'),
      organizationRole: json['organizationRole'] as String?,
      organization: organizationJson == null
          ? null
          : SchoolOrganization.fromJson(organizationJson),
      classrooms: classroomsJson
          .map((item) => SchoolClassroom.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class SchoolSession {
  const SchoolSession({
    required this.token,
    required this.user,
  });

  final String token;
  final SchoolUser user;

  factory SchoolSession.fromJson(Map<String, dynamic> json) {
    return SchoolSession(
      token: json['token'] as String? ?? '',
      user: SchoolUser.fromJson((json['user'] as Map<String, dynamic>?) ?? const {}),
    );
  }
}

class TeacherDashboard {
  const TeacherDashboard({
    required this.organization,
    required this.classrooms,
    required this.classroomCount,
    required this.subjectCount,
    required this.draftCount,
    required this.publishedCount,
    required this.recentSubmissionCount,
    required this.todayAttendancePending,
  });

  final SchoolOrganization? organization;
  final List<SchoolClassroom> classrooms;
  final int classroomCount;
  final int subjectCount;
  final int draftCount;
  final int publishedCount;
  final int recentSubmissionCount;
  final bool todayAttendancePending;

  factory TeacherDashboard.fromJson(Map<String, dynamic> json) {
    final organizationJson = json['organization'] as Map<String, dynamic>?;
    final classroomsJson = json['classrooms'] as List<dynamic>? ?? const [];
    final metrics = json['metrics'] as Map<String, dynamic>? ?? const {};

    return TeacherDashboard(
      organization: organizationJson == null
          ? null
          : SchoolOrganization.fromJson(organizationJson),
      classrooms: classroomsJson
          .map((item) => SchoolClassroom.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      classroomCount: (metrics['classroomCount'] as num?)?.toInt() ?? 0,
      subjectCount: (metrics['subjectCount'] as num?)?.toInt() ?? 0,
      draftCount: (metrics['draftCount'] as num?)?.toInt() ?? 0,
      publishedCount: (metrics['publishedCount'] as num?)?.toInt() ?? 0,
      recentSubmissionCount:
          (metrics['recentSubmissionCount'] as num?)?.toInt() ?? 0,
      todayAttendancePending: metrics['todayAttendancePending'] as bool? ?? false,
    );
  }
}

class StudentDashboard {
  const StudentDashboard({
    required this.organization,
    required this.classrooms,
    required this.classroomCount,
    required this.publishedTestCount,
    required this.attendancePercentage,
    required this.averageScore,
    required this.scoredCount,
    required this.recentAssessments,
    required this.attendanceSummary,
    required this.subjectProgress,
    required this.recentResults,
    required this.weakTopics,
  });

  final SchoolOrganization? organization;
  final List<SchoolClassroom> classrooms;
  final int classroomCount;
  final int publishedTestCount;
  final int attendancePercentage;
  final double averageScore;
  final int scoredCount;
  final List<AssessmentSummary> recentAssessments;
  final List<AttendanceSessionSummary> attendanceSummary;
  final List<SubjectProgressSummary> subjectProgress;
  final List<AssessmentAttemptSummary> recentResults;
  final List<WeakTopicSummary> weakTopics;

  factory StudentDashboard.fromJson(Map<String, dynamic> json) {
    final organizationJson = json['organization'] as Map<String, dynamic>?;
    final classroomsJson = json['classrooms'] as List<dynamic>? ?? const [];
    final metrics = json['metrics'] as Map<String, dynamic>? ?? const {};
    final assessmentsJson = json['recentAssessments'] as List<dynamic>? ?? const [];

    return StudentDashboard(
      organization: organizationJson == null
          ? null
          : SchoolOrganization.fromJson(organizationJson),
      classrooms: classroomsJson
          .map((item) => SchoolClassroom.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      classroomCount: (metrics['classroomCount'] as num?)?.toInt() ?? 0,
      publishedTestCount: (metrics['publishedTestCount'] as num?)?.toInt() ?? 0,
      attendancePercentage:
          (metrics['attendancePercentage'] as num?)?.toInt() ?? 0,
      averageScore: (metrics['averageScore'] as num?)?.toDouble() ?? 0,
      scoredCount: (metrics['scoredCount'] as num?)?.toInt() ?? 0,
      recentAssessments: assessmentsJson
          .map((item) => AssessmentSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      attendanceSummary: (json['attendanceSummary'] as List<dynamic>? ?? const [])
          .map((item) => AttendanceSessionSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      subjectProgress: (json['subjectProgress'] as List<dynamic>? ?? const [])
          .map((item) => SubjectProgressSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      recentResults: (json['recentResults'] as List<dynamic>? ?? const [])
          .map((item) => AssessmentAttemptSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
      weakTopics: (json['weakTopics'] as List<dynamic>? ?? const [])
          .map((item) => WeakTopicSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class AssessmentSummary {
  const AssessmentSummary({
    required this.id,
    required this.classroomId,
    required this.classroomName,
    required this.chapterKey,
    required this.chapterTitle,
    required this.subject,
    required this.difficulty,
    required this.totalMarks,
    required this.status,
    required this.questionCount,
    required this.topicIds,
    this.attemptStatus,
    this.studentScore,
    this.submittedAt,
    this.resultsSharedAt,
    this.sourcePdfUrl,
    this.videoUrl,
    this.publishedAt,
    this.questions,
  });

  final String id;
  final String classroomId;
  final String? classroomName;
  final String chapterKey;
  final String chapterTitle;
  final String subject;
  final String difficulty;
  final int totalMarks;
  final String status;
  final int questionCount;
  final List<String> topicIds;
  final String? attemptStatus;
  final int? studentScore;
  final DateTime? submittedAt;
  final DateTime? resultsSharedAt;
  final String? sourcePdfUrl;
  final String? videoUrl;
  final DateTime? publishedAt;
  final List<AssessmentQuestion>? questions;

  bool get isPublished => status == 'published';

  factory AssessmentSummary.fromJson(Map<String, dynamic> json) {
    final topicIdsJson = json['topicIds'] as List<dynamic>? ?? const [];
    final questionsJson = json['questions'] as List<dynamic>?;

    return AssessmentSummary(
      id: json['id'] as String? ?? '',
      classroomId: json['classroomId'] as String? ?? '',
      classroomName: json['classroomName'] as String?,
      chapterKey: json['chapterKey'] as String? ?? '',
      chapterTitle: json['chapterTitle'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      difficulty: json['difficulty'] as String? ?? '',
      totalMarks: (json['totalMarks'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'draft',
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 0,
      topicIds: topicIdsJson.map((item) => item.toString()).toList(growable: false),
      attemptStatus: json['attemptStatus'] as String?,
      studentScore: (json['studentScore'] as num?)?.toInt(),
      submittedAt: json['submittedAt'] == null
          ? null
          : DateTime.tryParse(json['submittedAt'].toString()),
      resultsSharedAt: json['resultsSharedAt'] == null
          ? null
          : DateTime.tryParse(json['resultsSharedAt'].toString()),
      sourcePdfUrl: json['sourcePdfUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      publishedAt: json['publishedAt'] == null
          ? null
          : DateTime.tryParse(json['publishedAt'].toString()),
      questions: questionsJson
          ?.map((item) => AssessmentQuestion.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class AssessmentQuestion {
  const AssessmentQuestion({
    required this.id,
    required this.rowId,
    required this.topicId,
    required this.topicTitle,
    required this.type,
    required this.prompt,
    required this.correctChoiceId,
    required this.explanation,
    required this.options,
  });

  final String id;
  final String? rowId;
  final String? topicId;
  final String topicTitle;
  final String type;
  final String prompt;
  final String correctChoiceId;
  final String explanation;
  final List<LessonChoice> options;

  factory AssessmentQuestion.fromJson(Map<String, dynamic> json) {
    final optionsJson = json['options'] as List<dynamic>? ?? const [];
    return AssessmentQuestion(
      id: json['id'] as String? ?? '',
      rowId: json['rowId'] as String?,
      topicId: json['topicId'] as String?,
      topicTitle: json['topicTitle'] as String? ?? '',
      type: json['type'] as String? ?? 'mcq',
      prompt: json['prompt'] as String? ?? '',
      correctChoiceId: json['correctChoiceId'] as String? ?? '',
      explanation: json['explanation'] as String? ?? '',
      options: optionsJson
          .map(
            (item) => LessonChoice.fromOptionJson(item as Map<String, dynamic>),
          )
          .toList(growable: false),
    );
  }
}

class AssessmentAttemptSummary {
  const AssessmentAttemptSummary({
    required this.id,
    required this.assessmentId,
    required this.studentId,
    required this.status,
    required this.score,
    required this.totalMarks,
    required this.startedAt,
    required this.updatedAt,
    required this.submittedAt,
    required this.assessment,
    required this.answers,
  });

  final String id;
  final String assessmentId;
  final String studentId;
  final String status;
  final int? score;
  final int totalMarks;
  final DateTime startedAt;
  final DateTime updatedAt;
  final DateTime? submittedAt;
  final AssessmentAttemptAssessment? assessment;
  final List<AssessmentAttemptAnswer> answers;

  bool get isSubmitted => status == 'submitted';

  factory AssessmentAttemptSummary.fromJson(Map<String, dynamic> json) {
    final answersJson = json['answers'] as List<dynamic>? ?? const [];
    return AssessmentAttemptSummary(
      id: json['id'] as String? ?? '',
      assessmentId: json['assessmentId'] as String? ?? '',
      studentId: json['studentId'] as String? ?? '',
      status: json['status'] as String? ?? 'in_progress',
      score: (json['score'] as num?)?.toInt(),
      totalMarks: (json['totalMarks'] as num?)?.toInt() ?? 0,
      startedAt: DateTime.tryParse(json['startedAt']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      submittedAt: json['submittedAt'] == null
          ? null
          : DateTime.tryParse(json['submittedAt'].toString()),
      assessment: json['assessment'] is Map<String, dynamic>
          ? AssessmentAttemptAssessment.fromJson(
              json['assessment'] as Map<String, dynamic>,
            )
          : null,
      answers: answersJson
          .map((item) => AssessmentAttemptAnswer.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class AssessmentAttemptAssessment {
  const AssessmentAttemptAssessment({
    required this.id,
    required this.chapterTitle,
    required this.chapterKey,
    required this.subject,
    required this.classroomId,
    required this.classroomName,
  });

  final String id;
  final String chapterTitle;
  final String chapterKey;
  final String subject;
  final String classroomId;
  final String? classroomName;

  factory AssessmentAttemptAssessment.fromJson(Map<String, dynamic> json) {
    final classroomJson = json['classroom'] as Map<String, dynamic>?;
    return AssessmentAttemptAssessment(
      id: json['id'] as String? ?? '',
      chapterTitle: json['chapterTitle'] as String? ?? '',
      chapterKey: json['chapterKey'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      classroomId: json['classroomId'] as String? ?? '',
      classroomName: classroomJson?['name'] as String?,
    );
  }
}

class AssessmentAttemptAnswer {
  const AssessmentAttemptAnswer({
    required this.id,
    required this.questionId,
    required this.selectedChoiceId,
    required this.isCorrect,
    required this.earnedMarks,
    required this.question,
  });

  final String id;
  final String questionId;
  final String? selectedChoiceId;
  final bool? isCorrect;
  final int earnedMarks;
  final AssessmentQuestion? question;

  factory AssessmentAttemptAnswer.fromJson(Map<String, dynamic> json) {
    return AssessmentAttemptAnswer(
      id: json['id'] as String? ?? '',
      questionId: json['questionId'] as String? ?? '',
      selectedChoiceId: json['selectedChoiceId'] as String?,
      isCorrect: json['isCorrect'] as bool?,
      earnedMarks: (json['earnedMarks'] as num?)?.toInt() ?? 0,
      question: json['question'] is Map<String, dynamic>
          ? AssessmentQuestion.fromJson(json['question'] as Map<String, dynamic>)
          : null,
    );
  }
}

class AttendanceSessionSummary {
  const AttendanceSessionSummary({
    required this.id,
    required this.attendanceKey,
    required this.attendanceDate,
    required this.classroomId,
    required this.classroomName,
    required this.status,
  });

  final String id;
  final String attendanceKey;
  final DateTime attendanceDate;
  final String classroomId;
  final String classroomName;
  final String status;

  factory AttendanceSessionSummary.fromJson(Map<String, dynamic> json) {
    return AttendanceSessionSummary(
      id: json['id'] as String? ?? '',
      attendanceKey: json['attendanceKey'] as String? ?? '',
      attendanceDate: DateTime.tryParse(json['attendanceDate']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      classroomId: json['classroomId'] as String? ?? '',
      classroomName: json['classroomName'] as String? ?? '',
      status: json['status'] as String? ?? 'absent',
    );
  }
}

class SubjectProgressSummary {
  const SubjectProgressSummary({
    required this.subject,
    required this.attempts,
    required this.averageScore,
  });

  final String subject;
  final int attempts;
  final double averageScore;

  factory SubjectProgressSummary.fromJson(Map<String, dynamic> json) {
    return SubjectProgressSummary(
      subject: json['subject'] as String? ?? '',
      attempts: (json['attempts'] as num?)?.toInt() ?? 0,
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0,
    );
  }
}

class WeakTopicSummary {
  const WeakTopicSummary({
    required this.topic,
    required this.misses,
  });

  final String topic;
  final int misses;

  factory WeakTopicSummary.fromJson(Map<String, dynamic> json) {
    return WeakTopicSummary(
      topic: json['topic'] as String? ?? '',
      misses: (json['misses'] as num?)?.toInt() ?? 0,
    );
  }
}

class SyllabusChapterSummary {
  const SyllabusChapterSummary({
    required this.id,
    required this.classroomSubjectId,
    required this.chapterKey,
    required this.title,
    required this.summary,
    required this.sourcePdfUrl,
    required this.videoUrl,
    required this.topicCount,
  });

  final String id;
  final String classroomSubjectId;
  final String chapterKey;
  final String title;
  final String summary;
  final String? sourcePdfUrl;
  final String? videoUrl;
  final int topicCount;

  factory SyllabusChapterSummary.fromJson(Map<String, dynamic> json) {
    return SyllabusChapterSummary(
      id: json['id'] as String? ?? '',
      classroomSubjectId: json['classroomSubjectId'] as String? ?? '',
      chapterKey: json['chapterKey'] as String? ?? '',
      title: json['title'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      sourcePdfUrl: json['sourcePdfUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      topicCount: (json['topicCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class ClassroomSubjectSummary {
  const ClassroomSubjectSummary({
    required this.id,
    required this.classroomId,
    required this.name,
    required this.displayOrder,
    required this.themeColor,
    required this.iconKey,
    required this.teacherUserId,
    required this.chapterCount,
    required this.chapters,
  });

  final String id;
  final String classroomId;
  final String name;
  final int displayOrder;
  final String? themeColor;
  final String? iconKey;
  final String? teacherUserId;
  final int chapterCount;
  final List<SyllabusChapterSummary> chapters;

  factory ClassroomSubjectSummary.fromJson(Map<String, dynamic> json) {
    final chaptersJson = json['chapters'] as List<dynamic>? ?? const [];
    return ClassroomSubjectSummary(
      id: json['id'] as String? ?? '',
      classroomId: json['classroomId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      displayOrder: (json['displayOrder'] as num?)?.toInt() ?? 0,
      themeColor: json['themeColor'] as String?,
      iconKey: json['iconKey'] as String?,
      teacherUserId: json['teacherUserId'] as String?,
      chapterCount: (json['chapterCount'] as num?)?.toInt() ?? chaptersJson.length,
      chapters: chaptersJson
          .map((item) => SyllabusChapterSummary.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class TeacherAttendanceStudent {
  const TeacherAttendanceStudent({
    required this.id,
    required this.name,
    required this.handle,
    required this.rollNumber,
    required this.status,
  });

  final String id;
  final String name;
  final String handle;
  final String? rollNumber;
  final String status;

  factory TeacherAttendanceStudent.fromJson(Map<String, dynamic> json) {
    return TeacherAttendanceStudent(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      handle: json['handle'] as String? ?? '',
      rollNumber: json['rollNumber'] as String?,
      status: json['status'] as String? ?? 'present',
    );
  }
}

class TeacherAttendanceSession {
  const TeacherAttendanceSession({
    required this.id,
    required this.attendanceKey,
    required this.attendanceDate,
  });

  final String id;
  final String attendanceKey;
  final DateTime attendanceDate;

  factory TeacherAttendanceSession.fromJson(Map<String, dynamic> json) {
    return TeacherAttendanceSession(
      id: json['id'] as String? ?? '',
      attendanceKey: json['attendanceKey'] as String? ?? '',
      attendanceDate: DateTime.tryParse(json['attendanceDate']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}

class TeacherAttendanceSnapshot {
  const TeacherAttendanceSnapshot({
    required this.classroomId,
    required this.classroomName,
    required this.joinCode,
    required this.subject,
    required this.attendanceDate,
    required this.attendanceKey,
    required this.session,
    required this.students,
  });

  final String classroomId;
  final String classroomName;
  final String joinCode;
  final String? subject;
  final DateTime attendanceDate;
  final String attendanceKey;
  final TeacherAttendanceSession? session;
  final List<TeacherAttendanceStudent> students;

  factory TeacherAttendanceSnapshot.fromJson(Map<String, dynamic> json) {
    final studentsJson = json['students'] as List<dynamic>? ?? const [];
    return TeacherAttendanceSnapshot(
      classroomId: (json['classroom'] as Map<String, dynamic>?)?['id'] as String? ??
          json['classroomId'] as String? ??
          '',
      classroomName: (json['classroom'] as Map<String, dynamic>?)?['name'] as String? ??
          json['classroomName'] as String? ??
          '',
      joinCode: (json['classroom'] as Map<String, dynamic>?)?['joinCode'] as String? ??
          json['joinCode'] as String? ??
          '',
      subject: (json['classroom'] as Map<String, dynamic>?)?['subject'] as String? ??
          json['subject'] as String?,
      attendanceDate: DateTime.tryParse(json['attendanceDate']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      attendanceKey: json['attendanceKey'] as String? ?? '',
      session: json['session'] is Map<String, dynamic>
          ? TeacherAttendanceSession.fromJson(
              json['session'] as Map<String, dynamic>,
            )
          : null,
      students: studentsJson
          .map((item) => TeacherAttendanceStudent.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}
