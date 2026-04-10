import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';
import '../learning/lesson_screen.dart';

class StudentLearnScreen extends StatefulWidget {
  const StudentLearnScreen({
    super.key,
    required this.session,
  });

  final SchoolSession session;

  @override
  State<StudentLearnScreen> createState() => _StudentLearnScreenState();
}

class _StudentLearnScreenState extends State<StudentLearnScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();

  List<SchoolClassroom> _classrooms = const [];
  List<ClassroomSubjectSummary> _subjects = const [];
  String? _selectedClassroomId;
  String? _selectedSubjectId;
  SyllabusChapterSummary? _selectedChapter;
  bool _loading = true;
  bool _loadingSubjects = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _classrooms = widget.session.user.classrooms;
    _selectedClassroomId = _classrooms.isNotEmpty ? _classrooms.first.id : null;
    _loadSubjects();
  }

  Future<void> _loadSubjects() async {
    if (_selectedClassroomId == null) {
      setState(() {
        _loading = false;
        _error = 'No classroom found for this account.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _loadingSubjects = true;
      _error = null;
    });

    try {
      final subjects = await _schoolApi.getClassroomSubjects(
        token: widget.session.token,
        classroomId: _selectedClassroomId!,
      );
      final selectedSubject =
          subjects.isNotEmpty ? subjects.first : null;
      final selectedChapter = selectedSubject?.chapters.isNotEmpty == true
          ? selectedSubject!.chapters.first
          : null;
      if (!mounted) {
        return;
      }
      setState(() {
        _subjects = subjects;
        _selectedSubjectId = selectedSubject?.id;
        _selectedChapter = selectedChapter;
      });
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString());
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _loadingSubjects = false;
        });
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
    _loadSubjects();
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentClassroom = _classrooms.isNotEmpty
        ? _classrooms.firstWhere(
            (item) => item.id == _selectedClassroomId,
            orElse: () => _classrooms.first,
          )
        : null;
    final subject = _subjects.firstWhere(
      (item) => item.id == _selectedSubjectId,
      orElse: () => _subjects.isNotEmpty
          ? _subjects.first
          : ClassroomSubjectSummary(
              id: '',
              classroomId: '',
              name: '',
              displayOrder: 0,
              themeColor: null,
              iconKey: null,
              teacherUserId: null,
              chapterCount: 0,
              chapters: const [],
            ),
    );

    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ScreenHeader(
            title: 'Learn',
            subtitle: currentClassroom?.name ?? 'Your classroom',
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Good to see you, ${widget.session.user.name}',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Tap a subject, open a chapter, and learn through the video plus the topic cards beneath it.',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFFDDE7F5),
                    height: 1.55,
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (currentClassroom != null) _HeroTag(label: currentClassroom.name),
                    if (subject.name.isNotEmpty) _HeroTag(label: subject.name),
                    if (_selectedChapter != null)
                      _HeroTag(label: _selectedChapter!.chapterKey),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            SurfaceCard(
              child: Text(
                _error!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.coralStrong,
                  fontWeight: FontWeight.w700,
                ),
              ),
            )
          else ...[
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    title: 'Choose Classroom',
                    subtitle: 'You may only see classrooms you joined with this account',
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _classrooms
                        .map(
                          (classroom) => PillChip(
                            label: classroom.name,
                            selected: classroom.id == _selectedClassroomId,
                            onTap: () => _selectClassroom(classroom.id),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (_loadingSubjects)
              const Center(child: CircularProgressIndicator())
            else if (_subjects.isEmpty)
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
                      subtitle: 'Switch between all curriculum areas in this class',
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
                          .toList(),
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
                      title: subject.name.isEmpty ? 'Chapters' : subject.name,
                      subtitle: 'Tap a chapter to open the video lesson',
                      trailing: Text(
                        '${subject.chapterCount} chapters',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...subject.chapters.map(
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
                  ],
                ),
              ),
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
            ],
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

class _HeroTag extends StatelessWidget {
  const _HeroTag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.14),
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
