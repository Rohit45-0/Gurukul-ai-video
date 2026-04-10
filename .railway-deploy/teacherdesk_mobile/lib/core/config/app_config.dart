class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'APP_API_URL',
    defaultValue: '',
  );

  static const String schoolApiUrl = apiBaseUrl;
  static const String communityApiUrl = apiBaseUrl;
}
