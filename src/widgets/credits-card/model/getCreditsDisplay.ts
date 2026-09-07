export type CreditsDisplay = {
  remaining: number;
  percent: number;
};

// "X of Y Remaining" (screen1-dashboard.png: "12 of 20 Remaining", bar ~60%
// full) means X credits are left, not X spent - pulled out on its own after
// CreditsCard displayed and filled its bar from `used` directly, backwards
// from what the mockup's own numbers mean.
export function getCreditsDisplay(used: number, total: number): CreditsDisplay {
  // Nothing stops `used` from exceeding `total` between a scan and the next
  // Top Up (no hard quota enforcement) - clamp so "-3 of 20 Remaining"
  // never renders even though the underlying numbers allow it.
  const remaining = Math.max(0, total - used);
  return { remaining, percent: Math.round((remaining / total) * 100) };
}
