/**
 * Server-side Firestore access is intentionally not implemented yet.
 *
 * Public catalogue migration starts with the Firebase browser SDK behind a
 * repository interface. When property SEO/detail pages are migrated, the
 * server adapter should be added here using server-only credentials in Vercel.
 *
 * Do not place service-account JSON or private keys in NEXT_PUBLIC_* variables.
 */
export const SERVER_FIREBASE_STATUS = "not-configured" as const;
