"use client";
import { useMediaQuery } from "./useMediaQuery";

/** Returns true if the user prefers reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
