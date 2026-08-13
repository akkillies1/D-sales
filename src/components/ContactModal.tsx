import React, { useState } from 'react';
import { X, Phone, MessageCircle } from 'lucide-react';
import { SUPPORT_PHONE, SUPPORT_PHONE_LINK, WHATSAPP_LINK } from '../config';
import { formatPhone } from '../utils/phone';
import { t } from '../i18n';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
	e.preventDefault();
	// No backend: open mailto as fallback
	const subject = encodeURIComponent('D-sales Pro Contact Form');
	const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
	window.location.href = `mailto:support@dcode.com?subject=${subject}&body=${body}`;
	setStatus('sent');
	setTimeout(() => {
	  setStatus(null);
	  onClose();
	}, 1200);
  };

  const handleWhatsApp = () => {
	const text = encodeURIComponent(`${t('whatsapp_prefill')}\nName: ${name}\nEmail: ${email}\n${message}`);
	if (WHATSAPP_LINK) {
	  // WHATSAPP_LINK is https://wa.me/<number>
	  window.open(`${WHATSAPP_LINK}?text=${text}`, '_blank');
	}
  };

  return (
	<div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
	  <div className="w-full max-w-md bg-[#0c0c0d] border border-zinc-800 rounded-2xl p-5 text-sm">
		<div className="flex items-start justify-between mb-3">
		  <div>
			<h3 className="text-lg font-bold">{t('contact_us')}</h3>
			<p className="text-xs text-zinc-400">{t('contact_sub')}</p>
		  </div>
		  <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
			<X className="w-5 h-5" />
		  </button>
		</div>

		<form onSubmit={handleSubmit} className="space-y-3">
		  <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name')} className="w-full bg-black/40 border border-zinc-800 rounded px-3 py-2 text-zinc-200" />
		  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} className="w-full bg-black/40 border border-zinc-800 rounded px-3 py-2 text-zinc-200" />
		  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('message')} rows={4} className="w-full bg-black/40 border border-zinc-800 rounded px-3 py-2 text-zinc-200" />

		  <div className="flex items-center justify-between gap-2">
			<button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-white">{t('send_message')}</button>
			{SUPPORT_PHONE_LINK && (
			  <a href={SUPPORT_PHONE_LINK} className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800 text-zinc-200">
				<Phone className="w-4 h-4" /> <span className="text-xs">{formatPhone(SUPPORT_PHONE)}</span>
			  </a>
			)}
			{WHATSAPP_LINK && (
			  <button type="button" onClick={handleWhatsApp} className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-600 text-white">
				<MessageCircle className="w-4 h-4" /> <span className="text-xs">WhatsApp</span>
			  </button>
			)}
		  </div>
		</form>

		{status === 'sent' && <div className="mt-3 text-xs text-emerald-400">{t('message_sent')}</div>}
	  </div>
	</div>
  );
};

export default ContactModal;
