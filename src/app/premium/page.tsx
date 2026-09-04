import { Sparkles } from "lucide-react";

import { AppHeader } from "@/widgets/app-header/ui/AppHeader";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";

// Per PRD_TingXieHero.md: Premium is a stub, not a functional destination —
// the client's own mockup never shows a screen behind this nav tab either.
export default function PremiumPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24">
      <AppHeader parentName="Sarah" studentName="Lucas" moeLevel="P2" />

      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <Sparkles className="size-8 text-primary" />
        <p className="text-lg font-semibold">Premium is coming soon</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Unlock extra worksheets, priority grading, and more syllabus levels.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
