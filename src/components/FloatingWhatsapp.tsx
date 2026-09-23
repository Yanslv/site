import { MessageCircle } from "lucide-react";

export default function FloatingWhatsapp({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center justify-center rounded-full bg-wine p-4 text-background shadow-lg shadow-wine/30 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine md:hidden"
      aria-label="Tirar dúvidas e agendar pelo WhatsApp"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
