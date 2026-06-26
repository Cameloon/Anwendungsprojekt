import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!url) {
  // eslint-disable-next-line no-console
  console.warn(
    "[convex] VITE_CONVEX_URL is not set. Profile queries will fail until you run `npx convex dev` and add the URL to your env."
  );
}

export const convex = new ConvexReactClient(url || "https://placeholder.convex.cloud");