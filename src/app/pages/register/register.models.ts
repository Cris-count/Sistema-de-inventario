export interface PublicPlanDto {
  codigo: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  moneda: string;
  maxBodegas: number;
  maxUsuarios: number;
  features: string[];
}

export interface EmpresaForm {
  nombre: string;
  identificacion: string;
  sector: string;
  emailContacto: string;
  telefono: string;
  pais: string;
  ciudad: string;
}

export interface SuperAdminForm {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SendEmailVerificationResponseDto {
  message: string;
  codeExpiresAt: string;
}

export interface VerifyEmailResponseDto {
  verificationToken: string;
  sessionExpiresAt: string;
  message: string;
}

export interface OnboardingRegisterRequestDto {
  planCodigo: string;
  emailVerificationToken: string;
  empresa: {
    nombre: string;
    identificacion: string;
    sector: string;
    emailContacto: string;
    telefono: string;
    pais: string;
    ciudad: string;
  };
  superAdmin: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
}

export interface OnboardingRegisterResponseDto {
  empresaId: number;
  empresaNombre: string;
  usuarioId: number;
  superAdminEmail: string;
  planCodigo: string;
  planNombre: string;
  suscripcionEstado: string;
  empresaEstadoComercial: string;
  activationOutcome: string;
  purchasePin: string | null;
  nextStep: string;
  message: string;
  compraId: number | null;
  pagoId: number | null;
  totpOtpauthUri: string | null;
  totpSecretBase32: string | null;
}

export function emptyEmpresaForm(): EmpresaForm {
  return {
    nombre: '',
    identificacion: '',
    sector: '',
    emailContacto: '',
    telefono: '',
    pais: '',
    ciudad: ''
  };
}

export function emptySuperAdminForm(): SuperAdminForm {
  return {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
}
