// Minimal i18n helper — extendable later
const messages: Record<string, string> = {
  contact_us: 'Contact Us',
  contact_sub: 'Get in touch with our support team',
  name: 'Your name',
  email: 'Your email',
  message: 'Message',
  send_message: 'Send Message',
  message_sent: 'Message prepared in your email client.',
  whatsapp_prefill: 'Contact via D-sales Pro',
};

export const t = (key: string) => messages[key] || key;

export default { t };
