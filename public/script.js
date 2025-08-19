import * as THREE from "three";
import { XRButton } from "/webxr/XRButton.js";
import { OrbitControls } from "/OrbitControls.js";
import { createText } from "/webxr/Text2D.js";
//import { DragControls } from "/DragControls.js";
import { XRControllerModelFactory } from "/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "/webxr/XRHandModelFactory.js";
import { BoxLineGeometry } from "/BoxLineGeometry.js";
//import { LineMaterial } from "/LineMaterial.js";

//let scene, camera, renderer, controls;
const trails = new Map();
const trailLength = 700;
const velocityArrows = [];
const gravityArrows = [];
let nextBodies = [];
let nextBodyMeshes = [];
let playPosition = [];

const G = 4.4567; // Simplified gravitational constant
let TIMESTEP = 0.001; // Time step for numerical integration
const slow = 0.0002;
const normal = 0.001;
const fast = 0.002;

// Add these variables at the top of your script
let mouse = new THREE.Vector2();
let touchEnabled = false;
let isDragging = false;
let selectedObject = null;
let mouseMoveTimeout;

let orbitControlsEnabled = true;

let container;
let camera, scene, renderer;
let controls, group;
let sliderGroup;
let playGroup;
let planetGroup;
let bodiesGroup;
let enableSelection = true;
let select = false;
let deselect = false;
let play = false;
let setup = true; //Runs one time to set the velocity arrows when the program first loads
const previousStates = new Map();
let drawTrail = true;
let activeBodies = 4;
let reset = false;
let rewind = false;
let isPlaying = false;
let sliderSelect = false;
let planetAndHandleIndex = 0;
let userSelect = false;

const updateFrameRate = 60; // Target frame rate for updateBodies
const updateFrameTime = 1000 / updateFrameRate; // Time in milliseconds per frame
let lastUpdateTime = 0;

const objects = [];

let raycaster;

const intersected = [];


let controller1, controller2;
let controllerGrip1, controllerGrip2;

//////// Hand controls
let hand1, hand2;

const tmpVector1 = new THREE.Vector3();
const tmpVector2 = new THREE.Vector3();

let grabbing = false;
const scaling = {
  active: false,
  initialDistance: 0,
  object: null,
  initialScale: 1,
};

const spheres = [];

//let socket = io();

// Load texture for Clear button
const loader = new THREE.TextureLoader();
const clearTexture = loader.load(
  "https://cdn.glitch.global/54187771-e873-41e3-8f2f-2a8d19e77031/clear.png?v=1742481737720"
);
const playTexture = loader.load(
  "https://cdn.glitch.global/cc951a80-8777-4ae5-afa3-0ecf0301a995/88cab6290fb34ee2f07130d66b7ce6d4.png?v=1744377022394"
);
const forwardTexture = loader.load(
  "https://cdn.glitch.global/54187771-e873-41e3-8f2f-2a8d19e77031/step-forward.png?v=1742482273423"
);
const rewindTexture = loader.load(
  "https://cdn.glitch.global/54187771-e873-41e3-8f2f-2a8d19e77031/rewind-button.png?v=1742482278019"
);

const massDownTexture = loader.load(
  "https://cdn.glitch.global/54187771-e873-41e3-8f2f-2a8d19e77031/massdown.png?v=1742484806745"
);
const massUpTexture = loader.load(
  "https://cdn.glitch.global/54187771-e873-41e3-8f2f-2a8d19e77031/massup.png?v=1742484801066"
);
const resetTexture = loader.load(
  "https://cdn.glitch.global/cc951a80-8777-4ae5-afa3-0ecf0301a995/reset.png?v=1744205536967"
);
const velocityTexture = loader.load(
  "https://cdn.glitch.global/cc951a80-8777-4ae5-afa3-0ecf0301a995/V.png?v=1744216197434"
);
const pauseTexture = loader.load(
  "https://cdn.glitch.global/cc951a80-8777-4ae5-afa3-0ecf0301a995/cc939ca06d62a659599474b2cbe4a717.png?v=1744376936932"
);

init();

function init() {
  /*
  socket.on("userSelect", function (data) {
    userSelect = data;
  })
  
  socket.on("bodiesDown", function (data) {
    removeBody();
  });
  socket.on("bodiesUp", function (data) {
    addBody();
  });
  socket.on("down", function (data) {
    bodies[data.index].mass = data.mass;
    updateMassText(data.index);
  });
  socket.on("up", function (data) {
    bodies[data.index].mass = data.mass;
    updateMassText(data.index);
  });
  socket.on("slider", function (data) {
    sliderSelect = false;
    bodies[data.index].mass = data.mass;
    updateMassText(data.index);
        updatePlayPosition();
  });
  socket.on("clearTrail", function (data) {
    clearTrail(data);
  });
  socket.on("clearTrails", function (data) {
    bodyMeshes.forEach(({ body, mesh }, index) => {
      clearTrail(index);
    });
  });
  socket.on("fast", function (data) {
    console.log("Socket: Fast");
    TIMESTEP = fast; // Time step for numerical integration
    updateSpeedButtonColors();
  });
  socket.on("normal", function (data) {
    console.log("Socket: Normal");
    TIMESTEP = normal; // Time step for numerical integration
    updateSpeedButtonColors();
  });
  socket.on("slow", function (data) {
    console.log("Socket: Slow");
    TIMESTEP = slow; // Time step for numerical integration
    updateSpeedButtonColors();
  });
  socket.on("playPosition", (receivedPlayPosition) => {
    // Clear existing playPosition array if it exists on the client
    playPosition = [];

    // Convert the received plain objects back to proper objects with THREE.Vector2
    playPosition = receivedPlayPosition.map((body) => ({
      mass: body.mass,
      position: new THREE.Vector2(body.position.x, body.position.y),
      velocity: new THREE.Vector2(body.velocity.x, body.velocity.y),
      color: body.color,
    }));
  });
  socket.on("play", function (data) {
    console.log("Socket: Play");
    if (data === true) {
      isPlaying = true;
      //play = true;
    } else {
      isPlaying = false;
      play = false;
    }
    togglePlayPauseTexture(isPlaying);
  });
  socket.on("reset", function (data) {
    console.log("Socket: Reset");
    resetBodies(true, false);
  });
  socket.on("rewind", function (data) {
    console.log("Socket: Rewind");
    resetBodies(false, true);
  });
  socket.on("sliderSelect", (data) => {
    // Find the handle in the sliderGroup that matches the index
    const slider = sliderGroup.children.find(
      (child) => child.index === data.index
    );

    if (slider) {
      slider.position.x = THREE.MathUtils.clamp(data.x, -1.4, 1.6); // clamp for safety
      sliderSelect = true;
      updateMassText(data.index);
          updatePlayPosition();
    }
  });

  socket.on("updateBodiesAndMeshes", (updatedData) => {
    updatedData.forEach((data, index) => {
      // Update the physics body
      if (bodies[index]) {
        bodies[index].position.x = data.position.x;
        bodies[index].position.y = data.position.y;
        bodies[index].velocity.x = data.velocity.x;
        bodies[index].velocity.y = data.velocity.y;
      }

      // Update the visual mesh
      if (bodyMeshes[index] && bodyMeshes[index].mesh) {
        bodyMeshes[index].mesh.position.set(
          data.meshPosition.x,
          data.meshPosition.y,
          data.meshPosition.z
        );
      }
    });

    socket.on("selectedObjectMoved", (data) => {
      const { x, y, z, name, index } = data;
      function findObjectInGroup(group, name, index) {
        // Check immediate children first
        const directChild = group.children.find(
          (child) => child.name === name && child.index === index
        );
        if (directChild) return directChild;
        // If not found, search through children's children
        for (const child of group.children) {
          if (child.children && child.children.length > 0) {
            const nestedObject = findObjectInGroup(child, name, index);
            if (nestedObject) return nestedObject;
          }
        }
        return null; // Not found at any level
      }
      // Usage
      const object = findObjectInGroup(planetGroup, name, index);

      if (object) {
        const worldPos = new THREE.Vector3(x, y, z);
        const localPos = planetGroup.worldToLocal(worldPos.clone());

        // Move the visual object in the scene
        object.position.copy(localPos);
        object.updateMatrixWorld(true);

        // Update the physics body position (2D)
        if (name === "Planet") {
          if (bodies[index]) {
            bodies[index].position.set(x, y);
          }

          // Update the visual mesh (3D)
          if (bodyMeshes[index] && bodyMeshes[index].mesh) {
            bodyMeshes[index].mesh.position.set(x, y, z);
          }
        }
      } else if (name === "Handle") {
        const worldPos = new THREE.Vector3(x, y, z);
        const localPos = planetGroup.worldToLocal(worldPos.clone());
        // Move the visual object in the scene

        //object.position.copy(localPos);

        object.updateMatrixWorld(true);

        // Update the visual mesh (3D)

        if (bodyMeshes[index] && bodyMeshes[index].mesh) {
          bodyMeshes[index].mesh.chilren[1].position.set(x, y, z);
          console.log(bodyMeshes[index].mesh.chilren[1].position);
        }

        // Update velocity arrows or gravity visuals
        updateVelocityArrows?.();
        updateGravityArrows?.(bodies, bodyMeshes);
      } else {
        console.warn(
          `Object ${name} with index ${index} not found in planetGroup.`
        );
      }
    });

    // Run any post-update functions
    updateVelocityArrows();
    updateGravityArrows(bodies, bodyMeshes);

    // Update trails if needed

    updatedData.forEach((data, index) => {
      if (trails && trails[index]) {
        const trail = trails[index];
        const position = new THREE.Vector3(
          data.meshPosition.x,
          data.meshPosition.y,
          data.meshPosition.z
        );
        trail.points.push(position);
        if (trail.points.length > trailLength) trail.points.shift();
        trail.line.geometry.setFromPoints(trail.points);
        trail.line.material.color.set(bodies[index].color);
      }
    });
  });
  */

  container = document.createElement("div");
  document.body.appendChild(container);
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 1);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(render);
  renderer.shadowMap.enabled = true;
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  let room = new THREE.LineSegments(
    new BoxLineGeometry(3, 3, 0, 10, 10, 10),
    new THREE.LineBasicMaterial({ color: 0x808080, linewidth: 2 })
  );
  room.geometry.translate(0, 1.5, -2.5);
  scene.add(room);

  document.body.appendChild(
    XRButton.createButton(renderer, {
      requiredFeatures: ["hit-test", "local-floor"],
      optionalFeatures: [
        "mesh-detection",
        "plane-detection",
        "hand-tracking",
        //"depth-sensing"
      ],
      //'depthSensing': { 'usagePreference': [ 'gpu-optimized' ], 'dataFormatPreference': [] }
    })

    //ARButton.createButton(renderer, {
    //mode: 'immersive-ar', // Specifies the AR mode
    //'optionalFeatures': [ 'depth-sensing' ],
    //'depthSensing': { 'usagePreference': [ 'gpu-optimized' ], 'dataFormatPreference': [] }
    //})
  );
  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.5, -1.5);
  //controls.enableDamping = true;
  //controls = new DragControls([...objects], camera, renderer.domElement);
  //controls.rotateSpeed = 2;
  //controls.addEventListener("drag", function (event) {
  //render();
  //});
  // Lights

  scene.add(new THREE.HemisphereLight(0xbcbcbc, 0xa5a5a5, 3));

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(0, 6, 0);
  light.castShadow = true;
  light.shadow.camera.top = 3;
  light.shadow.camera.bottom = -3;
  light.shadow.camera.right = 3;
  light.shadow.camera.left = -3;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);

  group = new THREE.Group();
  scene.add(group);

  sliderGroup = new THREE.Group();
  scene.add(sliderGroup);

  playGroup = new THREE.Group();
  scene.add(playGroup);

  planetGroup = new THREE.Group();
  scene.add(planetGroup);

  bodiesGroup = new THREE.Group();
  scene.add(bodiesGroup);

  // Define celestial bodies with initial conditions
  const bodies = [
    {
      mass: 250,
      position: new THREE.Vector2(0, 0),
      velocity: new THREE.Vector2(0, -2.3446),
      color: 0xffff00,
    },
    {
      mass: 25,
      position: new THREE.Vector2(2.0, 0),
      velocity: new THREE.Vector2(0, 23.4457),
      color: 0xff00ff,
    },
    {
      mass: 0.1,
      position: new THREE.Vector2(3, 0),
      velocity: new THREE.Vector2(0, 10),
      color: 0x00ffff,
    },
    {
      mass: 0.1,
      position: new THREE.Vector2(-3, 0),
      velocity: new THREE.Vector2(0, -10),
      color: 0x00ff00,
    },
  ];

  const bodiesReset = [
    {
      mass: 250,
      position: new THREE.Vector2(0, 0),
      velocity: new THREE.Vector2(0, -2.3446),
      color: 0xffff00,
    },
    {
      mass: 25,
      position: new THREE.Vector2(2.0, 0),
      velocity: new THREE.Vector2(0, 23.4457),
      color: 0xff00ff,
    },
    {
      mass: 0.1,
      position: new THREE.Vector2(3, 0),
      velocity: new THREE.Vector2(0, 10),
      color: 0x00ffff,
    },
    {
      mass: 0.1,
      position: new THREE.Vector2(-3, 0),
      velocity: new THREE.Vector2(0, -10),
      color: 0x00ff00,
    },
  ];

  playPosition = [
    {
      mass: 250,
      position: new THREE.Vector2(0, 0),
      velocity: new THREE.Vector2(0, -2.3446),
      color: 0xffff00,
    },
    {
      mass: 25,
      position: new THREE.Vector2(2.0, 0),
      velocity: new THREE.Vector2(0, 23.4457),
      color: 0xff00ff,
    },
    {
      mass: 0.1,
      position: new THREE.Vector2(3, 0),
      velocity: new THREE.Vector2(0, 10),
      color: 0x00ffff,
    },
    {
      mass: 0.1,
      position: new THREE.Vector2(-3, 0),
      velocity: new THREE.Vector2(0, -10),
      color: 0x00ff00,
    },
  ];

  const bodyMeshes = bodies.map((body) => {
    let size = body.mass / 100;
    if (size > 0.5) size = 0.5;
    if (size < 0.1) size = 0.1;

    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: body.color,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(body.position.x, body.position.y, 0);
    mesh.name = "Planet";
    mesh.index = planetAndHandleIndex;
    planetGroup.add(mesh);

    // Create velocity arrow relative to mesh
    const dir = body.velocity.clone().normalize();
    const length = body.velocity.length() * 0.1;
    const arrowHelper = new THREE.ArrowHelper(
      dir,
      new THREE.Vector3(0, 0, 0),
      length,
      0x00ff00
    );
    arrowHelper.line.material.linewidth = 3;
    arrowHelper.line.material.depthTest = false;
    arrowHelper.line.material.depthWrite = false;
    arrowHelper.cone.material.depthTest = false;
    arrowHelper.cone.material.depthWrite = false;
    mesh.add(arrowHelper); // Attach to body mesh
    velocityArrows.push(arrowHelper);

    // Create the handle (cylinder)
    const sphereGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.01, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 1,
      map: velocityTexture,
      depthTest: false,
      depthWrite: false,
      //side: THREE.DoubleSide,
    });

    const handleSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    handleSphere.rotation.x = Math.PI / 2;
    handleSphere.rotation.y = Math.PI / 2;

    // Position the handle at the end of the arrow, local to mesh
    const localArrowEnd = dir.clone().multiplyScalar(length);
    handleSphere.position.copy(localArrowEnd);

    handleSphere.name = "Handle";
    handleSphere.index = planetAndHandleIndex;
    planetAndHandleIndex = planetAndHandleIndex + 1;
    mesh.add(handleSphere); // Attach to body mesh

    handleSphere.userData = {
      type: "velocityHandle",
      bodyMesh: mesh,
      arrow: arrowHelper,
    };
    arrowHelper.userData.handleSphere = handleSphere;

    //objects.push(handleSphere);

    return { body, mesh };
  });

  //Initially resize the bodies based on new function. Linear.
  updateBodySizes();

  // Create trails
  const trails = bodies.map(() => ({
    points: [],
    line: new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
    ),
  }));
  trails.forEach((trail) => planetGroup.add(trail.line));
  // Grey rectangular plane below the solar system
  const planeGeometry = new THREE.PlaneGeometry(5, 1.6);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(0, 0.8, -0.05);
  //plane.rotation.set(0, Math.PI/2, -Math.PI/12);
  sliderGroup.add(plane);

  const sliderGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.15);
  const sliderMaterial1 = new THREE.MeshStandardMaterial({
    color: bodies[0].color,
    side: THREE.DoubleSide,
  });
  const slider1 = new THREE.Mesh(sliderGeometry, sliderMaterial1);
  slider1.name = "Slider";
  slider1.index = 0;
  slider1.position.set(bodies[0].mass / 95 - 1.4, 1.15, -0.05);
  sliderGroup.add(slider1);

  const sliderMaterial2 = new THREE.MeshStandardMaterial({
    color: bodies[1].color,
    side: THREE.DoubleSide,
  });
  const slider2 = new THREE.Mesh(sliderGeometry, sliderMaterial2);
  slider2.name = "Slider";
  slider2.index = 1;
  slider2.position.set(bodies[1].mass / 95 - 1.4, 0.85, -0.05);
  sliderGroup.add(slider2);

  const sliderMaterial3 = new THREE.MeshStandardMaterial({
    color: bodies[2].color,
    side: THREE.DoubleSide,
  });
  const slider3 = new THREE.Mesh(sliderGeometry, sliderMaterial3);
  slider3.name = "Slider";
  slider3.index = 2;
  slider3.position.set(bodies[2].mass / 95 - 1.4, 0.55, -0.05);
  sliderGroup.add(slider3);

  const sliderMaterial4 = new THREE.MeshStandardMaterial({
    color: bodies[3].color,
    side: THREE.DoubleSide,
  });
  const slider4 = new THREE.Mesh(sliderGeometry, sliderMaterial4);
  slider4.name = "Slider";
  slider4.index = 3;
  slider4.position.set(bodies[3].mass / 95 - 1.4, 0.25, -0.05);
  sliderGroup.add(slider4);

  // Grey rectangular plane below the solar system
  const plane2Geometry = new THREE.PlaneGeometry(2, 2);
  const plane2Material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const plane2 = new THREE.Mesh(plane2Geometry, plane2Material);
  plane2.position.set(0, 0.75, -0.05);
  // plane2.rotation.x = -Math.PI / 2;
  playGroup.add(plane2);

  // GUI buttons on plane2
  const createButton = (radius, height, color, position, name) => {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const button = new THREE.Mesh(geometry, material);
    button.name = name;
    button.position.set(...position);
    button.rotation.x = Math.PI / 2;
    playGroup.add(button);
    return button;
  };

  const createRectButton = (width, height, depth, color, position) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(...position);
    scene.add(button);
    return button;
  };

  const createRectButtonWithTexture = (
    width,
    height,
    depth,
    texture,
    position,
    name,
    index
  ) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(...position);
    button.rotation.x = Math.PI / 2;
    button.name = name;
    button.index = index;
    sliderGroup.add(button);
    return button;
  };

  const createRoundButtonWithTexture = (
    radius,
    height,
    texture,
    position,
    name
  ) => {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
    });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(...position);
    button.name = name;
    // scene.add(button);
    //objects.push(button);
    playGroup.add(button);
    button.rotation.y = Math.PI / 2;
    button.rotation.x = Math.PI / 2;
    console.log(button.name);
    return button;
  };

  const createRectButtonWithText = (
    width,
    height,
    depth,
    text,
    position,
    index
  ) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const buttonText = createText(text, 0.15);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      transparent: true,
    });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(...position);
    button.add(buttonText);
    button.index = index;
    button.name = "buttonText";
    buttonText.position.set(0, 0, 0.051);
    sliderGroup.add(button);
    return button;
  };

  const createRectButtonWithTextPlay = (
    width,
    height,
    depth,
    text,
    position
  ) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const buttonText = createText(text, 0.15);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      transparent: true,
    });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(...position);
    button.name = text;
    button.add(buttonText);
    buttonText.position.set(0, 0, 0.051);
    playGroup.add(button);
    return button;
  };

  // Clear button with texture
  createRectButtonWithTextPlay(0.6, 0.2, 0.1, "Clear", [0.6, 0.2, 0]);
  createRectButtonWithTextPlay(0.6, 0.2, 0.1, "Fast", [-0.2, 0.8, 0]);
  createRectButtonWithTextPlay(0.6, 0.2, 0.1, "Normal", [-0.2, 0.6, 0]);
  createRectButtonWithTextPlay(0.6, 0.2, 0.1, "Slow", [-0.2, 0.4, 0]);

  // Buttons
  createRoundButtonWithTexture(
    0.25,
    0.1,
    rewindTexture,
    [-0.65, 1.25, 0],
    "Rewind"
  ); // Rewind button
  createRoundButtonWithTexture(0.35, 0.1, playTexture, [0, 1.3, 0], "Play"); // Play button
  createRoundButtonWithTexture(
    0.25,
    0.1,
    forwardTexture,
    [0.65, 1.25, 0],
    "StepForward"
  ); // Pause button
  createRoundButtonWithTexture(0.4, 0.1, resetTexture, [1.6, 0.8, 0], "Reset"); // Reset button
  createButton(0.08, 0.01, 0xeeeeee, [-0.65, 0.8, 0], "Fast"); // Pause button
  createButton(0.08, 0.01, 0xeeeeee, [-0.65, 0.6, 0], "Normal"); // Pause button
  createButton(0.08, 0.01, 0xeeeeee, [-0.65, 0.4, 0], "Slow"); // Pause button
  createButton(0.04, 0.01, 0x000000, [-0.65, 0.8, 0.01], "FastBlack"); // Pause button
  createButton(0.04, 0.01, 0x000000, [-0.65, 0.6, 0.01], "NormalBlack"); // Pause button
  createButton(0.04, 0.01, 0x000000, [-0.65, 0.4, 0.01], "SlowBlack"); // Pause button

  createRectButtonWithText(1.2, 0.2, 0.01, "Mass (10^28 kg)", [-1.8, 1.4, 0]);
  createRectButtonWithTexture(
    0.2,
    0.01,
    0.2,
    massDownTexture,
    [-1.6, 1.15, 0],
    "Down",
    0
  );
  createRectButtonWithTexture(
    0.2,
    0.01,
    0.2,
    massDownTexture,
    [-1.6, 0.85, 0],
    "Down",
    1
  );
  createRectButtonWithTexture(
    0.2,
    0.01,
    0.2,
    massDownTexture,
    [-1.6, 0.55, 0],
    "Down",
    2
  );
  createRectButtonWithTexture(
    0.2,
    0.01,
    0.2,
    massDownTexture,
    [-1.6, 0.25, 0],
    "Down",
    3
  );

  createRectButtonWithTexture(
    0.2,
    0.01,
    0.2,
    massUpTexture,
    [2, 1.15, 0],
    "Up",
    0
  );
  createRectButtonWithTexture(
    0.2,
    0.01,
    0.2,
    massUpTexture,
    [2, 0.85, 0],
    "Up",
    1
  );
  createRectButtonWithTexture(
    0.2,
    0.01,
    0.2,
    massUpTexture,
    [2, 0.55, 0],
    "Up",
    2
  );
  createRectButtonWithTexture(
    0.2,
    0.01,
    0.2,
    massUpTexture,
    [2, 0.25, 0],
    "Up",
    3
  );

  createRectButtonWithText(0.6, 0.2, 0.01, bodies[0].mass, [-2, 1.15, 0], 0);
  createRectButtonWithText(0.6, 0.2, 0.01, bodies[1].mass, [-2, 0.85, 0], 1);
  createRectButtonWithText(0.6, 0.2, 0.01, bodies[2].mass, [-2, 0.55, 0], 2);
  createRectButtonWithText(0.6, 0.2, 0.01, bodies[3].mass, [-2, 0.25, 0], 3);

  const drawLine = (x1, y1, z1, x2, y2, z2, index) => {
    const points = [];
    points.push(new THREE.Vector3(x1, y1, z1)); // Start point
    points.push(new THREE.Vector3(x2, y2, z2)); // End point
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = new THREE.Line(geometry, material);
    line.index = index;
    sliderGroup.add(line);
    return line;
  };
  drawLine(2, 1.15, 0, -1.6, 1.15, 0, 0); // End point
  drawLine(2, 0.85, 0, -1.6, 0.85, 0, 1); // End point
  drawLine(2, 0.55, 0, -1.6, 0.55, 0, 2); // End point
  drawLine(2, 0.25, 0, -1.6, 0.25, 0, 3); // End point

  //Bodies Group
  const createRectButtonWithTextBody = (
    width,
    height,
    depth,
    text,
    position,
    index
  ) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const buttonText = createText(text, 0.15);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      transparent: true,
    });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(...position);
    button.add(buttonText);
    button.index = index;
    button.name = "buttonText";
    buttonText.position.set(0, 0, 0.051);
    bodiesGroup.add(button);
    return button;
  };
  const numberOfBodiesButton = (width, height, depth, position, index) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const buttonText = createText(bodies.length, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      transparent: true,
    });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(...position);
    button.add(buttonText);
    button.index = index;
    button.name = "numberOfBodies";
    buttonText.position.set(0, 0, 0.051);
    bodiesGroup.add(button);
    return button;
  };

  const createRectButtonWithTextureBody = (
    width,
    height,
    depth,
    texture,
    position,
    name
  ) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(...position);
    button.rotation.x = Math.PI / 2;
    button.rotation.y = -Math.PI / 2;
    button.name = name;
    bodiesGroup.add(button);
    return button;
  };
  createRectButtonWithTextBody(1.2, 0.2, 0.01, "Bodies", [-1.8, 0.5, 0]);
  numberOfBodiesButton(0.8, 0.9, 0.01, [-2.0, 0.92, 0]);
  createRectButtonWithTextureBody(
    0.36,
    0.01,
    0.39,
    massUpTexture,
    [-1.4, 0.79, 0],
    "BodiesDown"
  );
  createRectButtonWithTextureBody(
    0.36,
    0.01,
    0.39,
    massDownTexture,
    [-1.4, 1.19, 0],
    "BodiesUp"
  );

  sliderGroup.scale.set(0.15, 0.15, 0.15);
  sliderGroup.rotation.set(-Math.PI / 4, 0, 0);
  sliderGroup.position.set(0, 1, -0.5);
  //sliderGroup.visible = false;

  playGroup.scale.set(0.15, 0.15, 0.15);
  playGroup.rotation.set(-Math.PI / 4, 0, 0);
  playGroup.position.set(0.55, 1, -0.5);

  planetGroup.position.set(0, 1.5, -1.5);
  planetGroup.scale.set(0.2, 0.2, 0.2);

  bodiesGroup.scale.set(0.15, 0.15, 0.15);
  bodiesGroup.rotation.set(-Math.PI / 4, 0, 0);
  bodiesGroup.position.set(-0.25, 1, -0.5);

  // controllers

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("select", onSelect); // Triggered during selection
  controller1.addEventListener("selectend", onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("select", onSelect); // Triggered during selection
  controller2.addEventListener("selectend", onSelectEnd);

  scene.add(controller2);
  

// Add touch event listeners
document.addEventListener('touchstart', onTouchStart, { passive: false });
document.addEventListener('touchmove', onTouchMove, { passive: false });
document.addEventListener('touchend', onTouchEnd);

  // Add mouse event listeners
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

  window.addEventListener("resize", onWindowResize);

  const controllerModelFactory = new XRControllerModelFactory();
  const handModelFactory = new XRHandModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  //

  hand1 = renderer.xr.getHand(0);
  hand1.addEventListener("pinchstart", onPinchStartLeft);
  hand1.addEventListener("pinchend", onPinchEndLeft);
  hand1.add(handModelFactory.createHandModel(hand1));

  scene.add(hand1);

  // Hand 2
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  hand2 = renderer.xr.getHand(1);
  hand2.addEventListener("pinchstart", onPinchStartRight);
  hand2.addEventListener("pinchend", onPinchEndRight);
  hand2.add(handModelFactory.createHandModel(hand2));
  scene.add(hand2);

  //

  const geometryLine = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);

  const line3 = new THREE.Line(geometryLine);
  line3.name = "line";
  line3.scale.z = 5;

  controller1.add(line3.clone());
  controller2.add(line3.clone());

  raycaster = new THREE.Raycaster();

  ///Hand stuff
  const SphereRadius = 0.05;
  function onPinchStartLeft(event) {
    const controller = event.target;
    const indexTip = controller.joints["index-finger-tip"];
    const object = collideObject(indexTip);
    if (object) {
      grabbing = true;
      indexTip.attach(object);
      controller.userData.selected = object;
      console.log("Selected", object);
    }
  }

  function collideObject(indexTip) {
    for (let i = 0; i < group.children.length; i++) {
      const sphere = group.children[i];
      const distance = indexTip
        .getWorldPosition(tmpVector1)
        .distanceTo(group.children[i].getWorldPosition(tmpVector2));

      if (distance < sphere.geometry.boundingSphere.radius * sphere.scale.x) {
        return sphere;
      }
    }

    return null;
  }

  function onPinchStartRight(event) {
    const controller = event.target;
    const indexTip = controller.joints["index-finger-tip"];
    const object = collideObject(indexTip);
    if (object) {
      grabbing = true;
      indexTip.attach(object);
      controller.userData.selected = object;
      console.log("Selected", object);
    }
  }

  function onPinchEndLeft(event) {
    const controller = event.target;

    if (controller.userData.selected !== undefined) {
      const object = controller.userData.selected;
      object.material.emissive.b = 0;
      group.attach(object);

      controller.userData.selected = undefined;
      grabbing = false;
    }

    scaling.active = false;
  }

  function onPinchEndRight(event) {
    const controller = event.target;

    if (controller.userData.selected !== undefined) {
      const object = controller.userData.selected;
      object.material.emissive.b = 0;
      group.attach(object);

      controller.userData.selected = undefined;
      grabbing = false;
    }

    scaling.active = false;
  }
  ////
  
// Function to update mouse coordinates
// Add additional function to handle both mouse and touch coordinate updating
function updateMouseCoordinates(event, isTouch) {
  const rect = renderer.domElement.getBoundingClientRect();
  let clientX, clientY;

  if (isTouch && event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

// Mouse event handlers
function onMouseDown(event, isTouch) {
  updateMouseCoordinates(event, isTouch);
  
  // Create a fake controller object for consistency with XR code
  const fakeController = {
    userData: {},
    getObjectByName: () => ({ scale: { z: 5 } }),
    attach: (obj) => {
      selectedObject = obj;
      // Store original parent
      fakeController.userData.originalParent = obj.parent;
      // Store world position and quaternion
      const originalWorldQuaternion = new THREE.Quaternion();
      obj.getWorldQuaternion(originalWorldQuaternion);
      fakeController.userData.originalWorldQuaternion = originalWorldQuaternion;
      
      const originalWorldPosition = new THREE.Vector3();
      obj.getWorldPosition(originalWorldPosition);
      fakeController.userData.originalWorldZ = originalWorldPosition.z;
    }
  };
  
  // Update raycaster with mouse position
  raycaster.setFromCamera(mouse, camera);
  
  // Use existing intersection logic
  const allObjects = [];
  sliderGroup.traverse((child) => {
    if (child.isMesh) allObjects.push(child);
  });
  planetGroup.traverse((child) => {
    if (child.isMesh) allObjects.push(child);
  });
  playGroup.traverse((child) => {
    if (child.isMesh) allObjects.push(child);
  });
  bodiesGroup.traverse((child) => {
    if (child.isMesh) allObjects.push(child);
  });
  
  const intersects = raycaster.intersectObjects(allObjects, false);
  
  // Filter to include only interactable objects
  const filtered = intersects.filter((intersection) =>
    ["Planet", "Play", "Reset", "Rewind", "StepForward", "Down", "Up", "Slider", "Handle", "Clear", "Fast", "Normal", "Slow", "BodiesUp", "BodiesDown"].includes(intersection.object.name)
  );
  
  // Prioritize "Handle" if present
  filtered.sort((a, b) => {
    if (a.object.name === "Handle" && b.object.name !== "Handle") return -1;
    if (a.object.name !== "Handle" && b.object.name === "Handle") return 1;
    return a.distance - b.distance; // Fallback to normal distance sort
  });
  
  if (filtered.length > 0) {
    const intersection = filtered[0];
    const object = intersection.object;
    
    if (["Planet", "Play", "Reset", "Rewind", "StepForward", "Down", "Up", "Slider", "Handle", "Clear", "Fast", "Normal", "Slow", "BodiesDown", "BodiesUp"].includes(object.name)) {
      object.material.emissive.b = 1;
    }
    
    if (object.name === "Planet" || object.name === "Handle") {
      fakeController.attach(object);
    }
    
    // Disable orbit controls when interacting with an object
    orbitControlsEnabled = false;
    controls.enabled = false;
    
    select = true;
    //socket.emit("userSelect", true);
    fakeController.userData.selected = object;
    selectedObject = object;
    isDragging = true;
  }
}

// Modify the onMouseMove function to make planets and handles follow the cursor
function onMouseMove(event) {
  // Update mouse coordinates regardless of drag state
  updateMouseCoordinates(event, event.type.includes('touch'));
  
  // Handle highlighting when not dragging
  if (!isDragging || !selectedObject) {
    // Handle highlighting only when not dragging (no changes here)
    clearTimeout(mouseMoveTimeout);
    
    // Debounce the highlight functionality to improve performance
    mouseMoveTimeout = setTimeout(() => {
      // Clear previous highlights
      while (intersected.length) {
        const object = intersected.pop();
        if (object.type == "Mesh") {
          object.material.emissive.r = 0;
        }
      }
      
      // Only highlight if not currently dragging
      if (!isDragging) {
        raycaster.setFromCamera(mouse, camera);
        const allObjects = [];
        sliderGroup.traverse((child) => {
          if (child.isMesh) allObjects.push(child);
        });
        planetGroup.traverse((child) => {
          if (child.isMesh) allObjects.push(child);
        });
        playGroup.traverse((child) => {
          if (child.isMesh) allObjects.push(child);
        });
        bodiesGroup.traverse((child) => {
          if (child.isMesh) allObjects.push(child);
        });
        
        const intersects = raycaster.intersectObjects(allObjects, false);
        const filtered = intersects.filter((intersection) =>
          ["Planet", "Play", "Reset", "Rewind", "StepForward", "Down", "Up", "Slider", "Handle", "Clear", "Fast", "Normal", "Slow", "BodiesUp", "BodiesDown"].includes(intersection.object.name)
        );
        
        if (filtered.length > 0) {
          const object = filtered[0].object;
          if (["Planet", "Play", "Reset", "Rewind", "StepForward", "Down", "Up", "Slider", "Handle", "Clear", "Fast", "Normal", "Slow", "BodiesDown", "BodiesUp"].includes(object.name)) {
            object.material.emissive.r = 1;
            intersected.push(object);
          }
        }
      }
    }, 10);
    return;
  }
  
  // Handle dragging objects
  if (selectedObject && isDragging) {
    if (selectedObject.name === "Planet" || selectedObject.name === "Handle" || selectedObject.name === "Slider") {
      // Update raycaster with current mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Create a plane for dragging at the object's current z-depth
      const objectWorldPos = new THREE.Vector3();
      selectedObject.getWorldPosition(objectWorldPos);
      
      // Create a plane perpendicular to the camera direction at the object's depth
      const planeNormal = new THREE.Vector3(0, 0, 1); // Assuming z-axis is depth
      const dragPlane = new THREE.Plane(planeNormal, -objectWorldPos.z);
      
      // Find the point where the ray intersects the plane
      const intersectionPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
        // Convert world position to object's parent space
        if (selectedObject.parent) {
          const worldToLocal = new THREE.Matrix4();
          worldToLocal.copy(selectedObject.parent.matrixWorld).invert();
          intersectionPoint.applyMatrix4(worldToLocal);
          
          if (selectedObject.name === "Slider") {
            // For sliders, only update the x position and constrain it
            const minX = -1.4;
            const maxX = 1.6;
            intersectionPoint.x = Math.max(minX, Math.min(maxX, intersectionPoint.x));
            intersectionPoint.y = selectedObject.position.y;
            intersectionPoint.z = selectedObject.position.z;
            
            // Update slider position
            selectedObject.position.copy(intersectionPoint);
            
            // Update the mass based on slider position
            let newMass = bodies[selectedObject.index].mass;
            const x = selectedObject.position.x;
            const t = (x + 1.4) / (1.6 + 1.4); // Normalize from 0 to 1
            newMass = t * (300 - 0.1) + 0.1;
            if (newMass !== 0.1) newMass = Math.round(newMass);
            if (newMass > 300) newMass = 300;
            if (newMass < 0.1) newMass = 0.1;
            
            bodies[selectedObject.index].mass = newMass;
            updateMassText(selectedObject.index);
            
            // Notify other connected clients
            /*
            socket.emit("slider", {
              index: selectedObject.index,
              mass: bodies[selectedObject.index].mass,
            });
            */
          } else {
            // For planets and handles, update both x and y, but keep z unchanged
            intersectionPoint.z = selectedObject.position.z;
            
            // Update position
            selectedObject.position.copy(intersectionPoint);
            
            // Update physics if it's a planet
            if (selectedObject.name === "Planet") {
              // Update body position to match mesh position
              const planetIndex = selectedObject.index;
              if (planetIndex !== undefined && bodies[planetIndex]) {
                bodies[planetIndex].position.x = selectedObject.position.x;
                bodies[planetIndex].position.y = selectedObject.position.y;
                
                // Clear the trail for this planet
                clearTrail(planetIndex);
                
                // Update physics visualizations
                if (!isPlaying) {
                  updateVelocityArrows();
                  updateGravityArrows(bodies, bodyMeshes);
                  updatePlayPosition();
                }
                
                // Notify other connected clients
                /*
                socket.emit("clearTrail", planetIndex);
                socket.emit(
                  "updateBodiesAndMeshes",
                  bodies.map((body, index) => ({
                    position: {
                      x: body.position.x,
                      y: body.position.y,
                    },
                    velocity: {
                      x: body.velocity.x,
                      y: body.velocity.y,
                    },
                    meshPosition: {
                      x: bodyMeshes[index].mesh.position.x,
                      y: bodyMeshes[index].mesh.position.y,
                      z: bodyMeshes[index].mesh.position.z,
                    },
                  }))
                );
                */
              }
            }
            
            // If it's a handle, update velocity vectors
            if (selectedObject.name === "Handle") {
              // Update velocity based on handle position relative to its planet
              const planetIndex = selectedObject.parent;
              if (planetIndex !== undefined && bodies[planetIndex]) {
                // Calculate velocity from handle position (this depends on how your handles work)
                // This is an example - adjust based on your actual implementation
                const handleOffset = new THREE.Vector3();
                handleOffset.subVectors(selectedObject.position, new THREE.Vector3(0, 0, 0));
                
                // Scale the handle offset to get a reasonable velocity
                const velocityScale = 2.0; // Adjust this value as needed
                bodies[planetIndex].velocity.x = handleOffset.x * velocityScale;
                bodies[planetIndex].velocity.y = handleOffset.y * velocityScale;
                
                // Update visualizations
                if (!isPlaying) {
                  updateVelocityArrows();
                  updateGravityArrows(bodies, bodyMeshes);
                }
              }
            }
          }
        }
      }
    }
  }
}

function onMouseUp(event) {
  if (!isDragging && !selectedObject) return;
  
  if (selectedObject) {
    if (["Planet", "Play", "Reset", "Rewind", "StepForward", "Down", "Up", "Slider", "Handle", "Clear", "Fast", "Normal", "Slow", "BodiesDown", "BodiesUp"].includes(selectedObject.name)) {
      selectedObject.material.emissive.b = 0;
    }
    
    // Handle button clicks
    handleObjectInteraction(selectedObject);
    
    // Reattach to original parent if needed
    if ((selectedObject.name === "Planet" || selectedObject.name === "Handle") && selectedObject.userData && selectedObject.userData.originalParent) {
      selectedObject.userData.originalParent.attach(selectedObject);
      selectedObject.position.z = 0;
      selectedObject.updateMatrixWorld(true);
      
      // Update all matrices in the planetGroup recursively
      updateMatricesRecursively(planetGroup);
    }
    
    bodyMeshes.forEach(({ body, mesh }, index) => {
      body.position.set(mesh.position.x, mesh.position.y, 0);
    });
    
    // Re-enable orbit controls after interaction
    orbitControlsEnabled = true;
    controls.enabled = true;
    
    // Reset flags and selection
    isDragging = false;
    select = false;
    deselect = true;
   // socket.emit("userSelect", false);
    selectedObject = null;
  } else {
    // If we didn't interact with any object, make sure orbit controls are enabled
    orbitControlsEnabled = true;
    controls.enabled = true;
  }
}

// Touch event handlers - adapt mouse events for touch
function onTouchStart(event) {
  //event.preventDefault();
  touchEnabled = true;
  onMouseDown(event, true);
}

// Modify the touch move handler to use the same functionality
function onTouchMove(event) {
  //event.preventDefault();
  if (touchEnabled) {
    // For touch events, we need to update mouse coordinates differently
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    
    // Use the same drag logic as mouse move
    if (selectedObject && isDragging) {
      if (selectedObject.name === "Planet" || selectedObject.name === "Handle" || selectedObject.name === "Slider") {
        // Update raycaster with current touch position
        raycaster.setFromCamera(mouse, camera);
        
        // Create a plane for dragging at the object's current z-depth
        const objectWorldPos = new THREE.Vector3();
        selectedObject.getWorldPosition(objectWorldPos);
        
        // Create a plane perpendicular to the camera direction at the object's depth
        const planeNormal = new THREE.Vector3(0, 0, 1);
        const dragPlane = new THREE.Plane(planeNormal, -objectWorldPos.z);
        
        // Find the point where the ray intersects the plane
        const intersectionPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
          // Convert world position to object's parent space
          if (selectedObject.parent) {
            const worldToLocal = new THREE.Matrix4();
            worldToLocal.copy(selectedObject.parent.matrixWorld).invert();
            intersectionPoint.applyMatrix4(worldToLocal);
            
            if (selectedObject.name === "Slider") {
              // Handle slider same as in mouse move
              const minX = -1.4;
              const maxX = 1.6;
              intersectionPoint.x = Math.max(minX, Math.min(maxX, intersectionPoint.x));
              intersectionPoint.y = selectedObject.position.y;
              intersectionPoint.z = selectedObject.position.z;
              selectedObject.position.copy(intersectionPoint);
              
              // Update mass based on slider position
              let newMass = bodies[selectedObject.index].mass;
              const x = selectedObject.position.x;
              const t = (x + 1.4) / (1.6 + 1.4);
              newMass = t * (300 - 0.1) + 0.1;
              if (newMass !== 0.1) newMass = Math.round(newMass);
              if (newMass > 300) newMass = 300;
              if (newMass < 0.1) newMass = 0.1;
              
              bodies[selectedObject.index].mass = newMass;
              updateMassText(selectedObject.index);
              
             /* socket.emit("slider", {
                index: selectedObject.index,
                mass: bodies[selectedObject.index].mass,
              });
              */
            } else {
              // Handle planets and handle objects same as in mouse move
              intersectionPoint.z = selectedObject.position.z;
              selectedObject.position.copy(intersectionPoint);
              
              if (selectedObject.name === "Planet") {
                const planetIndex = selectedObject.index;
                if (planetIndex !== undefined && bodies[planetIndex]) {
                  bodies[planetIndex].position.x = selectedObject.position.x;
                  bodies[planetIndex].position.y = selectedObject.position.y;
                  
                  clearTrail(planetIndex);
                  
                  if (!isPlaying) {
                    updateVelocityArrows();
                    updateGravityArrows(bodies, bodyMeshes);
                    updatePlayPosition();
                  }
                  
                  /*
                  socket.emit("clearTrail", planetIndex);
                  socket.emit(
                    "updateBodiesAndMeshes",
                    bodies.map((body, index) => ({
                      position: {
                        x: body.position.x,
                        y: body.position.y,
                      },
                      velocity: {
                        x: body.velocity.x,
                        y: body.velocity.y,
                      },
                      meshPosition: {
                        x: bodyMeshes[index].mesh.position.x,
                        y: bodyMeshes[index].mesh.position.y,
                        z: bodyMeshes[index].mesh.position.z,
                      },
                    }))
                  );
                  */
                }
              }
              
              if (selectedObject.name === "Handle") {
                const planetIndex = selectedObject.parent ? selectedObject.parent.index : undefined;
                if (planetIndex !== undefined && bodies[planetIndex]) {
                  const handleOffset = new THREE.Vector3();
                  handleOffset.subVectors(selectedObject.position, new THREE.Vector3(0, 0, 0));
                  
                  const velocityScale = 2.0;
                  bodies[planetIndex].velocity.x = handleOffset.x * velocityScale;
                  bodies[planetIndex].velocity.y = handleOffset.y * velocityScale;
                  
                  if (!isPlaying) {
                    updateVelocityArrows();
                    updateGravityArrows(bodies, bodyMeshes);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function onTouchEnd(event) {
 //event.preventDefault();
  if (touchEnabled) {
    onMouseUp(event, true);
    touchEnabled = false;
  }
}

// Helper function to handle object interactions
function handleObjectInteraction(object) {
  if (object.name === "Play") {
    if (isPlaying) {
      play = false;
      isPlaying = false;
    } else {
      play = true;
      isPlaying = true;
    }
    togglePlayPauseTexture(isPlaying);
   // socket.emit("play", isPlaying);
  }
  
  if (object.name === "Reset") {
    reset = true;
    deselect = false;
    resetBodies(true, false);
   // socket.emit("reset", reset);
  }
  
  if (object.name === "Rewind") {
    rewind = true;
    deselect = false;
    resetBodies(false, true);
   // socket.emit("rewind", rewind);
  }
  
  if (object.name === "StepForward") {
    stepBodies();
  }
  
  if (object.name === "Clear") {
    bodyMeshes.forEach(({ body, mesh }, index) => {
      clearTrail(index);
    });
   // socket.emit("clearTrails", true);
  }
  
  if (object.name === "Slow") {
    TIMESTEP = slow;
    updateSpeedButtonColors();
   // socket.emit("slow", true);
  }
  
  if (object.name === "Normal") {
    TIMESTEP = normal;
    updateSpeedButtonColors();
  //  socket.emit("normal", true);
  }
  
  if (object.name === "Fast") {
    TIMESTEP = fast;
    updateSpeedButtonColors();
   // socket.emit("fast", true);
  }
  
  if (object.name === "BodiesDown") {
    removeBody();
   // socket.emit("bodiesDown", true);
  }
  
  if (object.name === "BodiesUp") {
    addBody();
   // socket.emit("bodiesUp", true);
  }
  
  if (object.name === "Slider") {
    let newMass = bodies[object.index].mass;
    const x = object.position.x; // local x in sliderGroup
    const t = (x + 1.4) / (1.6 + 1.4); // Normalize from 0 to 1
    newMass = t * (300 - 0.1) + 0.1;
    if (newMass !== 0.1) newMass = Math.round(newMass);
    if (newMass > 300) newMass = 300;
    if (newMass < 0.1) newMass = 0.1;
    
    bodies[object.index].mass = newMass;
    updateMassText(object.index);
    updatePlayPosition();
    sliderSelect = false;
    /*
    socket.emit("slider", {
      index: object.index,
      mass: bodies[object.index].mass,
    });
    */
  }
  
  if (object.name === "Down") {
    bodies[object.index].mass -= 5;
    if (bodies[object.index].mass < 1) {
      bodies[object.index].mass = 0.1;
    } else if (bodies[object.index].mass !== 0.1) {
      bodies[object.index].mass = Math.round(bodies[object.index].mass);
    }
    updateMassText(object.index);
    
    /*
    socket.emit("down", {
      index: object.index,
      mass: bodies[object.index].mass,
    });
    */
  }
  
  if (object.name === "Up") {
    bodies[object.index].mass += 5;
    if (bodies[object.index].mass > 300) {
      bodies[object.index].mass = 300;
    } else if (bodies[object.index].mass !== 0.1) {
      bodies[object.index].mass = Math.round(bodies[object.index].mass);
    }
    updateMassText(object.index);
    
    /*
    socket.emit("up", {
      index: object.index,
      mass: bodies[object.index].mass,
    });
    */
  }
  
  if (object.name === "Planet") {
    clearTrail(object.index);
    //socket.emit("clearTrail", object.index);
    
    if (!isPlaying) {
      updateVelocityArrows();
      updateGravityArrows(bodies, bodyMeshes);
      updatePlayPosition();
    }
    /*
    socket.emit(
      "updateBodiesAndMeshes",
      bodies.map((body, index) => ({
        position: {
          x: body.position.x,
          y: body.position.y,
        },
        velocity: {
          x: body.velocity.x,
          y: body.velocity.y,
        },
        meshPosition: {
          x: bodyMeshes[index].mesh.position.x,
          y: bodyMeshes[index].mesh.position.y,
          z: bodyMeshes[index].mesh.position.z,
        },
      }))
    );
    */
  }
}

// Helper function to update matrices recursively
function updateMatricesRecursively(obj) {
  obj.updateMatrix();
  obj.updateMatrixWorld(true);
  if (obj.children && obj.children.length > 0) {
    obj.children.forEach((child) => updateMatricesRecursively(child));
  }
}


// Keep the original XR controller functions intact
function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];
    const object = intersection.object;

    if (
      object.name == "Planet" ||
      object.name == "Play" ||
      object.name == "Reset" ||
      object.name == "Rewind" ||
      object.name == "StepForward" ||
      object.name == "Down" ||
      object.name == "Up" ||
      object.name == "Slider" ||
      object.name == "Handle" ||
      object.name == "Clear" ||
      object.name == "Fast" ||
      object.name == "Normal" ||
      object.name == "Slow" ||
      object.name == "BodiesDown" ||
      object.name == "BodiesUp"
    ) {
      object.material.emissive.b = 1;
    }

    if (object.name === "Planet" || object.name === "Handle") {
      // Store the original world quaternion before attaching
      const originalWorldQuaternion = new THREE.Quaternion();
      object.getWorldQuaternion(originalWorldQuaternion);
      controller.userData.originalWorldQuaternion = originalWorldQuaternion;

      // Store original world position
      const originalWorldPosition = new THREE.Vector3();
      object.getWorldPosition(originalWorldPosition);
      controller.userData.originalWorldZ = originalWorldPosition.z;

      // Store original parent
      controller.userData.originalParent = object.parent;

      // Attach to controller
      controller.attach(object);
    }

    // Disable orbit controls when using XR controller to interact with objects
    orbitControlsEnabled = false;
    controls.enabled = false;

    select = true;
    //socket.emit("userSelect", true);
    controller.userData.selected = object;
  }

  controller.userData.targetRayMode = event.data.targetRayMode;
}


 // }

  function onSelect(event) {
    const controller = event.target;
    const object = controller.userData.selected;
    if (!object) return;

    if (object.name === "Planet") {
      fixPlanetRotation(controller);
    }

    if (object.name === "Handle") {
      fixHandleRotation(controller);
    }
  }

function onSelectEnd(event) {
  const controller = event.target;
  select = false;
  deselect = true;

  if (controller.userData.selected !== undefined) {
    const object = controller.userData.selected;

    if (
      object.name == "Planet" ||
      object.name == "Play" ||
      object.name == "Reset" ||
      object.name == "Rewind" ||
      object.name == "StepForward" ||
      object.name == "Down" ||
      object.name == "Up" ||
      object.name == "Slider" ||
      object.name == "Handle" ||
      object.name == "Clear" ||
      object.name == "Fast" ||
      object.name == "Normal" ||
      object.name == "Slow" ||
      object.name == "BodiesDown" ||
      object.name == "BodiesUp"
    ) {
      object.material.emissive.b = 0;
    }
      if (object.name == "Play") {
        if (isPlaying) {
          play = false;
          isPlaying = false;
        } else {
          play = true;
          isPlaying = true;
        }

        togglePlayPauseTexture(isPlaying);
       // socket.emit("play", isPlaying);
      }

      if (object.name == "Reset") {
        reset = true;
        deselect = false;
        resetBodies(true, false);
       // socket.emit("reset", reset);
      }

      if (object.name == "Rewind") {
        rewind = true;
        deselect = false;
        resetBodies(false, true);
       // socket.emit("rewind", rewind);
      }

      if (object.name == "StepForward") {
        stepBodies();
      }
      if (object.name == "Clear") {
        bodyMeshes.forEach(({ body, mesh }, index) => {
          clearTrail(index);
        });
       // socket.emit("clearTrails", true);
      }
      if (object.name == "Slow") {
        TIMESTEP = slow;
        updateSpeedButtonColors();
       // socket.emit("slow", true);
      }
      if (object.name == "Normal") {
        TIMESTEP = normal;
        updateSpeedButtonColors();
       // socket.emit("normal", true);
      }
      if (object.name == "Fast") {
        TIMESTEP = fast;
        updateSpeedButtonColors();
       // socket.emit("fast", true);
      }

      if (object.name == "BodiesDown") {
        removeBody();
       // socket.emit("bodiesDown", true);
      }

      if (object.name == "BodiesUp") {
        addBody();
      //  socket.emit("bodiesUp", true);
      }

      if (object.name == "Planet" || object.name == "Handle") {
        if (object.name == "Planet") fixPlanetRotation(controller);
        if (object.name == "Handle") fixHandleRotation(controller);

        // ✅ Reattach to original parent
        const originalParent = controller.userData.originalParent;
        if (originalParent) {
          originalParent.attach(object);
        }

        object.position.z = 0;
        object.updateMatrixWorld(true);

        // Update all matrices in the planetGroup recursively
        function updateMatricesRecursively(obj) {
          obj.updateMatrix();
          obj.updateMatrixWorld(true);
          if (obj.children && obj.children.length > 0) {
            obj.children.forEach((child) => updateMatricesRecursively(child));
          }
        }

        // Assuming planetGroup is accessible here
        updateMatricesRecursively(planetGroup);

        if (object.name == "Planet") {
          clearTrail(object.index);
        //  socket.emit("clearTrail", object.index);
        }

        if (!isPlaying) {
          updateVelocityArrows();
          updateGravityArrows(bodies, bodyMeshes);
        }
/*
        socket.emit(
          "updateBodiesAndMeshes",
          bodies.map((body, index) => ({
            position: {
              x: body.position.x,
              y: body.position.y,
            },
            velocity: {
              x: body.velocity.x,
              y: body.velocity.y,
            },
            meshPosition: {
              x: bodyMeshes[index].mesh.position.x,
              y: bodyMeshes[index].mesh.position.y,
              z: bodyMeshes[index].mesh.position.z,
            },
          }))
        );
        */
        if (!isPlaying) {
  updatePlayPosition();
        }

        // ✅ Clean up stored parent reference
        delete controller.userData.originalParent;
        delete controller.userData.originalWorldQuaternion;
      }

      if (object.name == "Slider") {
        let newMass = bodies[object.index].mass;
        const x = object.position.x; // local x in sliderGroup
        const t = (x + 1.4) / (1.6 + 1.4); // Normalize from 0 to 1
        newMass = t * (300 - 0.1) + 0.1;
        if (newMass !== 0.1) newMass = Math.round(newMass);
        if (newMass > 300) newMass = 300;
        if (newMass < 0.1) newMass = 0.1;

        bodies[object.index].mass = newMass;
        updateMassText(object.index);
            updatePlayPosition();
        sliderSelect = false;
        /*
        socket.emit("slider", {
          index: object.index,
          mass: bodies[object.index].mass,
        });
        */
      }

      if (object.name == "Down") {
        bodies[object.index].mass -= 5;
        if (bodies[object.index].mass < 1) {
          bodies[object.index].mass = 0.1;
        } else if (bodies[object.index].mass !== 0.1) {
          bodies[object.index].mass = Math.round(bodies[object.index].mass);
        }
        updateMassText(object.index);
        /*
        socket.emit("down", {
          index: object.index,
          mass: bodies[object.index].mass,
        });
        */
      }

      if (object.name == "Up") {
        bodies[object.index].mass += 5;
        if (bodies[object.index].mass > 300) {
          bodies[object.index].mass = 300;
        } else if (bodies[object.index].mass !== 0.1) {
          bodies[object.index].mass = Math.round(bodies[object.index].mass);
        }
        updateMassText(object.index);

        /*
        socket.emit("up", {
          index: object.index,
          mass: bodies[object.index].mass,
        });
        */
      }

      bodyMeshes.forEach(({ body, mesh }, index) => {
        body.position.set(mesh.position.x, mesh.position.y, 0);
      });

    orbitControlsEnabled = true;
    controls.enabled = true;

    controller.userData.selected = undefined;
    }
    // socket.emit("userSelect", false);
  }
//  }

  // Helper function to fix planet rotation
  function fixPlanetRotation(controller) {
    if (
      !controller.userData.selected ||
      controller.userData.selected.name !== "Planet"
    )
      return;

    const planet = controller.userData.selected;

    // Fix rotation if we have the original world quaternion
    if (controller.userData.originalWorldQuaternion) {
      // Get parent's world quaternion
      const parentWorldQuaternion = new THREE.Quaternion();
      planet.parent.getWorldQuaternion(parentWorldQuaternion);
      parentWorldQuaternion.invert();

      // Calculate local quaternion needed to maintain original world orientation
      const localQuaternion = controller.userData.originalWorldQuaternion
        .clone()
        .premultiply(parentWorldQuaternion);

      // Apply the fixed rotation
      planet.quaternion.copy(localQuaternion);
    }
  }

  function fixHandleRotation(controller) {
    if (
      !controller.userData.selected ||
      controller.userData.selected.name !== "Handle"
    )
      return;

    const planet = controller.userData.selected;

    // Fix rotation if we have the original world quaternion
    if (controller.userData.originalWorldQuaternion) {
      // Get parent's world quaternion
      const parentWorldQuaternion = new THREE.Quaternion();
      planet.parent.getWorldQuaternion(parentWorldQuaternion);
      parentWorldQuaternion.invert();

      // Calculate local quaternion needed to maintain original world orientation
      const localQuaternion = controller.userData.originalWorldQuaternion
        .clone()
        .premultiply(parentWorldQuaternion);

      // Apply the fixed rotation
      planet.quaternion.copy(localQuaternion);
    }
  }

  function getIntersections(controller) {
    controller.updateMatrixWorld();
    raycaster.setFromXRController(controller);

    // Recursively check all children of relevant groups
    const allObjects = [];
    sliderGroup.traverse((child) => {
      if (child.isMesh) allObjects.push(child);
    });
    planetGroup.traverse((child) => {
      if (child.isMesh) allObjects.push(child);
    });
    playGroup.traverse((child) => {
      if (child.isMesh) allObjects.push(child);
    });

    bodiesGroup.traverse((child) => {
      if (child.isMesh) allObjects.push(child);
    });

    const intersects = raycaster.intersectObjects(allObjects, false);

    // Filter to include only interactable objects
    const filtered = intersects.filter((intersection) =>
      [
        "Planet",
        "Play",
        "Reset",
        "Rewind",
        "StepForward",
        "Down",
        "Up",
        "Slider",
        "Handle",
        "Clear",
        "Fast",
        "Normal",
        "Slow",
        "BodiesUp",
        "BodiesDown",
      ].includes(intersection.object.name)
    );

    // Prioritize "Handle" if present
    filtered.sort((a, b) => {
      if (a.object.name === "Handle" && b.object.name !== "Handle") return -1;
      if (a.object.name !== "Handle" && b.object.name === "Handle") return 1;
      return a.distance - b.distance; // Fallback to normal distance sort
    });

    return filtered;
  }

  function intersectObjects(controller) {
    // Do not highlight in mobile-ar
    if (controller.userData.targetRayMode === "screen") return;

    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return;

    const line = controller.getObjectByName("line");
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
      const intersection = intersections[0];
      const object = intersection.object;

      if (
        object.name == "Planet" ||
        object.name == "Play" ||
        object.name == "Reset" ||
        object.name == "Rewind" ||
        object.name == "StepForward" ||
        object.name == "Down" ||
        object.name == "Up" ||
        object.name == "Slider" ||
        object.name == "Handle" ||
        object.name == "Clear" ||
        object.name == "Fast" ||
        object.name == "Normal" ||
        object.name == "Slow" ||
        object.name == "BodiesDown" ||
        object.name == "BodiesUp"
      ) {
        object.material.emissive.r = 1;
      }

      intersected.push(object);
      line.scale.z = intersection.distance;
    } else {
      line.scale.z = 5;
    }
  }

  function cleanIntersected() {
    while (intersected.length) {
      const object = intersected.pop();
      if (object.type == "Mesh") {
        object.material.emissive.r = 0;
      }
    }
  }

  ///////////////
  // Key Events
  //////////////

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault(); // Prevents scrolling
      if (isPlaying) {
        play = false;
        isPlaying = false;
      } else {
        play = true;
        isPlaying = true;
      }
      togglePlayPauseTexture(isPlaying);
     // socket.emit("play", isPlaying);
      console.log("Play is now:", play);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.code === "Backspace") {
      event.preventDefault(); // Optional: prevents navigating back in some browsers
      //reset = true;
      //     resetBodies(true, false);
      resetBodies(false, true);
     // socket.emit("rewind", true);
    }
  });

  //document.addEventListener("resize", onWindowResize);

  //
  //Initial arrow Update

  //

  // Function to compute gravitational forces
  function computeForces() {
    const forces = bodies.map(() => new THREE.Vector2(0, 0));
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const dir = new THREE.Vector2().subVectors(
          bodies[j].position,
          bodies[i].position
        );
        const distSq = dir.lengthSq();
        if (distSq === 0) continue;
        const forceMag = (G * bodies[i].mass * bodies[j].mass) / distSq;
        const force = dir.normalize().multiplyScalar(forceMag);
        forces[i].add(force);
        forces[j].sub(force);
      }
    }
    return forces;
  }

  // Function to update positions and velocities using simple Euler integration
  function updateBodies() {
    const forces = computeForces();
    for (let i = 0; i < bodies.length; i++) {
      const acceleration = forces[i].clone().divideScalar(bodies[i].mass);
      bodies[i].velocity.add(acceleration.multiplyScalar(TIMESTEP));
      bodies[i].position.add(
        bodies[i].velocity.clone().multiplyScalar(TIMESTEP)
      );
    }
  }

  function updateVelocityArrows() {
    bodyMeshes.forEach(({ body, mesh }, index) => {
      const arrowHelper = velocityArrows[index];
      const handleSphere = arrowHelper.userData.handleSphere;

      // No need to set arrowHelper.position – it should already be at (0, 0, 0)

      if (handleSphere && deselect === true) {
        // Get direction from mesh's local origin to handleSphere's local position
        const newDirection = handleSphere.position.clone();
        const newLength = newDirection.length();
        newDirection.normalize();

        // Update arrow based on handleSphere
        arrowHelper.setDirection(newDirection);
        arrowHelper.setLength(newLength);

        // Update body.velocity proportionally
        const velocityScale = 10; // Inverse of 0.1 scaling
        body.velocity.set(
          newDirection.x * newLength * velocityScale,
          newDirection.y * newLength * velocityScale,
          newDirection.z * newLength * velocityScale
        );
      } else {
        // Default: update arrow from body's velocity
        const direction = new THREE.Vector3(
          body.velocity.x,
          body.velocity.y,
          body.velocity.z
        ).normalize();
        const length = body.velocity.length() * 0.1;

        arrowHelper.setDirection(direction);
        arrowHelper.setLength(length);

        // Update handleSphere's local position (relative to mesh)
        if (handleSphere) {
          const arrowEnd = direction.clone().multiplyScalar(length);
          handleSphere.position.copy(arrowEnd);
        }
      }
    });

    deselect = false;
  }

  function updateGravityArrows(bodies, bodyMeshes) {
    // Clear existing gravity arrows
    gravityArrows.forEach((arrow) => planetGroup.remove(arrow));
    gravityArrows.length = 0;

    for (let i = 0; i < bodies.length; i++) {
      const bodyA = bodies[i];
      let totalForce = new THREE.Vector3(0, 0, 0);

      for (let j = 0; j < bodies.length; j++) {
        if (i === j) continue; // Skip self-interaction

        const bodyB = bodies[j];
        const dir = new THREE.Vector3(
          bodyB.position.x - bodyA.position.x,
          bodyB.position.y - bodyA.position.y,
          0
        );

        const distance = dir.length();
        if (distance === 0) continue;

        dir.normalize();
        const forceMagnitude =
          (G * bodyA.mass * bodyB.mass) / (distance * distance);
        const forceVector = dir.multiplyScalar(forceMagnitude);

        totalForce.add(forceVector);
      }

      if (totalForce.length() > 0) {
        //totalForce.normalize();
        const direction = totalForce.clone().normalize();
        let length = totalForce.length() * 0.00005; // Scale for visibility
        if (length < 0.001) length = 0.2;
        if (length > 2) length = 2;
        const arrow = new THREE.ArrowHelper(
          direction,
          bodyMeshes[i].mesh.position,
          length,
          0x0000ff,
          0.2,
          0.2
        );

        arrow.line.material.linewidth = 3;
        arrow.line.material.depthTest = false;
        arrow.line.material.depthWrite = false;

        arrow.cone.material.depthTest = false;
        arrow.cone.material.depthWrite = false;
        planetGroup.add(arrow);
        gravityArrows.push(arrow);
      }
    }
  }

  function resetBodies(resetVar, rewindVar) {
    play = false;
    isPlaying = false;
    togglePlayPauseTexture(isPlaying);
    //socket.emit("play", isPlaying);

    //
    bodyMeshes.forEach(({ body, mesh }, index) => {
      // Reset body state
      if (resetVar) {
        body.position.set(
          bodiesReset[index].position.x,
          bodiesReset[index].position.y,
          0
        );
        body.velocity.set(
          bodiesReset[index].velocity.x,
          bodiesReset[index].velocity.y,
          0
        );
        body.mass = bodiesReset[index].mass;
      }

      if (rewindVar) {
        body.position.set(
          playPosition[index].position.x,
          playPosition[index].position.y,
          0
        );
        body.velocity.set(
          playPosition[index].velocity.x,
          playPosition[index].velocity.y,
          0
        );
        body.mass = playPosition[index].mass;
      }
      // Move mesh (planet) to new position
      mesh.position.set(body.position.x, body.position.y, 0);

      updateMassText(index);

      // Update velocity arrow and handle
      const arrowHelper = velocityArrows[index];
      const handleSphere = arrowHelper.userData.handleSphere;

      // Arrow is already at (0,0,0) relative to mesh, so just update direction and length

      const direction = new THREE.Vector3(
        body.velocity.x,
        body.velocity.y,
        body.velocity.z
      ).normalize();
      const length = body.velocity.length() * 0.1;

      arrowHelper.setDirection(direction);
      arrowHelper.setLength(length);
      clearTrail(index);

      // Set handleSphere local position at end of arrow
      if (handleSphere) {
        const arrowEnd = direction.clone().multiplyScalar(length);
        handleSphere.position.copy(arrowEnd); // local position relative to mesh
      }

      // Optional: update related features
      updateVelocityArrows();
      updateGravityArrows(bodies, bodyMeshes);
    });

    reset = false;
    rewind = false;
  }

  function clearTrail(index) {
    const trail = trails[index];
    trail.points = []; // Clear points
    trail.line.geometry.setFromPoints(trail.points); // Update geometry
  }

  function stepBodies() {
    play = false;
    bodyMeshes.forEach(({ body, mesh }, index) => {
      mesh.position.set(body.position.x, body.position.y, 0);
      updateBodies();
      updateVelocityArrows();
      updateGravityArrows(bodies, bodyMeshes);
      const trail = trails[index];
      trail.points.push(mesh.position.clone());
      if (trail.points.length > trailLength) trail.points.shift();
      trail.line.geometry.setFromPoints(trail.points);
      // 🎨 Ensure trail color matches body color
      if (trail.line.material && body.color) {
        trail.line.material.color.set(body.color);
      }
    });

    // Emit the body and mesh data after updating everything
    /*
    socket.emit(
      "updateBodiesAndMeshes",
      bodies.map((body, index) => ({
        position: {
          x: body.position.x,
          y: body.position.y,
        },
        velocity: {
          x: body.velocity.x,
          y: body.velocity.y,
        },
        meshPosition: {
          x: bodyMeshes[index].mesh.position.x,
          y: bodyMeshes[index].mesh.position.y,
          z: bodyMeshes[index].mesh.position.z,
        },
      }))
    );
    */
  }
  function updateMassText(index) {
    // Get the currently selected object
    const selectedSlider =
      controller1.userData.selected || controller2.userData.selected;

    // Find and remove the old button
    const button = sliderGroup.children.find(
      (child) => child.index === index && child.name === "buttonText"
    );

    if (button) {
      button.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });

      sliderGroup.remove(button);
    }

    // ✅ Default to current body mass unless slider is selected
    let newMass = bodies[index].mass;

    // ✅ If a handle is selected and matches this index, recalculate mass from position
    if (
      selectedSlider &&
      selectedSlider.name === "Slider" &&
      selectedSlider.index === index
    ) {
      const x = selectedSlider.position.x; // local x in sliderGroup
      const t = (x + 1.4) / (1.6 + 1.4); // Normalize from 0 to 1
      newMass = t * (300 - 0.1) + 0.1;
      if (newMass !== 0.1) newMass = Math.round(newMass);
      if (newMass > 300) newMass = 300;
      if (newMass < 0.1) newMass = 0.1;

      bodies[index].mass = newMass;
    }

    // For the socket.on sliderSelect
    if (sliderSelect) {
      const slider = sliderGroup.children.find(
        (child) => child.index === index
      );
      if (slider) {
        const x = slider.position.x; // local x in sliderGroup
        const t = (x + 1.4) / (1.6 + 1.4); // Normalize from 0 to 1
        newMass = t * (300 - 0.1) + 0.1;
        if (newMass !== 0.1) newMass = Math.round(newMass);
        if (newMass > 300) newMass = 300;
        if (newMass < 0.1) newMass = 0.1;

        bodies[index].mass = newMass;
      }
    }

    // Re-create the text button with updated mass
    let position;
    switch (index) {
      case 0:
        position = [-2, 1.15, 0];
        break;
      case 1:
        position = [-2, 0.85, 0];
        break;
      case 2:
        position = [-2, 0.55, 0];
        break;
      case 3:
        position = [-2, 0.25, 0];
        break;
      default:
        console.warn("Invalid object index for button:", index);
        return;
    }

    const newText = createRectButtonWithText(
      0.6,
      0.2,
      0.01,
      newMass,
      position,
      index
    );

    sliderGroup.add(newText);

    // ✅ Update slider handle positions from mass
    if (bodies[0]) {
      slider1.position.set(bodies[0].mass / 95 - 1.4, 1.15, -0.05);
    }
    if (bodies[1]) {
      slider2.position.set(bodies[1].mass / 95 - 1.4, 0.85, -0.05);
    }
    if (bodies[2]) {
      slider3.position.set(bodies[2].mass / 95 - 1.4, 0.55, -0.05);
    }
    if (bodies[3]) {
      slider4.position.set(bodies[3].mass / 95 - 1.4, 0.25, -0.05);
    }

    updateBodySizes();
    updateVelocityArrows();
    updateGravityArrows(bodies, bodyMeshes);
    
  }
  
  function updatePlayPosition() {
              playPosition = [];

          // Clone bodies array and populate playPosition
          playPosition = bodies.map((body) => ({
            mass: body.mass,
            position: new THREE.Vector2(body.position.x, body.position.y),
            velocity: new THREE.Vector2(body.velocity.x, body.velocity.y),
            color: body.color,
          }));

          // Emit the playPosition data to socket
          /*
          socket.emit(
            "playPosition",
            playPosition.map((body, index) => ({
              position: {
                x: body.position.x,
                y: body.position.y,
              },
              velocity: {
                x: body.velocity.x,
                y: body.velocity.y,
              },
              mass: body.mass,
              color: body.color,
            }))
          );
          */
  }

  function updateBodiesText() {
    const button = bodiesGroup.children.find(
      (child) => child.name === "numberOfBodies"
    );
    if (button) {
      // Dispose of all children first (including the text)
      button.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });

      // Remove the old button from the group
      bodiesGroup.remove(button);

      const numberOfBodiesButton = (width, height, depth, position, index) => {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const buttonText = createText(bodies.length, 0.5);
        const material = new THREE.MeshStandardMaterial({
          color: 0x808080,
          transparent: true,
        });
        const button = new THREE.Mesh(geometry, material);
        button.position.set(...position);
        button.add(buttonText);
        button.index = index;
        button.name = "numberOfBodies";
        buttonText.position.set(0, 0, 0.051);
        bodiesGroup.add(button);
        return button;
      };
      numberOfBodiesButton(0.8, 0.9, 0.01, [-2.0, 0.92, 0]);
    }
  }
  function updateBodySizes() {
    bodyMeshes.forEach(({ body, mesh }, index) => {
      // Define range parameters
      const minMass = 0.1;
      const maxMass = 300;
      const minRadius = 0.05;
      const maxRadius = 0.5;

      // Handle edge cases first
      if (body.mass <= minMass) {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        mesh.geometry = new THREE.SphereGeometry(minRadius, 16, 16);
        return;
      }

      if (body.mass >= maxMass) {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        mesh.geometry = new THREE.SphereGeometry(maxRadius, 16, 16);
        return;
      }

      // Convert mass to volume-based radius
      // Volume of a sphere = (4/3) * π * r³
      // For proportional scaling, we want radius ∝ ³√mass

      // Calculate the minimum and maximum volumes
      const minVolume = (4 / 3) * Math.PI * Math.pow(minRadius, 3);
      const maxVolume = (4 / 3) * Math.PI * Math.pow(maxRadius, 3);

      // Normalize the mass to a position in our volume range
      const normalizedMass = (body.mass - minMass) / (maxMass - minMass);
      const scaledVolume = minVolume + normalizedMass * (maxVolume - minVolume);

      // Calculate the radius from the volume
      // r = ³√(3V/4π)
      const radius = Math.pow((3 * scaledVolume) / (4 * Math.PI), 1 / 3);

      // Dispose old geometry
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      // Assign new geometry with updated radius
      mesh.geometry = new THREE.SphereGeometry(radius, 16, 16);
    });
  }

  function afterUpdateBodies() {
    bodyMeshes.forEach(({ body, mesh }, index) => {
      mesh.position.set(body.position.x, body.position.y, 0);

      const trail = trails[index];
      trail.points.push(mesh.position.clone());
      if (trail.points.length > trailLength) trail.points.shift();
      trail.line.geometry.setFromPoints(trail.points);

      if (trail.line.material && body.color) {
        trail.line.material.color.set(body.color);
      }
    });
    updateVelocityArrows();
    updateGravityArrows(bodies, bodyMeshes);
  }

  function togglePlayPauseTexture(isPlaying) {
    // Find the play button mesh
    const playButton = playGroup.getObjectByName("Play");

    if (playButton) {
      // If the mesh has a material
      if (playButton.material) {
        // Set the texture based on play state
        if (isPlaying) {
          playButton.material.map = pauseTexture;
        } else {
          playButton.material.map = playTexture;
        }

        // Make sure to update the material
        playButton.material.needsUpdate = true;
      }
    }
  }

  function updateSpeedButtonColors() {
    // Get all potential speed buttons from the playGroup
    const speedButtons = ["FastBlack", "SlowBlack", "NormalBlack"]
      .map((name) => playGroup.getObjectByName(name))
      .filter((button) => button !== undefined);

    // Process each button that was found
    speedButtons.forEach((button) => {
      // First, reset all buttons to their default color (assuming white)
      button.material.visible = false;

      // Then set color to cyan based on the current TIMESTEP value
      if (button.name === "FastBlack" && TIMESTEP === fast) {
        button.material.visible = true;
      } else if (button.name === "NormalBlack" && TIMESTEP === normal) {
        button.material.visible = true;
      } else if (button.name === "SlowBlack" && TIMESTEP === slow) {
        button.material.visible = true;
      }

      // Make sure the material updates
      button.material.needsUpdate = true;
    });
  }

  function removeBody() {
    // Only allow deletion if we have more than two bodies
    if (bodies.length > 2) {
      // Get the index of the last body
      const lastIndex = bodies.length - 1;
      activeBodies = activeBodies - 1;

      // Remove the last body and save it
      const removedBody = bodies.pop();
      nextBodies.push(removedBody);

      // Get and save the mesh for the last body
      const removedMeshEntry = bodyMeshes.pop();
      nextBodyMeshes.push(removedMeshEntry);

      const lastMesh = removedMeshEntry.mesh;

      // If the mesh exists, remove it from scene but don't dispose
      if (lastMesh && lastMesh.parent) {
        lastMesh.parent.remove(lastMesh);
      }

      // Optionally, keep geometry/material disposal for true cleanup
      // if (lastMesh.geometry) lastMesh.geometry.dispose();
      // if (lastMesh.material) lastMesh.material.dispose();

      // Hide all slider group items with index of the last body
      sliderGroup.traverse((child) => {
        if (child.index === lastIndex) {
          child.visible = false;
        }
      });
      clearTrail(lastIndex);
      
      

      // Update simulation and UI
      updateBodies();
      updateVelocityArrows();
      updateGravityArrows(bodies, bodyMeshes);
      updateBodiesText();
      
      
                playPosition = [];

          // Clone bodies array and populate playPosition
          playPosition = bodies.map((body) => ({
            mass: body.mass,
            position: new THREE.Vector2(body.position.x, body.position.y),
            velocity: new THREE.Vector2(body.velocity.x, body.velocity.y),
            color: body.color,
          }));

    }
  }
  function addBody() {
    if (
      bodies.length < 5 &&
      nextBodies.length > 0 &&
      nextBodyMeshes.length > 0
    ) {
      // Get the index of the body being re-added
      const nextIndex = bodies.length;
      activeBodies = activeBodies + 1;

      // Restore the last saved body and mesh
      const restoredBody = nextBodies.pop();
      const restoredMeshEntry = nextBodyMeshes.pop();

      bodies.push(restoredBody);
      bodyMeshes.push(restoredMeshEntry);

      // Re-add mesh to the scene if it exists
      if (restoredMeshEntry.mesh && scene) {
        planetGroup.add(restoredMeshEntry.mesh);
      }

      // Show corresponding slider
      sliderGroup.traverse((child) => {
        if (child.index === nextIndex) {
          child.visible = true;
        }
      });


      
      // Update physics simulation and visuals
      updateBodies();
      updateVelocityArrows();
      updateGravityArrows(bodies, bodyMeshes);
      updateBodiesText();
      
                      playPosition = [];

          // Clone bodies array and populate playPosition
          playPosition = bodies.map((body) => ({
            mass: body.mass,
            position: new THREE.Vector2(body.position.x, body.position.y),
            velocity: new THREE.Vector2(body.velocity.x, body.velocity.y),
            color: body.color,
          }));
    }
  }

  function updateSlider(controller) {
    const selected = controller.userData.selected;

    if (selected && selected.name === "Slider") {
      const tempMatrix = new THREE.Matrix4();
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      // Create a horizontal plane at sliderGroup's world position
      const planeNormal = new THREE.Vector3(0, 1, 0); // y-up horizontal plane
      const sliderPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        planeNormal,
        sliderGroup.position.clone()
      );

      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(sliderPlane, intersectionPoint);

      if (intersectionPoint) {
        // Convert intersection from world space to local space of sliderGroup
        const localPoint = sliderGroup.worldToLocal(intersectionPoint.clone());

        // Clamp to slider X range
        const clampedX = THREE.MathUtils.clamp(localPoint.x, -1.4, 1.6);

        // Update handle position in local X (keep Y, Z unchanged)
        selected.position.x = clampedX;
      }
      updateMassText(selected.index);
      /*
      socket.emit("sliderSelect", {
        x: selected.position.x,
        index: selected.index,
      });
      */
          updatePlayPosition();
    }
  }

  function movePlanet(controller) {
    const object = controller.userData.selected;

    if (!object) return;

    // Handling both "Planet" and "Handle" cases
    if (object.name === "Planet" || object.name === "Handle") {
      const worldPosition = new THREE.Vector3();
      const adjustedPosition = new THREE.Vector3();
      const planetPosition = new THREE.Vector3();

      // Get the object's world position
      object.getWorldPosition(worldPosition);

      if (object.name === "Planet") {
        // Adjust for Planet position
        adjustedPosition.x = (worldPosition.x - 0) / 0.2;
        adjustedPosition.y = (worldPosition.y - 1.5) / 0.2;
        adjustedPosition.z = (worldPosition.z - -1.5) / 0.2;
      } else if (object.name === "Handle") {
        // Find the corresponding "Planet" object in the planetGroup
        console.log(planetGroup);
        const planet = planetGroup.children.find(
          (child) => child.name === "Planet" && child.index === object.index
        );

        if (planet) {
          const planetWorldPosition = new THREE.Vector3();
          planet.getWorldPosition(planetWorldPosition);

          planetPosition.x = planetWorldPosition.x - 0;
          planetPosition.y = planetWorldPosition.y - 1.5;
          planetPosition.z = planetWorldPosition.z - -1.5;

          adjustedPosition.x = worldPosition.x - planetPosition.x;
          adjustedPosition.y = worldPosition.y - planetPosition.y;
          adjustedPosition.z = worldPosition.z - planetPosition.z;
        }
      }
/*
      socket.emit("selectedObjectMoved", {
        x: adjustedPosition.x,
        y: adjustedPosition.y,
        z: adjustedPosition.z,
        name: object.name,
        index: object.index,
      });
      */
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

function render() {
  renderer.setAnimationLoop((now) => {
    // Ensure fixPlanetRotation runs at default frame rate
    fixPlanetRotation(controller1);
    fixPlanetRotation(controller2);
    fixHandleRotation(controller1);
    fixHandleRotation(controller2);
    
    // Limit updateBodies() to 30Hz
    if (now - lastUpdateTime >= updateFrameTime) {
      lastUpdateTime = now;
      if (select) {
        movePlanet(controller1);
        movePlanet(controller2);
      }
      if (!select && play) {
        updateBodies(); // Runs at 60Hz
       /*
        socket.emit(
          "updateBodiesAndMeshes",
          bodies.map((body, index) => ({
            position: {
              x: body.position.x,
              y: body.position.y,
            },
            velocity: {
              x: body.velocity.x,
              y: body.velocity.y,
            },
            meshPosition: {
              x: bodyMeshes[index].mesh.position.x,
              y: bodyMeshes[index].mesh.position.y,
              z: bodyMeshes[index].mesh.position.z,
            },
          }))
        );
        */
        afterUpdateBodies();
      }
    }
    
    if (setup) {
      updateVelocityArrows();
      updateGravityArrows(bodies, bodyMeshes);
      updateSpeedButtonColors();
      removeBody();
      removeBody();
      setup = false;
    }
    
    cleanIntersected();
    intersectObjects(controller1);
    intersectObjects(controller2);
    
    if (select) {
      updateSlider(controller1);
      updateSlider(controller2);
    }
    
    // Only update orbit controls if enabled
    if (orbitControlsEnabled) {
      controls.update();
    }
    
    renderer.render(scene, camera);
  });
}
}
