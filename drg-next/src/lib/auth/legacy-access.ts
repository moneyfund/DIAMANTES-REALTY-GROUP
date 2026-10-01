// Transitional compatibility with the legacy DRG access model.
// These allowlists are not the security boundary; Firestore/Storage rules must enforce writes.
// Remove after all authorized users have role documents/custom claims.
export const LEGACY_ADMIN_EMAILS = [
  "norvingarcia220@gmail.com",
  "diego.valdivia.52056@gmail.com",
  "diamantesrealtygroup@gmail.com"
] as const;
export const LEGACY_AGENT_EMAILS = [
  "norvingarcia220@gmail.com",
  "valop27@gmail.com",
  "dra.nazarethbravo@gmail.com",
  "diego.valdivia.52056@gmail.com",
  "27marvin@gmail.com",
  "rubenn2121@gmail.com",
  "dr.americamora@gmail.com",
  "norlanflores3@gmail.com",
  "amyblandon.as@gmail.com",
  "marccenarokarel@gmail.com",
  "caguadamuzmoreno@gmail.com",
  "agentenorvingarcia@gmail.com",
  "valenzuela.ing120@gmail.com",
  "nazarethbravo.realestate@gmail.com",
  "uh243384@gmail.com"
] as const;
