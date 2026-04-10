import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/lesson_models.dart';
import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';

class AssessmentDetailScreen extends StatefulWidget {
  const AssessmentDetailScreen({
    super.key,
    required this.session,
    required this.assessmentId,
    this.assessment,
  });

  final SchoolSession session;
  final String assessmentId;
  final AssessmentSummary? assessment;

  @override
  State<AssessmentDetailScreen> createState() => _AssessmentDetailScreenState();
}

class _AssessmentDetailScreenState extends State<AssessmentDetailScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();
  AssessmentSummary? _assessment;
  AssessmentAttemptSummary? _attempt;
  final Set<String> _savingQuestionIds = <String>{};
  final Map<String, String?> _selectedChoiceIds = <String, String?>{};
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  List<AssessmentQuestion> get _questions {
    final assessmentQuestions = _assessment?.questions ?? const [];
    if (assessmentQuestions.isNotEmpty) {
      return assessmentQuestions;
    }

    final attemptQuestions = _attempt?.answers
            .map((answer) => answer.question)
            .whereType<AssessmentQuestion>()
            .toList(growable: false) ??
        const [];
    return attemptQuestions;
  }

  bool get _isSubmitted => _attempt?.isSubmitted ?? false;

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
      final assessment =
          widget.assessment ?? await _schoolApi.getAssessment(
        token: widget.session.token,
        assessmentId: widget.assessmentId,
      );
      final attempt = await _schoolApi.startAttempt(
        token: widget.session.token,
        assessmentId: widget.assessmentId,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _assessment = assessment;
        _attempt = attempt;
        _selectedChoiceIds
          ..clear()
          ..addEntries(
            attempt.answers.map(
              (answer) => MapEntry(answer.questionId, answer.selectedChoiceId),
            ),
          );
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

  Future<void> _chooseAnswer(
    AssessmentQuestion question,
    String choiceId,
  ) async {
    if (_isSubmitted) {
      return;
    }

    setState(() {
      _selectedChoiceIds[question.id] = choiceId;
      _savingQuestionIds.add(question.id);
    });

    try {
      final currentAttempt = _attempt;
      if (currentAttempt == null) {
        if (mounted) {
          setState(() => _savingQuestionIds.remove(question.id));
        }
        return;
      }

      final savedAttempt = await _schoolApi.saveAttemptAnswer(
        token: widget.session.token,
        attemptId: currentAttempt.id,
        questionId: question.id,
        selectedChoiceId: choiceId,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _attempt = savedAttempt;
        _selectedChoiceIds
          ..clear()
          ..addEntries(
            savedAttempt.answers.map(
              (answer) => MapEntry(answer.questionId, answer.selectedChoiceId),
            ),
          );
      });
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _savingQuestionIds.remove(question.id));
      }
    }
  }

  Future<void> _submit() async {
    if (_attempt == null || _isSubmitted) {
      return;
    }

    setState(() => _submitting = true);

    try {
      final attempt = await _schoolApi.submitAttempt(
        token: widget.session.token,
        attemptId: _attempt!.id,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _attempt = attempt;
        _selectedChoiceIds
          ..clear()
          ..addEntries(
            attempt.answers.map(
              (answer) => MapEntry(answer.questionId, answer.selectedChoiceId),
            ),
          );
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Test submitted successfully.')),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  String? _selectedChoiceIdFor(String questionId) {
    return _selectedChoiceIds[questionId] ??
        _attempt?.answers
            .where((answer) => answer.questionId == questionId)
            .firstOrNull
            ?.selectedChoiceId;
  }

  int get _answeredCount {
    if (_questions.isEmpty) {
      return 0;
    }

    return _questions
        .where((question) => _selectedChoiceIdFor(question.id) != null)
        .length;
  }

  int get _totalMarks => _attempt?.totalMarks ?? _assessment?.totalMarks ?? 0;

  int get _score => _attempt?.score ?? 0;

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) {
      return 'ST';
    }
    if (parts.length == 1) {
      final value = parts.first.trim();
      if (value.isEmpty) {
        return 'ST';
      }
      return value.substring(0, value.length >= 2 ? 2 : 1).toUpperCase();
    }
    final first = parts.first.isEmpty ? 'S' : parts.first[0];
    final last = parts.last.isEmpty ? 'T' : parts.last[0];
    return (first + last).toUpperCase();
  }

  Future<void> _openResource(String? url) async {
    if (url == null || url.isEmpty) {
      return;
    }

    await launchUrl(Uri.parse(url), mode: LaunchMode.platformDefault);
  }

  @override
  Widget build(BuildContext context) {
    final assessment = _assessment;
    final questions = _questions;
    final attempt = _attempt;

    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || assessment == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: SurfaceCard(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _error ?? 'Unable to load the assessment.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    SecondaryButton(
                      label: 'Retry',
                      icon: Icons.refresh_rounded,
                      onPressed: _load,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: ScreenContainer(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ScreenHeader(
              title: assessment.chapterTitle,
              subtitle: assessment.subject,
              leading: AppIconButton(
                icon: Icons.arrow_back_rounded,
                onPressed: () => Navigator.of(context).pop(),
              ),
              trailing: assessment.videoUrl != null
                  ? AppIconButton(
                      icon: Icons.play_circle_outline_rounded,
                      onPressed: () => _openResource(assessment.videoUrl),
                    )
                  : null,
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
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _HeroChip(label: assessment.classroomName ?? 'Classroom'),
                            _HeroChip(label: assessment.difficulty),
                            _HeroChip(
                              label: _isSubmitted
                                  ? 'Submitted'
                                  : '${_answeredCount}/${questions.length} answered',
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          assessment.chapterTitle,
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Answer every question, save as you go, and submit to see your score instantly.',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: const Color(0xFFDDE7F5),
                                height: 1.55,
                              ),
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
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    title: 'Test Overview',
                    subtitle: 'Loaded from the live classroom backend',
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: MetricTile(
                          icon: Icons.quiz_outlined,
                          value: '${questions.length}',
                          title: 'Questions',
                          subtitle: 'Objective only',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: MetricTile(
                          icon: Icons.stacked_bar_chart_rounded,
                          value: _isSubmitted ? '$_score' : '--',
                          title: 'Score',
                          subtitle: 'Out of $_totalMarks',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (assessment.sourcePdfUrl != null)
                    SecondaryButton(
                      label: 'Open Chapter PDF',
                      icon: Icons.picture_as_pdf_rounded,
                      onPressed: () => _openResource(assessment.sourcePdfUrl),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (_isSubmitted)
              SurfaceCard(
                color: AppColors.mint,
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
                        Icons.verified_rounded,
                        color: AppColors.mintStrong,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Submitted successfully',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your teacher can now share the results with the class.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (_isSubmitted) const SizedBox(height: 18),
            if (_isSubmitted && attempt != null)
              SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionTitle(
                      title: 'Result Summary',
                      subtitle: 'Review your answer key and explanations',
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: MetricTile(
                            icon: Icons.emoji_events_rounded,
                            value: '${attempt.score ?? 0}',
                            title: 'Marks',
                            subtitle: 'Total $_totalMarks',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: MetricTile(
                            icon: Icons.timer_outlined,
                            value: attempt.status,
                            title: 'Status',
                            subtitle: attempt.submittedAt == null
                                ? 'Not submitted'
                                : attempt.submittedAt!.toLocal().toString().split('.').first,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            if (_isSubmitted) const SizedBox(height: 18),
            if (questions.isEmpty)
              SurfaceCard(
                child: Text(
                  'No questions were generated for this assessment yet.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              )
            else
              ...questions.asMap().entries.map(
                (entry) {
                  final index = entry.key;
                  final question = entry.value;
                  final selectedChoiceId = _selectedChoiceIdFor(question.id);
                  final selectedChoice = question.options.firstWhere(
                    (choice) => choice.id == selectedChoiceId,
                    orElse: () => const LessonChoice(
                      id: '',
                      label: '',
                      feedback: '',
                      isCorrect: false,
                    ),
                  );
                  final correctChoice = question.options.firstWhere(
                    (choice) => choice.id == question.correctChoiceId,
                    orElse: () => const LessonChoice(
                      id: '',
                      label: '',
                      feedback: '',
                      isCorrect: false,
                    ),
                  );
                  final isCorrect = selectedChoiceId != null &&
                      selectedChoiceId == question.correctChoiceId;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: SurfaceCard(
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
                                alignment: Alignment.center,
                                child: Text(
                                  '${index + 1}',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      question.topicTitle,
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.amber,
                                          ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Question ${index + 1}',
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                            fontWeight: FontWeight.w800,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              if (_savingQuestionIds.contains(question.id))
                                const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              else if (_isSubmitted)
                                PillChip(
                                  label: isCorrect ? 'Correct' : 'Review',
                                  selected: isCorrect,
                                  small: true,
                                  background: isCorrect ? AppColors.mint : AppColors.coral,
                                  foreground:
                                      isCorrect ? AppColors.mintStrong : AppColors.coralStrong,
                                ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            question.prompt,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  height: 1.45,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 14),
                          ...question.options.map(
                            (choice) => Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(20),
                                onTap: _isSubmitted
                                    ? null
                                    : () => _chooseAnswer(question, choice.id),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 180),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 14,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _isSubmitted && choice.id == question.correctChoiceId
                                        ? AppColors.mint.withOpacity(0.55)
                                        : choice.id == selectedChoiceId
                                            ? AppColors.sky
                                            : AppColors.background,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: _isSubmitted && choice.id == question.correctChoiceId
                                          ? AppColors.mintStrong
                                          : choice.id == selectedChoiceId
                                              ? AppColors.primary
                                              : AppColors.border,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 22,
                                        height: 22,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: _isSubmitted &&
                                                    choice.id == question.correctChoiceId
                                                ? AppColors.mintStrong
                                                : choice.id == selectedChoiceId
                                                    ? AppColors.primary
                                                    : AppColors.muted.withOpacity(0.4),
                                            width: 1.8,
                                          ),
                                          color: choice.id == selectedChoiceId
                                              ? (_isSubmitted &&
                                                      choice.id == question.correctChoiceId
                                                  ? AppColors.mintStrong
                                                  : AppColors.primary)
                                              : Colors.transparent,
                                        ),
                                        child: choice.id == selectedChoiceId
                                            ? const Icon(
                                                Icons.check_rounded,
                                                color: Colors.white,
                                                size: 14,
                                              )
                                            : null,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          choice.label,
                                          style:
                                              Theme.of(context).textTheme.bodyLarge?.copyWith(
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                        ),
                                      ),
                                      if (_isSubmitted && choice.id == question.correctChoiceId)
                                        const Icon(
                                          Icons.verified_rounded,
                                          color: AppColors.mintStrong,
                                          size: 18,
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          if (_isSubmitted) ...[
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppColors.background,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isCorrect
                                        ? 'You chose the correct answer.'
                                        : 'Correct answer: ${correctChoice.label}',
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          fontWeight: FontWeight.w800,
                                        ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    question.explanation,
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          height: 1.45,
                                        ),
                                  ),
                                  if (selectedChoice.feedback.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      selectedChoice.feedback,
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: AppColors.primaryDark,
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            const SizedBox(height: 8),
            if (!_isSubmitted)
              SurfaceCard(
                color: AppColors.sky,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Autosave is on',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Your answers are stored live while you work. Submit only when you are ready.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 14),
                    SoftProgressBar(
                      progress: questions.isEmpty ? 0 : _answeredCount / questions.length,
                      color: AppColors.primary,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$_answeredCount / ${questions.length} answered',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 18),
            PrimaryButton(
              expanded: true,
              label: _submitting
                  ? 'Submitting...'
                  : _isSubmitted
                      ? 'Submitted'
                      : 'Submit Test',
              icon: _isSubmitted ? Icons.check_circle_rounded : Icons.send_rounded,
              onPressed: (_isSubmitted || _submitting) ? null : _submit,
            ),
          ],
        ),
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

extension _IterableFirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
