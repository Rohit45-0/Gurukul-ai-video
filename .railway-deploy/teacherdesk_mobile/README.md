# TeacherDesk Mobile

Code-first Flutter rebuild of the Rocket-generated teacher experience shown in the screenshots.

## What is included

- dashboard
- attendance marking flow
- classes overview
- exams tracker
- messages inbox
- broadcast bottom sheet
- profile screen
- shared theme, seed data, and reusable widgets

## Project note

This environment does not have the Flutter CLI installed, so the native platform wrappers were not generated here.

To make this runnable on your machine:

1. Open `teacherdesk_mobile`
2. Run:

```bash
flutter create . --platforms=android,ios,web
flutter pub get
flutter run
```

If Flutter has already generated platform folders for you elsewhere, you can copy this `lib/`, `pubspec.yaml`, and `analysis_options.yaml` into that project instead.

## Railway deployment

This repo now includes a Docker-based Railway setup that builds the app as Flutter Web inside Railway and serves it as a static web app.

Relevant files:

- `teacherdesk_mobile/Dockerfile`
- `teacherdesk_mobile/.dockerignore`
- `railway.json`

This is the fastest way to test the whole current app experience without needing Android or iOS packaging first.
