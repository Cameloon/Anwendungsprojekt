import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import App from "./App.tsx";
import { convex } from "./lib/convex";
import { IS_DEMO } from "./lib/demoMode";
import "./index.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const root = createRoot(document.getElementById("root")!);

if (IS_DEMO) {
  // eslint-disable-next-line no-console
  console.warn(
    "[setup] Running in DEMO mode (Clerk/Convex env vars missing). Using local dummy auth + profile."
  );
  root.render(<App />);
} else {
  root.render(
    <ClerkProvider publishableKey={clerkPubKey!}>
      <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
