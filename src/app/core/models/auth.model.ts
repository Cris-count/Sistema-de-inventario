export interface UserSummary {
  id: number;
  email: string;
  nombre: string;
  rolCodigo: string;
  rolNombre: string;
  /** Contexto multi-empresa (opcional para sesiones antiguas en localStorage). */
  empresaId?: number | null;
  empresaNombre?: string | null;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

/**
 * Respuesta real de POST /auth/login (incluye desafío MFA sin accessToken).
 * Debe alinearse con {@code AuthLoginResponse} en el backend.
 */
export interface AuthLoginResponse {
  mfaRequired: boolean;
  challengeToken?: string | null;
  blockCode?: string | null;
  accessToken?: string | null;
  tokenType?: string | null;
  expiresIn?: number | null;
  user?: UserSummary | null;
  refreshToken?: string | null;
  refreshExpiresIn?: number | null;
}
