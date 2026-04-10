import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';

import '../../models/lesson_models.dart';
import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';

enum LessonCoachMode { simple, analogy, mistake }

class LessonScreen extends StatefulWidget {
  const LessonScreen({
    super.key,
    required this.session,
    required this.chapterKey,
    this.onBack,
  });

  final SchoolSession session;
  final String chapterKey;
  final VoidCallback? onBack;

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();
  final ScrollController _topicScrollController = ScrollController();

  LessonChapter? _chapter;
  VideoPlayerController? _videoController;
  int _topicIndex = 0;
  LessonCoachMode _coachMode = LessonCoachMode.simple;
  String? _quizChoiceId;
  String? _scenarioChoiceId;
  bool _loading = true;
  String? _error;

  LessonTopic? get _topic {
    final chapter = _chapter;
    if (chapter == null || chapter.topics.isEmpty) {
      return null;
    }

    final safeIndex = _topicIndex.clamp(0, chapter.topics.length - 1).toInt();
    return chapter.topics[safeIndex];
  }

  @override
  void initState() {
    super.initState();
    _loadLesson();
  }

  @override
  void dispose() {
    _topicScrollController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _loadLesson() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final chapter = await _schoolApi.getLesson(
        token: widget.session.token,
        chapterKey: widget.chapterKey,
      );

      final controller = VideoPlayerController.networkUrl(Uri.parse(chapter.videoUrl));
      await controller.initialize();

      controller.addListener(() {
        if (!mounted || _chapter == null) {
          return;
        }
        final seconds = controller.value.position.inSeconds;
        final nextIndex = _chapter!.topics.lastIndexWhere(
          (topic) => seconds >= topic.startSeconds,
        );
        final safeIndex = nextIndex < 0 ? 0 : nextIndex;
        if (safeIndex != _topicIndex) {
          setState(() {
            _topicIndex = safeIndex;
            _quizChoiceId = null;
            _scenarioChoiceId = null;
            _coachMode = LessonCoachMode.simple;
          });
          _scrollTopics(safeIndex);
        }
      });

      setState(() {
        _chapter = chapter;
        _videoController = controller;
      });
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _jumpToTopic(int index) async {
    if (_chapter == null || _videoController == null) {
      return;
    }

    final topic = _chapter!.topics[index];
    await _videoController!.seekTo(Duration(seconds: topic.startSeconds));
    setState(() {
      _topicIndex = index;
      _quizChoiceId = null;
      _scenarioChoiceId = null;
      _coachMode = LessonCoachMode.simple;
    });
    _scrollTopics(index);
  }

  void _scrollTopics(int index) {
    if (!_topicScrollController.hasClients) {
      return;
    }
    const itemExtent = 256.0;
    final target = (index * itemExtent) - 18;
    _topicScrollController.animateTo(
      target.clamp(0.0, _topicScrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
    );
  }

  LessonChoice? _selectedChoice(List<LessonChoice> options, String? id) {
    if (id == null) {
      return null;
    }
    for (final option in options) {
      if (option.id == id) {
        return option;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final chapter = _chapter;
    final topic = _topic;

    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || chapter == null || topic == null) {
      return Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                _error ?? 'Unable to load the lesson.',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      );
    }

    final video = _videoController;
    final quizChoice = _selectedChoice(topic.quiz.options, _quizChoiceId);
    final scenarioChoice = _selectedChoice(topic.scenario.options, _scenarioChoiceId);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ScreenHeader(
                title: chapter.chapterTitle,
                subtitle: chapter.subjectLine,
                leading: widget.onBack == null
                    ? null
                    : AppIconButton(
                        icon: Icons.arrow_back_rounded,
                        onPressed: widget.onBack,
                      ),
                trailing: AppIconButton(
                  icon: Icons.description_outlined,
                  onPressed: () => launchUrl(
                    Uri.parse(chapter.sourcePdfUrl),
                    mode: LaunchMode.platformDefault,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                chapter.summary,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: AppColors.muted,
                  height: 1.55,
                ),
              ),
              const SizedBox(height: 18),
              SurfaceCard(
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.mint,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.menu_book_rounded,
                        color: AppColors.mintStrong,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            chapter.sourceName,
                            style: theme.textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Syllabus source for lesson + assessments',
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              if (video != null && video.value.isInitialized)
                SurfaceCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(22),
                        child: AspectRatio(
                          aspectRatio: video.value.aspectRatio,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              VideoPlayer(video),
                              Positioned(
                                left: 14,
                                top: 14,
                                child: PillChip(
                                  label: '${topic.timestampLabel} - ${topic.title}',
                                  selected: true,
                                  icon: Icons.play_circle_fill_rounded,
                                ),
                              ),
                              Center(
                                child: GestureDetector(
                                  onTap: () async {
                                    if (video.value.isPlaying) {
                                      await video.pause();
                                    } else {
                                      await video.play();
                                    }
                                    setState(() {});
                                  },
                                  child: Container(
                                    width: 84,
                                    height: 84,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.92),
                                      shape: BoxShape.circle,
                                      boxShadow: const [
                                        BoxShadow(
                                          color: Color(0x220F172A),
                                          blurRadius: 20,
                                          offset: Offset(0, 10),
                                        ),
                                      ],
                                    ),
                                    child: Icon(
                                      video.value.isPlaying
                                          ? Icons.pause_rounded
                                          : Icons.play_arrow_rounded,
                                      size: 42,
                                      color: AppColors.primaryDark,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        topic.mission,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: AppColors.primaryDark,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Slider(
                        value: video.value.position.inMilliseconds
                            .clamp(0, video.value.duration.inMilliseconds)
                            .toDouble(),
                        max: video.value.duration.inMilliseconds == 0
                            ? 1
                            : video.value.duration.inMilliseconds.toDouble(),
                        onChanged: (value) async {
                          await video.seekTo(Duration(milliseconds: value.round()));
                        },
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 18),
              Text(
                'Chapter Topics',
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 58,
                child: ListView.separated(
                  controller: _topicScrollController,
                  scrollDirection: Axis.horizontal,
                  itemBuilder: (context, index) {
                    final item = chapter.topics[index];
                    return GestureDetector(
                      onTap: () => _jumpToTopic(index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        width: 244,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: index == _topicIndex ? AppColors.sky : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: index == _topicIndex
                                ? const Color(0xFFBCD8F4)
                                : AppColors.border,
                          ),
                        ),
                        child: Row(
                          children: [
                            PillChip(
                              label: item.timestampLabel,
                              selected: index == _topicIndex,
                              small: true,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                item.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemCount: chapter.topics.length,
                ),
              ),
              const SizedBox(height: 18),
              SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      topic.title,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      topic.sourceAnchor,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      topic.recap,
                      style: theme.textTheme.bodyLarge?.copyWith(height: 1.55),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        topic.observation,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppColors.muted,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              _QuestionCard(
                title: 'Quick Quiz',
                accent: AppColors.coralStrong,
                prompt: topic.quiz.prompt,
                options: topic.quiz.options,
                selectedId: _quizChoiceId,
                onSelect: (value) => setState(() => _quizChoiceId = value),
                feedback: quizChoice?.feedback,
                correct: quizChoice?.isCorrect,
              ),
              const SizedBox(height: 18),
              SurfaceCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0EAFE),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.auto_awesome_outlined,
                            color: Color(0xFF7657D6),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'AI Explanation',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _CoachChip(
                          label: 'Explain Simply',
                          selected: _coachMode == LessonCoachMode.simple,
                          onTap: () =>
                              setState(() => _coachMode = LessonCoachMode.simple),
                        ),
                        _CoachChip(
                          label: 'Give Analogy',
                          selected: _coachMode == LessonCoachMode.analogy,
                          onTap: () =>
                              setState(() => _coachMode = LessonCoachMode.analogy),
                        ),
                        _CoachChip(
                          label: 'Why Wrong?',
                          selected: _coachMode == LessonCoachMode.mistake,
                          onTap: () =>
                              setState(() => _coachMode = LessonCoachMode.mistake),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        switch (_coachMode) {
                          LessonCoachMode.simple => topic.coach.simple,
                          LessonCoachMode.analogy => topic.coach.analogy,
                          LessonCoachMode.mistake => topic.coach.mistake,
                        },
                        style: theme.textTheme.bodyLarge?.copyWith(
                          height: 1.6,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              _QuestionCard(
                title: 'Real-life Application',
                accent: AppColors.amber,
                prompt: topic.scenario.prompt,
                options: topic.scenario.options,
                selectedId: _scenarioChoiceId,
                onSelect: (value) => setState(() => _scenarioChoiceId = value),
                feedback: scenarioChoice?.feedback,
                correct: scenarioChoice?.isCorrect,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.title,
    required this.accent,
    required this.prompt,
    required this.options,
    required this.selectedId,
    required this.onSelect,
    this.feedback,
    this.correct,
  });

  final String title;
  final Color accent;
  final String prompt;
  final List<LessonChoice> options;
  final String? selectedId;
  final ValueChanged<String> onSelect;
  final String? feedback;
  final bool? correct;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              color: accent,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            prompt,
            style: theme.textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w800,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          ...options.map(
            (option) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                onTap: () => onSelect(option.id),
                borderRadius: BorderRadius.circular(18),
                child: Ink(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: selectedId == option.id ? AppColors.sky : AppColors.background,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: selectedId == option.id
                          ? const Color(0xFFBCD8F4)
                          : AppColors.border,
                    ),
                  ),
                  child: Text(
                    option.label,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (feedback != null) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: correct == true ? AppColors.mint : AppColors.coral,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Text(
                feedback!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: correct == true ? AppColors.mintStrong : AppColors.coralStrong,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CoachChip extends StatelessWidget {
  const _CoachChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.sky : AppColors.background,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? const Color(0xFFBCD8F4) : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: selected ? AppColors.primary : AppColors.muted,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
    );
  }
}
