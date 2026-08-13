// Centralized app configuration for contact links.
// Set VITE_SUPPORT_PHONE and VITE_WHATSAPP_NUMBER in Vercel / .env to enable buttons.
const rawPhone = (import.meta as any)?.env?.VITE_SUPPORT_PHONE || '';
const rawWhatsApp = (import.meta as any)?.env?.VITE_WHATSAPP_NUMBER || '';

// Normalize phone (tel: link) and WhatsApp (wa.me) formats.
export const SUPPORT_PHONE = rawPhone; // e.g. +919876543210
export const SUPPORT_PHONE_LINK = rawPhone ? `tel:${rawPhone}` : '';

// WhatsApp number should be in international format without + or spaces (e.g. 919876543210)
const waNumber = rawWhatsApp.replace(/[^0-9]/g, '');
export const WHATSAPP_NUMBER = waNumber;
export const WHATSAPP_LINK = waNumber ? `https://wa.me/${waNumber}` : '';

export default {
  SUPPORT_PHONE,
  SUPPORT_PHONE_LINK,
  WHATSAPP_NUMBER: waNumber,
  WHATSAPP_LINK,
};
