type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center items-center mx-auto" : "text-left";

  return (
    <div className={`flex flex-col gap-3 max-w-2xl ${alignment}`}>
      {eyebrow && (
        <span className="text-sm font-medium uppercase tracking-[0.18em] text-rose">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-semibold text-ink">{title}</h2>
      {description && (
        <p className="text-base sm:text-lg text-ink/70 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
