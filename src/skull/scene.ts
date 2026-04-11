import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export interface SceneHandle {
  render(): void;
  resize(): void;
  skull: THREE.Group;
  /** Jaw submesh — null if the OBJ didn't contain one. */
  jaw: THREE.Mesh | null;
  /** Head submesh — null if the OBJ didn't contain one. */
  head: THREE.Mesh | null;
  /** Original local-space position of the jaw, for animated returns. */
  jawRestPosition: THREE.Vector3;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  getTime(): number;
  setMaterial(mat: THREE.Material): void;
}

export async function createScene(canvas: HTMLCanvasElement): Promise<SceneHandle> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 12;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const skull = new THREE.Group();
  scene.add(skull);

  let jaw: THREE.Mesh | null = null;
  let head: THREE.Mesh | null = null;

  // Fallback material used until the real shader material lands.
  let currentMaterial: THREE.Material = new THREE.MeshBasicMaterial({
    color: 0x00ffc8,
    wireframe: true,
  });

  try {
    const loader = new OBJLoader();
    const obj = await loader.loadAsync('/models/skull.obj');
    const meshes: THREE.Mesh[] = [];
    for (const child of obj.children.slice()) {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh);
      }
    }
    // Decide which mesh is the jaw by bounding-box Y center — jaw sits below.
    meshes.sort((a, b) => {
      a.geometry.computeBoundingBox();
      b.geometry.computeBoundingBox();
      const ay = a.geometry.boundingBox!.getCenter(new THREE.Vector3()).y;
      const by = b.geometry.boundingBox!.getCenter(new THREE.Vector3()).y;
      return ay - by;
    });
    if (meshes.length >= 2) {
      jaw = meshes[0];
      jaw.userData.part = 'jaw';
      head = meshes[meshes.length - 1];
      head.userData.part = 'head';
    } else if (meshes.length === 1) {
      head = meshes[0];
      head.userData.part = 'head';
    }
    for (const mesh of meshes) {
      mesh.material = currentMaterial;
      skull.add(mesh);
    }
    skull.scale.setScalar(0.6);
  } catch (err) {
    console.warn('[scene] OBJ load failed, using icosahedron fallback', err);
    const geo = new THREE.IcosahedronGeometry(4, 1);
    const mesh = new THREE.Mesh(geo, currentMaterial);
    mesh.userData.part = 'head';
    head = mesh;
    skull.add(mesh);
  }

  const jawRestPosition = jaw ? jaw.position.clone() : new THREE.Vector3();

  const clock = new THREE.Clock();

  return {
    scene,
    camera,
    renderer,
    skull,
    jaw,
    head,
    jawRestPosition,
    render() {
      renderer.render(scene, camera);
    },
    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    getTime() {
      return clock.getElapsedTime();
    },
    setMaterial(mat: THREE.Material) {
      currentMaterial = mat;
      skull.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = mat;
        }
      });
    },
  };
}
