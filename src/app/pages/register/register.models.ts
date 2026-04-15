import type { PublicPlanDto } from '../../core/models/public-plan.model';
export type { PublicPlanDto };

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

export interface OnboardingRegisterRequestDto {
  planCodigo: string;
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
