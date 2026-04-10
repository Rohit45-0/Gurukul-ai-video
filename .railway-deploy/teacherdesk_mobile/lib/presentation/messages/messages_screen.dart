import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../models/community_models.dart';
import '../../models/school_models.dart';
import '../../services/community_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({
    super.key,
    required this.session,
  });

  final SchoolSession session;

  @override
  State<MessagesScreen> createState() => MessagesScreenState();
}

class MessagesScreenState extends State<MessagesScreen> {
  final CommunityApiService _communityApi = const CommunityApiService();
  final TextEditingController _messageController = TextEditingController();

  List<CommunityGroup> _groups = const [];
  List<CommunityPostSummary> _posts = const [];
  String? _selectedGroupId;
  bool _loading = true;
  bool _sending = false;
  String? _error;

  String get _apiBaseUrl => AppConfig.communityApiUrl;

  CommunityGroup? get _selectedGroup {
    for (final group in _groups) {
      if (group.id == _selectedGroupId) {
        return group;
      }
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _messageController.addListener(_handleDraftChanged);
    _load();
  }

  @override
  void dispose() {
    _messageController.removeListener(_handleDraftChanged);
    _messageController.dispose();
    super.dispose();
  }

  void _handleDraftChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final groups = await _communityApi.getGroups(
        apiBaseUrl: _apiBaseUrl,
        token: widget.session.token,
      );

      final selectedGroupId =
          groups.isNotEmpty ? (_selectedGroupId ?? groups.first.id) : null;
      List<CommunityPostSummary> posts = const [];
      if (selectedGroupId != null) {
        posts = await _communityApi.getGroupPosts(
          apiBaseUrl: _apiBaseUrl,
          token: widget.session.token,
          groupId: selectedGroupId,
        );
      }

      if (!mounted) {
        return;
      }

      setState(() {
        _groups = groups;
        _selectedGroupId = selectedGroupId;
        _posts = posts;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _error = error.toString());
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _refreshPosts() async {
    if (_selectedGroupId == null) {
      return;
    }

    try {
      final posts = await _communityApi.getGroupPosts(
        apiBaseUrl: _apiBaseUrl,
        token: widget.session.token,
        groupId: _selectedGroupId!,
      );
      if (mounted) {
        setState(() => _posts = posts);
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString());
      }
    }
  }

  Future<void> _sendBroadcast() async {
    if (_selectedGroupId == null) {
      _show('No delivery group is available for this school yet.');
      return;
    }

    setState(() => _sending = true);

    try {
      await _communityApi.createBroadcastPost(
        apiBaseUrl: _apiBaseUrl,
        token: widget.session.token,
        groupId: _selectedGroupId!,
        title: 'Broadcast Notice',
        body: _messageController.text.trim(),
      );
      _messageController.clear();
      await _refreshPosts();
      _show('Broadcast sent successfully.');
    } catch (error) {
      _show(error.toString());
    } finally {
      if (mounted) {
        setState(() => _sending = false);
      }
    }
  }

  void _show(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final schoolName =
        widget.session.user.organization?.name ?? 'School workspace';
    final selectedGroup = _selectedGroup;

    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ScreenHeader(
            title: 'Broadcast Center',
            subtitle: schoolName,
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
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _HeroChip(label: widget.session.user.name),
                    _HeroChip(label: '${_groups.length} delivery groups'),
                    if (selectedGroup != null) _HeroChip(label: selectedGroup.name),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  'School notices, now connected to the same live teacher session.',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 10),
                Text(
                  'No second login, no fake inbox. This tab uses the same backend as sign-in, classrooms, and published tests.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: const Color(0xFFDDE7F5),
                        height: 1.55,
                      ),
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
                          fontWeight: FontWeight.w800,
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
          else ...[
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    title: 'Compose Official Notice',
                    subtitle: 'Choose a group and send a real backend broadcast',
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedGroupId,
                    decoration: const InputDecoration(labelText: 'Delivery group'),
                    items: _groups
                        .map(
                          (group) => DropdownMenuItem<String>(
                            value: group.id,
                            child: Text(group.name),
                          ),
                        )
                        .toList(),
                    onChanged: _groups.isEmpty
                        ? null
                        : (value) async {
                            setState(() => _selectedGroupId = value);
                            await _refreshPosts();
                          },
                  ),
                  const SizedBox(height: 12),
                  if (selectedGroup != null)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        PillChip(label: selectedGroup.slug, small: true),
                        PillChip(
                          label: selectedGroup.visibilityScope,
                          selected: true,
                          small: true,
                        ),
                      ],
                    ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _messageController,
                    minLines: 4,
                    maxLines: 6,
                    decoration: const InputDecoration(
                      labelText: 'Broadcast message',
                      hintText: 'Type a class notice, homework alert, or parent update',
                    ),
                  ),
                  const SizedBox(height: 16),
                  PrimaryButton(
                    expanded: true,
                    label: _sending ? 'Sending...' : 'Send Broadcast',
                    icon: Icons.campaign_outlined,
                    onPressed: _sending ||
                            _selectedGroupId == null ||
                            _messageController.text.trim().isEmpty
                        ? null
                        : _sendBroadcast,
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
                    title: 'Recent Notices',
                    subtitle: 'Latest posts from the selected school delivery group',
                  ),
                  const SizedBox(height: 14),
                  if (_groups.isEmpty)
                    Text(
                      'No delivery groups are ready yet. The backend should create default notice groups for each school.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else if (_posts.isEmpty)
                    Text(
                      'No notices yet. Send the first broadcast for this group.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    ..._posts.map(
                      (post) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                      post.title,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyLarge
                                          ?.copyWith(fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                  Text(
                                    post.createdAtLabel,
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                post.body,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      height: 1.5,
                                    ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                post.authorName,
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppColors.primary,
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
