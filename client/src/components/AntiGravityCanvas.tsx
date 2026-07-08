import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Props { brainwave?: string; isPlaying?: boolean; bpm?: number; }

const BW_HUE: Record<string, number> = {
  Delta: 210, Theta: 270, Alpha: 160, Beta: 200, Gamma: 42,
};

function AnimatedSpheres({ brainwave = 'Theta', isPlaying = false, bpm = 60 }: Props) {
  const group = useRef<THREE.Group>(null);
  const baseHue = BW_HUE[brainwave] ?? 270;
  const speed = isPlaying ? Math.max(bpm / 60, 0.5) : 0.2;

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.1 * speed;
      group.current.rotation.x = state.clock.elapsedTime * 0.05 * speed;
    }
  });

  return (
    <group ref={group}>
      {[...Array(25)].map((_, i) => (
        <Float
          key={i}
          speed={speed * 2}
          rotationIntensity={2}
          floatIntensity={3}
          position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10
          ]}
        >
          <Sphere args={[0.6 + Math.random() * 1.5, 32, 32]}>
            <MeshDistortMaterial
              color={`hsl(${baseHue + (Math.random() - 0.5) * 50}, 65%, 65%)`}
              attach="material"
              distort={0.4}
              speed={speed * 4}
              roughness={0.15}
              transmission={0.85}
              thickness={1.5}
              transparent
              opacity={0.8}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  );
}

export default function AntiGravityCanvas(props: Props) {
  return (
    <div id="antigravity-canvas" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="white" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="white" />
        <AnimatedSpheres {...props} />
        <Environment preset="studio" />
        <EffectComposer disableNormalPass>
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} opacity={0.6} intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
