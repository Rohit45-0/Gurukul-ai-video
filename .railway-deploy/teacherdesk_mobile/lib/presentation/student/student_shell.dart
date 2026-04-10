import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../widgets/app_ui.dart';
import 'student_home_screen.dart';
import 'student_homework_screen.dart';
import 'student_results_screen.dart';
import 'student_profile_screen.dart';
import '../messages/messages_screen.dart';

class StudentShell extends StatefulWidget {
  const StudentShell({
    super.key,
    required this.session,
    required this.onSessionUpdated,
    required this.onSignOut,
  });

  final SchoolSession session;
  final ValueChanged<SchoolSession> onSessionUpdated;
  final VoidCallback onSignOut;

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends State<StudentShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      StudentHomeScreen(
        session: widget.session,
        onOpenHomework: () => setState(() => _index = 1),
        onOpenResults: () => setState(() => _index = 2),
        onOpenInbox: () => setState(() => _index = 3),
      ),
      StudentHomeworkScreen(session: widget.session),
      StudentResultsScreen(session: widget.session),
      MessagesScreen(session: widget.session),
      StudentProfileScreen(
        session: widget.session,
        onSignOut: widget.onSignOut,
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: SafeArea(
        top: false,
        child: AppNavBar(
          currentIndex: _index,
          onTap: (value) => setState(() => _index = value),
          items: const [
            NavItemData(icon: Icons.home_rounded, label: 'Home'),
            NavItemData(icon: Icons.assignment_rounded, label: 'Homework'),
            NavItemData(icon: Icons.bar_chart_rounded, label: 'Results'),
            NavItemData(icon: Icons.inbox_rounded, label: 'Inbox'),
            NavItemData(icon: Icons.person_outline_rounded, label: 'Profile'),
          ],
        ),
      ),
    );
  }
}
