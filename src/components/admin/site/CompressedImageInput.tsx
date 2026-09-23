"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { compressImageFile } from "@/lib/compress-image";

export default function CompressedImageInput({
  name,
  previewPath = "",
}: {
  name: string;
  previewPath?: string;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const payloadRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = localPreview || previewPath;

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const payload = payloadRef.current;
    if (!file || !payload) return;

    setError(null);
    setStatus("Otimizando foto…");
    try {
      const compressed = await compressImageFile(file);
      const transfer = new DataTransfer();
      transfer.items.add(compressed);
      payload.files = transfer.files;
      setLocalPreview(URL.createObjectURL(compressed));
      setStatus("Foto pronta para salvar.");
    } catch (cause) {
      payload.value = "";
      event.target.value = "";
      setLocalPreview(null);
      setStatus(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível processar a imagem.");
    }
  }

  return (
    <div className="grid items-center gap-3 sm:grid-cols-[6rem_1fr]">
      {preview ? (
        <Image
          src={preview}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="h-24 w-24 rounded-xl object-cover"
        />
      ) : (
        <div className="h-24 w-24 rounded-xl bg-surface" />
      )}
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="inline-flex rounded-full border border-wine px-4 py-2 text-sm font-medium text-wine hover:bg-wine hover:text-background"
        >
          Trocar foto
        </button>
        {status && <span className="text-xs text-ink/60">{status}</span>}
        {error && <span className="text-xs text-rose">{error}</span>}
      </div>
      <input
        ref={pickerRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onPick}
      />
      <input ref={payloadRef} type="file" name={name} className="hidden" tabIndex={-1} />
    </div>
  );
}
