// main.js

// ==========================
// Global Variables and Initialization
// ==========================

// Attach variables to window to make them globally accessible
window.scene = null;
window.camera = null;
window.renderer = null;
window.controls = null;
window.gridHelper = null;

// Graph variables
window.graph = null;

// Initialize the application
window.init = function () {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 200, 400);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // Controls setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Grid Helper
    gridHelper = new THREE.GridHelper(400, 20);
    scene.add(gridHelper);

    // Initialize graph
    graph = new Graph();

    // Event listeners
    initEventListeners();

    // Start rendering loop
    animate();

    // Update UI
    updateModeDisplay();
    updateHelpText();
};

// Rendering loop
window.animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
};

// Adjust on window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the application
init();
