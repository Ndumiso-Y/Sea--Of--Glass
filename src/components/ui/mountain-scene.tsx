import React, { useRef, useEffect } from "react";
import * as THREE from "three";

/**
 * GenerativeMountainScene
 * * Renders a solid, undulating mountain landscape.
 * * "No gaps" (wireframe: false) implementation.
 */
export function GenerativeMountainScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;
    
    // SCENE SETUP
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.5, 3);
    camera.rotation.x = -0.3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // GEOMETRY
    const geometry = new THREE.PlaneGeometry(12, 8, 128, 128); 

    // SHADER MATERIAL
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      wireframe: false,
      uniforms: {
        time: { value: 0 },
        pointLightPosition: { value: new THREE.Vector3(0, 0, 5) },
        color: { value: new THREE.Color("#ffffff") }, // Pure clear glass / white
      },
      vertexShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // --- PERLIN NOISE FUNCTIONS ---
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
                      i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }

        void main() {
            vNormal = normal;
            vPosition = position;
            
            float noiseFreq = 1.2;
            float noiseAmp = 0.175; // 50% lower amplitude (calmer waves)
            
            // Layer 1: Base rolling waves moving "forward"
            float displacement = snoise(vec3(position.x * noiseFreq * 0.5, position.y * noiseFreq * 1.5 - time * 0.8, 0.0)) * noiseAmp;
            
            // Layer 2: Medium chop
            displacement += snoise(vec3(position.x * noiseFreq * 1.5 + time * 0.2, position.y * noiseFreq * 2.0 - time * 1.2, 0.0)) * (noiseAmp * 0.4);

            // Layer 3: Micro ripples
            displacement += snoise(vec3(position.x * noiseFreq * 4.0, position.y * noiseFreq * 4.0 - time * 1.5, 0.0)) * (noiseAmp * 0.15);

            vec3 newPosition = position + normal * displacement;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 pointLightPosition;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // Pseudo-random hash for crystal sparkles
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(cameraPosition - vPosition);
            
            // 1. GLOBAL LIGHT (Always bright and sparkling)
            // A static directional light representing "sunlight" from above/front
            vec3 globalLightDir = normalize(vec3(0.5, 1.0, 0.8));
            float globalDiffuse = max(dot(normal, globalLightDir), 0.0);
            
            // Global specular highlights
            vec3 globalHalfVector = normalize(globalLightDir + viewDir);
            float globalSpec = pow(max(dot(normal, globalHalfVector), 0.0), 64.0);
            
            // 2. MOUSE HOVER LIGHT (Interactive point light)
            vec3 hoverLightDir = normalize(pointLightPosition - vPosition);
            float hoverDiffuse = max(dot(normal, hoverLightDir), 0.0);
            
            // Interactive specular highlights
            vec3 hoverHalfVector = normalize(hoverLightDir + viewDir);
            float hoverSpec = pow(max(dot(normal, hoverHalfVector), 0.0), 128.0);
            
            // 3. COMBINE LIGHTING
            // Take whichever diffuse is stronger, but boost ambient baseline significantly
            float totalDiffuse = max(globalDiffuse * 0.6, hoverDiffuse * 1.2);
            // Add specular reflections together
            float totalSpec = (globalSpec * 0.6) + (hoverSpec * 1.8);
            
            // Soft fresnel for glass-like rim lighting
            float fresnel = 1.0 - dot(normal, vec3(0.0, 0.0, 1.0));
            fresnel = pow(max(fresnel, 0.0), 2.0);
            
            // High ambient baseline (0.75) means the waves are *always* bright from the start
            vec3 finalColor = color * (totalDiffuse * 0.35 + 0.75) + vec3(1.0) * fresnel * 0.3 + vec3(1.0) * totalSpec;
            
            // 4. CRYSTAL DEMOND SPARKLES
            // Slice the plane into tiny glittering fragments
            vec2 grid = floor(vPosition.xy * 45.0); 
            float rand = hash(grid);
            
            // Only allow ~2% of the fragments to actually sparkle
            float isSparkle = step(0.98, rand);
            
            // Make them twinkle beautifully out of sync
            // time scales by 20.0 so they blink roughly once per second
            float twinkle = sin(time * 25.0 + rand * 100.0) * 0.5 + 0.5;
            
            // Sparkles show up strongest on lit rims and lit crests!
            float sparkleFactor = isSparkle * twinkle * pow(totalDiffuse + 0.5, 2.0);
            
            // Add intense white light where the sparkles hit
            finalColor += vec3(1.0) * sparkleFactor * 2.5; 
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      transparent: true,
      opacity: 0.85, // Slightly more transparent for a true glass look
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    // Lower the mesh by 50% so it's a calm sea below the horizon
    mesh.position.y = -1.2;
    scene.add(mesh);

    const pointLight = new THREE.PointLight(0xffffff, 3.5, 100);
    // Adjusted point light so the lowered mesh still catches brilliant light
    pointLight.position.set(0, 1.5, 5);
    // @ts-ignore
    lightRef.current = pointLight;
    scene.add(pointLight);

    let frameId: number;
    const animate = (t: number) => {
      material.uniforms.time.value = t * 0.0003;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate(0);

    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        const lightX = x * 5;
        const lightY = y * 5;
        const pos = new THREE.Vector3(lightX, 2, 2 - y * 2);
        
        if (lightRef.current) {
          lightRef.current.position.copy(pos);
        }
        if (material.uniforms.pointLightPosition) {
          material.uniforms.pointLightPosition.value = pos;
        }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (currentMount) currentMount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />;
}

export default GenerativeMountainScene;
