import { Info } from "lucide-react";
import { demoNotice } from "@/config/site";

export default function DemoNotice() {
  return (
    <div className="bg-ink text-background">
      <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:text-sm">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{demoNotice}</span>
      </p>
    </div>
  );
}
