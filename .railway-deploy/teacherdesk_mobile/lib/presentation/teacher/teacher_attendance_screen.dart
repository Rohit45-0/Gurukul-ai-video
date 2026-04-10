import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_ui.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({
    super.key,
    required this.session,
  });

  final SchoolSession session;

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();
  final TextEditingController _searchController = TextEditingController();

  List<SchoolClassroom> _classrooms = const [];
  TeacherAttendanceSnapshot? _snapshot;
  String? _selectedClassroomId;
  bool _loading = true;
  bool _saving = false;
  String? _error;
  String _query = '';
  final Map<String, String> _editedStatuses = <String, String>{};

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      if (!mounted) {
        return;
      }
      setState(() => _query = _searchController.text.trim().toLowerCase());
    });
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final classrooms = await _schoolApi.getTeacherClassrooms(widget.session.token);
      if (classrooms.isEmpty) {
        if (!mounted) {
          return;
        }
        setState(() {
          _classrooms = classrooms;
          _snapshot = null;
          _selectedClassroomId = null;
          _editedStatuses.clear();
        });
        return;
      }

      final selectedClassroomId = classrooms.any(
            (room) => room.id == _selectedClassroomId,
          )
          ? _selectedClassroomId!
          : classrooms.first.id;
      final snapshot = await _schoolApi.getClassroomAttendance(
        token: widget.session.token,
        classroomId: selectedClassroomId,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _classrooms = classrooms;
        _selectedClassroomId = selectedClassroomId;
        _snapshot = snapshot;
        _editedStatuses
          ..clear()
          ..addEntries(
            snapshot.students.map(
              (student) => MapEntry(student.id, student.status),
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

  Future<void> _reloadSelectedClassroom(String? classroomId) async {
    if (classroomId == null) {
      return;
    }
    setState(() {
      _selectedClassroomId = classroomId;
    });
    try {
      final snapshot = await _schoolApi.getClassroomAttendance(
        token: widget.session.token,
        classroomId: classroomId,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _snapshot = snapshot;
        _editedStatuses
          ..clear()
          ..addEntries(
            snapshot.students.map(
              (student) => MapEntry(student.id, student.status),
            ),
          );
      });
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
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
    return '${local.day} ${monthNames[local.month]} ${local.year}';
  }

  int get _presentCount =>
      _editedStatuses.values.where((status) => status == 'present').length;

  int get _absentCount =>
      _editedStatuses.values.where((status) => status == 'absent').length;

  Future<void> _markAllPresent() async {
    if (_snapshot == null) {
      return;
    }
    setState(() {
      for (final student in _snapshot!.students) {
        _editedStatuses[student.id] = 'present';
      }
    });
  }

  Future<void> _save() async {
    final snapshot = _snapshot;
    final classroomId = _selectedClassroomId;
    if (snapshot == null || classroomId == null) {
      return;
    }

    setState(() => _saving = true);

    try {
      final saved = await _schoolApi.saveClassroomAttendance(
        token: widget.session.token,
        classroomId: classroomId,
        attendanceDate: snapshot.attendanceDate.toIso8601String().split('T').first,
        entries: snapshot.students
            .map(
              (student) => <String, String>{
                'studentId': student.id,
                'status': _editedStatuses[student.id] ?? student.status,
              },
            )
            .toList(growable: false),
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _snapshot = saved;
        _editedStatuses
          ..clear()
          ..addEntries(
            saved.students.map(
              (student) => MapEntry(student.id, student.status),
            ),
          );
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Attendance saved successfully.')),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
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
    final snapshot = _snapshot;
    final visibleStudents = snapshot?.students.where((student) {
          final query = _query;
          if (query.isEmpty) {
            return true;
          }
          final roll = student.rollNumber?.toLowerCase() ?? '';
          return student.name.toLowerCase().contains(query) ||
              student.handle.toLowerCase().contains(query) ||
              roll.contains(query);
        }).toList(growable: false) ??
        const <TeacherAttendanceStudent>[];

    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ScreenHeader(
            title: 'Attendance',
            subtitle: 'Day-wise classroom attendance',
          ),
          const SizedBox(height: 16),
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
          else if (_classrooms.isEmpty)
            SurfaceCard(
              child: Text(
                'No classrooms are linked to this teacher account yet.',
                style: Theme.of(context).textTheme.bodyLarge,
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
                    classroom.name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Mark attendance, edit it, and save the day sheet in one clean screen.',
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
                      _HeaderChip(label: snapshot?.attendanceKey ?? 'today'),
                      _HeaderChip(label: _formatDate(snapshot?.attendanceDate ?? DateTime.now())),
                      _HeaderChip(label: classroom.joinCode),
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
                    title: 'Classroom',
                    subtitle: 'Pick the class you want to mark',
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    value: _selectedClassroomId,
                    decoration: const InputDecoration(
                      labelText: 'Classroom',
                    ),
                    items: _classrooms
                        .map(
                          (room) => DropdownMenuItem<String>(
                            value: room.id,
                            child: Text(room.name),
                          ),
                        )
                        .toList(growable: false),
                    onChanged: _reloadSelectedClassroom,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: MetricTile(
                          icon: Icons.check_circle_rounded,
                          value: '$_presentCount',
                          title: 'Present',
                          subtitle: 'Marked today',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: MetricTile(
                          icon: Icons.cancel_rounded,
                          value: '$_absentCount',
                          title: 'Absent',
                          subtitle: 'Marked today',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: MetricTile(
                          icon: Icons.people_alt_rounded,
                          value: '${snapshot?.students.length ?? 0}',
                          title: 'Students',
                          subtitle: 'In the current class',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: MetricTile(
                          icon: Icons.event_available_rounded,
                          value: snapshot?.session == null ? 'No' : 'Yes',
                          title: 'Saved',
                          subtitle: 'Session exists',
                        ),
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
                    title: 'Search Students',
                    subtitle: 'Find by name, handle, or roll number',
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: 'Search name or roll number',
                      prefixIcon: Icon(Icons.search_rounded),
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
                    title: 'Mark Attendance',
                    subtitle: 'Tap a row and switch present or absent',
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      SecondaryButton(
                        label: 'Mark All Present',
                        icon: Icons.check_rounded,
                        onPressed: _markAllPresent,
                      ),
                      SecondaryButton(
                        label: 'Refresh',
                        icon: Icons.refresh_rounded,
                        onPressed: _load,
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (visibleStudents.isEmpty)
                    Text(
                      'No matching students found.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    )
                  else
                    ...visibleStudents.map(
                      (student) {
                        final status = _editedStatuses[student.id] ?? student.status;
                        final isPresent = status == 'present';
                        return Padding(
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
                                AppAvatar(
                                  initials: _studentInitials(student.name),
                                  size: 42,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        student.name,
                                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                              fontWeight: FontWeight.w800,
                                            ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        [
                                          if (student.rollNumber != null) 'Roll ${student.rollNumber}',
                                          student.handle,
                                        ].join(' • '),
                                        style: Theme.of(context).textTheme.bodySmall,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Wrap(
                                      spacing: 8,
                                      children: [
                                        PillChip(
                                          label: 'P',
                                          selected: isPresent,
                                          small: true,
                                          background:
                                              isPresent ? AppColors.mint : AppColors.background,
                                          foreground: isPresent
                                              ? AppColors.mintStrong
                                              : AppColors.muted,
                                          onTap: () {
                                            setState(() {
                                              _editedStatuses[student.id] = 'present';
                                            });
                                          },
                                        ),
                                        PillChip(
                                          label: 'A',
                                          selected: !isPresent,
                                          small: true,
                                          background:
                                              !isPresent ? AppColors.coral : AppColors.background,
                                          foreground: !isPresent
                                              ? AppColors.coralStrong
                                              : AppColors.muted,
                                          onTap: () {
                                            setState(() {
                                              _editedStatuses[student.id] = 'absent';
                                            });
                                          },
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      status,
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            fontWeight: FontWeight.w800,
                                            color: isPresent
                                                ? AppColors.mintStrong
                                                : AppColors.coralStrong,
                                          ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            PrimaryButton(
              expanded: true,
              label: _saving ? 'Saving...' : 'Submit Attendance',
              icon: Icons.save_rounded,
              onPressed: _saving ? null : _save,
            ),
          ],
        ],
      ),
    );
  }

  String _studentInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) {
      return 'ST';
    }
    if (parts.length == 1) {
      final value = parts.first.trim();
      return value.substring(0, value.length >= 2 ? 2 : 1).toUpperCase();
    }
    return ('${parts.first[0]}${parts.last[0]}').toUpperCase();
  }
}

class _HeaderChip extends StatelessWidget {
  const _HeaderChip({required this.label});

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
