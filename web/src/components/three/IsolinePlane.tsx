"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Procedural isoline plane rendered as a line mesh. */
export function IsolinePlane() {
  const ref = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const gridSize = 20;
    const spacing = 1.2;
    for (let i = -gridSize; i <= gridSize; i++) {
      const y = i * spacing;
      for (let j = -gridSize; j < gridSize; j++) {
        const x0 = j * spacing, x1 = (j + 1) * spacing;
        const z0 = Math.sin(x0 * 0.3 + y * 0.2) * 0.8;
        const z1 = Math.sin(x1 * 0.3 + y * 0.2) * 0.8;
        positions.push(x0, y, z0, x1, y, z1);
      }
    }
    for (let j = -gridSize; j <= gridSize; j++) {
      const x = j * spacing;
      for (let i = -gridSize; i < gridSize; i++) {
        const y0 = i * spacing, y1 = (i + 1) * spacing;
        const z0 = Math.sin(x * 0.3 + y0 * 0.2) * 0.8;
        const z1 = Math.sin(x * 0.3 + y1 * 0.2) * 0.8;
        positions.push(x, y0, z0, x, y1, z1);
      }
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.08) * 0.04;
  });

  return (
    // @ts-ignore three lineSegments
    <lineSegments ref={ref} geometry={geometry} position={[0, 0, -4]}>
      <lineBasicMaterial color="#e8e5de" transparent opacity={0.22} />
    </lineSegments>
  );
}
