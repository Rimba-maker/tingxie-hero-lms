import { expect, test } from "@playwright/test";

// Covers the parts of the app that don't need real camera/Supabase/Gemini
// access — /scan's getUserMedia flow is verified manually per README, not
// here (headless Chromium's fake camera device isn't reliable in CI).

test("dashboard loads and links to the scan flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/welcome back/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /scan.*grade worksheet/i })).toBeVisible();
});

test("syllabus tabs switch between MOE levels", async ({ page }) => {
  await page.goto("/syllabus");

  const p2Tab = page.getByRole("tab", { name: "P2" });
  const p3Tab = page.getByRole("tab", { name: "P3" });
  await expect(p2Tab).toBeVisible();

  await p3Tab.click();
  await expect(p3Tab).toHaveAttribute("data-active", "");
});

test("bottom nav moves between dashboard and syllabus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /syllabus/i }).click();
  await expect(page).toHaveURL(/\/syllabus/);
});

test("history tab redirects instead of 404ing", async ({ page }) => {
  const response = await page.goto("/history");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).not.toHaveURL(/\/history$/);
});

test("premium tab renders a stub instead of 404ing", async ({ page }) => {
  await page.goto("/premium");
  await expect(page.getByText(/premium is coming soon/i)).toBeVisible();
});
