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
  /**
   * Pivot group wrapping the jaw, positioned at the jaw's hinge point.
   * Rotate its .rotation.x to hinge the jaw open/closed. Null if no jaw.
   */
  jawPivot: THREE.Group | null;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  getTime(): number;
  setMaterial(mat: THREE.Material): void;
}

const BASE_CAMERA_Z = 12;

// Portrait / narrow viewports pull the camera back so the skull fits
// horizontally. Square or wider uses BASE_CAMERA_Z unchanged; a half-width
// portrait phone ends up ~1.4× further away.
function cameraZForAspect(aspect: number): number {
  return aspect >= 1 ? BASE_CAMERA_Z : BASE_CAMERA_Z / Math.sqrt(aspect);
}

export async function createScene(canvas: HTMLCanvasElement): Promise<SceneHandle> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const initialAspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(60, initialAspect, 0.1, 100);
  camera.position.z = cameraZForAspect(initialAspect);

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
  let jawPivot: THREE.Group | null = null;

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

    // Wrap the jaw in a pivot Group at the hinge point so rotation hinges
    // correctly. Hinge is the top-rear of the jaw's bounding box.
    if (jaw) {
      jaw.geometry.computeBoundingBox();
      const bbox = jaw.geometry.boundingBox!;
      // Top-rear of jaw, centered left-right. Front is +Z convention.
      const hinge = new THREE.Vector3(
        (bbox.min.x + bbox.max.x) * 0.5,
        bbox.max.y,
        bbox.min.z
      );
      jawPivot = new THREE.Group();
      jawPivot.position.copy(hinge);
      skull.add(jawPivot);
      // Move the jaw from the skull group into the pivot, offsetting its
      // local position so its world position is unchanged.
      skull.remove(jaw);
      jaw.position.sub(hinge);
      jawPivot.add(jaw);
    }
  } catch (err) {
    console.warn('[scene] OBJ load failed, using icosahedron fallback', err);
    const geo = new THREE.IcosahedronGeometry(4, 1);
    const mesh = new THREE.Mesh(geo, currentMaterial);
    mesh.userData.part = 'head';
    head = mesh;
    skull.add(mesh);
  }

  const timer = new THREE.Timer();

  return {
    scene,
    camera,
    renderer,
    skull,
    jaw,
    head,
    jawPivot,
    render() {
      renderer.render(scene, camera);
    },
    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / h;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = aspect;
      camera.position.z = cameraZForAspect(aspect);
      camera.updateProjectionMatrix();
    },
    getTime() {
      timer.update();
      return timer.getElapsed();
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
