import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TingXie HERO",
    short_name: "TingXie HERO",
    description: "AI-powered Chinese handwriting grading for Singapore Primary school students",
    start_url: "/",
    display: "standalone",
    // Mobile-only by design — the assignment brief only ever shows mobile
    // mockups and no responsive/desktop layout was built (see README's
    // Known Limitations) — so lock the installed app to portrait.
    orientation: "portrait",
    background_color: "#faf7f2",
    theme_color: "#faf7f2",
    // Real app screenshots (not placeholders) — Chrome's install prompt
    // shows these directly, per web.dev's richer-install-ui guidance
    // (confirmed via Context7). "narrow" form_factor since these are
    // portrait mobile captures — matches the manifest's own orientation.
    screenshots: [
      {
        src: "/screenshots/dashboard.png",
        sizes: "390x700",
        type: "image/png",
        form_factor: "narrow",
        label: "Dashboard — credits, mastery stats, and this week's schedule",
      },
      {
        src: "/screenshots/syllabus.png",
        sizes: "390x700",
        type: "image/png",
        form_factor: "narrow",
        label: "Syllabus — MOE lessons by level with vocabulary and status",
      },
      {
        src: "/screenshots/results.png",
        sizes: "390x460",
        type: "image/png",
        form_factor: "narrow",
        label: "Results — graded worksheet with correction overlay",
      },
    ],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
