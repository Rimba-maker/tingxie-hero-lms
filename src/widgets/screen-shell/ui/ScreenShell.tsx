import type { ReactNode } from "react";

import { PhoneFrame } from "@/widgets/phone-frame/ui/PhoneFrame";
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
//
// Widens at tablet width (md:) instead of just centering the mobile column
// with empty margins either side — real tablets (an iPad checking Syllabus
// or History) are common enough to earn actual reflow, not a shrunk mockup.
// Individual screens opt into wider grids at md: where their own content
// has more than one natural column; this shell only grants the room. Past
// xl: — genuinely wide desktop, no tablet mockup could ever have covered —
// falls back to a phone-frame mockup instead of inventing a desktop layout
// the assignment never supplied a design for.
export function ScreenShell({ viewer, children }: ScreenShellProps) {
  return (
    <PhoneFrame activateAt="xl">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24 md:max-w-3xl md:px-8">
        {viewer && <AppHeader viewer={viewer} />}
        <main className="contents">{children}</main>
        {viewer && <BottomNav />}
      </div>
    </PhoneFrame>
  );
}
