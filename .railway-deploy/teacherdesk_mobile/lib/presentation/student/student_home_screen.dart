import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';

class StudentHomeScreen extends StatefulWidget {
  const StudentHomeScreen({
    super.key,
    required this.session,
    required this.onOpenHomework,
    required this.onOpenResults,
    required this.onOpenInbox,
  });

  final SchoolSession session;
  final VoidCallback onOpenHomework;
  final VoidCallback onOpenResults;
  final VoidCallback onOpenInbox;

  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();
  StudentDashboard? _dashboard;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final dashboard = await _schoolApi.getStudentDashboard(widget.session.token);
      if (!mounted) {
        return;
      }
      setState(() => _dashboard = dashboard);
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

  @override
  Widget build(BuildContext context) {
    final dashboard = _dashboard;
    final classroom = dashboard?.classrooms.isNotEmpty == true
        ? dashboard!.classrooms.first
        : (widget.session.user.classrooms.isNotEmpty
            ? widget.session.user.classrooms.first
            : null);
    final organizationName =
        widget.session.user.organization?.name ?? 'Learning workspace';
    final homeworkDueCount = dashboard == null
        ? 0
        : dashboard.recentAssessments
            .where((item) => item.attemptStatus != 'submitted')
            .length;
    final focusItems = dashboard == null
        ? const <String>[]
        : dashboard.subjectProgress.isNotEmpty
            ? dashboard.subjectProgress
                .take(4)
                .map((item) => item.subject)
                .toList(growable: false)
            : dashboard.recentAssessments
                .take(4)
                .map((item) => item.chapterTitle)
                .toList(growable: false);

    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ScreenHeader(
            title: 'Home',
            subtitle: organizationName,
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
                        'Good morning, ${widget.session.user.name}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Keep homework, videos, tests, and results in one place.',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
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
                          _HeroChip(
                            label: classroom?.rollNumber == null
                                ? 'Student'
                                : 'Roll ${classroom!.rollNumber}',
                          ),
                          _HeroChip(label: '$homeworkDueCount homework due'),
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
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.coralStrong,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 16),
                  SecondaryButton(
                    label: 'Retry',
                    icon: Icons.refresh_rounded,
                    onPressed: _load,
                  ),
                ],
              ),
            )
          else if (dashboard != null) ...[
            Row(
              children: [
                Expanded(
                  child: MetricTile(
                    icon: Icons.assignment_rounded,
                    value: '$homeworkDueCount',
                    title: 'Homework due',
                    subtitle: 'Open work from teachers',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricTile(
                    icon: Icons.calendar_month_rounded,
                    value: '${dashboard.attendancePercentage}%',
                    title: 'Attendance',
                    subtitle: 'Day-wise this month',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: MetricTile(
                    icon: Icons.emoji_events_rounded,
                    value: dashboard.scoredCount == 0
                        ? '--'
                        : dashboard.averageScore.toStringAsFixed(1),
                    title: 'Average',
                    subtitle: 'From scored tests',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricTile(
                    icon: Icons.school_rounded,
                    value: '${dashboard.scoredCount}',
                    title: 'Scored',
                    subtitle: 'Completed attempts',
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
                    title: 'Today\'s Plan',
                    subtitle: 'A quick look at what to focus on next',
                  ),
                  const SizedBox(height: 12),
                  if (focusItems.isEmpty)
                    Text(
                      'Your plan will appear here after the first assessments and subject progress update.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: focusItems
                          .map(
                            (item) => PillChip(
                              label: item,
                              selected: false,
                              small: true,
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
                  const SectionTitle(
                    title: 'Shortcuts',
                    subtitle: 'Jump into homework, results, or your inbox',
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _ShortcutCard(
                          icon: Icons.assignment_rounded,
                          title: 'Homework',
                          subtitle: 'Videos + tests',
                          color: AppColors.sky,
                          onTap: widget.onOpenHomework,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ShortcutCard(
                          icon: Icons.bar_chart_rounded,
                          title: 'Results',
                          subtitle: 'Scores & progress',
                          color: AppColors.mint,
                          onTap: widget.onOpenResults,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: _ShortcutCard(
                      icon: Icons.inbox_rounded,
                      title: 'Inbox',
                      subtitle: 'Notices and shared updates',
                      color: AppColors.amberSoft,
                      onTap: widget.onOpenInbox,
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
                    title: 'Subject Progress',
                    subtitle: 'Based on your scored attempts',
                  ),
                  const SizedBox(height: 14),
                  if (dashboard.subjectProgress.isEmpty)
                    Text(
                      'Your subject-wise progress will appear after the first scored test.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    ...dashboard.subjectProgress.take(4).map(
                          (progress) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Container(
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
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: BoxDecoration(
                                          color: AppColors.sky,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(
                                          Icons.menu_book_rounded,
                                          color: AppColors.primary,
                                          size: 18,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              progress.subject,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodyLarge
                                                  ?.copyWith(fontWeight: FontWeight.w800),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '${progress.attempts} scored attempts',
                                              style: Theme.of(context).textTheme.bodySmall,
                                            ),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        '${progress.averageScore.toStringAsFixed(1)}%',
                                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.primaryDark,
                                            ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  SoftProgressBar(
                                    progress: progress.averageScore / 100,
                                    color: AppColors.primary,
                                  ),
                                ],
                              ),
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
                    title: 'Latest Result',
                    subtitle: 'Shared by the teacher after submission',
                  ),
                  const SizedBox(height: 14),
                  if (dashboard.recentResults.isEmpty)
                    Text(
                      'Results will show up here after you submit a test.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    ...dashboard.recentResults.take(2).map(
                          (attempt) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.background,
                                borderRadius: BorderRadius.circular(22),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: AppColors.mint,
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: const Icon(
                                      Icons.verified_rounded,
                                      color: AppColors.mintStrong,
                                      size: 18,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          attempt.assessment?.chapterTitle ?? 'Assessment',
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodyLarge
                                              ?.copyWith(fontWeight: FontWeight.w800),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          attempt.submittedAt == null
                                              ? attempt.status
                                              : 'Submitted ${_formatDate(attempt.submittedAt!)}',
                                          style: Theme.of(context).textTheme.bodySmall,
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '${attempt.score ?? 0}/${attempt.totalMarks}',
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w800,
                                        ),
                                  ),
                                ],
                              ),
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
                    title: 'Attendance',
                    subtitle: 'One day at a time, no noisy period-wise setup',
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: MetricTile(
                          icon: Icons.fact_check_rounded,
                          value: '${dashboard.attendancePercentage}%',
                          title: 'Monthly',
                          subtitle: 'Attendance rate',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: MetricTile(
                          icon: Icons.groups_rounded,
                          value: '${dashboard.classroomCount}',
                          title: 'Classes',
                          subtitle: 'Joined classrooms',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (dashboard.attendanceSummary.isEmpty)
                    Text(
                      'Once your teacher marks attendance, the latest day-wise record appears here.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: dashboard.attendanceSummary.take(4).map(
                        (item) {
                          final isPresent = item.status == 'present';
                          return PillChip(
                            label: '${_formatDate(item.attendanceDate)} - ${item.status}',
                            selected: isPresent,
                            small: true,
                            background: isPresent ? AppColors.mint : AppColors.coral,
                            foreground:
                                isPresent ? AppColors.mintStrong : AppColors.coralStrong,
                          );
                        },
                      ).toList(growable: false),
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
                    title: 'Latest Notice',
                    subtitle: 'Published tests and classroom updates',
                  ),
                  const SizedBox(height: 14),
                  if (dashboard.recentAssessments.isEmpty)
                    Text(
                      'Your teacher has not published a test yet.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            dashboard.recentAssessments.first.assessment?.chapterTitle ??
                                dashboard.recentAssessments.first.assessmentId,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${dashboard.recentAssessments.first.totalMarks} marks - ${dashboard.recentAssessments.first.status}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              PillChip(
                                label: dashboard.recentAssessments.first.status,
                                selected: true,
                                small: true,
                              ),
                              const Spacer(),
                              SecondaryButton(
                                label: 'Open Homework',
                                icon: Icons.arrow_forward_rounded,
                                onPressed: widget.onOpenHomework,
                              ),
                            ],
                          ),
                        ],
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
                    title: 'Weak Topics',
                    subtitle: 'What to revise next',
                  ),
                  const SizedBox(height: 12),
                  if (dashboard.weakTopics.isEmpty)
                    Text(
                      'Weak topics will appear here after a few scored attempts.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: dashboard.weakTopics.take(6).map(
                        (topic) => PillChip(
                          label: '${topic.topic} - ${topic.misses}',
                          selected: false,
                          small: true,
                        ),
                      ).toList(growable: false),
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

class _ShortcutCard extends StatelessWidget {
  const _ShortcutCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.7),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppColors.primaryDark, size: 20),
            ),
            const SizedBox(height: 14),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}
