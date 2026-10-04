"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { buildStrands } from "./buildStrands";

const DEFAULT_KEYS = [
  "0x1111111111111111111111111111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444444444444444444444444444",
  "0x5555555555555555555555555555555555555555555555555555555555555555",
];

export function SkeinStrands({ keys = DEFAULT_KEYS }: { keys?: string[] }) {
  const strands = useMemo(() => buildStrands(keys, 5), [keys]);
  return (
    <group>
      {strands.map((points, idx) => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(points.length * 3);
        points.forEach((p, i) => {
          positions[i * 3] = p.x;
          positions[i * 3 + 1] = p.y;
          positions[i * 3 + 2] = p.z;
        });
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const colors = ["#c45a1a", "#2d6a4f", "#6b6b63", "#1a1a18", "#9a9a93"];
        return (
          // @ts-ignore three line
          <line key={idx} geometry={geo}>
            <lineBasicMaterial color={colors[idx % colors.length]} transparent opacity={0.7} />
          </line>
        );
      })}
    </group>
  );
}
