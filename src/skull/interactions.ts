import * as THREE from 'three';
import type { SceneHandle } from './scene';

export type SkullPart = 'leftEye' | 'rightEye' | 'jaw' | 'other';

export type InteractionEventMap = {
  pointer: { x: number; y: number };
  /** `hitLocal` is the click point in the skull group's local space, or null if clicked outside the skull. */
  click: { skullPart: SkullPart; hitLocal: { x: number; y: number; z: number } | null };
  scroll: { delta: number; total: number };
  edge: { proximity: number };
  key: { char: string };
};

type Listener<K extends keyof InteractionEventMap> =
  (payload: InteractionEventMap[K]) => void;

export interface InteractionBus {
  on<K extends keyof InteractionEventMap>(event: K, cb: Listener<K>): void;
  off<K extends keyof InteractionEventMap>(event: K, cb: Listener<K>): void;
  getCursor(): { x: number; y: number; edgeProximity: number };
  getScroll(): number;
  getLastInputTime(): number;
  getOrbit(): { x: number; y: number };
  isDragging(): boolean;
  isTouch(): boolean;
}

const clampPitch = (v: number) => Math.max(-0.6, Math.min(0.6, v));

export function createInteractions(
  canvas: HTMLCanvasElement,
  scene: SceneHandle,
  getCurrentLook: () => { yaw: number; pitch: number } = () => ({ yaw: 0, pitch: 0 })
): InteractionBus {
  const listeners = new Map<keyof InteractionEventMap, Set<Listener<any>>>();
  let cursor = { x: 0, y: 0, edgeProximity: 0 };
  let scroll = 0;
  let lastInput = performance.now();

  const orbit = { x: 0, y: 0 };
  let isTouchDevice = false;
  let dragging = false;
  let dragStartClientX = 0;
  let dragStartClientY = 0;
  let dragStartYaw = 0;
  let dragStartPitch = 0;

  function emit<K extends keyof InteractionEventMap>(
    event: K,
    payload: InteractionEventMap[K]
  ) {
    lastInput = performance.now();
    const set = listeners.get(event);
    if (!set) return;
    for (const cb of set) cb(payload);
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType !== 'touch') return;
    isTouchDevice = true;
    dragging = true;
    dragStartClientX = e.clientX;
    dragStartClientY = e.clientY;
    const current = getCurrentLook();
    dragStartYaw = current.yaw;
    dragStartPitch = current.pitch;
    orbit.x = current.yaw;
    orbit.y = current.pitch;
    lastInput = performance.now();
  }

  function onPointerUp(e: PointerEvent) {
    if (e.pointerType !== 'touch') return;
    dragging = false;
  }

  function onPointerMove(e: PointerEvent) {
    if (dragging && e.pointerType === 'touch') {
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - dragStartClientX) / rect.width;
      const dy = (e.clientY - dragStartClientY) / rect.height;
      orbit.x = dragStartYaw + dx * 2.0;
      orbit.y = clampPitch(dragStartPitch + dy * 1.5);
      lastInput = performance.now();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    cursor.x = nx;
    cursor.y = ny;

    const edgeX = 1 - Math.min(Math.abs(nx), 1);
    const edgeY = 1 - Math.min(Math.abs(ny), 1);
    const closestEdge = Math.min(edgeX, edgeY); // smaller = nearer to edge
    cursor.edgeProximity = Math.max(0, 1 - closestEdge / 0.2); // 0..1 when within 20% of edge

    emit('pointer', { x: nx, y: ny });
    emit('edge', { proximity: cursor.edgeProximity });
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY / 1000;
    scroll = Math.max(0, Math.min(1, scroll + delta));
    emit('scroll', { delta, total: scroll });
  }

  function onClick(e: PointerEvent) {
    const result = pickSkullPart(e);
    emit('click', result);
  }

  // Raycaster reused across clicks
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pickSkullPart(e: PointerEvent): {
    skullPart: SkullPart;
    hitLocal: { x: number; y: number; z: number } | null;
  } {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(ndc, scene.camera);
    const hits = raycaster.intersectObjects(scene.skull.children, true);
    if (hits.length === 0) return { skullPart: 'other', hitLocal: null };
    const hit = hits[0];
    const part = (hit.object.userData.part as string) ?? 'head';

    // Convert the world hit to the skull group's local space so the resulting
    // point is stable as the parent group rotates or translates.
    const groupLocal = scene.skull.worldToLocal(hit.point.clone());
    const hitLocal = { x: groupLocal.x, y: groupLocal.y, z: groupLocal.z };

    if (part === 'jaw') return { skullPart: 'jaw', hitLocal };

    // Map hit position onto the head: left vs right eye region vs rest.
    // Eye region: upper-front quadrant of the head mesh.
    const meshLocal = hit.object.worldToLocal(hit.point.clone());
    if (meshLocal.y > 0.1 && Math.abs(meshLocal.x) > 0.2) {
      return {
        skullPart: meshLocal.x < 0 ? 'leftEye' : 'rightEye',
        hitLocal,
      };
    }
    return { skullPart: 'other', hitLocal };
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('click', onClick);

  return {
    on(event, cb) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    },
    off(event, cb) {
      listeners.get(event)?.delete(cb);
    },
    getCursor() {
      return { ...cursor };
    },
    getScroll() {
      return scroll;
    },
    getLastInputTime() {
      return lastInput;
    },
    getOrbit() { return { ...orbit }; },
    isDragging() { return dragging; },
    isTouch() { return isTouchDevice; },
  };
}
