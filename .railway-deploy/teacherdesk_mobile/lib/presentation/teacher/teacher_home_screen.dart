import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';

class TeacherHomeScreen extends StatefulWidget {
  const TeacherHomeScreen({
    super.key,
    required this.session,
    required this.onOpenAttendance,
    required this.onOpenStudio,
    required this.onOpenBroadcast,
  });

  final SchoolSession session;
  final VoidCallback onOpenAttendance;
  final VoidCallback onOpenStudio;
  final VoidCallback onOpenBroadcast;

  @override
  State<TeacherHomeScreen> createState() => _TeacherHomeScreenState();
}

class _TeacherHomeScreenState extends State<TeacherHomeScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();
  TeacherDashboard? _dashboard;
  bool _loading = true;
  String? _error;

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
      final dashboard = await _schoolApi.getTeacherDashboard(widget.session.token);
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dashboard = _dashboard;
    final school = widget.session.user.organization;
    final classroom = widget.session.user.classrooms.isNotEmpty
        ? widget.session.user.classrooms.first
        : null;

    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ScreenHeader(
            title: 'Teacher Workspace',
            subtitle: school?.name ?? 'School dashboard',
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
                  'Good afternoon, ${widget.session.user.name}',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Run attendance, build subject tests, and share results from the same live workspace.',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: const Color(0xFFDDE7F5),
                    height: 1.55,
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _BlueTag(
                      label: 'School code: ${school?.schoolCode ?? 'N/A'}',
                    ),
                    if (classroom != null)
                      _BlueTag(label: 'Class code: ${classroom.joinCode}'),
                    _BlueTag(
                      label: dashboard?.todayAttendancePending == true
                          ? 'Attendance pending'
                          : 'Attendance done',
                    ),
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
                    icon: Icons.groups_rounded,
                    value: '${dashboard.classroomCount}',
                    title: 'Classrooms',
                    subtitle: 'Live from database',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricTile(
                    icon: Icons.menu_book_rounded,
                    value: '${dashboard.subjectCount}',
                    title: 'Subjects',
                    subtitle: 'Multi-subject core',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: MetricTile(
                    icon: Icons.edit_note_rounded,
                    value: '${dashboard.draftCount}',
                    title: 'Draft Tests',
                    subtitle: 'Awaiting publish',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricTile(
                    icon: Icons.task_alt_rounded,
                    value: '${dashboard.publishedCount}',
                    title: 'Published',
                    subtitle: 'Visible to students',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: MetricTile(
                    icon: Icons.groups_2_rounded,
                    value: '${dashboard.recentSubmissionCount}',
                    title: 'Submissions',
                    subtitle: 'New this week',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricTile(
                    icon: Icons.fact_check_rounded,
                    value: dashboard.todayAttendancePending ? 'Pending' : 'Done',
                    title: 'Attendance',
                    subtitle: 'Today\'s status',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            if (dashboard.todayAttendancePending)
              SurfaceCard(
                color: AppColors.amberSoft,
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.75),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.calendar_month_rounded,
                        color: AppColors.amber,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Attendance is pending today',
                            style: theme.textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Mark the day sheet before class ends so parents and students see the correct record.',
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    SecondaryButton(
                      label: 'Mark Now',
                      icon: Icons.arrow_forward_rounded,
                      onPressed: widget.onOpenAttendance,
                    ),
                  ],
                ),
              ),
            if (dashboard.todayAttendancePending) const SizedBox(height: 18),
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    title: 'Quick Actions',
                    subtitle: 'Jump straight to the real work',
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: PrimaryButton(
                          expanded: true,
                          label: 'Attendance',
                          icon: Icons.fact_check_rounded,
                          onPressed: widget.onOpenAttendance,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: SecondaryButton(
                          label: 'Studio',
                          icon: Icons.auto_awesome_rounded,
                          onPressed: widget.onOpenStudio,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SecondaryButton(
                    label: 'Broadcast',
                    icon: Icons.campaign_outlined,
                    background: AppColors.mint,
                    foreground: AppColors.mintStrong,
                    onPressed: widget.onOpenBroadcast,
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
                    title: 'Your Classrooms',
                    subtitle: 'Subjects and chapters are now split cleanly',
                  ),
                  const SizedBox(height: 14),
                  ...dashboard.classrooms.map(
                    (room) => Padding(
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
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.sky,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Icon(
                                Icons.class_rounded,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    room.name,
                                    style: theme.textTheme.bodyLarge?.copyWith(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    [
                                      if (room.subject != null) room.subject!,
                                      '${room.studentCount ?? 0} students',
                                      '${room.subjectCount ?? 0} subjects',
                                      '${room.chapterCount ?? 0} chapters',
                                    ].join(' • '),
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                PillChip(
                                  label: room.joinCode,
                                  selected: true,
                                  small: true,
                                ),
                                const SizedBox(height: 8),
                                if (room.attendancePending == true)
                                  PillChip(
                                    label: 'Attendance pending',
                                    small: true,
                                    background: AppColors.amberSoft,
                                    foreground: AppColors.amber,
                                  )
                                else
                                  PillChip(
                                    label: 'Attendance done',
                                    small: true,
                                    background: AppColors.mint,
                                    foreground: AppColors.mintStrong,
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
}

class _BlueTag extends StatelessWidget {
  const _BlueTag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
