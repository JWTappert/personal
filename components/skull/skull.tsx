import { useRef, useEffect, useState, useContext } from "react";
import * as THREE from "three";
import { OBJLoader } from "node_modules/three/examples/jsm/loaders/OBJLoader";
import styled, { ThemeContext } from "styled-components";

export default function Skull(props) {
  const theme = useContext(ThemeContext);
  const mount = useRef(null);
  const [isAnimating, setAnimating] = useState(true);
  const [selectedMaterial, SetSelectedMaterial] = useState("basic");
  const controls = useRef(null);

  useEffect(() => {
    let width = mount.current.clientWidth;
    let height = mount.current.clientHeight;
    let frameId;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    const loader = new OBJLoader();
    let geometrySkull: THREE.BufferGeometry;
    let geometrySkullJaw: THREE.BufferGeometry;
    const skull: THREE.Group = new THREE.Group();
    const spotLight: THREE.SpotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(350, 350, 350);
    let head: THREE.Mesh;
    let jaw: THREE.Mesh;
    let material: THREE.Material;

    switch (selectedMaterial) {
      case "basic":
        material = new THREE.MeshBasicMaterial({
          color: theme.colors.primary,
          wireframe: true,
        });
        break;
      case "normal":
        material = new THREE.MeshNormalMaterial({ flatShading: true });
        break;
      case "lambert":
        scene.add(spotLight);
        material = new THREE.MeshLambertMaterial({
          color: theme.colors.primary,
        });
        break;
      case "phong":
        scene.add(spotLight);
        material = new THREE.MeshPhongMaterial({ color: theme.colors.primary });
        break;
      case "standard":
        scene.add(spotLight);
        material = new THREE.MeshStandardMaterial({
          color: theme.colors.primary,
        });
        break;
      case "physical":
        scene.add(spotLight);
        material = new THREE.MeshPhysicalMaterial({
          color: theme.colors.primary,
        });
        break;
      case "toon":
        scene.add(spotLight);
        material = new THREE.MeshToonMaterial({ color: theme.colors.primary });
        break;
    }

    loader.load(
      "/models/skull.obj",
      function (object: any) {
        geometrySkull = object.children[1].geometry;
        geometrySkullJaw = object.children[0].geometry;
        head = new THREE.Mesh(geometrySkull, material);
        jaw = new THREE.Mesh(geometrySkullJaw, material);
        skull.add(head);
        skull.add(jaw);
        scene.add(skull);
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      function (error) {
        console.error({ error });
      }
    );

    camera.position.z = 12;
    renderer.setSize(width, height);

    const renderScene = () => {
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      width = mount.current.clientWidth;
      height = mount.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderScene();
    };

    const animate = () => {
      // skull.rotation.x += 0.005;
      skull.rotation.y += 0.005;

      renderScene();
      frameId = window.requestAnimationFrame(animate);
    };

    const start = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(animate);
      }
    };

    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = null;
    };

    mount.current.appendChild(renderer.domElement);
    window.addEventListener("resize", handleResize);
    start();

    controls.current = { start, stop };

    return () => {
      stop();
      window.removeEventListener("resize", handleResize);
      mount.current.removeChild(renderer.domElement);

      scene.remove(skull);
      geometrySkull.dispose();
      geometrySkullJaw.dispose();
      material.dispose();
    };
  }, [selectedMaterial]);

  useEffect(() => {
    if (isAnimating) {
      controls.current.start();
    } else {
      controls.current.stop();
    }
  }, [isAnimating]);

  function handleMaterialSelected({ value }) {
    if (!value) {
      SetSelectedMaterial("normal");
      return;
    }
    SetSelectedMaterial(value);
  }

  return (
    <>
      <Scene
        className="vis"
        ref={mount}
        onClick={() => setAnimating(!isAnimating)}
      />
      <div>
        <form>
          <h4>Material</h4>
          {materials.map((mat) => (
            <div key={mat}>
              <label>
                <input
                  type="radio"
                  value={mat}
                  checked={selectedMaterial === mat}
                  onChange={({ target }) => handleMaterialSelected(target)}
                />
                {mat}
              </label>
            </div>
          ))}
        </form>
      </div>
    </>
  );
}

const materials = ["basic", "normal", "phong", "toon"];

const Scene = styled.div`
  height: 100%;
  width: 100%;
`;
