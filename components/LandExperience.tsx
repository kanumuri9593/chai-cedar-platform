"use client";

import { Html, Line, OrbitControls, Sky, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Moon, Sun, Trees, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import {
  cameraViews,
  type CameraView,
  defaultSceneMode,
  landSceneObjects,
  type LandSceneObject,
  type SceneMode,
  type SeasonMode
} from "@/lib/chai-cedar-data";

const seasonColors: Record<SeasonMode, { grass: string; trees: string; accent: string; orchard: string }> = {
  spring: { grass: "#526f35", trees: "#5f8f42", accent: "#f3a0bf", orchard: "#f6b4cc" },
  summer: { grass: "#3f5f2e", trees: "#244622", accent: "#d6b16c", orchard: "#7fae4d" },
  fall: { grass: "#604f2e", trees: "#9a5a27", accent: "#df8a28", orchard: "#c46526" },
  winter: { grass: "#a7ada5", trees: "#61705f", accent: "#cfd8d1", orchard: "#dce0dc" }
};

function SceneCamera({
  view,
  controlsRef
}: {
  view: CameraView;
  controlsRef: MutableRefObject<any>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    const next = cameraViews[view];
    camera.position.set(...next.position);
    camera.lookAt(...next.target);
    if (controlsRef.current) {
      controlsRef.current.target.set(...next.target);
      controlsRef.current.update();
    }
  }, [camera, controlsRef, view]);

  return null;
}

function Tree({
  position,
  color,
  scale = 1
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.045, 0.065, 0.78, 8]} />
        <meshStandardMaterial color="#5a3920" roughness={0.86} />
      </mesh>
      <mesh castShadow position={[0, 0.92, 0]}>
        <coneGeometry args={[0.38, 1.0, 8]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 1.35, 0]}>
        <coneGeometry args={[0.27, 0.72, 8]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
    </group>
  );
}

function HotspotLabel({
  object,
  selected,
  onSelect
}: {
  object: LandSceneObject;
  selected: boolean;
  onSelect: (object: LandSceneObject) => void;
}) {
  return (
    <Html position={[object.position[0], 1.45, object.position[2]]} center distanceFactor={11}>
      <button
        className="land-label"
        style={{
          outline: selected ? "3px solid #d6b16c" : "0",
          transform: selected ? "scale(1.04)" : "scale(1)"
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(object);
        }}
      >
        {object.title}
      </button>
    </Html>
  );
}

function Cabin({ object, mode, onSelect }: { object: LandSceneObject; mode: SceneMode; onSelect: () => void }) {
  const lit = mode.light === "night";
  return (
    <group position={object.position} rotation={object.rotation} scale={object.scale} onClick={onSelect}>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[1.7, 0.84, 0.72]} />
        <meshStandardMaterial color={mode.vision === "future" ? "#352719" : "#4b3828"} roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, 0.93, 0]}>
        <boxGeometry args={[1.86, 0.15, 0.86]} />
        <meshStandardMaterial color="#111111" metalness={0.25} roughness={0.42} />
      </mesh>
      <mesh receiveShadow position={[0.04, 0.08, 0.55]}>
        <boxGeometry args={[2.08, 0.12, 0.42]} />
        <meshStandardMaterial color="#8e5b32" roughness={0.72} />
      </mesh>
      {[-0.52, 0, 0.52].map((x) => (
        <mesh key={x} position={[x, 0.48, -0.38]}>
          <boxGeometry args={[0.25, 0.35, 0.03]} />
          <meshStandardMaterial
            color={lit ? "#ffd37a" : "#91b8c7"}
            emissive={lit ? "#ffc765" : "#000000"}
            emissiveIntensity={lit ? 1.8 : 0}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

function Barn({ object, onSelect }: { object: LandSceneObject; onSelect: () => void }) {
  return (
    <group position={object.position} rotation={object.rotation} scale={object.scale} onClick={onSelect}>
      <mesh castShadow receiveShadow position={[0, 0.38, 0]}>
        <boxGeometry args={[1.5, 0.76, 0.92]} />
        <meshStandardMaterial color="#5a5349" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.84, 0]}>
        <boxGeometry args={[1.62, 0.16, 1.02]} />
        <meshStandardMaterial color="#27231f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.28, -0.48]}>
        <boxGeometry args={[0.55, 0.46, 0.04]} />
        <meshStandardMaterial color="#1b1815" roughness={0.78} />
      </mesh>
    </group>
  );
}

function Tent({ object, mode, onSelect }: { object: LandSceneObject; mode: SceneMode; onSelect: () => void }) {
  return (
    <group position={object.position} rotation={object.rotation} scale={object.scale} onClick={onSelect}>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[1.7, 0.16, 1.36]} />
        <meshStandardMaterial color="#8b5e34" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0]}>
        <coneGeometry args={[0.78, 1.08, 4]} />
        <meshStandardMaterial color={mode.light === "night" ? "#d8c29a" : "#cab38b"} roughness={0.88} />
      </mesh>
      {mode.light === "night" && (
        <pointLight color="#f6c66b" intensity={1.6} distance={2.6} position={[0, 1.1, 0.2]} />
      )}
    </group>
  );
}

function Pond({ object, mode, onSelect }: { object: LandSceneObject; mode: SceneMode; onSelect: () => void }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.roughness = 0.18 + Math.sin(clock.elapsedTime * 0.8) * 0.025;
    }
  });

  return (
    <group position={object.position} scale={object.scale} onClick={onSelect}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1, 72]} />
        <meshStandardMaterial
          ref={materialRef}
          color={mode.light === "night" ? "#092334" : "#15556a"}
          metalness={0.15}
          roughness={0.18}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[1.02, 1.14, 72]} />
        <meshStandardMaterial color="#1b321f" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Orchard({ object, mode, onSelect }: { object: LandSceneObject; mode: SceneMode; onSelect: () => void }) {
  const colors = seasonColors[mode.season];
  const trees = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => {
        const ring = index % 2 === 0 ? 1.2 : 0.72;
        const angle = index * 1.19;
        return {
          position: [Math.cos(angle) * ring, 0, Math.sin(angle) * ring * 0.74] as [number, number, number],
          scale: 0.62 + ((index * 17) % 5) * 0.06
        };
      }),
    []
  );

  return (
    <group position={object.position} scale={object.scale} onClick={onSelect}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.18, 64]} />
        <meshStandardMaterial color={colors.grass} transparent opacity={0.46} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.23, 0.34, 48]} />
        <meshStandardMaterial color="#9f7445" roughness={0.78} />
      </mesh>
      {trees.map((tree, index) => (
        <Tree
          key={index}
          position={tree.position}
          scale={tree.scale}
          color={index % 5 === 0 ? colors.accent : colors.orchard}
        />
      ))}
      {mode.light === "night" && (
        <>
          {trees.slice(0, 12).map((tree, index) => (
            <pointLight
              key={index}
              color="#f1b762"
              distance={1.2}
              intensity={0.52}
              position={[tree.position[0], 0.56, tree.position[2]]}
            />
          ))}
        </>
      )}
    </group>
  );
}

function PlayArea({ object, mode, onSelect }: { object: LandSceneObject; mode: SceneMode; onSelect: () => void }) {
  return (
    <group position={object.position} rotation={object.rotation} scale={object.scale} onClick={onSelect}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.96, 36]} />
        <meshStandardMaterial color="#80633f" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 0.56, 0]}>
        <boxGeometry args={[0.82, 0.13, 0.62]} />
        <meshStandardMaterial color="#9b6738" roughness={0.74} />
      </mesh>
      {[
        [-0.32, 0.3, -0.23],
        [0.32, 0.3, -0.23],
        [-0.32, 0.3, 0.23],
        [0.32, 0.3, 0.23]
      ].map((pos, index) => (
        <mesh key={index} castShadow position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.035, 0.04, 0.68, 8]} />
          <meshStandardMaterial color="#6d4425" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.62, 0.38, 0.28]} rotation={[0.4, 0, -0.35]}>
        <boxGeometry args={[0.12, 0.05, 0.76]} />
        <meshStandardMaterial color="#3f7aa5" roughness={0.62} />
      </mesh>
      {mode.vision === "future" && (
        <mesh position={[0, 0.98, -0.46]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.018, 8, 32]} />
          <meshStandardMaterial color="#c7d8d5" roughness={0.46} />
        </mesh>
      )}
    </group>
  );
}

function Forest({ mode }: { mode: SceneMode }) {
  const colors = seasonColors[mode.season];
  const trees = useMemo(
    () =>
      Array.from({ length: 46 }, (_, index) => {
        const x = -8.8 + (index % 16) * 1.15 + (((index * 13) % 9) - 4) * 0.035;
        const z = -7.3 + Math.floor(index / 16) * 0.75 + (((index * 7) % 7) - 3) * 0.08;
        return { position: [x, 0, z] as [number, number, number], scale: 0.72 + ((index * 19) % 8) * 0.06 };
      }),
    []
  );

  return (
    <group>
      {trees.map((tree, index) => (
        <Tree key={index} position={tree.position} scale={tree.scale} color={colors.trees} />
      ))}
    </group>
  );
}

function Road() {
  return (
    <group position={[-1.8, 0.025, -6.55]} rotation={[0, 0.08, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[10.2, 0.04, 0.72]} />
        <meshStandardMaterial color="#56514b" roughness={0.95} />
      </mesh>
      <Line
        points={[
          [-4.8, 0.04, 0],
          [4.8, 0.04, 0]
        ]}
        color="rgba(244,238,223,0.7)"
        dashed
        dashSize={0.34}
        gapSize={0.22}
        lineWidth={1.5}
      />
    </group>
  );
}

function Paths() {
  return (
    <group>
      <Line
        points={[
          [5.9, 0.08, -4.2],
          [3.2, 0.08, -2.2],
          [0.4, 0.08, 0],
          [-2.4, 0.08, 2.4],
          [-6.1, 0.08, 4.5]
        ]}
        color="#d2b489"
        lineWidth={5}
        dashed
        dashSize={0.22}
        gapSize={0.16}
      />
      <Line
        points={[
          [-6.4, 0.09, -4.45],
          [-3.2, 0.09, -2.9],
          [0.1, 0.09, 0.2],
          [2.2, 0.09, 3.3],
          [6.4, 0.09, 4.6]
        ]}
        color="#d2b489"
        lineWidth={3.5}
        dashed
        dashSize={0.18}
        gapSize={0.18}
      />
      <Line
        points={[
          [0.1, 0.09, 0.2],
          [0.8, 0.09, 2.4],
          [1.1, 0.09, 4.7]
        ]}
        color="#d2b489"
        lineWidth={3.5}
        dashed
        dashSize={0.18}
        gapSize={0.18}
      />
    </group>
  );
}

function SceneObjects({
  mode,
  selected,
  onSelect
}: {
  mode: SceneMode;
  selected: LandSceneObject;
  onSelect: (object: LandSceneObject) => void;
}) {
  const colors = seasonColors[mode.season];

  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[18, 15, 24, 24]} />
        <meshStandardMaterial color={colors.grass} roughness={0.96} />
      </mesh>
      <Road />
      <Paths />
      <Forest mode={mode} />
      {landSceneObjects.map((object) => {
        if (object.id === "forest" || object.id === "road") {
          return <HotspotLabel key={object.id} object={object} selected={selected.id === object.id} onSelect={onSelect} />;
        }

        return (
          <group key={object.id}>
            {object.id === "barn" && <Barn object={object} onSelect={() => onSelect(object)} />}
            {object.id === "cabin" && <Cabin object={object} mode={mode} onSelect={() => onSelect(object)} />}
            {object.id === "tent" && <Tent object={object} mode={mode} onSelect={() => onSelect(object)} />}
            {object.id === "play" && <PlayArea object={object} mode={mode} onSelect={() => onSelect(object)} />}
            {object.id === "pond" && <Pond object={object} mode={mode} onSelect={() => onSelect(object)} />}
            {object.id === "orchard" && <Orchard object={object} mode={mode} onSelect={() => onSelect(object)} />}
            <HotspotLabel object={object} selected={selected.id === object.id} onSelect={onSelect} />
          </group>
        );
      })}
    </>
  );
}

function ZonePanel({ selected, onClose }: { selected: LandSceneObject; onClose: () => void }) {
  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={selected.id}
        className="zone-panel"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25 }}
      >
        <div className="panel-header">
          <div>
            <p className="eyebrow" style={{ color: "#8d5d22", marginBottom: 8 }}>
              {selected.status}
            </p>
            <h2>{selected.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close zone detail">
            <X size={18} />
          </button>
        </div>
        <p>{selected.summary}</p>
        <p>
          <strong>Cost:</strong> {selected.costRange}
          <br />
          <strong>Role:</strong> {selected.revenueRole}
        </p>
        <ol className="step-list">
          {selected.steps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p style={{ margin: 0 }}>{step}</p>
            </li>
          ))}
        </ol>
      </motion.aside>
    </AnimatePresence>
  );
}

export function LandExperience() {
  const [selected, setSelected] = useState<LandSceneObject>(
    landSceneObjects.find((object) => object.id === "cabin") ?? landSceneObjects[0]
  );
  const [mode, setMode] = useState<SceneMode>(defaultSceneMode);
  const [cameraView, setCameraView] = useState<CameraView>("aerial");
  const controlsRef = useRef<any>(null);

  const setSeason = (season: SeasonMode) => setMode((current) => ({ ...current, season }));

  return (
    <>
      <div className="hero-canvas" aria-hidden="true">
        <Canvas shadows camera={{ position: cameraViews.aerial.position, fov: 48 }}>
          <color attach="background" args={[mode.light === "night" ? "#07100f" : "#9db08e"]} />
          <fog attach="fog" args={[mode.light === "night" ? "#07100f" : "#9db08e", 10, 24]} />
          {mode.light === "day" ? (
            <Sky sunPosition={[5, 8, 4]} turbidity={5} rayleigh={1.2} />
          ) : (
            <>
              <Stars radius={80} depth={36} count={1200} factor={4} fade speed={0.35} />
              <ambientLight intensity={0.35} />
            </>
          )}
          <ambientLight intensity={mode.light === "day" ? 0.82 : 0.34} />
          <directionalLight
            castShadow
            color={mode.light === "day" ? "#fff4da" : "#b7d1ff"}
            intensity={mode.light === "day" ? 2.8 : 0.82}
            position={[5, 8, 3]}
            shadow-mapSize={[2048, 2048]}
          />
          <SceneCamera view={cameraView} controlsRef={controlsRef} />
          <SceneObjects mode={mode} selected={selected} onSelect={setSelected} />
          <OrbitControls ref={controlsRef} enableDamping minDistance={4.8} maxDistance={20} maxPolarAngle={1.28} />
        </Canvas>
      </div>

      <div className="scene-tools" aria-label="3D view controls">
        <button
          className={`tool-button ${mode.light === "day" ? "active" : ""}`}
          onClick={() => setMode((current) => ({ ...current, light: current.light === "day" ? "night" : "day" }))}
        >
          {mode.light === "day" ? <Sun size={16} /> : <Moon size={16} />}
          {mode.light === "day" ? "Day" : "Night"}
        </button>
        {(["spring", "summer", "fall", "winter"] as SeasonMode[]).map((season) => (
          <button
            className={`mode-button ${mode.season === season ? "active" : ""}`}
            key={season}
            onClick={() => setSeason(season)}
          >
            <Trees size={15} />
            {season}
          </button>
        ))}
        <button
          className={`mode-button ${mode.vision === "future" ? "active" : ""}`}
          onClick={() =>
            setMode((current) => ({ ...current, vision: current.vision === "future" ? "current" : "future" }))
          }
        >
          Future vision
        </button>
        {Object.entries(cameraViews).map(([key, value]) => (
          <button
            className={`mode-button ${cameraView === key ? "active" : ""}`}
            key={key}
            onClick={() => setCameraView(key as CameraView)}
          >
            {value.label}
          </button>
        ))}
      </div>

      <ZonePanel selected={selected} onClose={() => setSelected(landSceneObjects[1])} />
    </>
  );
}

export function ExploreButton() {
  return (
    <a className="solid-link" href="#land-system">
      Explore the blueprint <ChevronRight size={17} />
    </a>
  );
}
