import Foundation
import Security

public struct AuthTokens: Codable, Hashable, Sendable {
    public let accountId: String
    public let accessToken: String
    public let refreshToken: String
    public let expiresAt: Date

    public init(accountId: String, accessToken: String, refreshToken: String, expiresAt: Date) {
        self.accountId = accountId
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.expiresAt = expiresAt
    }
}

public protocol AuthTokenStorage: Sendable {
    func load() throws -> AuthTokens?
    func save(_ tokens: AuthTokens) throws
    func clear() throws
}

public struct KeychainAuthTokenStorage: AuthTokenStorage, @unchecked Sendable {
    private let service: String
    private let account = "authenticated-session"

    public init(service: String) { self.service = service }

    public func load() throws -> AuthTokens? {
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var value: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &value)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = value as? Data else { throw AuthError.secureStorage }
        return try JSONDecoder().decode(AuthTokens.self, from: data)
    }

    public func save(_ tokens: AuthTokens) throws {
        let data = try JSONEncoder().encode(tokens)
        let status = SecItemUpdate(baseQuery as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var item = baseQuery
            item[kSecValueData as String] = data
            item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else { throw AuthError.secureStorage }
        } else if status != errSecSuccess {
            throw AuthError.secureStorage
        }
    }

    public func clear() throws {
        let status = SecItemDelete(baseQuery as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw AuthError.secureStorage }
    }

    private var baseQuery: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    }
}

public enum AuthError: LocalizedError, Sendable {
    case invalidConfiguration
    case invalidCredentials
    case expiredSession
    case secureStorage
    case server(String)
    case networkUnavailable

    public var errorDescription: String? {
        switch self {
        case .invalidConfiguration: return "Release 必须配置 HTTPS CloudBase 网关"
        case .invalidCredentials: return "请输入有效邮箱和至少 8 位密码"
        case .expiredSession: return "登录已失效，请重新登录"
        case .secureStorage: return "无法安全保存登录状态"
        case .server(let message): return message
        case .networkUnavailable: return "网络开小差，请稍后再试"
        }
    }
}

public actor AuthAPIClient {
    private let endpoint: URL
    private let clientVersion: String
    private let session: URLSession

    public init(endpoint: URL, clientVersion: String, session: URLSession = .shared) {
        self.endpoint = endpoint
        self.clientVersion = clientVersion
        self.session = session
    }

    public func login(email: String, password: String) async throws -> AuthTokens {
        try await exchange(action: "auth.loginEmail", payload: EmailPasswordPayload(email: email, password: password))
    }

    public func register(email: String, password: String) async throws -> AuthTokens {
        try await exchange(action: "auth.registerEmail", payload: EmailPasswordPayload(email: email, password: password))
    }

    public func refresh(_ refreshToken: String) async throws -> AuthTokens {
        try await exchange(action: "auth.refresh", payload: RefreshPayload(refreshToken: refreshToken))
    }

    public func requestPasswordReset(email: String) async throws {
        let _: AcceptedResponse = try await request(action: "auth.requestPasswordReset", payload: EmailPayload(email: email))
    }

    public func logout(accessToken: String, refreshToken: String) async throws {
        let _: EmptyAuthResponse = try await request(action: "auth.logout", payload: RefreshPayload(refreshToken: refreshToken), bearer: accessToken)
    }

    private func exchange<Payload: Encodable>(action: String, payload: Payload) async throws -> AuthTokens {
        let response: TokenResponse = try await request(action: action, payload: payload)
        guard !response.accessToken.isEmpty, !response.refreshToken.isEmpty, response.expiresIn > 0 else { throw AuthError.expiredSession }
        return AuthTokens(accountId: response.accountId, accessToken: response.accessToken, refreshToken: response.refreshToken, expiresAt: Date().addingTimeInterval(TimeInterval(response.expiresIn)))
    }

    private func request<Payload: Encodable, Value: Decodable>(action: String, payload: Payload, bearer: String? = nil) async throws -> Value {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let bearer { request.setValue("Bearer \(bearer)", forHTTPHeaderField: "Authorization") }
        request.httpBody = try JSONEncoder().encode(AuthRequest(action: action, requestId: UUID().uuidString, clientVersion: clientVersion, payload: payload))
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw AuthError.networkUnavailable }
            let envelope = try JSONDecoder().decode(AuthEnvelope<Value>.self, from: data)
            guard (200...299).contains(http.statusCode), envelope.code == 0, let value = envelope.data else {
                throw http.statusCode == 401 ? AuthError.expiredSession : AuthError.server(envelope.message)
            }
            return value
        } catch let error as AuthError {
            throw error
        } catch is DecodingError {
            throw AuthError.server("认证服务返回格式不兼容")
        } catch {
            throw AuthError.networkUnavailable
        }
    }
}

public actor AuthSession {
    private let client: AuthAPIClient
    private let storage: any AuthTokenStorage
    private var tokens: AuthTokens?

    public init(client: AuthAPIClient, storage: any AuthTokenStorage) {
        self.client = client
        self.storage = storage
        tokens = try? storage.load()
    }

    public func isAuthenticated() -> Bool { tokens != nil }

    public func login(email: String, password: String) async throws {
        try validate(email: email, password: password)
        try persist(await client.login(email: email, password: password))
    }

    public func register(email: String, password: String) async throws {
        try validate(email: email, password: password)
        try persist(await client.register(email: email, password: password))
    }

    public func requestPasswordReset(email: String) async throws {
        guard email.contains("@"), email.contains(".") else { throw AuthError.invalidCredentials }
        try await client.requestPasswordReset(email: email)
    }

    public func accessToken() async throws -> String {
        guard var current = tokens else { throw AuthError.expiredSession }
        if current.expiresAt.timeIntervalSinceNow <= 60 {
            do {
                current = try await client.refresh(current.refreshToken)
                try persist(current)
            } catch {
                try? storage.clear()
                tokens = nil
                throw AuthError.expiredSession
            }
        }
        return current.accessToken
    }

    public func logout() async {
        if let current = tokens { try? await client.logout(accessToken: current.accessToken, refreshToken: current.refreshToken) }
        try? storage.clear()
        tokens = nil
    }

    private func persist(_ value: AuthTokens) throws {
        try storage.save(value)
        tokens = value
    }

    private func validate(email: String, password: String) throws {
        guard email.contains("@"), email.contains("."), password.count >= 8 else { throw AuthError.invalidCredentials }
    }
}

private struct EmailPasswordPayload: Encodable { let email: String; let password: String }
private struct EmailPayload: Encodable { let email: String }
private struct RefreshPayload: Encodable { let refreshToken: String }
private struct AuthRequest<Payload: Encodable>: Encodable { let action: String; let requestId: String; let clientVersion: String; let payload: Payload }
private struct AuthEnvelope<Value: Decodable>: Decodable { let code: Int; let message: String; let data: Value? }
private struct TokenResponse: Decodable { let accountId: String; let accessToken: String; let refreshToken: String; let expiresIn: Int }
private struct EmptyAuthResponse: Decodable { let revoked: Bool }
private struct AcceptedResponse: Decodable { let accepted: Bool }
