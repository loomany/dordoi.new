import { routing } from "@/i18n/routing";

export type RouteLocale = (typeof routing.locales)[number];

export const ROUTE_LOCALES = routing.locales;

export function isRouteLocale(value: string): value is RouteLocale {
  return (routing.locales as readonly string[]).includes(value);
}
