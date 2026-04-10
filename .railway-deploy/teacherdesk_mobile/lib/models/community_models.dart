class CommunityOtpRequestResult {
  const CommunityOtpRequestResult({
    required this.expiresInMinutes,
    this.devOtpCode,
    this.userName,
    this.organizationName,
  });

  final int expiresInMinutes;
  final String? devOtpCode;
  final String? userName;
  final String? organizationName;
}

class CommunitySession {
  const CommunitySession({
    required this.token,
    required this.userId,
    required this.name,
    required this.email,
    required this.organizationName,
  });

  final String token;
  final String userId;
  final String name;
  final String email;
  final String organizationName;
}

class CommunityGroup {
  const CommunityGroup({
    required this.id,
    required this.name,
    required this.slug,
    required this.visibilityScope,
  });

  final String id;
  final String name;
  final String slug;
  final String visibilityScope;
}

class CommunityPostSummary {
  const CommunityPostSummary({
    required this.id,
    required this.title,
    required this.body,
    required this.authorName,
    required this.createdAtLabel,
  });

  final String id;
  final String title;
  final String body;
  final String authorName;
  final String createdAtLabel;
}
