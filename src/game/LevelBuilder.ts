/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface CollectibleItemData {
  id: string;
  nameAr: string;
  nameEn: string;
  position: THREE.Vector3;
  mesh: THREE.Group;
  collected: boolean;
  color: number;
}

export interface HidingZone {
  name: string;
  bounds: THREE.Box3;
}

export interface LevelData {
  root: THREE.Group;
  colliders: THREE.Box3[];
  collectibles: CollectibleItemData[];
  exitDoor: {
    group: THREE.Group;
    position: THREE.Vector3;
    indicatorLight: THREE.PointLight;
    indicatorMesh: THREE.Mesh;
    bounds: THREE.Box3;
    isUnlocked: boolean;
  };
  hidingZones: HidingZone[];
  patrolWaypoints: THREE.Vector3[];
  flickerLight: THREE.PointLight;
  shoppingCarts: THREE.Group[];
}

export function buildSupermarketLevel(): LevelData {
  const root = new THREE.Group();
  root.name = 'SupermarketLevel';

  const colliders: THREE.Box3[] = [];
  const hidingZones: HidingZone[] = [];
  const shoppingCarts: THREE.Group[] = [];

  // Supermarket Dimensions: 32m x 24m, height 4.2m
  const MAP_W = 32;
  const MAP_D = 24;
  const WALL_H = 4.2;

  // 1. Vibrant Waxed Supermarket Floor Tile Texture
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const fCtx = floorCanvas.getContext('2d')!;

  // Clean, realistic light cream supermarket tile
  fCtx.fillStyle = '#e2e8f0';
  fCtx.fillRect(0, 0, 512, 512);

  // Checkerboard accents / tile grid
  fCtx.fillStyle = '#cbd5e1';
  for (let y = 0; y < 512; y += 64) {
    for (let x = 0; x < 512; x += 64) {
      if ((x / 64 + y / 64) % 2 === 0) {
        fCtx.fillRect(x, y, 64, 64);
      }
    }
  }

  // Thin clean grout lines
  fCtx.strokeStyle = '#94a3b8';
  fCtx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) {
    fCtx.beginPath();
    fCtx.moveTo(i, 0);
    fCtx.lineTo(i, 512);
    fCtx.stroke();
    fCtx.beginPath();
    fCtx.moveTo(0, i);
    fCtx.lineTo(512, i);
    fCtx.stroke();
  }

  const floorTexture = new THREE.CanvasTexture(floorCanvas);
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(8, 6);
  floorTexture.colorSpace = THREE.SRGBColorSpace;

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.35, // Polished clean wax sheen
    metalness: 0.1,
  });

  const floorGeo = new THREE.PlaneGeometry(MAP_W, MAP_D);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // 2. Ceiling with acoustic panel pattern
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
  });
  const ceiling = new THREE.Mesh(floorGeo, ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = WALL_H;
  root.add(ceiling);

  // Helper to add solid wall colliders
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Clean modern slate wall
    roughness: 0.75,
  });
  const wallStripeMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb, // Bright supermarket blue brand stripe
    roughness: 0.6,
  });

  function addWall(x: number, z: number, w: number, d: number, mat = wallMat) {
    const geo = new THREE.BoxGeometry(w, WALL_H, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, WALL_H / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    // Decorative bright stripe along top
    const stripeGeo = new THREE.BoxGeometry(w + 0.02, 0.4, d + 0.02);
    const stripe = new THREE.Mesh(stripeGeo, wallStripeMat);
    stripe.position.set(x, WALL_H - 0.6, z);
    root.add(stripe);

    const box = new THREE.Box3();
    box.setFromObject(mesh);
    colliders.push(box);
    return mesh;
  }

  // Outer boundary walls
  addWall(0, -MAP_D / 2, MAP_W, 0.6); // North
  addWall(0, MAP_D / 2, MAP_W, 0.6);  // South
  addWall(-MAP_W / 2, 0, 0.6, MAP_D); // West
  addWall(MAP_W / 2, 0, 0.6, MAP_D);  // East

  // Storage Room Partition Wall
  addWall(8, -5, 0.5, 14, wallMat);
  addWall(8, 9, 0.5, 6, wallMat);

  // Storage doorway header
  const doorHeaderGeo = new THREE.BoxGeometry(0.5, 1.4, 4);
  const doorHeader = new THREE.Mesh(doorHeaderGeo, wallMat);
  doorHeader.position.set(8, WALL_H - 0.7, 4);
  root.add(doorHeader);

  // 3. Colorful Refrigerator Display Wall (along North Wall from X = -4 to X = 6)
  const fridgeGroup = new THREE.Group();
  fridgeGroup.position.set(1.0, 0, -MAP_D / 2 + 1.0);

  const fridgeFrameGeo = new THREE.BoxGeometry(10.0, 2.8, 1.2);
  const fridgeFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
  const fridgeFrame = new THREE.Mesh(fridgeFrameGeo, fridgeFrameMat);
  fridgeFrame.position.y = 1.4;
  fridgeGroup.add(fridgeFrame);

  // Glowing Interior light for refrigerators
  const fridgeLight = new THREE.PointLight(0x38bdf8, 2.5, 9);
  fridgeLight.position.set(0, 1.5, 0.8);
  fridgeGroup.add(fridgeLight);

  // Glass Front Panels with high transmission/shine
  const glassGeo = new THREE.BoxGeometry(9.6, 2.4, 0.08);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    transmission: 0.85,
    transparent: true,
    opacity: 0.6,
    metalness: 0.1,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, 1.4, 0.55);
  fridgeGroup.add(glass);

  // Rows of colorful beverage cans inside fridge
  const canColors = [0xef4444, 0x10b981, 0xf59e0b, 0x3b82f6, 0x8b5cf6, 0xec4899];
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < 16; c++) {
      const col = canColors[(c + row) % canColors.length];
      const canGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.28, 8);
      const canMat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.8, roughness: 0.2 });
      const canMesh = new THREE.Mesh(canGeo, canMat);
      canMesh.position.set(-4.2 + (c / 15) * 8.4, 0.5 + row * 0.7, 0.2);
      fridgeGroup.add(canMesh);
    }
  }

  root.add(fridgeGroup);

  const fridgeBox = new THREE.Box3();
  fridgeBox.min.set(1.0 - 5.1, 0, -MAP_D / 2);
  fridgeBox.max.set(1.0 + 5.1, 2.8, -MAP_D / 2 + 1.7);
  colliders.push(fridgeBox);

  // 4. Vibrant Low-Poly Grocery Aisles
  const shelfWoodMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
  const shelfSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
  const boxColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0xa855f7, 0xec4899];

  interface AisleInfo {
    x: number;
    z: number;
    titleAr: string;
    signColor: number;
  }

  const aisles: AisleInfo[] = [
    { x: -8, z: -6, titleAr: 'المشروبات والعصائر', signColor: 0x0284c7 },
    { x: -8, z: -1, titleAr: 'المعلبات والأغذية', signColor: 0xd97706 },
    { x: -8, z: 4, titleAr: 'المنظفات والعناية', signColor: 0x7c3aed },
    { x: -8, z: 9, titleAr: 'المخبوزات والحلويات', signColor: 0x16a34a },
  ];

  function createShelfRow(info: AisleInfo, length: number = 12) {
    const group = new THREE.Group();
    group.position.set(info.x, 0, info.z);

    const shelfHeight = 2.4;
    const shelfDepth = 1.6;

    // Upright End Frames with bright accent color
    const endMat = new THREE.MeshStandardMaterial({ color: info.signColor, roughness: 0.4 });
    const endGeo = new THREE.BoxGeometry(0.14, shelfHeight, shelfDepth);
    const end1 = new THREE.Mesh(endGeo, endMat);
    end1.position.set(-length / 2, shelfHeight / 2, 0);
    const end2 = new THREE.Mesh(endGeo, endMat);
    end2.position.set(length / 2, shelfHeight / 2, 0);
    group.add(end1, end2);

    // Center divider
    const dividerGeo = new THREE.BoxGeometry(length, shelfHeight, 0.08);
    const divider = new THREE.Mesh(dividerGeo, shelfSteelMat);
    divider.position.set(0, shelfHeight / 2, 0);
    group.add(divider);

    // 4 Horizontal Tiers
    const tierGeo = new THREE.BoxGeometry(length, 0.06, shelfDepth);
    for (let t = 0; t < 4; t++) {
      const tier = new THREE.Mesh(tierGeo, shelfWoodMat);
      tier.position.set(0, 0.4 + t * 0.6, 0);
      group.add(tier);

      // Add colorful low-poly grocery products
      const numItems = 14;
      for (let i = 0; i < numItems; i++) {
        const itemX = -length / 2 + 0.6 + (i / numItems) * (length - 1.2);
        const col1 = boxColors[(i * 3 + t) % boxColors.length];

        // Box shape product
        const itemGeo1 = new THREE.BoxGeometry(0.26, 0.38, 0.24);
        const itemMat1 = new THREE.MeshStandardMaterial({ color: col1, roughness: 0.4 });
        const item1 = new THREE.Mesh(itemGeo1, itemMat1);
        item1.position.set(itemX, 0.4 + t * 0.6 + 0.19, 0.45);
        group.add(item1);

        // Cylinder shape (can / bottle)
        const col2 = boxColors[(i * 2 + t + 1) % boxColors.length];
        const itemGeo2 = new THREE.CylinderGeometry(0.12, 0.12, 0.32, 10);
        const itemMat2 = new THREE.MeshStandardMaterial({ color: col2, metalness: 0.4, roughness: 0.3 });
        const item2 = new THREE.Mesh(itemGeo2, itemMat2);
        item2.position.set(itemX, 0.4 + t * 0.6 + 0.16, -0.45);
        group.add(item2);
      }
    }

    // Overhead illuminated Aisle Banner with Arabic text
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d')!;
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.strokeStyle = '#' + info.signColor.toString(16).padStart(6, '0');
    sCtx.lineWidth = 6;
    sCtx.strokeRect(6, 6, 500, 116);
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 36px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(info.titleAr, 256, 64);

    const signTexture = new THREE.CanvasTexture(signCanvas);
    signTexture.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      emissive: info.signColor,
      emissiveIntensity: 0.25,
      roughness: 0.3,
    });
    const signGeo = new THREE.BoxGeometry(2.4, 0.6, 0.1);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 3.2, 0);
    group.add(sign);

    root.add(group);

    const box = new THREE.Box3();
    box.min.set(info.x - length / 2 - 0.2, 0, info.z - shelfDepth / 2 - 0.2);
    box.max.set(info.x + length / 2 + 0.2, shelfHeight, info.z + shelfDepth / 2 + 0.2);
    colliders.push(box);
  }

  aisles.forEach(a => createShelfRow(a));

  // 5. Realistic Low-Poly Shopping Carts (عربات التسوق)
  function createShoppingCart(x: number, z: number, rotY: number = 0) {
    const cart = new THREE.Group();
    cart.position.set(x, 0, z);
    cart.rotation.y = rotY;

    // Chrome wire basket
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const basketGeo = new THREE.BoxGeometry(0.85, 0.65, 1.1);
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.set(0, 0.7, 0);
    cart.add(basket);

    // Bright red plastic handle & bumper
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8);
    handleGeo.rotateZ(Math.PI / 2);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 1.05, 0.55);
    cart.add(handle);

    // 4 Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const wheelPositions = [
      [-0.38, 0.1, -0.45],
      [0.38, 0.1, -0.45],
      [-0.38, 0.1, 0.45],
      [0.38, 0.1, 0.45],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      cart.add(wheel);
    });

    root.add(cart);
    shoppingCarts.push(cart);

    const box = new THREE.Box3();
    box.setFromObject(cart);
    colliders.push(box);
  }

  // Row of parked shopping carts near checkout entrance
  createShoppingCart(-12.5, -4, 0.2);
  createShoppingCart(-12.5, -2.5, -0.1);
  createShoppingCart(-12.5, -1.0, 0.15);

  // 6. Realistic Checkout Counters with Conveyor Belt & Screen
  function createCheckoutCounter(zPos: number) {
    const group = new THREE.Group();
    group.position.set(2.5, 0, zPos);

    // Desk Base
    const deskGeo = new THREE.BoxGeometry(4.5, 1.05, 1.2);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0.525, 0);
    group.add(desk);

    // Green Supermarket Rubber Conveyor Belt
    const beltGeo = new THREE.BoxGeometry(3.2, 0.04, 0.8);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(-0.4, 1.07, 0);
    group.add(belt);

    // Cash Register Monitor & Screen
    const monitorGeo = new THREE.BoxGeometry(0.35, 0.35, 0.12);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x15803d,
      emissiveIntensity: 0.6,
    });
    const monitor = new THREE.Mesh(monitorGeo, screenMat);
    monitor.position.set(1.4, 1.35, 0.2);
    group.add(monitor);

    // Red Barcode Scanner Laser Line
    const laserGeo = new THREE.BoxGeometry(0.18, 0.02, 0.18);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const laser = new THREE.Mesh(laserGeo, laserMat);
    laser.position.set(0.6, 1.1, 0);
    group.add(laser);

    // Stacked Red Shopping Baskets
    for (let b = 0; b < 3; b++) {
      const basketGeo = new THREE.BoxGeometry(0.45, 0.25, 0.35);
      const basketMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
      const basket = new THREE.Mesh(basketGeo, basketMat);
      basket.position.set(-1.8, 0.6 + b * 0.18, 0.7);
      group.add(basket);
    }

    root.add(group);

    const box = new THREE.Box3();
    box.min.set(2.5 - 2.3, 0, zPos - 0.7);
    box.max.set(2.5 + 2.3, 1.4, zPos + 0.7);
    colliders.push(box);
  }

  createCheckoutCounter(-7);
  createCheckoutCounter(-3);

  // 7. Storage Room (Warm wooden crates, industrial racks)
  const crateMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
  function addCrate(x: number, y: number, z: number, size: number = 1.0) {
    const geo = new THREE.BoxGeometry(size, size, size);
    const mesh = new THREE.Mesh(geo, crateMat);
    mesh.position.set(x, y + size / 2, z);
    mesh.rotation.y = (Math.random() - 0.5) * 0.2;
    mesh.castShadow = true;
    root.add(mesh);

    const box = new THREE.Box3();
    box.setFromObject(mesh);
    colliders.push(box);
  }

  addCrate(13, 0, -9, 1.2);
  addCrate(14.3, 0, -9, 1.2);
  addCrate(13.6, 1.2, -9, 1.1);
  addCrate(13, 0, -7.5, 1.2);

  function addStorageRack(x: number, z: number) {
    const rackGeo = new THREE.BoxGeometry(5.0, 3.2, 1.4);
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const mesh = new THREE.Mesh(rackGeo, rackMat);
    mesh.position.set(x, 1.6, z);
    root.add(mesh);

    const box = new THREE.Box3();
    box.setFromObject(mesh);
    colliders.push(box);
  }

  addStorageRack(12, 1);
  addStorageRack(12, 7);

  // 8. Safe Hiding Zones
  hidingZones.push({
    name: 'مخزن الصناديق الخشبية',
    bounds: new THREE.Box3(new THREE.Vector3(12.0, 0, -11.0), new THREE.Vector3(15.5, 2.0, -6.5)),
  });

  hidingZones.push({
    name: 'ركن الرفوف الخلفية',
    bounds: new THREE.Box3(new THREE.Vector3(13.5, 0, 8.5), new THREE.Vector3(15.5, 2.0, 11.5)),
  });

  hidingZones.push({
    name: 'خلف منصة الدفع',
    bounds: new THREE.Box3(new THREE.Vector3(0.5, 0, -8.5), new THREE.Vector3(2.0, 1.5, -5.5)),
  });

  hidingZones.push({
    name: 'زاوية الممر الرابع',
    bounds: new THREE.Box3(new THREE.Vector3(-15.5, 0, 7.5), new THREE.Vector3(-13.0, 2.0, 11.5)),
  });

  // 9. Collectibles (5 vibrant high-contrast items)
  const collectibles: CollectibleItemData[] = [];

  // Item 1: Milk Carton (Aisle 1)
  {
    const grp = new THREE.Group();
    const milkGeo = new THREE.BoxGeometry(0.35, 0.6, 0.35);
    const milkMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
    });
    const m = new THREE.Mesh(milkGeo, milkMat);
    m.position.y = 0.3;
    grp.add(m);

    const glowGeo = new THREE.RingGeometry(0.32, 0.5, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.02;
    grp.add(glow);

    const pos = new THREE.Vector3(-5, 1.0, -6);
    grp.position.copy(pos);
    root.add(grp);

    collectibles.push({
      id: 'milk',
      nameAr: 'حليب معقم طازج',
      nameEn: 'Fresh Milk',
      position: pos,
      mesh: grp,
      collected: false,
      color: 0x38bdf8,
    });
  }

  // Item 2: Tuna Can (Aisle 2)
  {
    const grp = new THREE.Group();
    const tunaGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.22, 12);
    const tunaMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0xeab308,
      emissiveIntensity: 0.5,
    });
    const m = new THREE.Mesh(tunaGeo, tunaMat);
    m.position.y = 0.11;
    grp.add(m);

    const glowGeo = new THREE.RingGeometry(0.28, 0.45, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.02;
    grp.add(glow);

    const pos = new THREE.Vector3(-11, 1.6, -1);
    grp.position.copy(pos);
    root.add(grp);

    collectibles.push({
      id: 'tuna',
      nameAr: 'معلبات تونة ذهبية',
      nameEn: 'Golden Tuna',
      position: pos,
      mesh: grp,
      collected: false,
      color: 0xfacc15,
    });
  }

  // Item 3: Detergent (Aisle 3)
  {
    const grp = new THREE.Group();
    const detGeo = new THREE.BoxGeometry(0.32, 0.65, 0.22);
    const detMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      roughness: 0.3,
      emissive: 0x9333ea,
      emissiveIntensity: 0.5,
    });
    const m = new THREE.Mesh(detGeo, detMat);
    m.position.y = 0.325;
    grp.add(m);

    const glowGeo = new THREE.RingGeometry(0.28, 0.45, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.02;
    grp.add(glow);

    const pos = new THREE.Vector3(-7, 0.45, 4);
    grp.position.copy(pos);
    root.add(grp);

    collectibles.push({
      id: 'detergent',
      nameAr: 'منظف الأرضيات المركز',
      nameEn: 'Floor Cleaner',
      position: pos,
      mesh: grp,
      collected: false,
      color: 0xa855f7,
    });
  }

  // Item 4: Flashlight Batteries (Checkout Counter)
  {
    const grp = new THREE.Group();
    const batGeo = new THREE.BoxGeometry(0.26, 0.14, 0.32);
    const batMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.25,
      emissive: 0x16a34a,
      emissiveIntensity: 0.55,
    });
    const m = new THREE.Mesh(batGeo, batMat);
    m.position.y = 0.07;
    grp.add(m);

    const glowGeo = new THREE.RingGeometry(0.24, 0.4, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.02;
    grp.add(glow);

    const pos = new THREE.Vector3(2.5, 1.15, -7);
    grp.position.copy(pos);
    root.add(grp);

    collectibles.push({
      id: 'batteries',
      nameAr: 'بطاريات كشاف إضافية',
      nameEn: 'Batteries',
      position: pos,
      mesh: grp,
      collected: false,
      color: 0x22c55e,
    });
  }

  // Item 5: Master Emergency Keycard (Storage Room)
  {
    const grp = new THREE.Group();
    const cardGeo = new THREE.BoxGeometry(0.3, 0.05, 0.48);
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xdc2626,
      emissiveIntensity: 0.6,
    });
    const m = new THREE.Mesh(cardGeo, cardMat);
    m.position.y = 0.025;
    grp.add(m);

    const glowGeo = new THREE.RingGeometry(0.28, 0.5, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.02;
    grp.add(glow);

    const pos = new THREE.Vector3(14, 0.05, 5);
    grp.position.copy(pos);
    root.add(grp);

    collectibles.push({
      id: 'keycard',
      nameAr: 'بطاقة طوارئ المخرج',
      nameEn: 'Exit Keycard',
      position: pos,
      mesh: grp,
      collected: false,
      color: 0xef4444,
    });
  }

  // 10. Exit Door
  const exitGroup = new THREE.Group();
  const exitPos = new THREE.Vector3(-15.4, 0, -10);
  exitGroup.position.copy(exitPos);

  const exitFrameGeo = new THREE.BoxGeometry(0.3, 3.2, 2.6);
  const exitFrameMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 });
  const exitFrame = new THREE.Mesh(exitFrameGeo, exitFrameMat);
  exitFrame.position.y = 1.6;
  exitGroup.add(exitFrame);

  // Exit Sign Board
  const signGeo = new THREE.BoxGeometry(0.15, 0.5, 2.0);
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    emissive: 0x22c55e,
    emissiveIntensity: 0.8,
  });
  const exitSign = new THREE.Mesh(signGeo, signMat);
  exitSign.position.set(0.15, 3.2, 0);
  exitGroup.add(exitSign);

  // Indicator Lamp
  const lampGeo = new THREE.SphereGeometry(0.18, 16, 16);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.9,
  });
  const indicatorMesh = new THREE.Mesh(lampGeo, lampMat);
  indicatorMesh.position.set(0.2, 2.4, 0.9);
  exitGroup.add(indicatorMesh);

  const indicatorLight = new THREE.PointLight(0xef4444, 3.0, 6);
  indicatorLight.position.set(0.4, 2.4, 0.9);
  exitGroup.add(indicatorLight);

  root.add(exitGroup);

  const exitBounds = new THREE.Box3();
  exitBounds.min.set(exitPos.x - 0.5, 0, exitPos.z - 1.5);
  exitBounds.max.set(exitPos.x + 1.8, 3.0, exitPos.z + 1.5);

  // 11. Warm/Cool Supermarket Lights Rig
  const ambLight = new THREE.AmbientLight(0x1e293b, 1.2); // Brighter, clearer ambient
  root.add(ambLight);

  // Ceiling Fluorescent Troffers (Warm supermarket glow)
  const ceilingLightPositions = [
    [-8, 3.8, -6],
    [-8, 3.8, 1],
    [-8, 3.8, 8],
    [2, 3.8, -5],
    [2, 3.8, 4],
    [12, 3.8, 0],
  ];

  ceilingLightPositions.forEach(([lx, ly, lz]) => {
    // Visible light fixture panel
    const fixtureGeo = new THREE.BoxGeometry(2.4, 0.1, 0.8);
    const fixtureMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8,
    });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(lx, ly + 0.1, lz);
    root.add(fixture);

    const pLight = new THREE.PointLight(0xfef08a, 1.4, 11);
    pLight.position.set(lx, ly - 0.2, lz);
    root.add(pLight);
  });

  // Center Flickering Fluorescent tube
  const flickerLight = new THREE.PointLight(0x60a5fa, 2.2, 14);
  flickerLight.position.set(-6, 3.8, 0);
  root.add(flickerLight);

  // 12. Patrol Waypoints for Guard AI
  const patrolWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(-12, 0, -8),
    new THREE.Vector3(-3, 0, -8),
    new THREE.Vector3(5, 0, -4),
    new THREE.Vector3(12, 0, -4),
    new THREE.Vector3(12, 0, 6),
    new THREE.Vector3(5, 0, 4),
    new THREE.Vector3(-3, 0, 8),
    new THREE.Vector3(-12, 0, 8),
    new THREE.Vector3(-12, 0, 2),
    new THREE.Vector3(-4, 0, 2),
    new THREE.Vector3(-4, 0, -3),
    new THREE.Vector3(-12, 0, -3),
  ];

  return {
    root,
    colliders,
    collectibles,
    exitDoor: {
      group: exitGroup,
      position: exitPos,
      indicatorLight,
      indicatorMesh,
      bounds: exitBounds,
      isUnlocked: false,
    },
    hidingZones,
    patrolWaypoints,
    flickerLight,
    shoppingCarts,
  };
}
