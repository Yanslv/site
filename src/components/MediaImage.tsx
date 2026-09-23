import Image from "next/image";

export default function MediaImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src.startsWith("/assets/") && !src.startsWith("/site-media/")) return null;
  if (src.startsWith("/site-media/")) {
    return <Image src={src} alt={alt} fill unoptimized sizes={sizes} className={className} />;
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} />;
}
