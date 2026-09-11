"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  Html,
  ContactShadows,
  Stage,
} from "@react-three/drei";
import ProductModel from "./ProductModel";
import { Loader2 } from "lucide-react";
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface Product3DViewerProps {
  modelUrl: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export default function Product3DViewer({
  modelUrl,
  autoRotate = true,
  rotationSpeed = 1.3
}: Product3DViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-[2.5rem] bg-slate-950 border border-white/10 shadow-2xl group">
      <Canvas
        shadows
        camera={{
          position: [0, 0.8, 4],
          fov: 35,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense
          fallback={
            <Html center>
                <div className="flex flex-col items-center gap-4 text-white/50">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Initializing 3D Unit...</p>
                </div>
            </Html>
          }
        >
          <Stage
            intensity={0.5}
            environment="city"
            adjustCamera={false}
            shadows
          >
            <ProductModel modelUrl={modelUrl} />
          </Stage>

          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.35}
            scale={8}
            blur={2}
            far={4}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom
            minDistance={2.2}
            maxDistance={6}
            enableDamping
            dampingFactor={0.06}
            autoRotate={autoRotate}
            autoRotateSpeed={rotationSpeed}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={(Math.PI * 3) / 4}
          />

          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* Control Hint */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 border border-white/20 px-6 py-2.5 text-[8px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl">
        Swipe to Rotate • Pinch to Zoom
      </div>

      {/* Quality Badge */}
      <div className="absolute top-6 right-6 h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/50 backdrop-blur-md">
          <span className="text-[9px] font-black">4K</span>
      </div>
    </div>
  );
}
