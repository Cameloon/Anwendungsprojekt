// Configure Clerk as the auth provider for Convex.
// Replace the domain below with the Issuer URL from your Clerk JWT template
// (Dashboard -> JWT Templates -> "convex" -> Issuer).
// You can also set CLERK_JWT_ISSUER_DOMAIN via `npx convex env set`.
export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL,
      applicationID: 'convex',
    },
  ],
}
