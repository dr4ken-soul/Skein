"use client";
import { Canvas } from "@react-three/fiber";
import { IsolinePlane } from "./IsolinePlane";
import { SkeinStrands } from "./SkeinStrands";
import { CameraRig } from "./CameraRig";
import { StillFallback } from "./StillFallback";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Single fixed WebGL canvas for the entire page. Mount once. */
export function SkeinScene({ keys }: { keys?: string[] }) {
  const prefersReduced = usePrefersReducedMotion();
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (prefersReduced || isMobile) {
    return <StillFallback />;
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <IsolinePlane />
        <SkeinStrands keys={keys} />
        <CameraRig />
      </Canvas>
    </div>
  );
}
