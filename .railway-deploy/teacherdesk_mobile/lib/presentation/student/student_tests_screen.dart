import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';
import 'assessment_detail_screen.dart';

class StudentTestsScreen extends StatefulWidget {
  const StudentTestsScreen({
    super.key,
    required this.session,
  });

  final SchoolSession session;

  @override
  State<StudentTestsScreen> createState() => _StudentTestsScreenState();
}

class _StudentTestsScreenState extends State<StudentTestsScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();
  List<AssessmentSummary> _assessments = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await _schoolApi.getStudentAssessments(widget.session.token);
      if (!mounted) {
        return;
      }
      setState(() => _assessments = items);
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

  String _actionLabel(AssessmentSummary assessment) {
    if (assessment.attemptStatus == 'submitted') {
      return 'Review Score';
    }
    if (assessment.attemptStatus == 'in_progress') {
      return 'Continue Test';
    }
    return 'Open Test';
  }

  @override
  Widget build(BuildContext context) {
    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ScreenHeader(
            title: 'Published Tests',
            subtitle: 'Tap a test to answer questions and see your score',
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_error!),
                  const SizedBox(height: 16),
                  SecondaryButton(
                    label: 'Retry',
                    icon: Icons.refresh_rounded,
                    onPressed: _load,
                  ),
                ],
              ),
            )
          else if (_assessments.isEmpty)
            SurfaceCard(
              child: Text(
                'No tests are published for your classroom yet.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            )
          else
            ..._assessments.map(
              (assessment) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: SurfaceCard(
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
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w800,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  assessment.classroomName ?? 'Your classroom',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          PillChip(
                            label: assessment.attemptStatus ?? assessment.status,
                            selected: assessment.isPublished,
                            small: true,
                            background: assessment.attemptStatus == 'submitted'
                                ? AppColors.mint
                                : assessment.isPublished
                                    ? AppColors.sky
                                    : AppColors.amberSoft,
                            foreground: assessment.attemptStatus == 'submitted'
                                ? AppColors.mintStrong
                                : assessment.isPublished
                                    ? AppColors.primary
                                    : AppColors.amber,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${assessment.subject} • ${assessment.questionCount} questions • ${assessment.totalMarks} marks',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      if (assessment.studentScore != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.background,
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
                                  'Score ${assessment.studentScore}/${assessment.totalMarks}',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
                          PillChip(label: assessment.difficulty, small: true),
                          const Spacer(),
                          PrimaryButton(
                            label: _actionLabel(assessment),
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
                                await _load();
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
    );
  }
}
