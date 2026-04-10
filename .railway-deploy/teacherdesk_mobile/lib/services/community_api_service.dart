import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/community_models.dart';

class CommunityApiException implements Exception {
  CommunityApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class CommunityApiService {
  const CommunityApiService();

  Future<CommunityOtpRequestResult> requestOtp({
    required String apiBaseUrl,
    required String email,
  }) async {
    final response = await http.post(
      Uri.parse('${_normalize(apiBaseUrl)}/auth/request-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    final data = _decode(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw CommunityApiException(
        _messageFrom(data, 'Unable to request OTP.'),
        statusCode: response.statusCode,
      );
    }

    return CommunityOtpRequestResult(
      expiresInMinutes: data['expiresInMinutes'] as int? ?? 10,
      devOtpCode: data['devOtpCode'] as String?,
      userName: (data['user'] as Map<String, dynamic>?)?['name'] as String?,
      organizationName:
          (data['user'] as Map<String, dynamic>?)?['organizationName'] as String?,
    );
  }

  Future<CommunitySession> verifyOtp({
    required String apiBaseUrl,
    required String email,
    required String code,
  }) async {
    final response = await http.post(
      Uri.parse('${_normalize(apiBaseUrl)}/auth/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'code': code}),
    );

    final data = _decode(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw CommunityApiException(
        _messageFrom(data, 'Unable to verify OTP.'),
        statusCode: response.statusCode,
      );
    }

    final user = data['user'] as Map<String, dynamic>? ?? const {};
    final organization = user['organization'] as Map<String, dynamic>? ?? const {};

    return CommunitySession(
      token: data['token'] as String? ?? '',
      userId: user['id'] as String? ?? '',
      name: user['name'] as String? ?? email,
      email: user['email'] as String? ?? email,
      organizationName: organization['name'] as String? ?? 'Community',
    );
  }

  Future<List<CommunityGroup>> getGroups({
    required String apiBaseUrl,
    required String token,
  }) async {
    final response = await http.get(
      Uri.parse('${_normalize(apiBaseUrl)}/groups'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final data = _decode(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw CommunityApiException(
        _messageFrom(data, 'Unable to load groups.'),
        statusCode: response.statusCode,
      );
    }

    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => CommunityGroup(
            id: item['id'] as String? ?? '',
            name: item['name'] as String? ?? 'Untitled group',
            slug: item['slug'] as String? ?? '',
            visibilityScope: item['visibilityScope'] as String? ?? 'organization',
          ),
        )
        .toList();
  }

  Future<void> createBroadcastPost({
    required String apiBaseUrl,
    required String token,
    required String groupId,
    required String title,
    required String body,
  }) async {
    final response = await http.post(
      Uri.parse('${_normalize(apiBaseUrl)}/groups/$groupId/posts'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'title': title,
        'body': body,
        'attachmentIds': <String>[],
      }),
    );

    final data = _decode(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw CommunityApiException(
        _messageFrom(data, 'Unable to send broadcast.'),
        statusCode: response.statusCode,
      );
    }
  }

  Future<List<CommunityPostSummary>> getGroupPosts({
    required String apiBaseUrl,
    required String token,
    required String groupId,
  }) async {
    final response = await http.get(
      Uri.parse('${_normalize(apiBaseUrl)}/groups/$groupId/posts'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final data = _decode(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw CommunityApiException(
        _messageFrom(data, 'Unable to load recent broadcasts.'),
        statusCode: response.statusCode,
      );
    }

    final items = data['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => CommunityPostSummary(
            id: item['id'] as String? ?? '',
            title: item['title'] as String? ?? 'Untitled broadcast',
            body: item['body'] as String? ?? '',
            authorName:
                (item['author'] as Map<String, dynamic>?)?['name'] as String? ??
                    'Unknown',
            createdAtLabel: item['createdAt'] as String? ?? '',
          ),
        )
        .toList(growable: false);
  }

  Map<String, dynamic> _decode(http.Response response) {
    final body = response.body.trim();
    if (body.isEmpty) {
      return <String, dynamic>{};
    }

    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return <String, dynamic>{'data': decoded};
  }

  String _messageFrom(Map<String, dynamic> data, String fallback) {
    final message = data['message'];
    if (message is String && message.isNotEmpty) {
      return message;
    }
    return fallback;
  }

  String _normalize(String apiBaseUrl) {
    final trimmed = apiBaseUrl.trim().replaceAll(RegExp(r'/$'), '');
    if (trimmed.endsWith('/api/v1')) {
      return trimmed;
    }
    return '$trimmed/api/v1';
  }
}
