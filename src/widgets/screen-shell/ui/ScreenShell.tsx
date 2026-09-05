import type { ReactNode } from "react";

import type { Viewer } from "@/widgets/app-header/model/types";
import { AppHeader } from "@/widgets/app-header/ui/AppHeader";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";

type ScreenShellProps = {
  // Omitted only by Results, which is reached via a specific submission
  // link rather than a bottom-nav tab and has its own "Test Feedback"
  // header instead (matches its mockup) — no AppHeader/BottomNav there.
  viewer?: Viewer;
  children: ReactNode;
};

// The wrapper every screen repeated identically (mx-auto/max-w-md/gap-4/
// p-4/pb-24), plus the AppHeader+BottomNav pair the three nav-tab screens
// also repeated identically — one place instead of four to touch for any
// future layout change (found duplicated across all four screens by a
// mattpocock-skills:code-review pass).
export function ScreenShell({ viewer, children }: ScreenShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24">
      {viewer && <AppHeader viewer={viewer} />}
      <main className="contents">{children}</main>
      {viewer && <BottomNav />}
    </div>
  );
}
