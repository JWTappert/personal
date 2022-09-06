import { useRef, useEffect, useState, useContext } from "react";
import * as THREE from "three";
import { OBJLoader } from "node_modules/three/examples/jsm/loaders/OBJLoader";
import styled, { useTheme } from "styled-components";
import SceneSettings from "./scene-settings";

export default function Skull(props) {
  const theme = useTheme();
  const mount = useRef(null);
  const [isAnimating, setAnimating] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState("basic");
  const [rotateX, setRotateX] = useState(false);
  const [rotateY, setRotateY] = useState(true);
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
      case "phong":
        scene.add(spotLight);
        material = new THREE.MeshPhongMaterial({
          color: theme.colors.primary,
          shininess: 100,
        });
        break;
      case "toon":
        scene.add(spotLight);
        material = new THREE.MeshToonMaterial({
          color: theme.colors.primary,
        });
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
      if (rotateX) skull.rotation.x += 0.005;
      if (rotateY) skull.rotation.y += 0.005;

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
  }, [selectedMaterial, rotateX, rotateY]);

  useEffect(() => {
    if (isAnimating) {
      controls.current.start();
    } else {
      controls.current.stop();
    }
  }, [isAnimating]);

  function handleMaterialSelected({ value }: any) {
    if (!value) {
      setSelectedMaterial("normal");
      return;
    }
    setSelectedMaterial(value);
  }

  return (
    <>
      <Scene
        className="vis"
        ref={mount}
        onClick={() => setAnimating(!isAnimating)}
      />
      <Container>
        <SceneSettings
          rotateX={rotateX}
          rotateY={rotateY}
          selectedMaterial={selectedMaterial}
          onRotateXSelected={setRotateX}
          onRotateYSelected={setRotateY}
          onMaterialSelected={handleMaterialSelected}
        />
      </Container>
    </>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
`;

const Scene = styled.div`
  height: 100%;
  width: 100%;
`;
