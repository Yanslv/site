import { MessageCircle } from "lucide-react";

type WhatsappCtaProps = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "md" | "lg";
  showIcon?: boolean;
  className?: string;
};

const variantClasses: Record<NonNullable<WhatsappCtaProps["variant"]>, string> = {
  primary: "bg-wine text-background hover:bg-ink focus-visible:outline-wine",
  secondary: "bg-surface text-wine hover:bg-rose hover:text-background focus-visible:outline-rose",
  outline: "border border-wine text-wine hover:bg-wine hover:text-background focus-visible:outline-wine",
};

const sizeClasses: Record<NonNullable<WhatsappCtaProps["size"]>, string> = {
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-base",
};

export default function WhatsappCta({
  href,
  label,
  variant = "primary",
  size = "md",
  showIcon = true,
  className = "",
}: WhatsappCtaProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <MessageCircle className="h-4 w-4" aria-hidden="true" />}
      {label}
    </a>
  );
}
