const PUBLIC_ROUTE_CATEGORIES = new Set([
  "/",
  "/oferty",
  "/oferty/:slug",
  "/firmy/:slug",
  "/metodologia",
  "/polityka-prywatnosci",
  "/testy",
]);

export const PUBLIC_AUTOCAPTURE_URL_ALLOWLIST =
  /^(?:https?:\/\/[^#]+#\/(?:|oferty(?:\/[^/?#]+)?|firmy\/[^/?#]+|metodologia|polityka-prywatnosci|testy)\/?(?:\?[^#]*)?(?:#[^#]*)?|https?:\/\/[^/?#]+\/?(?:\?[^#]*)?)$/;

export function normalizeAnalyticsPathname(pathname: string): string {
  const pathPart = pathname.split(/[?#]/, 1)[0] ?? "";
  const path = `/${pathPart.split("/").filter(Boolean).join("/")}`;

  if (
    path === "/" ||
    path === "/oferty" ||
    path === "/metodologia" ||
    path === "/polityka-prywatnosci" ||
    path === "/testy"
  ) {
    return path;
  }
  if (/^\/oferty\/[^/]+$/.test(path)) return "/oferty/:slug";
  if (/^\/firmy\/[^/]+$/.test(path)) return "/firmy/:slug";
  if (/^\/aplikuj\/[^/]+$/.test(path)) return "/aplikuj/:slug";
  if (/^\/auth\/[^/]+$/.test(path)) return "/auth/:mode";
  if (path === "/app") return "/app";
  if (path.startsWith("/app/profil")) return "/app/profil";
  if (path.startsWith("/app/zapisane")) return "/app/zapisane";
  if (path.startsWith("/app/aplikacje")) return "/app/aplikacje";
  if (path.startsWith("/app/oferty")) return "/app/oferty";
  if (path.startsWith("/app/organizacja")) return "/app/organizacja";
  if (path.startsWith("/app/kandydaci")) return "/app/kandydaci";
  if (path.startsWith("/app/case")) return "/app/case";
  if (path.startsWith("/app/settings")) return "/app/settings";
  return "/other";
}

export function isPublicAnalyticsPathname(pathname: string): boolean {
  return PUBLIC_ROUTE_CATEGORIES.has(normalizeAnalyticsPathname(pathname));
}
