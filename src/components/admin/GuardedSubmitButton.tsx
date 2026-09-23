"use client";

export function GuardedSubmitButton({
  label,
  className,
  confirmMessage,
}: {
  label: string;
  className: string;
  confirmMessage?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!confirmMessage) return;
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
