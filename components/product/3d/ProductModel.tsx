"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface ProductModelProps {
  modelUrl: string;
  scale?: number;
}

export default function ProductModel({
  modelUrl,
  scale = 1.6
}: ProductModelProps) {
  const { scene } = useGLTF(modelUrl);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    // Enable shadows for all meshes
    clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={clonedScene}
      scale={scale}
      position={[0, -1, 0]}
    />
  );
}
