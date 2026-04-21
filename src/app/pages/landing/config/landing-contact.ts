/**
 * Configuración de contacto comercial para la landing pública.
 *
 * Punto único para ajustar los canales reales (email, WhatsApp, teléfono) sin
 * tocar cada sección. Si no hay backend de formulario todavía, los CTA usan
 * `mailto:` y `wa.me` directamente (honesto, sin inventar endpoints).
 *
 * Para reemplazar los datos: editar sólo este archivo.
 */

export interface LandingContact {
  /** Número en formato internacional sin signos ni espacios (para wa.me). */
  whatsappNumber: string;
  /** Número formateado para mostrar en UI. */
  phoneDisplay: string;
  /** Link tel: con formato internacional. */
  phoneHref: string;
  /** Email comercial. */
  email: string;
  /** Mensaje prellenado de WhatsApp (codificado al usar). */
  whatsappGreeting: string;
}

export const LANDING_CONTACT: LandingContact = {
  whatsappNumber: '573000000000',
  phoneDisplay: '+57 300 000 0000',
  phoneHref: 'tel:+573000000000',
  email: 'hola@cersik.co',
  whatsappGreeting: 'Hola, me gustaría información sobre Cersik.'
};

/** Mensaje corto para topbar / ticker (misma línea comercial en todo el sitio público). */
export const LANDING_COMMERCIAL_TAGLINE =
  'Controla inventario, compras y ventas desde un solo lugar';

/** Construye el link wa.me con mensaje codificado listo para abrir en móvil/desktop. */
export function buildWhatsAppLink(contact: LandingContact = LANDING_CONTACT): string {
  const text = encodeURIComponent(contact.whatsappGreeting);
  return `https://wa.me/${contact.whatsappNumber}?text=${text}`;
}

/** Construye el link mailto con asunto genérico comercial. */
export function buildMailtoLink(contact: LandingContact = LANDING_CONTACT): string {
  const subject = encodeURIComponent('Consulta comercial — Cersik');
  return `mailto:${contact.email}?subject=${subject}`;
}
