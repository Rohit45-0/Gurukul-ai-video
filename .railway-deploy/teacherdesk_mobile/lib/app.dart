import 'package:flutter/material.dart';

import 'models/school_models.dart';
import 'presentation/auth/auth_hub_screen.dart';
import 'presentation/shell/teacher_shell.dart';
import 'presentation/student/student_shell.dart';
import 'theme/app_theme.dart';

class TeacherDeskApp extends StatefulWidget {
  const TeacherDeskApp({super.key});

  @override
  State<TeacherDeskApp> createState() => _TeacherDeskAppState();
}

class _TeacherDeskAppState extends State<TeacherDeskApp> {
  SchoolSession? _session;

  void _handleAuthenticated(SchoolSession session) {
    setState(() => _session = session);
  }

  void _handleSessionUpdated(SchoolSession session) {
    setState(() => _session = session);
  }

  void _signOut() {
    setState(() => _session = null);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TeacherDesk',
      debugShowCheckedModeBanner: false,
      theme: buildTeacherDeskTheme(),
      home: AnimatedSwitcher(
        duration: const Duration(milliseconds: 260),
        child: _session == null
            ? AuthHubScreen(
                key: const ValueKey('auth-hub'),
                onAuthenticated: _handleAuthenticated,
              )
            : (_session!.user.role == SchoolRole.student
                ? StudentShell(
                    key: const ValueKey('student-shell'),
                    session: _session!,
                    onSessionUpdated: _handleSessionUpdated,
                    onSignOut: _signOut,
                  )
                : TeacherShell(
                    key: const ValueKey('teacher-shell'),
                    session: _session!,
                    onSessionUpdated: _handleSessionUpdated,
                    onSignOut: _signOut,
                  )),
      ),
    );
  }
}
