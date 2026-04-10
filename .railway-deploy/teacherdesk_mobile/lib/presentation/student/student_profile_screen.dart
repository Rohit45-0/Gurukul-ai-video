import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../widgets/app_ui.dart';

class StudentProfileScreen extends StatelessWidget {
  const StudentProfileScreen({
    super.key,
    required this.session,
    required this.onSignOut,
  });

  final SchoolSession session;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    return ScreenContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ScreenHeader(
            title: 'Profile',
            subtitle: 'Student account',
          ),
          const SizedBox(height: 18),
          SurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  session.user.name,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                Text(session.user.email),
                const SizedBox(height: 12),
                if (session.user.organization != null)
                  PillChip(
                    label:
                        'School code: ${session.user.organization!.schoolCode ?? 'Not set'}',
                    selected: true,
                    small: true,
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
                  title: 'Classroom Access',
                  subtitle: 'Linked during student registration',
                ),
                const SizedBox(height: 14),
                ...session.user.classrooms.map(
                  (classroom) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Text(
                      '${classroom.name} - ${classroom.subject ?? 'Subject'}',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          PrimaryButton(
            expanded: true,
            label: 'Sign Out',
            icon: Icons.logout_rounded,
            onPressed: onSignOut,
          ),
        ],
      ),
    );
  }
}
