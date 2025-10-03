import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { colors, generateArcsData, locations } from '../constants/locationsData';
import StarsEffect from './StarsEffect';
import { globeConfig } from '../constants/globeConfig';

const GlobeComponent = ({
  dimensions,
  starsData,
  onLocationClick,

  // can override these when you use <GlobeComponent ... />
  satellitePath = '/nasa-eos-am-1terra-satellite/source/nasa_eos_am-1terra_satellite.glb',
  albedoPath = '/nasa-eos-am-1terra-satellite/textures/gltf_embedded_2.png',
  emissivePath = '/nasa-eos-am-1terra-satellite/textures/gltf_embedded_0.png',

  // Orbit tuning
  orbitAltitudeRatio = 1.50,        // >1 = above surface
  orbitInclinationDeg = 35,         // tilt of orbit plane
  orbitRAANDeg = -20,               // rotation around Y (ascending node)
  orbitalPeriodMs = 30000,          // ~30s per revolution
  orbitThicknessRatio = 0.01,       //  thickness of torus ring (relative to globe radius)
  satelliteScaleRatio = 0.08       // satellite size vs globe radius
}) => {
  const globeRef = useRef(null);

  // UI state
  const [selected, setSelected] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const idleTimer = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Scene adornments
  const haloRef = useRef(null);
  const burstsRef = useRef([]);
  const rafRef = useRef(null);

  // Satellite orbit refs + UI
  const satOrbitRef = useRef({ group: null, pivot: null, mesh: null, ring: null, torus: null });
  const satAnimRef = useRef(null);
  const satAngleRef = useRef(0);
  const satLastTsRef = useRef(0);
  const [satInfoOpen, setSatInfoOpen] = useState(false);

  // Debug state
  // const [debugInfo, setDebugInfo] = useState('Loading...');

  // Data
  const arcsData = useMemo(() => generateArcsData(), []);
  const points = useMemo(() => locations, []);
  const labelColorFn = useCallback(() => globeConfig.labelColor, []);

  // Helpers
  const latLngToVector3 = useCallback((lat, lng, altRatio = 1.0) => {
    const radius = globeRef.current?.getGlobeRadius?.() || 100;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const r = radius * altRatio;
    const x = -r * Math.sin(phi) * Math.cos(theta);
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }, []);

  const markUserActive = useCallback(() => {
    if (!globeRef.current) return;
    globeRef.current.controls().autoRotate = false;
    setAutoRotate(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      globeRef.current.controls().autoRotate = true;
      setAutoRotate(true);
    }, 1000);
  }, []);

  // Debug function to check scene
  const checkSceneContents = useCallback(() => {
    const globe = globeRef.current;
    // if (!globe) {
    //   setDebugInfo('Globe ref not available');
    //   return;
    // }

    const scene = globe.scene();
    const children = scene.children.map(child => ({
      name: child.name || 'unnamed',
      type: child.type,
      visible: child.visible,
      childrenCount: child.children?.length || 0
    }));

    const orbitGroup = scene.getObjectByName('satellite-orbit-group');
    let orbitInfo = 'No orbit group found';
    
    if (orbitGroup) {
      orbitInfo = `Orbit group found with ${orbitGroup.children.length} children: `;
      orbitInfo += orbitGroup.children.map(child => child.type).join(', ');
    }

    // setDebugInfo(`
    //   Scene children: ${scene.children.length}
    //   Orbit: ${orbitInfo}
    //   Satellite mesh: ${satOrbitRef.current.mesh ? 'LOADED' : 'MISSING'}
    // `);

    // console.log('=== SCENE DEBUG ===');
    // console.log('Scene children:', scene.children);
    // console.log('Orbit group:', orbitGroup);
    // console.log('Satellite ref:', satOrbitRef.current);
    // console.log('===================');
  }, []);

  // Visual FX
  const updateSelectionHalo = useCallback((sel) => {
    const globe = globeRef.current;
    if (!globe) return;

    if (!haloRef.current) {
      const group = new THREE.Group();
      group.name = 'selection-halo';

      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.14, 16, 100),
        new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.65 })
      );
      group.add(torus);

      const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.06, 16, 100),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
      );
      group.add(innerRing);

      globe.scene().add(group);
      haloRef.current = group;
    }

    if (sel) {
      const pos = latLngToVector3(sel.lat, sel.lng, 1.01);
      haloRef.current.position.copy(pos);
      const normal = pos.clone().normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      haloRef.current.setRotationFromQuaternion(q);
      haloRef.current.visible = true;
    } else {
      haloRef.current.visible = false;
    }
  }, [latLngToVector3]);

  const spawnBurst = useCallback((lat, lng) => {
    const globe = globeRef.current;
    if (!globe) return;
    const scene = globe.scene();
    const pos = latLngToVector3(lat, lng, 1.03);

    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize().multiplyScalar(0.25 + Math.random() * 0.35);

      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      velocities[i * 3] = dir.x;
      velocities[i * 3 + 1] = dir.y;
      velocities[i * 3 + 2] = dir.z;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfff3a3,
      size: 0.9,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });

    const points = new THREE.Points(geom, mat);
    points.name = 'burst';
    scene.add(points);

    const burst = { mesh: points, start: performance.now(), life: 900 };
    burstsRef.current.push(burst);

    if (!rafRef.current) {
      const step = () => {
        const now = performance.now();
        let anyAlive = false;

        burstsRef.current.forEach(b => {
          const elapsed = now - b.start;
          const t = Math.min(1, elapsed / b.life);
          const p = b.mesh.geometry.attributes.position;
          const v = b.mesh.geometry.attributes.velocity;
          for (let i = 0; i < p.count; i++) {
            p.array[i * 3] += v.array[i * 3] * 0.9;
            p.array[i * 3 + 1] += v.array[i * 3 + 1] * 0.9;
            p.array[i * 3 + 2] += v.array[i * 3 + 2] * 0.9;
          }
          p.needsUpdate = true;
          b.mesh.material.opacity = 0.95 * (1 - t);
          if (elapsed < b.life) anyAlive = true;
        });

        burstsRef.current = burstsRef.current.filter(b => {
          if (now - b.start >= b.life) {
            b.mesh.geometry.dispose();
            b.mesh.material.dispose();
            globeRef.current?.scene().remove(b.mesh);
            return false;
          }
          return true;
        });

        if (anyAlive) rafRef.current = requestAnimationFrame(step);
        else { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      };
      rafRef.current = requestAnimationFrame(step);
    }
  }, [latLngToVector3]);

  // Handlers
  const flyTo = useCallback((lat, lng, altitude = 2) => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView({ lat, lng, altitude }, 1000);
  }, []);

  const handlePointClick = useCallback((point, event) => {
    if (!point) return;
    markUserActive();
    flyTo(point.lat, point.lng, 2);
    spawnBurst(point.lat, point.lng);
    const sel = { name: point.name, lat: point.lat, lng: point.lng, emoji: point.emoji };
    setSelected(sel);
    updateSelectionHalo(sel);
    onLocationClick?.(point, event);
  }, [flyTo, onLocationClick, spawnBurst, updateSelectionHalo, markUserActive]);

  const handleLabelClick = useCallback((label, event) => {
    if (!label) return;
    markUserActive();
    flyTo(label.lat, label.lng, 2);
    spawnBurst(label.lat, label.lng);
    const sel = { name: label.name, lat: label.lat, lng: label.lng, emoji: label.emoji };
    setSelected(sel);
    updateSelectionHalo(sel);
    onLocationClick?.(label, event);
  }, [flyTo, onLocationClick, spawnBurst, updateSelectionHalo, markUserActive]);

  const handlePointHover = useCallback((point) => {
    const globe = globeRef.current;
    if (!globe) return;

    globe.controls().domElement.style.cursor = point ? 'pointer' : 'grab';

    if (point) {
      // Save hover data
      setHovered({ name: point.name, lat: point.lat, lng: point.lng, emoji: point.emoji });

      // Convert lat/lng to 3D vector
      const pos = latLngToVector3(point.lat, point.lng, 1.02);

      // Project to 2D screen coords
      const camera = globe.camera();
      const renderer = globe.renderer();
      const vec = pos.clone().project(camera);

      const x = (vec.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
      const y = (-vec.y * 0.5 + 0.5) * renderer.domElement.clientHeight;

      setHoverPos({ x, y });
    } else {
      setHovered(null);
    }
  }, [latLngToVector3]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (!points?.length) return;

      if (['ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
        markUserActive();
      }
      const idx = selected ? points.findIndex(p => p.name === selected.name) : -1;

      if (e.key === 'ArrowRight') {
        const next = points[(idx + 1 + points.length) % points.length];
        handlePointClick(next);
      } else if (e.key === 'ArrowLeft') {
        const prev = points[(idx - 1 + points.length) % points.length];
        handlePointClick(prev);
      } else if (e.key === 'Enter' && selected) {
        flyTo(selected.lat, selected.lng, 1.8);
      } else if (e.key === ' ') {
        const g = globeRef.current;
        if (g) {
          const newAR = !autoRotate;
          g.controls().autoRotate = newAR;
          setAutoRotate(newAR);
        }
      } else if (e.key === 'Escape') {
        setSelected(null);
        updateSelectionHalo(null);
        setSatInfoOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [points, selected, handlePointClick, flyTo, autoRotate, updateSelectionHalo, markUserActive]);

  // Pause auto-rotate on interactions
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const dom = g.controls().domElement;
    const handler = () => markUserActive();
    dom.addEventListener('pointerdown', handler, { passive: true });
    dom.addEventListener('wheel', handler, { passive: true });
    dom.addEventListener('pointermove', handler, { passive: true });
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      dom.removeEventListener('pointerdown', handler);
      dom.removeEventListener('wheel', handler);
      dom.removeEventListener('pointermove', handler);
    };
  }, [markUserActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      burstsRef.current.forEach(b => {
        b.mesh.geometry?.dispose?.();
        b.mesh.material?.dispose?.();
        globeRef.current?.scene()?.remove(b.mesh);
      });
      burstsRef.current = [];
      if (haloRef.current) {
        haloRef.current.children?.forEach(child => {
          child.geometry?.dispose?.();
          child.material?.dispose?.();
        });
        globeRef.current?.scene()?.remove(haloRef.current);
        haloRef.current = null;
      }
    };
  }, []);

  // --- Satellite orbit setup: GLB + textures + thick torus orbit ---
  useEffect(() => {
    let disposed = false;
    let orbitGroup = null;
    let pivot = null;

    const init = async () => {
      const globe = globeRef.current;
      if (!globe) {
        console.error('Globe not available for satellite initialization');
        return;
      }

      const scene = globe.scene();
      const radius = globe.getGlobeRadius?.() || 100;

      console.log('Initializing satellite orbit with radius:', radius);

      // Orbit parameters
      const orbitRadius = radius * orbitAltitudeRatio;
      const inclination = THREE.MathUtils.degToRad(orbitInclinationDeg);
      const ascNode = THREE.MathUtils.degToRad(orbitRAANDeg);

      // Group defining the orbit plane
      orbitGroup = new THREE.Group();
      orbitGroup.name = 'satellite-orbit-group';
      orbitGroup.rotation.set(inclination, ascNode, 0);
      scene.add(orbitGroup);

      console.log('Orbit group created and added to scene');

      // Thin guide line (kept for visual sharpness)
      const steps = 256;
      const pts = [];
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
      }
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 })
      );
      orbitGroup.add(ring);

      // ✅ Thick orbit ring (torus) — THIS is the "thickness"
      const orbitThickness = radius * orbitThicknessRatio;
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(orbitRadius, orbitThickness, 24, 200),
        new THREE.MeshPhysicalMaterial({
          color: 0x7dd3fc,
          roughness: 0.35,
          metalness: 0.2,
          transparent: true,
          opacity: 0.22,
          emissive: new THREE.Color(0x7dd3fc),
          emissiveIntensity: 0.55
        })
      );
      // Torus lies in XY plane by default — spin to XZ to match our line
      torus.rotation.x = Math.PI / 2;
      orbitGroup.add(torus);

      console.log('Orbit rings created - thin line and thick torus');

      // Pivot that rotates the satellite around Earth
      pivot = new THREE.Object3D();
      orbitGroup.add(pivot);

      // Lazy import GLTFLoader (SSR-safe)
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();

      console.log('Attempting to load satellite from:', satellitePath);

      loader.load(
        satellitePath,
        async (gltf) => {
          if (disposed) {
            console.log('Satellite loaded but component disposed');
            return;
          }
          
          console.log('Satellite GLB loaded successfully:', gltf);
          const sat = gltf.scene;
          
          if (!sat || sat.children.length === 0) {
            console.error('Satellite model is empty or invalid - creating fallback');
            createFallbackSatellite();
            return;
          }

          // Size satellite relative to globe
          const scale = radius * satelliteScaleRatio;
          sat.scale.setScalar(scale);
          console.log('Satellite scaled to:', scale);

          // Start position on orbit
          sat.position.set(orbitRadius, 0, 0);
          sat.lookAt(0, 0, 0);

          // Load & apply textures to ensure color (no gray model)
          const tLoader = new THREE.TextureLoader();
          const loadTex = (url, isColor = false) =>
            new Promise((resolve, reject) => {
              tLoader.load(
                url,
                (tex) => {
                  console.log(`Texture loaded: ${url}`);
                  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
                  tex.flipY = false;
                  tex.anisotropy = 4;
                  resolve(tex);
                },
                undefined,
                (err) => {
                  console.error(`Failed to load texture: ${url}`, err);
                  resolve(null); // Continue without texture
                }
              );
            });

          console.log('Loading textures...');
          const [colorMap, emissiveMap] = await Promise.all([
            loadTex(albedoPath, true),
            loadTex(emissivePath, true)
          ]);

          console.log('Textures loaded, applying materials...');

          sat.traverse((o) => {
            if (!o.isMesh) return;
            if (o.material) {
              if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
              else o.material.dispose?.();
            }
            o.material = new THREE.MeshStandardMaterial({
              map: colorMap || null,
              metalness: 0.55,
              roughness: 0.5,
              emissiveMap: emissiveMap || null,
              emissive: emissiveMap ? new THREE.Color(0xffffff) : new THREE.Color(0x000000),
              emissiveIntensity: emissiveMap ? 0.8 : 0.0
            });
            o.castShadow = false;
            o.receiveShadow = false;
          });

          pivot.add(sat);
          satOrbitRef.current = { group: orbitGroup, pivot, mesh: sat, ring, torus };
          
          console.log('Satellite successfully added to scene');
          checkSceneContents();
        },
        (progress) => {
          console.log('Satellite loading progress:', progress);
        },
        (err) => {
          console.error('Satellite GLB load failed:', err);
          console.error('Attempted path:', satellitePath);
          console.log('Creating fallback satellite...');
          createFallbackSatellite();
        }
      );

      const createFallbackSatellite = () => {
        if (disposed) return;
        
        console.log('Creating fallback satellite geometry');
        
        // Create a simple visible satellite geometry
        const group = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(15, 8, 20);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x4a90e2,
          metalness: 0.7,
          roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(30, 1, 15);
        const panelMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x2c5aa0,
          emissive: 0x1a3a6a,
          emissiveIntensity: 0.3
        });
        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.position.x = -20;
        group.add(leftPanel);
        
        const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        rightPanel.position.x = 20;
        group.add(rightPanel);
        
        // Antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
        const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.z = 15;
        antenna.rotation.x = Math.PI / 2;
        group.add(antenna);

        const scale = radius * satelliteScaleRatio * 2; // Make fallback larger
        group.scale.setScalar(scale);
        group.position.set(orbitRadius, 0, 0);
        group.lookAt(0, 0, 0);

        pivot.add(group);
        satOrbitRef.current = { group: orbitGroup, pivot, mesh: group, ring, torus };
        
        console.log('Fallback satellite created and added');
        checkSceneContents();
      };

      // Animate: revolution
      const angularSpeed = (2 * Math.PI) / orbitalPeriodMs; // rad per ms
      const step = (now) => {
        if (satLastTsRef.current === 0) satLastTsRef.current = now;
        const dt = now - satLastTsRef.current;
        satLastTsRef.current = now;

        satAngleRef.current += dt * angularSpeed;
        if (pivot) pivot.rotation.y = satAngleRef.current;

        if (satOrbitRef.current.mesh) {
          // Keep satellite facing Earth (nice visual)
          satOrbitRef.current.mesh.lookAt(0, 0, 0);
        }

        if (!disposed) satAnimRef.current = requestAnimationFrame(step);
      };
      satAnimRef.current = requestAnimationFrame(step);
    };

    init();

    return () => {
      console.log('Cleaning up satellite orbit');
      disposed = true;
      if (satAnimRef.current) cancelAnimationFrame(satAnimRef.current);
      satAnimRef.current = null;

      const globe = globeRef.current;
      if (globe && satOrbitRef.current.group) {
        const grp = satOrbitRef.current.group;
        grp.traverse(obj => {
          obj.geometry?.dispose?.();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
          else obj.material?.dispose?.();
        });
        globe.scene().remove(grp);
      }
      satOrbitRef.current = { group: null, pivot: null, mesh: null, ring: null, torus: null };
    };
  }, [satellitePath, albedoPath, emissivePath, orbitAltitudeRatio, orbitInclinationDeg, orbitRAANDeg, orbitalPeriodMs, orbitThicknessRatio, satelliteScaleRatio, checkSceneContents]);

  // Set initial POV (zoomed out)
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();

    // Set auto-rotation speed (default is 2.0)
    controls.autoRotateSpeed = 0.4; // Slower rotation

    globeRef.current.pointOfView(
      { lat: 20, lng: 0, altitude: 4.5 },
      1
    );

    // Check scene after globe is initialized
    setTimeout(checkSceneContents, 1000);
  }, [checkSceneContents]);

  // Click satellite to open info (raycast)
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const dom = g.renderer().domElement;
    const camera = g.camera();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const pick = (e) => {
      const sat = satOrbitRef.current?.mesh;
      if (!sat) {
        console.log('No satellite mesh for raycasting');
        return;
      }

      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(sat, true);
      if (hits.length) {
        e.preventDefault();
        console.log('Satellite clicked!');
        markUserActive();
        setSatInfoOpen(true);
      }
    };

    const hover = (e) => {
      const sat = satOrbitRef.current?.mesh;
      if (!sat) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(sat, true);
      dom.style.cursor = hits.length ? 'pointer' : (hovered ? 'pointer' : 'grab');
    };

    dom.addEventListener('pointerdown', pick);
    dom.addEventListener('pointermove', hover, { passive: true });
    return () => {
      dom.removeEventListener('pointerdown', pick);
      dom.removeEventListener('pointermove', hover);
    };
  }, [markUserActive, hovered]);

  // Label helpers
  const labelSize = useCallback((d) => {
    if (selected?.name === d.name) return globeConfig.labelSize * 1.35;
    if (hovered?.name === d.name) return globeConfig.labelSize * 1.2;
    return globeConfig.labelSize;
  }, [hovered, selected]);

  const labelText = useCallback((d) => `${d.emoji ? d.emoji + ' ' : ''}${d.name}`, []);
  const labelColor = useCallback((d) => {
    if (selected?.name === d.name) return '#ffd54a';
    if (hovered?.name === d.name) return '#ffffff';
    return labelColorFn(d);
  }, [hovered, selected, labelColorFn]);

  return (
    <>
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}

        // Globe base
        globeImageUrl={globeConfig.globeImageUrl}
        backgroundColor={globeConfig.backgroundColor}
        enablePointerInteraction={globeConfig.enablePointerInteraction}

        // Arcs
        arcsData={arcsData}
        arcStartLat={d => d.startLat}
        arcStartLng={d => d.startLng}
        arcEndLat={d => d.endLat}
        arcEndLng={d => d.endLng}
        arcColor={d => d.color}
        arcStroke={globeConfig.arcStroke}
        arcDashLength={globeConfig.arcDashLength}
        arcDashGap={globeConfig.arcDashGap}
        arcDashAnimateTime={globeConfig.arcDashAnimateTime}
        arcDashInitialGap={() => Math.random()}

        // Points
        pointsData={points}
        pointLat={d => d.lat}
        pointLng={d => d.lng}
        pointColor={() => colors[Math.floor(Math.random() * colors.length)]}
        pointRadius={globeConfig.pointRadius}
        pointAltitude={globeConfig.pointAltitude}
        onPointClick={handlePointClick}
        onPointHover={handlePointHover}

        // Rings
        ringsData={points}
        ringLat={d => d.lat}
        ringLng={d => d.lng}
        ringMaxRadius={globeConfig.ringMaxRadius}
        ringPropagationSpeed={globeConfig.ringPropagationSpeed}
        ringRepeatPeriod={globeConfig.ringRepeatPeriod}
        ringColor={() => colors[Math.floor(Math.random() * colors.length)]}

        // Labels
        labelsData={points}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={labelText}
        labelSize={labelSize}
        labelColor={labelColor}
        labelAltitude={globeConfig.labelAltitude}
        labelDotRadius={0.34}
        labelResolution={2}
        onLabelClick={handleLabelClick}
        onLabelHover={handlePointHover}

        // Atmosphere
        showAtmosphere={globeConfig.showAtmosphere}
        atmosphereColor={globeConfig.atmosphereColor}
        atmosphereAltitude={globeConfig.atmosphereAltitude}

        // Camera caps
        cameraMinDistance={globeConfig.cameraMinDistance}
        cameraMaxDistance={globeConfig.cameraMaxDistance}
      />

      {/* Stars */}
      <StarsEffect globeRef={globeRef} starsData={starsData} />

      {/* Debug Info Overlay */}
      {/* <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 1000,
        maxWidth: '300px'
      }}>
        <div><strong>Satellite Debug:</strong></div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{debugInfo}</div>
        <button 
          onClick={checkSceneContents}
          style={{
            marginTop: '5px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Refresh Debug
        </button>
      </div> */}

      {/* Hover tip */}
      {hovered && !selected && (
        <div
          className="nasa-hover"
          style={{
            position: 'absolute',
            left: `${hoverPos.x + 12}px`,
            top: `${hoverPos.y + 12}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none'
          }}
        >
          <div className="nasa-hover-title">
            {hovered.emoji ? `${hovered.emoji} ` : ''}{hovered.name}
          </div>
          <div>lat: {hovered.lat.toFixed(2)} · lng: {hovered.lng.toFixed(2)}</div>
          <div className="nasa-hover-sub">Click to explore</div>
        </div>
      )}

      {/* Selected toast */}
      {selected && (
        <div className="nasa-toast">
          <div className="nasa-toast-title">
            {selected.emoji ? `${selected.emoji} ` : ''}{selected.name}
          </div>
          <div>Enter = focus · Esc = clear · Space = auto-rotate</div>
        </div>
      )}

      {/* NASA-themed modal on satellite click */}
      {satInfoOpen && (
        <div className="nasa-backdrop" onClick={() => setSatInfoOpen(false)}>
          <div
            className="nasa-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Terra Instrument Suite"
          >
            <div className="nasa-border-glow" />
            <div className="nasa-bg">
              <div className="nasa-stars nasa-stars-1" />
              <div className="nasa-stars nasa-stars-2" />
              <div className="nasa-scanline" />
            </div>

            <div className="nasa-header">
              <div className="nasa-badge">
                <div className="nasa-badge-ring" />
                <div className="nasa-badge-core">NASA</div>
              </div>
              <div className="nasa-title">
                <div className="nasa-title-main">Terra (EOS AM-1)</div>
                <div className="nasa-title-sub">Instrument Suite — Quick Overview</div>
              </div>
              <button onClick={() => setSatInfoOpen(false)} className="nasa-close" aria-label="Close">×</button>
            </div>

            <div className="nasa-content">
              <Item k="MODIS" v="Monitors land, oceans, and atmosphere for vegetation, temperature, and clouds." delay={0} />
              <Item k="ASTER" v="Captures high-resolution images of Earth's surface for geology and land cover." delay={60} />
              <Item k="CERES" v="Measures Earth's energy balance to study climate and clouds." delay={120} />
              <Item k="MISR" v="Analyzes aerosols, clouds, and surface features from multiple angles." delay={180} />
              <Item k="MOPITT" v="Tracks atmospheric carbon monoxide to monitor air pollution." delay={240} />
            </div>

            <div className="nasa-footer">
              <div className="nasa-dot" />
              <div className="nasa-tip">Tip: Click outside this window or press <b>Esc</b> to close.</div>
              <div className="nasa-chip">Sun-sync orbit</div>
              <div className="nasa-chip">Polar crossing</div>
              <div className="nasa-chip">Climate science</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Animated item line used inside modal
function Item({ k, v, delay = 0 }) {
  return (
    <div className="nasa-item" style={{ animationDelay: `${delay}ms` }}>
      <div className="nasa-item-key">{k}</div>
      <div className="nasa-item-val">{v}</div>
    </div>
  );
}

export default GlobeComponent;