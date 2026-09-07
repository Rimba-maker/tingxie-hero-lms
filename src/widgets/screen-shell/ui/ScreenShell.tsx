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
//
// Widens at tablet (md:) and again at desktop (xl:) instead of centering a
// fixed mobile column with empty margins either side, or - tried and
// reverted on direct feedback - shrinking everything into a narrow
// phone-shaped card at desktop, which crammed Syllabus's 2-column grid
// into far too little width and looked cramped, not tidy. Individual
// screens opt into wider grids at md: where their own content has more
// than one natural column; this shell only grants the room, real content
// stays real content at every width.
//
// `xl:[transform:translateZ(0)]` isn't decoration: any ancestor with a CSS
// transform becomes the containing block for `position: fixed`
// descendants, so it keeps BottomNav scoped to this card's own width
// instead of stretching across the full (much wider) browser viewport -
// confirmed live. `min-h-dvh` is what makes that actually look right:
// without it, on a page shorter than the viewport, "fixed to this
// container's bottom" would land partway up the screen instead of at the
// visual bottom of the window.
export function ScreenShell({ viewer, children }: ScreenShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-background p-4 pb-24 md:max-w-3xl md:px-8 xl:max-w-5xl xl:rounded-[1.75rem] xl:px-12 xl:py-8 xl:shadow-[0_30px_60px_-20px_rgb(0_0_0_/_0.15)] xl:[transform:translateZ(0)]">
      {viewer && <AppHeader viewer={viewer} />}
      <main className="contents">{children}</main>
      {viewer && <BottomNav />}
    </div>
  );
}
