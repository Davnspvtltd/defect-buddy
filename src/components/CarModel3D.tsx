import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/** Marker positions are in normalized model-space; <Bounds fit /> rescales the car
 * so these stable offsets land on the right region regardless of GLB scale. */
export type CarMarker = {
  code: string;
  label: string;
  zone: "EX" | "IN" | "EN" | "UB";
  position: [number, number, number];
};

export const CAR_MARKERS: CarMarker[] = [
  { code: "EN",     label: "Engine Bay",      zone: "EN", position: [ 1.4, 0.6,  0.0] },
  { code: "EX-FR",  label: "Front Exterior",  zone: "EX", position: [ 1.6, 0.2,  0.9] },
  { code: "EX-RR",  label: "Rear Exterior",   zone: "EX", position: [-1.7, 0.4,  0.0] },
  { code: "EX-LH",  label: "Left Side",       zone: "EX", position: [ 0.0, 0.5, -1.0] },
  { code: "EX-RH",  label: "Right Side",      zone: "EX", position: [ 0.0, 0.5,  1.0] },
  { code: "IN",     label: "Cabin / Interior",zone: "IN", position: [ 0.1, 0.9,  0.0] },
  { code: "UB",     label: "Underbody",       zone: "UB", position: [ 0.0,-0.4,  0.0] },
];


function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Preserve original GLB materials, just ensure they react well to lighting.
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) {
          mat.envMapIntensity = 1.2;
          mat.needsUpdate = true;
        }
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }, [scene]);

  return <primitive object={scene} />;
}

export default function CarModel3D({
  className,
}: {
  selectedCode?: string;
  onSelect?: (m: CarMarker) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-[280px] sm:h-[360px] lg:h-[420px] w-full overflow-hidden rounded-2xl border",
        "bg-[radial-gradient(ellipse_at_center,_#ffffff_0%,_#f1f3f6_55%,_#dde2ea_100%)]",
        "flex items-center justify-center",
        className,
      )}
    >
      <Canvas
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
        shadows
        camera={{ position: [4.5, 2.2, 4.5], fov: 32 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMappingExposure: 1.25 }}
      >
        <color attach="background" args={["#ffffff"]} />
        <hemisphereLight args={["#ffffff", "#cfd6e1", 0.85]} />
        <directionalLight
          position={[6, 9, 6]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#dce6ff" />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Bounds fit clip observe margin={1.25}>
            <Model url="/models/car.glb" />
          </Bounds>
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.45}
            scale={9}
            blur={2.6}
            far={3}
            color="#0b1220"
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.2}
          maxDistance={6}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-sm bg-white/85 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground backdrop-blur">
        Drag · Zoom
      </div>
    </div>
  );
}

useGLTF.preload("/models/car.glb");
