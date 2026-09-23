"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";

export default function SuccessToast({ message }: { message?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState(message ?? "");

  useEffect(() => {
    if (!message) return;
    setText(message);
    const timer = setTimeout(() => {
      setText("");
      router.replace(pathname);
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, pathname, router]);

  if (!text) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[min(100%-2rem,24rem)] -translate-x-1/2">
      <button
        type="button"
        onClick={() => {
          setText("");
          router.replace(pathname);
        }}
        className="flex w-full items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-left text-sm font-medium text-background shadow-lg"
      >
        <Check className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
        {text}
      </button>
    </div>
  );
}
