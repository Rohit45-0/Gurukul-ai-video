import 'package:flutter/material.dart';

import '../../models/school_models.dart';
import '../../services/school_api_service.dart';
import '../../theme/app_theme.dart';

class AuthHubScreen extends StatefulWidget {
  const AuthHubScreen({
    super.key,
    required this.onAuthenticated,
  });

  final ValueChanged<SchoolSession> onAuthenticated;

  @override
  State<AuthHubScreen> createState() => _AuthHubScreenState();
}

class _AuthHubScreenState extends State<AuthHubScreen> {
  final SchoolApiService _schoolApi = const SchoolApiService();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _schoolNameController = TextEditingController();
  final TextEditingController _schoolCodeController = TextEditingController();
  final TextEditingController _classroomNameController = TextEditingController();
  final TextEditingController _classroomCodeController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _rollNumberController = TextEditingController();

  bool _isRegisterMode = false;
  SchoolRole _selectedRole = SchoolRole.teacher;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _schoolNameController.dispose();
    _schoolCodeController.dispose();
    _classroomNameController.dispose();
    _classroomCodeController.dispose();
    _subjectController.dispose();
    _rollNumberController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final session = _isRegisterMode
          ? await _register()
          : await _schoolApi.login(
              email: _emailController.text.trim(),
              password: _passwordController.text,
            );
      widget.onAuthenticated(session);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  Future<SchoolSession> _register() {
    if (_selectedRole == SchoolRole.student) {
      return _schoolApi.registerStudent(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        schoolCode: _schoolCodeController.text.trim(),
        classroomCode: _classroomCodeController.text.trim(),
        rollNumber: _rollNumberController.text.trim(),
      );
    }

    return _schoolApi.registerTeacher(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      schoolName: _schoolNameController.text.trim(),
      schoolCode: _schoolCodeController.text.trim(),
      classroomName: _classroomNameController.text.trim(),
      subject: _subjectController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF8F2E8), Color(0xFFF3E9DD), Color(0xFFF7F2EA)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(18, 20, 18, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        gradient: const LinearGradient(
                          colors: [Color(0xFFEDA62A), Color(0xFF2E6AA2)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: const Icon(
                        Icons.menu_book_rounded,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'TeacherDesk',
                          style: theme.textTheme.titleLarge?.copyWith(
                            color: AppColors.primaryDark,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          'School operations + student learning',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: AppColors.muted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2D6AA1), Color(0xFF225483)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x220F3B68),
                        blurRadius: 30,
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
                        children: const [
                          _HeroTag(label: 'Teacher'),
                          _HeroTag(label: 'Student'),
                          _HeroTag(label: 'Assessments'),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Real registration, real classrooms, real published tests.',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Create a school, register students into a class, publish a chapter test, and see it appear immediately on the student side through the live backend.',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: const Color(0xFFDDE7F5),
                          height: 1.55,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: AppColors.border),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x120F172A),
                        blurRadius: 24,
                        offset: Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _SegmentButton(
                            label: 'Sign In',
                            selected: !_isRegisterMode,
                            onTap: () => setState(() => _isRegisterMode = false),
                          ),
                          _SegmentButton(
                            label: 'Create Account',
                            selected: _isRegisterMode,
                            onTap: () => setState(() => _isRegisterMode = true),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _RoleChip(
                            label: 'Teacher',
                            selected: _selectedRole == SchoolRole.teacher,
                            icon: Icons.school_rounded,
                            onTap: () => setState(() => _selectedRole = SchoolRole.teacher),
                          ),
                          const SizedBox(width: 10),
                          _RoleChip(
                            label: 'Student',
                            selected: _selectedRole == SchoolRole.student,
                            icon: Icons.person_outline_rounded,
                            onTap: () => setState(() => _selectedRole = SchoolRole.student),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      if (_isRegisterMode)
                        _LabeledField(
                          label: 'Full name',
                          child: TextField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              hintText: 'Enter your full name',
                            ),
                          ),
                        ),
                      _LabeledField(
                        label: 'Email',
                        child: TextField(
                          controller: _emailController,
                          decoration: const InputDecoration(
                            hintText: 'you@school.edu',
                          ),
                        ),
                      ),
                      _LabeledField(
                        label: 'Password',
                        child: TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            hintText: 'Minimum 6 characters',
                          ),
                        ),
                      ),
                      if (_isRegisterMode && _selectedRole == SchoolRole.teacher) ...[
                        _LabeledField(
                          label: 'School name',
                          child: TextField(
                            controller: _schoolNameController,
                            decoration: const InputDecoration(
                              hintText: 'Shivaji Vidyalaya',
                            ),
                          ),
                        ),
                        _LabeledField(
                          label: 'School code',
                          child: TextField(
                            controller: _schoolCodeController,
                            decoration: const InputDecoration(
                              hintText: 'SVPUNE',
                            ),
                          ),
                        ),
                        _LabeledField(
                          label: 'Classroom name',
                          child: TextField(
                            controller: _classroomNameController,
                            decoration: const InputDecoration(
                              hintText: 'Std 10 Div A',
                            ),
                          ),
                        ),
                        _LabeledField(
                          label: 'Subject',
                          child: TextField(
                            controller: _subjectController,
                            decoration: const InputDecoration(
                              hintText: 'Science',
                            ),
                          ),
                        ),
                      ],
                      if (_isRegisterMode && _selectedRole == SchoolRole.student) ...[
                        _LabeledField(
                          label: 'School code',
                          child: TextField(
                            controller: _schoolCodeController,
                            decoration: const InputDecoration(
                              hintText: 'Enter school code from teacher',
                            ),
                          ),
                        ),
                        _LabeledField(
                          label: 'Classroom code',
                          child: TextField(
                            controller: _classroomCodeController,
                            decoration: const InputDecoration(
                              hintText: 'Enter classroom code from teacher',
                            ),
                          ),
                        ),
                        _LabeledField(
                          label: 'Roll number',
                          child: TextField(
                            controller: _rollNumberController,
                            decoration: const InputDecoration(
                              hintText: 'Optional',
                            ),
                          ),
                        ),
                      ],
                      if (_error != null) ...[
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.coral,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFF1C5BE)),
                          ),
                          child: Text(
                            _error!,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: AppColors.coralStrong,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _submitting ? null : _submit,
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                          ),
                          child: Text(
                            _submitting
                                ? 'Please wait...'
                                : (_isRegisterMode
                                    ? (_selectedRole == SchoolRole.teacher
                                        ? 'Create Teacher Workspace'
                                        : 'Create Student Account')
                                    : 'Continue to Dashboard'),
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _isRegisterMode
                            ? (_selectedRole == SchoolRole.teacher
                                ? 'Teacher signup creates the school workspace, the first classroom, and the shareable student join codes.'
                                : 'Student signup uses the school code and classroom code shared by the teacher.')
                            : 'Sign in with the email and password you registered with.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.muted,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HeroTag extends StatelessWidget {
  const _HeroTag({required this.label});

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

class _SegmentButton extends StatelessWidget {
  const _SegmentButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : AppColors.background,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: selected ? Colors.white : AppColors.primaryDark,
                  fontWeight: FontWeight.w800,
                ),
          ),
        ),
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip({
    required this.label,
    required this.selected,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.sky : AppColors.background,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? const Color(0xFFBCD8F4) : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: selected ? AppColors.primary : AppColors.muted,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: selected ? AppColors.primary : AppColors.muted,
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  const _LabeledField({
    required this.label,
    required this.child,
  });

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}
