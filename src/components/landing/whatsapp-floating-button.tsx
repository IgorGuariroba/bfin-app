const DEFAULT_MESSAGE = "Oi! Quero saber mais sobre o bfin.";

function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function WhatsAppFloatingButton() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY_NUMBER ?? "";
  const phone = sanitizePhone(raw);
  if (!phone) return null;

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] md:bottom-5"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19.05 4.91A10 10 0 0 0 4.06 18.34L3 22l3.77-1.03A10 10 0 1 0 19.05 4.9zM12 20.13a8.13 8.13 0 0 1-4.14-1.13l-.3-.18-2.24.61.6-2.18-.19-.31a8.13 8.13 0 1 1 6.27 3.19zm4.47-6.1c-.24-.12-1.45-.71-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.97-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.2-.72-.65-1.21-1.44-1.35-1.68-.14-.24-.02-.37.1-.49.1-.1.24-.27.36-.4.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.65.58.25 1.03.4 1.38.51.58.18 1.1.15 1.51.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
      </svg>
    </a>
  );
}
