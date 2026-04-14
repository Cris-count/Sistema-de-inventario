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
