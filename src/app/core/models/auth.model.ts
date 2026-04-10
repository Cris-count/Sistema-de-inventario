export interface UserSummary {
  id: number;
  email: string;
  nombre: string;
  rolCodigo: string;
  rolNombre: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}
