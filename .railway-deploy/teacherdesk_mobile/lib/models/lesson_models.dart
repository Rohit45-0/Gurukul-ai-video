class LessonChoice {
  const LessonChoice({
    required this.id,
    required this.label,
    required this.feedback,
    required this.isCorrect,
  });

  final String id;
  final String label;
  final String feedback;
  final bool isCorrect;

  factory LessonChoice.fromJson(Map<String, dynamic> json) {
    return LessonChoice(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      feedback: json['feedback'] as String? ?? '',
      isCorrect: json['isCorrect'] as bool? ?? false,
    );
  }

  factory LessonChoice.fromOptionJson(Map<String, dynamic> json) {
    return LessonChoice(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      feedback: '',
      isCorrect: false,
    );
  }
}

class LessonQuiz {
  const LessonQuiz({
    required this.title,
    required this.prompt,
    required this.options,
  });

  final String title;
  final String prompt;
  final List<LessonChoice> options;

  factory LessonQuiz.fromJson(Map<String, dynamic> json) {
    final optionsJson = json['options'] as List<dynamic>? ?? const [];
    return LessonQuiz(
      title: json['title'] as String? ?? '',
      prompt: json['prompt'] as String? ?? '',
      options: optionsJson
          .map((item) => LessonChoice.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class LessonCoach {
  const LessonCoach({
    required this.simple,
    required this.analogy,
    required this.mistake,
  });

  final String simple;
  final String analogy;
  final String mistake;

  factory LessonCoach.fromJson(Map<String, dynamic> json) {
    return LessonCoach(
      simple: json['simple'] as String? ?? '',
      analogy: json['analogy'] as String? ?? '',
      mistake: json['mistake'] as String? ?? '',
    );
  }
}

class LessonScenario {
  const LessonScenario({
    required this.title,
    required this.prompt,
    required this.options,
  });

  final String title;
  final String prompt;
  final List<LessonChoice> options;

  factory LessonScenario.fromJson(Map<String, dynamic> json) {
    final optionsJson = json['options'] as List<dynamic>? ?? const [];
    return LessonScenario(
      title: json['title'] as String? ?? '',
      prompt: json['prompt'] as String? ?? '',
      options: optionsJson
          .map((item) => LessonChoice.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class LessonTopic {
  const LessonTopic({
    required this.id,
    required this.timestampLabel,
    required this.startSeconds,
    required this.endSeconds,
    required this.title,
    required this.mission,
    required this.recap,
    required this.observation,
    required this.sourceAnchor,
    required this.quiz,
    required this.coach,
    required this.scenario,
  });

  final String id;
  final String timestampLabel;
  final int startSeconds;
  final int endSeconds;
  final String title;
  final String mission;
  final String recap;
  final String observation;
  final String sourceAnchor;
  final LessonQuiz quiz;
  final LessonCoach coach;
  final LessonScenario scenario;

  factory LessonTopic.fromJson(Map<String, dynamic> json) {
    return LessonTopic(
      id: json['id'] as String? ?? '',
      timestampLabel: json['timestampLabel'] as String? ?? '',
      startSeconds: (json['startSeconds'] as num?)?.toInt() ?? 0,
      endSeconds: (json['endSeconds'] as num?)?.toInt() ?? 0,
      title: json['title'] as String? ?? '',
      mission: json['mission'] as String? ?? '',
      recap: json['recap'] as String? ?? '',
      observation: json['observation'] as String? ?? '',
      sourceAnchor: json['sourceAnchor'] as String? ?? '',
      quiz: LessonQuiz.fromJson((json['quiz'] as Map<String, dynamic>?) ?? const {}),
      coach: LessonCoach.fromJson((json['coach'] as Map<String, dynamic>?) ?? const {}),
      scenario: LessonScenario.fromJson(
        (json['scenario'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}

class LessonChapter {
  const LessonChapter({
    required this.chapterTitle,
    required this.summary,
    required this.sourceLabel,
    required this.sourceName,
    required this.sourcePdfUrl,
    required this.videoUrl,
    required this.subjectLine,
    required this.topics,
  });

  final String chapterTitle;
  final String summary;
  final String sourceLabel;
  final String sourceName;
  final String sourcePdfUrl;
  final String videoUrl;
  final String subjectLine;
  final List<LessonTopic> topics;

  factory LessonChapter.fromJson(Map<String, dynamic> json) {
    final topicsJson = json['topics'] as List<dynamic>? ?? const [];
    return LessonChapter(
      chapterTitle: json['chapterTitle'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      sourceLabel: json['sourceLabel'] as String? ?? 'Source',
      sourceName: json['sourceName'] as String? ?? '',
      sourcePdfUrl: json['sourcePdfUrl'] as String? ?? '',
      videoUrl: json['videoUrl'] as String? ?? '',
      subjectLine: json['subjectLine'] as String? ?? '',
      topics: topicsJson
          .map((item) => LessonTopic.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}
