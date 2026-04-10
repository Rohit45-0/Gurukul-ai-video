import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';
import '../learning/lesson_screen.dart';
import 'assessment_detail_screen.dart';

enum HomeworkFilter { all, pending, submitted }

class StudentHomeworkScreen extends StatefulWidget {
  const StudentHomeworkScreen({
    super.key,
    required this.session,
  });

  final SchoolSession session;

  @override
  State<StudentHomeworkScreen> createState() => _StudentHomeworkScreenState();
}

class _StudentHomeworkScreenState extends State<StudentHomeworkScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();

  List<SchoolClassroom> _classrooms = const [];
  List<ClassroomSubjectSummary> _subjects = const [];
  List<AssessmentSummary> _assessments = const [];
  String? _selectedClassroomId;
  String? _selectedSubjectId;
  SyllabusChapterSummary? _selectedChapter;
  HomeworkFilter _filter = HomeworkFilter.pending;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _classrooms = widget.session.user.classrooms;
    _selectedClassroomId = _classrooms.isNotEmpty ? _classrooms.first.id : null;
    _loadWorkspace();
  }

  SchoolClassroom? _currentClassroom() {
    for (final classroom in _classrooms) {
      if (classroom.id == _selectedClassroomId) {
        return classroom;
      }
    }
    return _classrooms.isNotEmpty ? _classrooms.first : null;
  }

  ClassroomSubjectSummary? _currentSubject() {
    for (final subject in _subjects) {
      if (subject.id == _selectedSubjectId) {
        return subject;
      }
    }
    return _subjects.isNotEmpty ? _subjects.first : null;
  }

  Future<void> _loadWorkspace() async {
    if (_selectedClassroomId == null) {
      setState(() {
        _loading = false;
        _error = 'No classroom found for this account.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final subjects = await _schoolApi.getClassroomSubjects(
        token: widget.session.token,
        classroomId: _selectedClassroomId!,
      );
      final assessments = await _schoolApi.getStudentAssessments(widget.session.token);
      if (!mounted) {
        return;
      }

      final selectedSubject = subjects.isNotEmpty ? subjects.first : null;
      final selectedChapter = selectedSubject?.chapters.isNotEmpty == true
          ? selectedSubject!.chapters.first
          : null;

      setState(() {
        _subjects = subjects;
        _assessments = assessments;
        _selectedSubjectId = selectedSubject?.id;
        _selectedChapter = selectedChapter;
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

  void _selectClassroom(String? classroomId) {
    if (classroomId == null || classroomId == _selectedClassroomId) {
      return;
    }
    setState(() {
      _selectedClassroomId = classroomId;
      _subjects = const [];
      _selectedSubjectId = null;
      _selectedChapter = null;
    });
    _loadWorkspace();
  }

  void _selectSubject(ClassroomSubjectSummary subject) {
    setState(() {
      _selectedSubjectId = subject.id;
      _selectedChapter = subject.chapters.isNotEmpty ? subject.chapters.first : null;
    });
  }

  void _selectChapter(SyllabusChapterSummary chapter) {
    setState(() => _selectedChapter = chapter);
  }

  bool _matchesSubject(AssessmentSummary assessment, ClassroomSubjectSummary subject) {
    final assessmentSubject = assessment.subject.trim().toLowerCase();
    final selectedSubject = subject.name.trim().toLowerCase();
    return assessmentSubject == selectedSubject;
  }

  List<AssessmentSummary> _visibleAssessments() {
    final classroomId = _selectedClassroomId;
    final subject = _currentSubject();

    Iterable<AssessmentSummary> items = _assessments;
    if (classroomId != null && classroomId.isNotEmpty) {
      items = items.where((item) => item.classroomId == classroomId);
    }
    if (subject != null && subject.id.isNotEmpty) {
      items = items.where((item) => _matchesSubject(item, subject));
    }
    if (_filter == HomeworkFilter.pending) {
      items = items.where((item) => item.attemptStatus != 'submitted');
    } else if (_filter == HomeworkFilter.submitted) {
      items = items.where((item) => item.attemptStatus == 'submitted');
    }
    final list = items.toList(growable: false);
    list.sort((left, right) {
      final leftSubmitted = left.attemptStatus == 'submitted';
      final rightSubmitted = right.attemptStatus == 'submitted';
      if (leftSubmitted != rightSubmitted) {
        return leftSubmitted ? 1 : -1;
      }
      final leftPublished = left.publishedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final rightPublished = right.publishedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      return rightPublished.compareTo(leftPublished);
    });
    return list;
  }

  String _statusLabel(AssessmentSummary assessment) {
    if (assessment.attemptStatus == 'submitted') {
      return 'Review Score';
    }
    if (assessment.attemptStatus == 'in_progress') {
      return 'Continue Test';
    }
    return 'Open Test';
  }

  Color _statusBackground(AssessmentSummary assessment) {
    if (assessment.attemptStatus == 'submitted') {
      return AppColors.mint;
    }
    if (assessment.attemptStatus == 'in_progress') {
      return AppColors.sky;
    }
    return AppColors.amberSoft;
  }

  Color _statusForeground(AssessmentSummary assessment) {
    if (assessment.attemptStatus == 'submitted') {
      return AppColors.mintStrong;
    }
    if (assessment.attemptStatus == 'in_progress') {
      return AppColors.primary;
    }
    return AppColors.amber;
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) {
      return 'ST';
    }
    if (parts.length == 1) {
      final value = parts.first.trim();
      return value.substring(0, value.length >= 2 ? 2 : 1).toUpperCase();
    }
    final first = parts.first.isEmpty ? 'S' : parts.first[0];
    final last = parts.last.isEmpty ? 'T' : parts.last[0];
    return (first + last).toUpperCase();
  }

  String _formatDate(DateTime date) {
    const monthNames = <int, String>{
      1: 'Jan',
      2: 'Feb',
      3: 'Mar',
      4: 'Apr',
      5: 'May',
      6: 'Jun',
      7: 'Jul',
      8: 'Aug',
      9: 'Sep',
      10: 'Oct',
      11: 'Nov',
      12: 'Dec',
    };
    final local = date.toLocal();
    return '${local.day} ${monthNames[local.month]}';
  }

  String _formatScore(AssessmentSummary assessment) {
    if (assessment.studentScore == null) {
      return '--';
    }
    return '${assessment.studentScore}/${assessment.totalMarks}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final classroom = _currentClassroom();
    final subject = _currentSubject();
    final visibleAssessments = _visibleAssessments();
    final classroomAssessments = _assessments
        .where((assessment) => assessment.classroomId == _selectedClassroomId)
        .toList(growable: false);
    final pendingCount = classroomAssessments
        .where((assessment) => assessment.attemptStatus != 'submitted')
        .length;
    final submittedCount = classroomAssessments
        .where((assessment) => assessment.attemptStatus == 'submitted')
        .length;
    final lessonCount = subject?.chapterCount ?? 0;

    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ScreenHeader(
            title: 'Homework',
            subtitle: classroom?.name ?? 'Your classroom',
          ),
          const SizedBox(height: 16),
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
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Good afternoon, ${widget.session.user.name}',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Watch chapter videos, solve tests, and review teacher-shared answers from the same workspace.',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: const Color(0xFFDDE7F5),
                          height: 1.55,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _HeroChip(label: classroom?.name ?? 'Classroom'),
                          _HeroChip(label: subject?.name ?? 'Homework feed'),
                          _HeroChip(label: '$pendingCount pending'),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                AppAvatar(
                  initials: _initials(widget.session.user.name),
                  size: 58,
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _error!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.coralStrong,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SecondaryButton(
                    label: 'Retry',
                    icon: Icons.refresh_rounded,
                    onPressed: _loadWorkspace,
                  ),
                ],
              ),
            )
          else ...[
            Row(
              children: [
                Expanded(
                  child: MetricTile(
                    icon: Icons.assignment_rounded,
                    value: '$pendingCount',
                    title: 'Pending',
                    subtitle: 'Homework due',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricTile(
                    icon: Icons.check_circle_outline_rounded,
                    value: '$submittedCount',
                    title: 'Submitted',
                    subtitle: 'Solved tests',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: MetricTile(
                    icon: Icons.play_circle_outline_rounded,
                    value: '$lessonCount',
                    title: 'Lessons',
                    subtitle: 'In this subject',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricTile(
                    icon: Icons.calendar_month_rounded,
                    value: '${widget.session.user.classrooms.length}',
                    title: 'Classes',
                    subtitle: 'Joined classrooms',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    title: 'Choose Classroom',
                    subtitle: 'Switch between classrooms linked to your account',
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _classrooms
                        .map(
                          (classroomItem) => PillChip(
                            label: classroomItem.name,
                            selected: classroomItem.id == _selectedClassroomId,
                            onTap: () => _selectClassroom(classroomItem.id),
                          ),
                        )
                        .toList(growable: false),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (_subjects.isEmpty)
              SurfaceCard(
                child: Text(
                  'No subjects are linked to this classroom yet.',
                  style: theme.textTheme.bodyMedium,
                ),
              )
            else ...[
              SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionTitle(
                      title: 'Subjects',
                      subtitle: 'Tap a subject to open its chapter video and tasks',
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _subjects
                          .map(
                            (item) => PillChip(
                              label: item.name,
                              selected: item.id == _selectedSubjectId,
                              icon: _subjectIcon(item.iconKey),
                              onTap: () => _selectSubject(item),
                            ),
                          )
                          .toList(growable: false),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionTitle(
                      title: subject?.name ?? 'Learning',
                      subtitle: 'Open the chapter video, PDF, and AI-style topic cards',
                      trailing: Text(
                        '${subject?.chapterCount ?? 0} chapters',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (subject?.chapters.isNotEmpty == true)
                      ...subject!.chapters.map(
                        (chapter) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            onTap: () => _selectChapter(chapter),
                            borderRadius: BorderRadius.circular(24),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: _selectedChapter?.id == chapter.id
                                    ? AppColors.sky
                                    : AppColors.background,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: _selectedChapter?.id == chapter.id
                                      ? const Color(0xFFBCD8F4)
                                      : AppColors.border,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: AppColors.mint,
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: const Icon(
                                      Icons.play_circle_outline_rounded,
                                      color: AppColors.mintStrong,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          chapter.title,
                                          style: theme.textTheme.bodyLarge?.copyWith(
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${chapter.topicCount} topic cards',
                                          style: theme.textTheme.bodySmall,
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Icon(
                                    Icons.chevron_right_rounded,
                                    color: AppColors.muted,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    if (subject?.chapters.isEmpty == true)
                      Text(
                        'This subject does not have chapters yet.',
                        style: theme.textTheme.bodyMedium,
                      ),
                  ],
                ),
              ),
            ],
            if (_selectedChapter != null) ...[
              const SizedBox(height: 18),
              SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionTitle(
                      title: _selectedChapter!.title,
                      subtitle: _selectedChapter!.summary,
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        PillChip(
                          label: _selectedChapter!.chapterKey,
                          selected: true,
                          small: true,
                        ),
                        if (_selectedChapter!.sourcePdfUrl != null)
                          SecondaryButton(
                            label: 'Open PDF',
                            icon: Icons.description_outlined,
                            onPressed: () => launchUrl(
                              Uri.parse(_selectedChapter!.sourcePdfUrl!),
                              mode: LaunchMode.platformDefault,
                            ),
                          ),
                        if (_selectedChapter!.videoUrl != null)
                          SecondaryButton(
                            label: 'Open Video',
                            icon: Icons.play_arrow_rounded,
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => LessonScreen(
                                  session: widget.session,
                                  chapterKey: _selectedChapter!.chapterKey,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 18),
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    title: 'Homework & Tests',
                    subtitle: 'Your tests live here alongside chapter learning',
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      PillChip(
                        label: 'All',
                        selected: _filter == HomeworkFilter.all,
                        onTap: () => setState(() => _filter = HomeworkFilter.all),
                      ),
                      PillChip(
                        label: 'Pending',
                        selected: _filter == HomeworkFilter.pending,
                        onTap: () => setState(() => _filter = HomeworkFilter.pending),
                      ),
                      PillChip(
                        label: 'Submitted',
                        selected: _filter == HomeworkFilter.submitted,
                        onTap: () => setState(() => _filter = HomeworkFilter.submitted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (visibleAssessments.isEmpty)
                    Text(
                      'No matching tests yet. When the teacher publishes one, it will appear here.',
                      style: theme.textTheme.bodyMedium,
                    )
                  else
                    ...visibleAssessments.map(
                      (assessment) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(24),
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
                                          '${assessment.subject} - ${assessment.questionCount} questions - ${assessment.totalMarks} marks',
                                          style: theme.textTheme.bodySmall,
                                        ),
                                      ],
                                    ),
                                  ),
                                  PillChip(
                                    label: assessment.attemptStatus ?? assessment.status,
                                    selected: assessment.attemptStatus == 'submitted',
                                    small: true,
                                    background: _statusBackground(assessment),
                                    foreground: _statusForeground(assessment),
                                  ),
                                ],
                              ),
                              if (assessment.studentScore != null) ...[
                                const SizedBox(height: 12),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(18),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: BoxDecoration(
                                          color: AppColors.mint,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(
                                          Icons.verified_rounded,
                                          size: 18,
                                          color: AppColors.mintStrong,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          'Score ${_formatScore(assessment)}',
                                          style: theme.textTheme.bodyMedium?.copyWith(
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 14),
                              Row(
                                children: [
                                  PillChip(
                                    label: assessment.difficulty,
                                    small: true,
                                  ),
                                  const Spacer(),
                                  PrimaryButton(
                                    label: _statusLabel(assessment),
                                    icon: Icons.open_in_new_rounded,
                                    onPressed: () async {
                                      await Navigator.of(context).push<void>(
                                        MaterialPageRoute<void>(
                                          builder: (_) => AssessmentDetailScreen(
                                            session: widget.session,
                                            assessmentId: assessment.id,
                                            assessment: assessment,
                                          ),
                                        ),
                                      );
                                      if (mounted) {
                                        await _loadWorkspace();
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
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

  IconData? _subjectIcon(String? iconKey) {
    return switch (iconKey) {
      'science' => Icons.science_rounded,
      'calculate' => Icons.calculate_rounded,
      'menu_book' => Icons.menu_book_rounded,
      'account_balance' => Icons.account_balance_rounded,
      'public' => Icons.public_rounded,
      'translate' => Icons.translate_rounded,
      _ => Icons.school_rounded,
    };
  }
}

class _HeroChip extends StatelessWidget {
  const _HeroChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.16),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
      ),
    );
  }
}
