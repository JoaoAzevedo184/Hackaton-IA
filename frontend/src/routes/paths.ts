// src/routes/paths.ts
export const ROUTES = {
  HOME: "/",
  MATCH: "/match/:matchId",
  HISTORY: "/history",
  SETTINGS: "/settings",
} as const;

export function matchPath(matchId: string): string {
  return `/match/${matchId}`;
}