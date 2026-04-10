import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../widgets/app_ui.dart';
import '../messages/messages_screen.dart';
import '../studio/teacher_studio_screen.dart';
import '../teacher/teacher_attendance_screen.dart';
import '../teacher/teacher_home_screen.dart';
import '../teacher/teacher_profile_screen.dart';

class TeacherShell extends StatefulWidget {
  const TeacherShell({
    super.key,
    required this.session,
    required this.onSessionUpdated,
    required this.onSignOut,
  });

  final SchoolSession session;
  final ValueChanged<SchoolSession> onSessionUpdated;
  final VoidCallback onSignOut;

  @override
  State<TeacherShell> createState() => _TeacherShellState();
}

class _TeacherShellState extends State<TeacherShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      TeacherHomeScreen(
        session: widget.session,
        onOpenAttendance: () => setState(() => _index = 1),
        onOpenStudio: () => setState(() => _index = 2),
        onOpenBroadcast: () => setState(() => _index = 3),
      ),
      TeacherAttendanceScreen(session: widget.session),
      TeacherStudioScreen(session: widget.session),
      MessagesScreen(session: widget.session),
      TeacherProfileScreen(
        session: widget.session,
        onSignOut: widget.onSignOut,
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: screens,
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: AppNavBar(
          currentIndex: _index,
          onTap: (value) => setState(() => _index = value),
          items: const [
            NavItemData(icon: Icons.home_rounded, label: 'Home'),
            NavItemData(icon: Icons.fact_check_rounded, label: 'Attendance'),
            NavItemData(icon: Icons.auto_awesome_rounded, label: 'Studio'),
            NavItemData(icon: Icons.campaign_outlined, label: 'Broadcast'),
            NavItemData(icon: Icons.person_outline_rounded, label: 'Profile'),
          ],
        ),
      ),
    );
  }
}
