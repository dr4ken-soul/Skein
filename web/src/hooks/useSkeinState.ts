"use client";
import { useState, useCallback } from "react";

export type SkeinState = "idle" | "reading" | "matched" | "collision";

/** Global skein scene state driven by app interactions. */
export function useSkeinState() {
  const [state, setState] = useState<SkeinState>("idle");
  const trigger = useCallback((s: SkeinState) => setState(s), []);
  return { state, trigger };
}
