"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import * as THREE from "three";

/** Camera that walks along a path driven by scroll progress. */
export function CameraRig() {
  const progress = useScrollProgress();
  useFrame(({ camera }) => {
    const t = progress;
    camera.position.x = Math.sin(t * Math.PI * 1.2) * 1.5;
    camera.position.y = (t - 0.5) * 2;
    camera.position.z = 8 - t * 1.5;
    camera.lookAt(0, 0, 0);
  });
  return null;
}
