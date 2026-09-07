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

// A phone-proportioned card, not an illustrated phone. First pass drew an
// actual bezel and a notch, which read as "the app shrank into its own
// little phone" rather than "a normal desktop presentation with tidy
// edges" - the whole point being made softer, not more literal. Elevation
// comes from a single soft shadow (craft-floor: pick one, not a border
// stacked under it too) and rounded corners; no border, no bezel, no notch.
// `[transform:translateZ(0)]` still does real work though, not decoration:
// it establishes a containing block so BottomNav's `position: fixed`
// resolves against this card instead of the true viewport, with zero
// changes needed to BottomNav itself.
const VARIANTS = {
  md: {
    backdrop:
      "md:flex md:min-h-dvh md:items-center md:justify-center md:bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_var(--color-background)_55%)] md:p-10",
    // box-sizing: border-box (Tailwind's preflight) no longer needs
    // compensating for here - no border - so the box is exactly the
    // content's own tuned 390px width.
    // md:min-h-0 still matters: the base min-h-dvh below is a lower bound
    // CSS `height` can never shrink past, so without resetting it here the
    // card would silently stretch to fill the whole viewport instead of
    // being a real ~850px silhouette - confirmed live.
    device:
      "md:relative md:mx-0 md:h-[850px] md:min-h-0 md:w-[390px] md:max-h-[92dvh] md:shrink-0 md:overflow-hidden md:rounded-[1.75rem] md:shadow-[0_30px_60px_-20px_rgb(0_0_0_/_0.35)] md:[transform:translateZ(0)]",
    content: "md:h-full md:min-h-0 md:overflow-y-auto md:overscroll-contain",
  },
  xl: {
    backdrop:
      "xl:flex xl:min-h-dvh xl:items-center xl:justify-center xl:bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_var(--color-background)_55%)] xl:p-10",
    device:
      "xl:relative xl:mx-0 xl:h-[850px] xl:min-h-0 xl:w-[390px] xl:max-h-[92dvh] xl:shrink-0 xl:overflow-hidden xl:rounded-[1.75rem] xl:shadow-[0_30px_60px_-20px_rgb(0_0_0_/_0.35)] xl:[transform:translateZ(0)]",
    content: "xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain",
  },
} as const;

export function PhoneFrame({ children, activateAt }: PhoneFrameProps) {
  const v = VARIANTS[activateAt];
  return (
    <div className={v.backdrop}>
      <div className={`min-h-dvh w-full bg-background ${v.device}`}>
        <div className={`min-h-dvh ${v.content}`}>{children}</div>
      </div>
    </div>
  );
}
