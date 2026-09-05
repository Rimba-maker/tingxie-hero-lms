import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

import { expect, test } from "@playwright/test";

// Covers the parts of the app that don't need real camera/Supabase/Gemini
// access — /scan's getUserMedia flow is verified manually per README, not
// here (headless Chromium's fake camera device isn't reliable in CI).

// Playwright doesn't auto-load .env.local the way Next.js does — parsed by
// hand (cwd is the project root when run via `npm run test:e2e`) rather than
// adding a dotenv dependency for one file.
function loadEnv(): Record<string, string> {
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1)];
      }),
  );
}

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

// Serial, not parallel: both tests hit /history against the real shared
// Supabase project (the shipped DB starts empty, per README's Known
// Limitations — no permanent demo data), so the empty-state assertion must
// run before the fixture below inserts a row, not race against it.
test.describe.serial("history states", () => {
  test("shows the empty state on a fresh database", async ({ page }) => {
    await page.goto("/history");
    await expect(page.getByText(/past ting xie results/i)).toBeVisible();
    await expect(page.getByText(/no results yet/i)).toBeVisible();
  });

  test("shows a real submission and links into its Results page", async ({ page }) => {
    const env = loadEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const submissionId = "e2e00000-0000-4000-8000-000000000099";

    const { data: lesson } = await supabase.from("lessons").select("id").limit(1).single();
    const { error: insertError } = await supabase.from("submissions").insert({
      id: submissionId,
      lesson_id: lesson!.id,
      image_url: "https://example.com/e2e-test-worksheet.jpg",
      total_score: 8,
      total_possible: 10,
      status: "graded",
    });
    expect(insertError).toBeNull();

    try {
      await page.goto("/history");
      const firstResult = page.getByRole("link", { name: /week \d+/i }).first();
      await expect(firstResult).toBeVisible();
      await firstResult.click();
      await expect(page).toHaveURL(/\/results\//);
    } finally {
      await supabase.from("submissions").delete().eq("id", submissionId);
      const { count } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("id", submissionId);
      expect(count).toBe(0);
    }
  });
});

test("premium tab renders a stub instead of 404ing", async ({ page }) => {
  await page.goto("/premium");
  await expect(page.getByText(/premium is coming soon/i)).toBeVisible();
});
