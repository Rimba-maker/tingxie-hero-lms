import type { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
  /**
   * Breakpoint the frame activates at. "md" is for screens with no sane
   * desktop equivalent at all (Scan — there's no camera-on-a-monitor use
   * case, so it's framed from tablet width up). "xl" is for content
   * screens that get a real adaptive tablet layout first and only fall
   * back to the frame once the viewport is wide enough that a native
   * desktop layout would mean inventing a design the assignment never
   * supplied a mockup for.
   */
  activateAt: "md" | "xl";
};

// A phone silhouette, not a generic centered box — this is what makes a
// mobile-only PWA read as a deliberate choice on a wide viewport rather
// than an unfinished one. `[transform:translateZ(0)]` on the device shell
// is doing real work, not decoration: it establishes a containing block so
// BottomNav's `position: fixed` resolves against the device frame instead
// of the true viewport, with zero changes needed to BottomNav itself.
const VARIANTS = {
  md: {
    backdrop:
      "md:flex md:min-h-dvh md:items-center md:justify-center md:bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_var(--color-background)_55%)] md:p-10",
    // 410px outer, not 390px: box-sizing: border-box (Tailwind's preflight)
    // means the 10px border would otherwise eat into the content area,
    // shrinking it to 370px and wrapping text tuned for a real 390px
    // viewport - confirmed live, this exact gap broke AppHeader's layout.
    // md:min-h-0 matters just as much: the base min-h-dvh below is a lower
    // bound CSS `height` can never shrink past, so without resetting it
    // here the frame silently stretched to fill the whole viewport instead
    // of being a real 870px phone silhouette - also confirmed live.
    device:
      "md:relative md:mx-0 md:h-[870px] md:min-h-0 md:w-[410px] md:max-h-[92dvh] md:shrink-0 md:overflow-hidden md:rounded-[2.75rem] md:border-[10px] md:border-neutral-900 md:shadow-[0_35px_60px_-15px_rgb(0_0_0_/_0.45)] md:[transform:translateZ(0)]",
    notch:
      "md:absolute md:left-1/2 md:top-0 md:z-50 md:block md:h-6 md:w-32 md:-translate-x-1/2 md:rounded-b-2xl md:bg-neutral-900",
    content: "md:h-full md:min-h-0 md:overflow-y-auto md:overscroll-contain",
  },
  xl: {
    backdrop:
      "xl:flex xl:min-h-dvh xl:items-center xl:justify-center xl:bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_var(--color-background)_55%)] xl:p-10",
    device:
      "xl:relative xl:mx-0 xl:h-[870px] xl:min-h-0 xl:w-[410px] xl:max-h-[92dvh] xl:shrink-0 xl:overflow-hidden xl:rounded-[2.75rem] xl:border-[10px] xl:border-neutral-900 xl:shadow-[0_35px_60px_-15px_rgb(0_0_0_/_0.45)] xl:[transform:translateZ(0)]",
    notch:
      "xl:absolute xl:left-1/2 xl:top-0 xl:z-50 xl:block xl:h-6 xl:w-32 xl:-translate-x-1/2 xl:rounded-b-2xl xl:bg-neutral-900",
    content: "xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain",
  },
} as const;

export function PhoneFrame({ children, activateAt }: PhoneFrameProps) {
  const v = VARIANTS[activateAt];
  return (
    <div className={v.backdrop}>
      <div className={`min-h-dvh w-full bg-background ${v.device}`}>
        <span aria-hidden className={`hidden ${v.notch}`} />
        <div className={`min-h-dvh ${v.content}`}>{children}</div>
      </div>
    </div>
  );
}
