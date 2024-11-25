import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import "./style.css";
import { fragmentShader, pointFragmentShader, pointVertexShader, starFragmentShader, startVertexShader, vertexShader } from "./shaders";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
// dat.GUI.toggleHide();



// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();



const raycaster = new THREE.Raycaster();
let mousePosition = new THREE.Vector2();
let targetMousePosition = new THREE.Vector2();
let pointsMesh = null;

const modelPosition = {
    x: 0,
    y: -2.6,
    z: 0,
};

const updateMousePosition = () => {
    mousePosition.x += (targetMousePosition.x - mousePosition.x) * 0.1;
    mousePosition.y += (targetMousePosition.y - mousePosition.y) * 0.1;

    // Check if pointsMesh and its material exist before accessing uniforms
    if (pointsMesh && pointsMesh.material && pointsMesh.material.uniforms) {
        pointsMesh.material.uniforms.uMouse.value.copy(mousePosition);
    }
};

window.addEventListener('mousemove', (event) => {
    targetMousePosition.x = (event.clientX / sizes.width) * 2 - 1;
    targetMousePosition.y = -(event.clientY / sizes.height) * 2 + 1;
});

const modelTransform = {
    scale: 1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    pointColor: '#89cfeb',
    fragmentShaderColor: '#1f8fff',
    pointHoverColor:'#00bfff',
    pointSize:4.0
};




// Update the material creation in your OBJLoader callback
const pointsMaterial = new THREE.ShaderMaterial({
    vertexShader: pointVertexShader,
    fragmentShader: pointFragmentShader,
    transparent: true,
    uniforms: {
        uProgress: { value: 0 },
        uPointSize: { value: modelTransform.pointSize },
        uHover: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Color(modelTransform.pointColor) },
        uHoverColor:{value:new THREE.Color(modelTransform.pointHoverColor)}
    },
    depthTest: true,
    depthWrite: false,
});



let wireframeMesh;
let wireframeMaterial;
const objLoader = new OBJLoader();
objLoader.load(
    '/brain/brain1.obj',
    (object) => {
        object.traverse((child) => {
            if (child.isMesh) {
                const originalGeometry = child.geometry;
                const geometry = new THREE.BufferGeometry();
                const positions = originalGeometry.attributes.position.array;
                const vertexCount = positions.length;

                // Simplify geometry
                const stride = 3;
                const simplifiedPositions = [];

                for (let i = 0; i < vertexCount; i += 9 * stride) {
                    for (let j = 0; j < 9; j += 3) {
                        if (i + j < vertexCount) {
                            simplifiedPositions.push(
                                positions[i + j],
                                positions[i + j + 1],
                                positions[i + j + 2]
                            );
                        }
                    }
                }

                const simplifiedVertexCount = simplifiedPositions.length / 3;
                const vertexIndices = new Float32Array(simplifiedVertexCount);
                for (let i = 0; i < simplifiedVertexCount; i++) {
                    vertexIndices[i] = i;
                }

                geometry.setAttribute('position', new THREE.Float32BufferAttribute(simplifiedPositions, 3));
                geometry.setAttribute('vertexIndex', new THREE.BufferAttribute(vertexIndices, 1));


                 wireframeMaterial = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: true,
                    side: THREE.DoubleSide,
                    uniforms: {
                        uProgress: { value: 0 },
                        uColor: { value: new THREE.Color(modelTransform.fragmentShaderColor)}
                    },
                    wireframe: true,
                    wireframeLinewidth: 1,
                    depthTest: true,
                    depthWrite: true
                });

                wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
                wireframeMesh.scale.set(1, 1, 1);
                wireframeMesh.position.set(modelPosition.x, modelPosition.y, modelPosition.z);
                wireframeMesh.rotateY(213)

                // Create and add pointsMesh
                pointsMesh = new THREE.Points(geometry, pointsMaterial);
                pointsMesh.scale.copy(wireframeMesh.scale);
                pointsMesh.position.copy(wireframeMesh.position);
                pointsMesh.rotateY(213)

                scene.add(wireframeMesh);
                scene.add(pointsMesh);
            }
        });
    },
    (xhr) => {
        console.log(`Loading... ${(xhr.loaded / xhr.total) * 100}% completed`);
    },
    (error) => {
        console.error('Error loading OBJ file:', error);
    }
);

const modelSettings = gui.addFolder('Model Settings');
modelSettings.addColor(modelTransform, 'fragmentShaderColor').name('Wireframe Color').onChange((value) => {
    wireframeMaterial.uniforms.uColor.value.set(value);
});

modelSettings.addColor(modelTransform, 'pointColor').name('Points Color').onChange((value) => {
    pointsMaterial.uniforms.uColor.value.set(value);
});

modelSettings.addColor(modelTransform, 'pointHoverColor').name('Points Hover Color').onChange((value) => {
    pointsMaterial.uniforms.uHoverColor.value.set(value);
});
modelSettings.add(modelTransform, 'pointSize').name('Points Size on Hover')
    .min(1)
    .max(10)
    .step(0.1)
    .onChange((value) => {
        pointsMaterial.uniforms.uPointSize.value = value;
    });


const modelFolder = gui.addFolder('Model Position');
modelFolder.add(modelPosition, 'x', -10, 10, 0.1).name('X Position').onChange(() => {
    if (wireframeMesh && pointsMesh) {
        wireframeMesh.position.x = modelPosition.x;
        pointsMesh.position.x = modelPosition.x;
    }
});
modelFolder.add(modelPosition, 'y', -10, 10, 0.1).name('Y Position').onChange(() => {
    if (wireframeMesh && pointsMesh) {
        wireframeMesh.position.y = modelPosition.y;
        pointsMesh.position.y = modelPosition.y;
    }
});
modelFolder.add(modelPosition, 'z', -10, 10, 0.1).name('Z Position').onChange(() => {
    if (wireframeMesh && pointsMesh) {
        wireframeMesh.position.z = modelPosition.z;
        pointsMesh.position.z = modelPosition.z;
    }
});


/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
);
// Assuming you already have `camera`, `scene`, `gui`, and other necessary components initialized

// Set initial camera position
camera.position.set(-7.2, 0.1, 3.2); // Slightly elevated and zoomed out
// scene.add(camera);

// Camera control object to bind with GUI
const cameraControls = {
    positionX: camera.position.x,
    positionY: camera.position.y,
    positionZ: camera.position.z,
    rotationX: camera.rotation.x,
    rotationY: camera.rotation.y,
    rotationZ: camera.rotation.z,
    fov: camera.fov,
};

// Add a folder for camera controls in GUI
const cameraGui = gui.addFolder('Camera');

// Field of View (FOV) control
cameraGui.add(cameraControls, 'fov', 10, 120, 1).name('FOV').onChange((value) => {
    camera.fov = value;
    camera.updateProjectionMatrix();
});


// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// controls.enableRotate = false;


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap


/**
 * Animate
 */
const clock = new THREE.Clock();


  const totalDrawTime = 3

  function createStarBackground() {
    // Create a geometry for the stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000; // Default number of stars

    // Arrays to store positions and sizes of stars
    const positions = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);

    // Fill the arrays with random values
    for (let i = 0; i < starsCount; i++) {
        // Position
        positions[i * 3] = (Math.random() - 0.5) * 20;      // x
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;  // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;  // z

        // Size
        sizes[i] = Math.random() * 2 * 0.05; // Random sizes for variation
    }

    // Add attributes to the geometry
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create shader material for stars
    const starsMaterial = new THREE.ShaderMaterial({
        uniforms: {
            pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            color1: { value: new THREE.Color(0x80c1ff) }, // Blue tint
            color2: { value: new THREE.Color(0xcccccc) }, // Neutral tint
            blurStrength: { value: 0.3 }
        },
        vertexShader:startVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    // Create the stars mesh and add to scene
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Update pixelRatio on window resize
    window.addEventListener('resize', () => {
        starsMaterial.uniforms.pixelRatio.value = Math.min(window.devicePixelRatio, 2);
    });

    return { stars, material: starsMaterial, geometry: starsGeometry };
}

// Add this line after scene creation
const backgroundStars = createStarBackground();

const starSettings = {
    size: 2,
    blurStrength: 0.3,
    color1: '#80c1ff',
    color2: '#cccccc',
    randomness: 20
};

const BackgroundSettings = gui.addFolder('Background Settings')

BackgroundSettings.add(starSettings, 'size', 0.1, 5).name('Star Size').onChange(value => {
    const sizes = backgroundStars.geometry.attributes.size.array;
    for (let i = 0; i < sizes.length; i++) {
        sizes[i] = Math.random() * value;
    }
    backgroundStars.geometry.attributes.size.needsUpdate = true;
});

BackgroundSettings.add(starSettings, 'blurStrength', 0.1, 1).name('Blur Strength').onChange(value => {
    backgroundStars.material.uniforms.blurStrength.value = value;
});

BackgroundSettings.addColor(starSettings, 'color1').name('Color 1').onChange(value => {
    backgroundStars.material.uniforms.color1.value.set(value);
});

BackgroundSettings.addColor(starSettings, 'color2').name('Color 2').onChange(value => {
    backgroundStars.material.uniforms.color2.value.set(value);
});

BackgroundSettings.add(starSettings, 'randomness', 5, 50).name('Randomness').onChange(value => {
    const positions = backgroundStars.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] = (Math.random() - 0.5) * value;      // x
        positions[i * 3 + 1] = (Math.random() - 0.5) * value;  // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * value;  // z
    }
    backgroundStars.geometry.attributes.position.needsUpdate = true;
});


const updateModelTransform = () => {
    if (wireframeMesh && pointsMesh) {
        // Update scale
        wireframeMesh.scale.setScalar(modelTransform.scale);
        pointsMesh.scale.setScalar(modelTransform.scale);

        // Update rotation
        wireframeMesh.rotation.set(
            THREE.MathUtils.degToRad(modelTransform.rotationX),
            THREE.MathUtils.degToRad(modelTransform.rotationY),
            THREE.MathUtils.degToRad(modelTransform.rotationZ)
        );
        pointsMesh.rotation.copy(wireframeMesh.rotation);
    }
};

const transformFolder = gui.addFolder("Model Transformations");

// Add GUI control for scaling
transformFolder
    .add(modelTransform, "scale", 0.1, 5, 0.1)
    .name("Scale")
    .onChange(updateModelTransform);

// Add GUI controls for rotation
transformFolder
    .add(modelTransform, "rotationX", 0, 360, 1)
    .name("Rotation X")
    .onChange(updateModelTransform);

transformFolder
    .add(modelTransform, "rotationY", 0, 360, 1)
    .name("Rotation Y")
    .onChange(updateModelTransform);

transformFolder
    .add(modelTransform, "rotationZ", 0, 360, 1)
    .name("Rotation Z")
    .onChange(updateModelTransform);





const tick = () => {
	const elapsedTime = clock.getElapsedTime();

    if (wireframeMesh && pointsMesh) {
        const progress = Math.min(elapsedTime / totalDrawTime, 1);
        wireframeMesh.material.uniforms.uProgress.value = progress;
        pointsMesh.material.uniforms.uProgress.value = progress;

        // Update mouse position
        updateMousePosition();

        // Update raycaster
        raycaster.setFromCamera(mousePosition, camera);
        const intersects = raycaster.intersectObject(pointsMesh);

        // Update hover effect
        const targetHoverValue = intersects.length > 0 ? 1.0 : 0.0;
        const currentHoverValue = pointsMesh.material.uniforms.uHover.value;
        pointsMesh.material.uniforms.uHover.value += (targetHoverValue - currentHoverValue) * 0.1;    }


	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
