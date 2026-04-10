import 'package:flutter/material.dart';

import '../../models/lesson_models.dart';
import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';
import '../learning/lesson_screen.dart';

class TeacherStudioScreen extends StatefulWidget {
  const TeacherStudioScreen({
    super.key,
    required this.session,
  });

  final SchoolSession session;

  @override
  State<TeacherStudioScreen> createState() => _TeacherStudioScreenState();
}

class _TeacherStudioScreenState extends State<TeacherStudioScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();

  List<SchoolClassroom> _classrooms = const [];
  List<ClassroomSubjectSummary> _subjects = const [];
  List<SyllabusChapterSummary> _chapters = const [];
  List<AssessmentSummary> _assessments = const [];
  LessonChapter? _chapter;

  final Set<String> _selectedTopicIds = <String>{};
  String? _selectedClassroomId;
  String? _selectedSubjectId;
  String? _selectedChapterKey;
  int _marks = 10;
  String _difficulty = 'Balanced';
  bool _loading = true;
  bool _generating = false;
  String? _error;
  AssessmentSummary? _latestDraft;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final classrooms = await _schoolApi.getTeacherClassrooms(widget.session.token);
      final assessments = await _schoolApi.getTeacherAssessments(widget.session.token);

      if (!mounted) {
        return;
      }

      setState(() {
        _classrooms = classrooms;
        _assessments = assessments;
        _selectedClassroomId = classrooms.isNotEmpty ? classrooms.first.id : null;
      });

      if (_selectedClassroomId != null) {
        await _loadClassroomContext(_selectedClassroomId!);
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loadClassroomContext(String classroomId) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final subjects = await _schoolApi.getClassroomSubjects(
        token: widget.session.token,
        classroomId: classroomId,
      );

      if (!mounted) {
        return;
      }

      final subjectId = subjects.isNotEmpty
          ? (subjects.any((subject) => subject.id == _selectedSubjectId)
              ? _selectedSubjectId
              : subjects.first.id)
          : null;

      setState(() {
        _subjects = subjects;
        _selectedSubjectId = subjectId;
        _selectedTopicIds.clear();
      });

      if (subjectId != null) {
        await _loadSubject(subjectId);
      } else {
        setState(() {
          _chapters = const [];
          _chapter = null;
          _selectedChapterKey = null;
          _selectedTopicIds.clear();
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loadSubject(String subjectId) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final chapters = await _schoolApi.getSubjectChapters(
        token: widget.session.token,
        subjectId: subjectId,
      );

      if (!mounted) {
        return;
      }

      final chapterKey = chapters.isNotEmpty
          ? (chapters.any((chapter) => chapter.chapterKey == _selectedChapterKey)
              ? _selectedChapterKey
              : chapters.first.chapterKey)
          : null;

      setState(() {
        _chapters = chapters;
        _selectedChapterKey = chapterKey;
      });

      if (chapterKey != null) {
        await _loadChapter(chapterKey);
      } else {
        setState(() {
          _chapter = null;
          _selectedTopicIds.clear();
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loadChapter(String chapterKey) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final chapter = await _schoolApi.getLesson(
        token: widget.session.token,
        chapterKey: chapterKey,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _chapter = chapter;
        _selectedChapterKey = chapter.chapterKey;
        if (_selectedTopicIds.isEmpty || !_selectedTopicIds.every((id) =>
            chapter.topics.any((topic) => topic.id == id))) {
          _selectedTopicIds
            ..clear()
            ..addAll(chapter.topics.take(2).map((topic) => topic.id));
        }
      });
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _generateDraft() async {
    if (_selectedClassroomId == null || _chapter == null || _selectedTopicIds.isEmpty) {
      return;
    }

    setState(() => _generating = true);

    try {
      final draft = await _schoolApi.generateDraftAssessment(
        token: widget.session.token,
        classroomId: _selectedClassroomId!,
        chapterKey: _chapter!.chapterKey,
        topicIds: _selectedTopicIds.toList(growable: false),
        totalMarks: _marks,
        difficulty: _difficulty,
      );

      final updatedAssessments =
          await _schoolApi.getTeacherAssessments(widget.session.token);

      if (!mounted) {
        return;
      }

      setState(() {
        _latestDraft = draft;
        _assessments = updatedAssessments;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Draft test generated successfully.')),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _generating = false);
      }
    }
  }

  Future<void> _publishAssessment(String assessmentId) async {
    try {
      await _schoolApi.publishAssessment(
        token: widget.session.token,
        assessmentId: assessmentId,
      );
      await _refreshAssessments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Test published for students.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }

  Future<void> _shareResults(String assessmentId) async {
    try {
      await _schoolApi.shareAssessmentResults(
        token: widget.session.token,
        assessmentId: assessmentId,
      );
      await _refreshAssessments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Results shared with students.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }

  Future<void> _regenerateFirstQuestion(AssessmentSummary assessment) async {
    final firstQuestion = assessment.questions?.isNotEmpty == true
        ? assessment.questions!.first
        : null;
    if (firstQuestion == null) {
      return;
    }

    try {
      final updated = await _schoolApi.regenerateAssessmentQuestion(
        token: widget.session.token,
        assessmentId: assessment.id,
        questionId: firstQuestion.id,
        topicId: firstQuestion.topicId,
      );
      if (!mounted) {
        return;
      }
      setState(() => _latestDraft = updated);
      await _refreshAssessments();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Question regenerated from AI.')),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }

  Future<void> _refreshAssessments() async {
    final updated = await _schoolApi.getTeacherAssessments(widget.session.token);
    if (!mounted) {
      return;
    }
    setState(() => _assessments = updated);
  }

  @override
  Widget build(BuildContext context) {
    final classroom = _classrooms.firstWhere(
      (room) => room.id == _selectedClassroomId,
      orElse: () => _classrooms.isNotEmpty
          ? _classrooms.first
          : const SchoolClassroom(
              id: '',
              name: '',
              subject: null,
              joinCode: '',
            ),
    );
    final chapter = _chapter;

    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ScreenHeader(
            title: 'Test Studio',
            subtitle: 'Choose a subject, preview the lesson, and generate a publishable test',
          ),
          const SizedBox(height: 16),
          if (_loading && _chapter == null && _classrooms.isEmpty)
            const Center(child: CircularProgressIndicator())
          else if (_error != null && chapter == null)
            SurfaceCard(
              child: Text(
                _error!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.coralStrong,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            )
          else ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(30),
                gradient: const LinearGradient(
                  colors: [Color(0xFF2D6AA1), Color(0xFF245987)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x220F3B68),
                    blurRadius: 28,
                    offset: Offset(0, 18),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    chapter?.chapterTitle ?? 'Pick a chapter to start',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    chapter?.summary ??
                        'Select a classroom, subject, and chapter to use the lesson video and PDF as the test source.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: const Color(0xFFDDE7F5),
                          height: 1.55,
                        ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: chapter == null
                          ? null
                          : () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => LessonScreen(
                                    session: widget.session,
                                    chapterKey: chapter.chapterKey,
                                    onBack: () => Navigator.of(context).pop(),
                                  ),
                                ),
                              );
                            },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Color(0x66D5E5F7)),
                      ),
                      child: const Text(
                        'Preview Lesson',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    title: 'Choose Context',
                    subtitle: 'Classroom -> subject -> chapter',
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedClassroomId,
                    decoration: const InputDecoration(labelText: 'Classroom'),
                    items: _classrooms
                        .map(
                          (room) => DropdownMenuItem<String>(
                            value: room.id,
                            child: Text(room.name),
                          ),
                        )
                        .toList(growable: false),
                    onChanged: (value) async {
                      if (value == null) {
                        return;
                      }
                      setState(() => _selectedClassroomId = value);
                      await _loadClassroomContext(value);
                    },
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Subjects',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 10),
                  if (_subjects.isEmpty)
                    Text(
                      'No subjects are linked to this classroom yet.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _subjects
                          .map(
                            (subject) => PillChip(
                              label: '${subject.name} • ${subject.chapterCount}',
                              selected: subject.id == _selectedSubjectId,
                              onTap: () async {
                                setState(() {
                                  _selectedSubjectId = subject.id;
                                  _selectedChapterKey = null;
                                  _selectedTopicIds.clear();
                                });
                                await _loadSubject(subject.id);
                              },
                            ),
                          )
                          .toList(growable: false),
                    ),
                  const SizedBox(height: 16),
                  Text(
                    'Chapters',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 10),
                  if (_chapters.isEmpty)
                    Text(
                      'No chapters found for this subject yet.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _chapters
                          .map(
                            (chapterSummary) => PillChip(
                              label:
                                  '${chapterSummary.title} • ${chapterSummary.topicCount} topics',
                              selected: chapterSummary.chapterKey == _selectedChapterKey,
                              onTap: () async {
                                setState(() {
                                  _selectedChapterKey = chapterSummary.chapterKey;
                                  _selectedTopicIds.clear();
                                });
                                await _loadChapter(chapterSummary.chapterKey);
                              },
                            ),
                          )
                          .toList(growable: false),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (chapter != null)
              SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionTitle(
                      title: 'Build Draft',
                      subtitle: 'Pick the topics you want AI to turn into questions',
                    ),
                    const SizedBox(height: 14),
                    Text(
                      classroom.name.isEmpty
                          ? 'No classroom selected'
                          : '${classroom.name} • ${classroom.joinCode}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Topics',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: chapter.topics
                          .map(
                            (topic) => PillChip(
                              label: topic.title,
                              selected: _selectedTopicIds.contains(topic.id),
                              onTap: () {
                                setState(() {
                                  if (_selectedTopicIds.contains(topic.id)) {
                                    _selectedTopicIds.remove(topic.id);
                                  } else {
                                    _selectedTopicIds.add(topic.id);
                                  }
                                });
                              },
                            ),
                          )
                          .toList(growable: false),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<int>(
                            value: _marks,
                            decoration: const InputDecoration(labelText: 'Marks'),
                            items: const [10, 15, 20, 25]
                                .map(
                                  (value) => DropdownMenuItem<int>(
                                    value: value,
                                    child: Text('$value marks'),
                                  ),
                                )
                                .toList(growable: false),
                            onChanged: (value) {
                              if (value != null) {
                                setState(() => _marks = value);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _difficulty,
                            decoration: const InputDecoration(labelText: 'Difficulty'),
                            items: const ['Easy', 'Balanced', 'Challenging']
                                .map(
                                  (value) => DropdownMenuItem<String>(
                                    value: value,
                                    child: Text(value),
                                  ),
                                )
                                .toList(growable: false),
                            onChanged: (value) {
                              if (value != null) {
                                setState(() => _difficulty = value);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    PrimaryButton(
                      expanded: true,
                      label: _generating ? 'Generating...' : 'Generate Draft Test',
                      icon: Icons.auto_awesome_rounded,
                      onPressed: _generating ? null : _generateDraft,
                    ),
                  ],
                ),
              ),
            if (chapter != null) const SizedBox(height: 18),
            if (_latestDraft != null) ...[
              SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionTitle(
                      title: 'Latest Draft',
                      subtitle: 'You can publish it or refresh the first question',
                    ),
                    const SizedBox(height: 12),
                    _AssessmentTile(
                      assessment: _latestDraft!,
                      onPublish: _latestDraft!.isPublished
                          ? null
                          : () => _publishAssessment(_latestDraft!.id),
                      onShareResults: _latestDraft!.isPublished
                          ? () => _shareResults(_latestDraft!.id)
                          : null,
                      onRegenerateFirstQuestion: _latestDraft!.questions?.isNotEmpty == true
                          ? () => _regenerateFirstQuestion(_latestDraft!)
                          : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
            ],
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    title: 'All Assessments',
                    subtitle: 'Drafts, published tests, and shared results',
                  ),
                  const SizedBox(height: 12),
                  if (_assessments.isEmpty)
                    Text(
                      'No tests yet. Generate the first one from a chapter.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    ..._assessments.map(
                      (assessment) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _AssessmentTile(
                          assessment: assessment,
                          onPublish: assessment.isPublished
                              ? null
                              : () => _publishAssessment(assessment.id),
                          onShareResults: assessment.isPublished
                              ? () => _shareResults(assessment.id)
                              : null,
                          onRegenerateFirstQuestion:
                              assessment.questions?.isNotEmpty == true
                                  ? () => _regenerateFirstQuestion(assessment)
                                  : null,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AssessmentTile extends StatelessWidget {
  const _AssessmentTile({
    required this.assessment,
    this.onPublish,
    this.onShareResults,
    this.onRegenerateFirstQuestion,
  });

  final AssessmentSummary assessment;
  final VoidCallback? onPublish;
  final VoidCallback? onShareResults;
  final VoidCallback? onRegenerateFirstQuestion;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      assessment.chapterTitle,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${assessment.classroomName ?? 'Classroom'} • ${assessment.subject}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              PillChip(
                label: assessment.isPublished ? 'Published' : assessment.status,
                selected: assessment.isPublished,
                small: true,
                background: assessment.isPublished ? AppColors.mint : AppColors.amberSoft,
                foreground: assessment.isPublished ? AppColors.mintStrong : AppColors.amber,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${assessment.questionCount} questions • ${assessment.totalMarks} marks',
            style: theme.textTheme.bodySmall,
          ),
          if (assessment.questions?.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            Text(
              'First question: ${assessment.questions!.first.prompt}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.ink,
              ),
            ),
          ],
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              if (onPublish != null)
                SecondaryButton(
                  label: 'Publish',
                  icon: Icons.publish_rounded,
                  onPressed: onPublish,
                ),
              if (onShareResults != null)
                SecondaryButton(
                  label: 'Share Results',
                  icon: Icons.campaign_outlined,
                  background: AppColors.mint,
                  foreground: AppColors.mintStrong,
                  onPressed: onShareResults,
                ),
              if (onRegenerateFirstQuestion != null)
                SecondaryButton(
                  label: 'Refresh AI Question',
                  icon: Icons.auto_awesome_rounded,
                  onPressed: onRegenerateFirstQuestion,
                ),
            ],
          ),
        ],
      ),
    );
  }
}
