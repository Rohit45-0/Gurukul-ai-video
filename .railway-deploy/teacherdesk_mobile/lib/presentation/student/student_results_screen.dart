import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';

class StudentResultsScreen extends StatefulWidget {
  const StudentResultsScreen({
    super.key,
    required this.session,
  });

  final SchoolSession session;

  @override
  State<StudentResultsScreen> createState() => _StudentResultsScreenState();
}

class _StudentResultsScreenState extends State<StudentResultsScreen> {
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
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final dashboard = await _schoolApi.getStudentResults(widget.session.token);
      if (mounted) {
        setState(() => _dashboard = dashboard);
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

  @override
  Widget build(BuildContext context) {
    final dashboard = _dashboard;

    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ScreenHeader(
            title: 'Results',
            subtitle: widget.session.user.name,
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            SurfaceCard(
              child: Text(
                _error!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.coralStrong,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            )
          else if (dashboard == null)
            SurfaceCard(
              child: Text(
                'No results are available yet.',
                style: Theme.of(context).textTheme.bodyMedium,
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
                    'Overall performance',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _StatPill(
                        label: 'Attendance',
                        value: '${dashboard.attendancePercentage}%',
                      ),
                      _StatPill(
                        label: 'Average score',
                        value: dashboard.averageScore.toStringAsFixed(1),
                      ),
                      _StatPill(
                        label: 'Scored tests',
                        value: '${dashboard.scoredCount}',
                      ),
                    ],
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
                    title: 'Subject-wise marks',
                    subtitle: 'This uses the real backend attempt summaries',
                  ),
                  const SizedBox(height: 14),
                  if (dashboard.subjectProgress.isEmpty)
                    Text(
                      'No subject-wise scores yet. Publish and solve a few tests to see trends here.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    ...dashboard.subjectProgress.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _ScoreRow(
                          subject: item.subject,
                          attempts: item.attempts,
                          averageScore: item.averageScore,
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
                    title: 'Recent Results',
                    subtitle: 'Published tests that you have opened or submitted',
                  ),
                  const SizedBox(height: 14),
                  if (dashboard.recentResults.isEmpty)
                    Text(
                      'Your recent attempt history will appear here once you submit a test.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    ...dashboard.recentResults.map(
                      (attempt) => Padding(
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
                                  Expanded(
                                    child: Text(
                                      attempt.assessment?.chapterTitle ??
                                          'Assessment',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyLarge
                                          ?.copyWith(fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                  PillChip(
                                    label: attempt.isSubmitted
                                        ? 'Scored'
                                        : 'In progress',
                                    selected: attempt.isSubmitted,
                                    small: true,
                                    background: attempt.isSubmitted
                                        ? AppColors.mint
                                        : AppColors.sky,
                                    foreground: attempt.isSubmitted
                                        ? AppColors.mintStrong
                                        : AppColors.primary,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '${attempt.score ?? 0}/${attempt.totalMarks} marks',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              const SizedBox(height: 6),
                              if (attempt.submittedAt != null)
                                Text(
                                  _formatDate(attempt.submittedAt!),
                                  style: Theme.of(context).textTheme.bodySmall,
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
                    title: 'Weak topics',
                    subtitle: 'Concepts you may want to revisit in Learn',
                  ),
                  const SizedBox(height: 14),
                  if (dashboard.weakTopics.isEmpty)
                    Text(
                      'Great news, no weak topics have been flagged yet.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: dashboard.weakTopics
                          .map(
                            (item) => PillChip(
                              label: '${item.topic}  •  ${item.misses}',
                              selected: true,
                              small: true,
                              background: AppColors.coral,
                              foreground: AppColors.coralStrong,
                            ),
                          )
                          .toList(),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime dateTime) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final local = dateTime.toLocal();
    return '${local.day} ${months[local.month - 1]} ${local.year}';
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.14),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFFDDE7F5),
                ),
          ),
        ],
      ),
    );
  }
}

class _ScoreRow extends StatelessWidget {
  const _ScoreRow({
    required this.subject,
    required this.attempts,
    required this.averageScore,
  });

  final String subject;
  final int attempts;
  final double averageScore;

  @override
  Widget build(BuildContext context) {
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
                child: Text(
                  subject,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              Text(
                '$averageScore',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '$attempts attempt${attempts == 1 ? '' : 's'}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 10),
          SoftProgressBar(
            progress: (averageScore / 100).clamp(0.0, 1.0),
            color: AppColors.primary,
          ),
        ],
      ),
    );
  }
}
