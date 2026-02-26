'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import * as THREE from 'three';

export interface RisingLinesProps {
  className?: string;
  color?: string;
  horizonColor?: string;
  haloColor?: string;
  riseSpeed?: number;
  riseScale?: number;
  riseIntensity?: number;
  flowSpeed?: number;
  flowDensity?: number;
  flowIntensity?: number;
  horizonIntensity?: number;
  haloIntensity?: number;
  horizonHeight?: number;
  circleScale?: number;
  scale?: number;
  brightness?: number;
}

const hexToRgb = (hex: string): THREE.Vector3 => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return new THREE.Vector3(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    );
  }
  return new THREE.Vector3(0.2, 0.5, 1.0);
};

const RisingLines = ({
  className,
  color = '#33AAFF',
  horizonColor = '#33AAFF',
  haloColor = '#33FFFF',
  riseSpeed = 0.1,
  riseScale = 11.5,
  riseIntensity = 1.0,
  flowSpeed = 0.2,
  flowDensity = 4.0,
  flowIntensity = 0.6,
  horizonIntensity = 0.85,
  haloIntensity = 7.5,
  horizonHeight = -0.65,
  circleScale = 0.2,
  scale = 3.5,
  brightness = 1.0,
}: RisingLinesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec3 uColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uHaloColor;
      uniform float uRiseSpeed;
      uniform float uRiseScale;
      uniform float uRiseIntensity;
      uniform float uFlowSpeed;
      uniform float uFlowDensity;
      uniform float uFlowIntensity;
      uniform float uHorizonIntensity;
      uniform float uHaloIntensity;
      uniform float uHorizonHeight;
      uniform float uCircleScale;
      uniform float uScale;
      uniform float uBrightness;
      varying vec2 vUv;

      float normalizeRange(float minVal, float maxVal, float value) {
        return clamp((value - minVal) / (maxVal - minVal), 0.0, 1.0);
      }
      float mapRange(float inMin, float inMax, float outMin, float outMax, float value) {
        float normalized = normalizeRange(inMin, inMax, value);
        return mix(outMin, outMax, normalized);
      }
      float hash2D(vec2 coord) {
        vec2 k = fract(coord * vec2(127.82, 311.45));
        k += dot(k, k + 71.83);
        return fract(k.x * k.y);
      }
      vec2 hash2D_vec2(vec2 coord) {
        float h1 = hash2D(coord);
        float h2 = hash2D(coord + h1);
        return vec2(h1, h2);
      }
      vec2 computeParticleOffset(vec2 cellIndex, float timeScale) {
        vec2 randVec = hash2D_vec2(cellIndex);
        vec2 animated = randVec * uTime * timeScale;
        return sin(animated) * 0.4;
      }
      float generateAscendingGlow(vec2 coordinates, float gridDensity) {
        vec2 scaledCoords = coordinates * gridDensity;
        vec2 cellIndex = floor(scaledCoords);
        vec2 localPos = fract(scaledCoords);
        localPos -= 0.5;
        vec2 particlePos = computeParticleOffset(cellIndex, 0.7);
        vec2 deltaPos = (particlePos - localPos) * 70.0;
        float distSq = dot(deltaPos, deltaPos);
        float intensity = 1.0 / distSq;
        float phase = particlePos.x * 10.0;
        float oscillation = sin(uTime * 10.0 + phase) * 0.5 + 0.9;
        return intensity * oscillation;
      }
      float computeLaserStreaks(vec2 coords, vec2 pixelPos) {
        vec2 workCoords = coords;
        workCoords.x = (workCoords.x - 0.5) * 2.0;
        workCoords.x = abs(workCoords.x);
        float edgeFactor = 1.0 - workCoords.x;
        workCoords.x *= uFlowDensity;
        workCoords.y = 1.0 - workCoords.y;
        workCoords.y += workCoords.x;
        float seed = fract(tan(pixelPos.x) * 7.0);
        float animOffset = uResolution.y * (uTime + 60.0) * uFlowSpeed;
        float denominator = mod(seed * animOffset, uResolution.x) - pixelPos.y;
        float streakValue = seed * 10.0 * workCoords.y / denominator * workCoords.y;
        return streakValue;
      }
      float computeRadialGlow(vec2 position, vec2 center, vec2 sc, float power, float strength) {
        vec2 offset = position * sc - center;
        float distSq = dot(offset, offset);
        return strength / pow(distSq, power);
      }
      float computeHorizonLaser(vec2 position, float horizonY, float intensity) {
        float curveAmount = 0.08;
        float curvedY = horizonY + curveAmount * position.x * position.x;
        float dist = abs(position.y - curvedY) * 50.0;
        float distSq = dist * dist + 0.1;
        float core = intensity / distSq;
        float horizExtent = 1.0 - smoothstep(1.0, 2.5, abs(position.x));
        return core * horizExtent;
      }
      void main() {
        vec2 screenUV = vUv;
        vec2 centeredUV = (screenUV - 0.5) * 2.0;
        float aspectRatio = uResolution.x / uResolution.y;
        centeredUV.x *= aspectRatio;
        vec2 transformedUV = centeredUV / uScale;
        transformedUV.y -= uHorizonHeight / uScale;
        float upperFade = clamp(mapRange(0.0, 0.3, 0.0, 0.5, transformedUV.y + 0.10), 0.0, 1.0);
        vec2 vignetteCoords = (screenUV - 0.5) * 2.0;
        float vignetteRadius = length(vignetteCoords);
        float vignetteMask = smoothstep(-0.6 + uCircleScale, 0.2 + uCircleScale, 1.0 - vignetteRadius);
        vec2 particleCoords = vec2(transformedUV.x, transformedUV.y - uTime * uRiseSpeed);
        float ascendingEffect = generateAscendingGlow(particleCoords, uRiseScale);
        vec2 scaledScreenUV = (screenUV - 0.5) / uScale + 0.5;
        vec2 pixelCoords = scaledScreenUV * uResolution;
        float laserStreaks = computeLaserStreaks(scaledScreenUV, pixelCoords);
        float particleLayer = clamp(ascendingEffect * uRiseIntensity, 0.0, 1.0);
        float laserLayer = clamp(laserStreaks * uFlowIntensity, 0.0, 1.0);
        float combinedEffect = (particleLayer + laserLayer) * upperFade;
        vec3 horizonGlow = uHorizonColor;
        float horizonInt = computeRadialGlow(transformedUV, vec2(0.0, -5.0), vec2(1.0, 50.0), 0.5, uHorizonIntensity);
        horizonGlow *= horizonInt;
        vec3 haloGlow = uHaloColor;
        float haloGlowInt = computeRadialGlow(transformedUV, vec2(0.0, -1.0), vec2(1.0, 10.0), 1.2, uHaloIntensity * 2.0);
        haloGlow *= haloGlowInt;
        float laserLineInt = computeHorizonLaser(transformedUV, -0.92, uHaloIntensity * 0.8);
        vec3 laserLine = uHaloColor * clamp(laserLineInt, 0.0, 1.0);
        vec3 effectColor = uColor * combinedEffect * haloGlow;
        vec3 composedColor = (effectColor + horizonGlow + laserLine) * vignetteMask * uBrightness;
        float alpha = max(max(composedColor.r, composedColor.g), composedColor.b);
        vec3 normalizedColor = composedColor / max(alpha, 0.001);
        alpha = smoothstep(0.0, 1.0, alpha);
        gl_FragColor = vec4(normalizedColor, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uColor: { value: hexToRgb(color) },
        uHorizonColor: { value: hexToRgb(horizonColor) },
        uHaloColor: { value: hexToRgb(haloColor) },
        uRiseSpeed: { value: riseSpeed },
        uRiseScale: { value: riseScale },
        uRiseIntensity: { value: riseIntensity },
        uFlowSpeed: { value: flowSpeed },
        uFlowDensity: { value: flowDensity },
        uFlowIntensity: { value: flowIntensity },
        uHorizonIntensity: { value: horizonIntensity },
        uHaloIntensity: { value: haloIntensity },
        uHorizonHeight: { value: horizonHeight },
        uCircleScale: { value: circleScale },
        uScale: { value: scale },
        uBrightness: { value: brightness },
      },
      transparent: true,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleResize = () => {
      if (!container || !renderer || !material) return;
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      material.uniforms.uResolution.value.set(rect.width, rect.height);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      }
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uColor.value = hexToRgb(color);
    u.uHorizonColor.value = hexToRgb(horizonColor);
    u.uHaloColor.value = hexToRgb(haloColor);
    u.uRiseSpeed.value = riseSpeed;
    u.uRiseScale.value = riseScale;
    u.uRiseIntensity.value = riseIntensity;
    u.uFlowSpeed.value = flowSpeed;
    u.uFlowDensity.value = flowDensity;
    u.uFlowIntensity.value = flowIntensity;
    u.uHorizonIntensity.value = horizonIntensity;
    u.uHaloIntensity.value = haloIntensity;
    u.uHorizonHeight.value = horizonHeight;
    u.uCircleScale.value = circleScale;
    u.uScale.value = scale;
    u.uBrightness.value = brightness;
  }, [
    color, horizonColor, haloColor, riseSpeed, riseScale, riseIntensity,
    flowSpeed, flowDensity, flowIntensity, horizonIntensity, haloIntensity,
    horizonHeight, circleScale, scale, brightness,
  ]);

  return (
    <div ref={containerRef} className={cn('absolute inset-0', className)} />
  );
};

export default RisingLines;
