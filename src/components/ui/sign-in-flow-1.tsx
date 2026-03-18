"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

// ─── ShaderMaterial (inner Three.js mesh) ────────────────────────────────────

const InnerShaderMaterial = ({
  source,
  uniforms,
}: {
  source: string;
  uniforms: Uniforms;
}) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.ShaderMaterial;
    material.uniforms.u_time.value = clock.getElapsedTime();
  });

  const preparedUniforms = useMemo(() => {
    const out: Record<string, { value: unknown }> = {};
    for (const key in uniforms) {
      const u = uniforms[key];
      switch (u.type) {
        case "uniform1f":
          out[key] = { value: u.value };
          break;
        case "uniform1i":
          out[key] = { value: u.value };
          break;
        case "uniform1fv":
          out[key] = { value: u.value };
          break;
        case "uniform3fv":
          out[key] = {
            value: (u.value as number[][]).map((v) =>
              new THREE.Vector3().fromArray(v)
            ),
          };
          break;
        case "uniform2f":
          out[key] = { value: new THREE.Vector2().fromArray(u.value as number[]) };
          break;
        default:
          out[key] = { value: u.value };
      }
    }
    out["u_time"] = { value: 0 };
    out["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };
    return out;
  }, [size.width, size.height, uniforms]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main(){
            gl_Position = vec4(position.xy, 0.0, 1.0);
            fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: source,
        uniforms: preparedUniforms,
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source]
  );

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

// ─── Shader canvas wrapper ────────────────────────────────────────────────────

const Shader: React.FC<ShaderProps> = ({ source, uniforms }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <InnerShaderMaterial source={source} uniforms={uniforms} />
  </Canvas>
);

// ─── DotMatrix ────────────────────────────────────────────────────────────────

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    }
    return {
      u_colors: {
        value: colorsArray.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]),
        type: "uniform3fv",
      },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: {
        value: shader.includes("u_reverse_active") ? 1 : 0,
        type: "uniform1i",
      },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;
        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;
        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy){
          return fract(tan(distance(xy*PHI,xy)*0.5)*xy.x);
        }

        void main(){
          vec2 st = fragCoord.xy;
          ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
          ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}

          float opacity = step(0.0, st.x) * step(0.0, st.y);
          vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

          float frequency = 5.0;
          float show_offset = random(st2);
          float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
          opacity *= u_opacities[int(rand * 10.0)];
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

          vec3 color = u_colors[int(show_offset * 6.0)];

          float animation_speed_factor = 0.5;
          vec2 center_grid = u_resolution / 2.0 / u_total_size;
          float dist_from_center = distance(center_grid, st2);
          float timing_offset_intro = dist_from_center * 0.01 + random(st2) * 0.15;
          float max_grid_dist = distance(center_grid, vec2(0.0));
          float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + random(st2 + 42.0) * 0.2;

          if(u_reverse == 1){
            opacity *= 1.0 - step(timing_offset_outro, u_time * animation_speed_factor);
            opacity *= clamp(step(timing_offset_outro + 0.1, u_time * animation_speed_factor) * 1.25, 1.0, 1.25);
          } else {
            opacity *= step(timing_offset_intro, u_time * animation_speed_factor);
            opacity *= clamp((1.0 - step(timing_offset_intro + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
          }

          fragColor = vec4(color, opacity);
          fragColor.rgb *= fragColor.a;
        }
      `}
      uniforms={uniforms}
    />
  );
};

// ─── Public: CanvasRevealEffect ───────────────────────────────────────────────

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => (
  <div className={cn("h-full relative w-full", containerClassName)}>
    <div className="h-full w-full">
      <DotMatrix
        colors={colors}
        dotSize={dotSize ?? 3}
        opacities={opacities}
        shader={`
          ${reverse ? "u_reverse_active" : "false"}_;
          animation_speed_factor_${animationSpeed.toFixed(1)}_;
        `}
        center={["x", "y"]}
      />
    </div>
    {showGradient && (
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
    )}
  </div>
);
