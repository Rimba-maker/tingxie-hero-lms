// @ts-check
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Default is ~2MB, which would happily precache the ~1.1MB pdf-lib/
  // fontkit chunk (dynamically imported only by the rarely-used "Print
  // Worksheet" feature) as part of the app's eager install payload —
  // defeating the point of code-splitting it. Every real app chunk here
  // is well under 250KB, so 500KB leaves headroom for normal growth while
  // still excluding any future heavy, occasionally-used feature the same
  // way, without needing to match unstable content-hashed filenames.
  maximumFileSizeToCacheInBytes: 500 * 1024,
});
