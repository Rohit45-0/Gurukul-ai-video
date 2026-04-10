import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color background = Color(0xFFF7F2EA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color primary = Color(0xFF235A8B);
  static const Color primaryDark = Color(0xFF173B63);
  static const Color amber = Color(0xFFF2AF37);
  static const Color amberSoft = Color(0xFFFFF2CC);
  static const Color mint = Color(0xFFD8F6E6);
  static const Color mintStrong = Color(0xFF2E9B78);
  static const Color sky = Color(0xFFDDEEFF);
  static const Color coral = Color(0xFFF8DDD8);
  static const Color coralStrong = Color(0xFFD9675C);
  static const Color ink = Color(0xFF233145);
  static const Color muted = Color(0xFF738196);
  static const Color border = Color(0xFFE8DDCF);
  static const Color track = Color(0xFFEDE6DA);
}

ThemeData buildTeacherDeskTheme() {
  final baseText = GoogleFonts.nunitoSansTextTheme();
  final heading = GoogleFonts.soraTextTheme(baseText);

  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      surface: AppColors.surface,
      error: AppColors.coralStrong,
    ),
    textTheme: baseText.copyWith(
      headlineSmall: heading.headlineSmall?.copyWith(
        color: AppColors.ink,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: heading.titleLarge?.copyWith(
        color: AppColors.ink,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: heading.titleMedium?.copyWith(
        color: AppColors.ink,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: baseText.bodyLarge?.copyWith(color: AppColors.ink),
      bodyMedium: baseText.bodyMedium?.copyWith(color: AppColors.ink),
      bodySmall: baseText.bodySmall?.copyWith(color: AppColors.muted),
      labelLarge: baseText.labelLarge?.copyWith(fontWeight: FontWeight.w700),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      foregroundColor: AppColors.ink,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      color: AppColors.surface,
      shadowColor: const Color(0x14000000),
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF4EFE6),
      hintStyle: const TextStyle(color: AppColors.muted),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.3),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.primaryDark,
      contentTextStyle: GoogleFonts.nunitoSans(
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
      behavior: SnackBarBehavior.floating,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.border,
      thickness: 1,
      space: 1,
    ),
  );
}
