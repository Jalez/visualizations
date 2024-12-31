// ==========================
// Global Variables and Initialization
// ==========================

// Three.js variables
let scene, camera, renderer, controls;
let gridHelper;

// Graph variables
let graph;

// Interaction variables
let mode = 'none';
let selectedNode = null;
let startNode = null;
let endNode = null;
let statusMessages = [];
let algorithmSteps = [];
let currentStepIndex = -1;
let showEdgeWeights = false;
let showAlgorithmCode = false;
let codeLines = [];
let currentCodeLineIndex = -1;

// Initialize the application
function init() {
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
}

// Rendering loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Adjust on window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================
// Event Listeners
// ==========================

function initEventListeners() {
    window.addEventListener('click', onMouseClick, false);
    window.addEventListener('keydown', onKeyDown, false);
}

// ==========================
// Graph Data Structures
// ==========================

class GraphNode {
    constructor(id, x, y, z) {
        this.id = id;
        this.position = new THREE.Vector3(x, y, z);
        this.edges = [];
        this.visited = false;
        this.mesh = null; // Three.js mesh representation
        this.label = null; // Label sprite
    }
}

class GraphEdge {
    constructor(node1, node2, weight = 1) {
        this.node1 = node1;
        this.node2 = node2;
        this.weight = weight;
        this.line = null; // Three.js line representation
        this.label = null; // Label sprite
    }
}

class Graph {
    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    addNode(x, y, z) {
        const node = new GraphNode(this.nodes.length, x, y, z);
        this.nodes.push(node);
        this.createNodeMesh(node);
        return node;
    }

    addEdge(node1, node2, weight = 1) {
        // Prevent duplicate edges
        if (this.edges.some(edge => (edge.node1 === node1 && edge.node2 === node2) || (edge.node1 === node2 && edge.node2 === node1))) {
            return;
        }
        const edge = new GraphEdge(node1, node2, weight);
        this.edges.push(edge);
        node1.edges.push(edge);
        node2.edges.push(edge);
        this.createEdgeLine(edge);
    }

    removeNode(node) {
        // Remove edges connected to the node
        node.edges.slice().forEach(edge => {
            this.removeEdge(edge);
        });
        // Remove node mesh and label
        scene.remove(node.mesh);
        scene.remove(node.label);
        // Remove node from graph
        this.nodes = this.nodes.filter(n => n !== node);
    }

    removeEdge(edge) {
        scene.remove(edge.line);
        scene.remove(edge.label);
        edge.node1.edges = edge.node1.edges.filter(e => e !== edge);
        edge.node2.edges = edge.node2.edges.filter(e => e !== edge);
        this.edges = this.edges.filter(e => e !== edge);
    }

    createNodeMesh(node) {
        const geometry = new THREE.SphereGeometry(5, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(node.position);
        scene.add(mesh);
        node.mesh = mesh;

        // Add label
        const sprite = createTextSprite(node.id.toString());
        node.label = sprite;
        updateLabelPosition(node);
        scene.add(sprite);
    }

    createEdgeLine(edge) {
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        const points = [];
        points.push(edge.node1.position);
        points.push(edge.node2.position);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        edge.line = line;

        // Add weight label
        const sprite = createTextSprite(edge.weight.toString());
        edge.label = sprite;
        updateEdgeLabelPosition(edge);
        if (!showEdgeWeights) {
            sprite.visible = false;
        }
        scene.add(sprite);
    }
}

// Create text sprite for labels
function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.font = 'Bold 24px Arial';
    context.fillStyle = 'rgba(0,0,0,1.0)';
    context.textAlign = 'center';
    context.fillText(message, size / 2, size / 2 + 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(20, 20, 1);
    return sprite;
}

// Update node label position
function updateLabelPosition(node) {
    node.label.position.copy(node.position);
    node.label.position.y += 10;
}

// Update edge label position
function updateEdgeLabelPosition(edge) {
    const midPoint = new THREE.Vector3().addVectors(edge.node1.position, edge.node2.position).multiplyScalar(0.5);
    edge.label.position.copy(midPoint);
    edge.label.position.y += 5;
}

// ==========================
// User Interaction
// ==========================

// Handle mode change
function changeMode(selectedMode) {
    mode = selectedMode;
    updateModeDisplay();
    updateHelpText();
}

// Update mode display
function updateModeDisplay() {
    const modeDisplay = document.getElementById('modeDisplay');
    modeDisplay.textContent = `Mode: ${capitalizeFirstLetter(mode)}`;
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


// Handle mouse clicks
function onMouseClick(event) {
    // Prevent unintended actions when clicking on UI elements
    if (event.target.closest('#ui') || event.target.closest('#instructions') || event.target.closest('#algorithmCode')) {
        return;
    }

    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / renderer.domElement.clientHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Determine which objects are intersected
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        handleInteraction(intersected);
    } else if (mode === 'addNode') {
        // Add node at click position
        const point = new THREE.Vector3();
        raycaster.ray.at(100, point);
        graph.addNode(point.x, point.y, point.z);
    }
}

function handleInteraction(object) {
    // Find the corresponding node
    const node = graph.nodes.find(n => n.mesh === object || n.label === object);
    if (node) {
        switch (mode) {
            case 'addEdge':
                if (selectedNode && selectedNode !== node) {
                    const weight = parseFloat(prompt('Enter edge weight:', '1')) || 1;
                    graph.addEdge(selectedNode, node, weight);
                    selectedNode = null;
                    updateHelpText('Edge added.');
                } else {
                    selectedNode = node;
                    updateHelpText('Select the second node to connect.');
                }
                break;
            case 'removeNode':
                removeNode(node);
                updateHelpText(`Node ${node.id} removed. Select another node to remove or change mode.`);
                break;
            case 'selectStartNode':
                if (startNode) {
                    highlightNode(startNode, 0xffffff); // Reset color
                }
                startNode = node;
                highlightNode(node, 0x00ff00); // Green color
                updateHelpText(`Start node set to Node ${node.id}. Select another node to change or change mode.`);
                break;
            case 'selectEndNode':
                if (endNode) {
                    highlightNode(endNode, 0xffffff); // Reset color
                }
                endNode = node;
                highlightNode(node, 0xff0000); // Red color
                updateHelpText(`End node set to Node ${node.id}. Select another node to change or change mode.`);
                break;
            case 'removeEdge':
                // For simplicity, we can remove all edges connected to the node
                removeEdgesOfNode(node);
                updateHelpText(`Edges connected to Node ${node.id} removed. Select another node or change mode.`);
                break;
            default:
                // Do nothing
                break;
        }
    } else if (mode === 'removeEdge') {
        // Check if an edge line was clicked
        const edge = graph.edges.find(e => e.line === object);
        if (edge) {
            graph.removeEdge(edge);
            updateHelpText('Edge removed. Select another edge to remove or change mode.');
        }
    }
}

function removeNode(node) {
    if (node === startNode) startNode = null;
    if (node === endNode) endNode = null;
    graph.removeNode(node);
}

function removeEdgesOfNode(node) {
    node.edges.slice().forEach(edge => {
        graph.removeEdge(edge);
    });
}

function highlightNode(node, color) {
    node.mesh.material.color.setHex(color);
}

// ==========================
// Algorithm Implementations
// ==========================

function startAlgorithm() {
    const algorithm = document.getElementById('algorithmSelect').value;
    if (!startNode) {
        alert('Please select a start node.');
        return;
    }
    if ((algorithm === 'dijkstra' || algorithm === 'astar') && !endNode) {
        alert('Please select an end node.');
        return;
    }

    resetTraversal();
    loadAlgorithmCode(algorithm);
    switch (algorithm) {
        case 'bfs':
            bfs(startNode);
            updateStatus('BFS completed.');
            break;
        case 'dfs':
            dfs(startNode);
            updateStatus('DFS completed.');
            break;
        case 'dijkstra':
            dijkstra(startNode);
            updateStatus("Dijkstra's Algorithm completed.");
            break;
        case 'astar':
            aStar(startNode, endNode);
            updateStatus('A* Search completed.');
            break;
        default:
            alert('Algorithm not implemented.');
    }
}

// Breadth-First Search (BFS)
function bfs(start) {
    const queue = [];
    queue.push(start);
    start.visited = true;
    highlightNode(start, 0x00ff00); // Green color
    recordStep(`Starting BFS from Node ${start.id}.`, 1);

    while (queue.length > 0) {
        const currentNode = queue.shift();
        recordStep(`Visiting Node ${currentNode.id}.`, 4);

        currentNode.edges.forEach(edge => {
            const neighbor = edge.node1 === currentNode ? edge.node2 : edge.node1;
            if (!neighbor.visited) {
                neighbor.visited = true;
                highlightNode(neighbor, 0x00ff00); // Green color
                queue.push(neighbor);
                recordStep(`Discovered Node ${neighbor.id} from Node ${currentNode.id}.`, 7);
            }
        });
    }
}

// Depth-First Search (DFS)
function dfs(node) {
    node.visited = true;
    highlightNode(node, 0x0000ff); // Blue color
    recordStep(`Visited Node ${node.id}.`, 1);

    node.edges.forEach(edge => {
        const neighbor = edge.node1 === node ? edge.node2 : edge.node1;
        if (!neighbor.visited) {
            recordStep(`Exploring neighbor Node ${neighbor.id} of Node ${node.id}.`, 3);
            dfs(neighbor);
        }
    });
}

// Dijkstra's Algorithm
function dijkstra(start) {
    const distances = {};
    const previous = {};
    const queue = new PriorityQueue();
    graph.nodes.forEach(node => {
        distances[node.id] = Infinity;
        previous[node.id] = null;
        node.visited = false;
    });
    distances[start.id] = 0;
    queue.enqueue(start, 0);
    recordStep('Initialized distances and priority queue.', 1);

    while (!queue.isEmpty()) {
        const currentNode = queue.dequeue();
        if (currentNode.visited) continue;
        currentNode.visited = true;
        highlightNode(currentNode, 0x00ff00); // Green color
        recordStep(`Visiting Node ${currentNode.id}.`, 7);

        currentNode.edges.forEach(edge => {
            const neighbor = edge.node1 === currentNode ? edge.node2 : edge.node1;
            const alt = distances[currentNode.id] + edge.weight;
            if (alt < distances[neighbor.id]) {
                distances[neighbor.id] = alt;
                previous[neighbor.id] = currentNode;
                queue.enqueue(neighbor, alt);
                recordStep(`Updated distance of Node ${neighbor.id} to ${alt} via Node ${currentNode.id}.`, 11);
            }
        });
    }

    // Highlight the shortest path
    let pathNode = endNode;
    while (pathNode && previous[pathNode.id]) {
        highlightNode(pathNode, 0xff0000); // Red color
        pathNode = previous[pathNode.id];
        recordStep(`Tracing back path via Node ${pathNode.id}.`, 13);
    }
}

// A* Algorithm
function aStar(start, goal) {
    const openSet = new PriorityQueue();
    const cameFrom = {};
    const gScore = {};
    const fScore = {};
    graph.nodes.forEach(node => {
        gScore[node.id] = Infinity;
        fScore[node.id] = Infinity;
        node.visited = false;
    });
    gScore[start.id] = 0;
    fScore[start.id] = heuristic(start, goal);
    openSet.enqueue(start, fScore[start.id]);
    recordStep('Initialized scores and open set.', 1);

    while (!openSet.isEmpty()) {
        const currentNode = openSet.dequeue();
        if (currentNode.visited) continue;
        currentNode.visited = true;
        highlightNode(currentNode, 0x00ff00); // Green color
        recordStep(`Visiting Node ${currentNode.id}.`, 7);

        if (currentNode === goal) {
            recordStep('Goal reached.', 9);
            // Reconstruct path
            let pathNode = goal;
            while (pathNode && cameFrom[pathNode.id]) {
                highlightNode(pathNode, 0xff0000); // Red color
                pathNode = cameFrom[pathNode.id];
                recordStep(`Tracing back path via Node ${pathNode.id}.`, 10);
            }
            return;
        }

        currentNode.edges.forEach(edge => {
            const neighbor = edge.node1 === currentNode ? edge.node2 : edge.node1;
            const tentative_gScore = gScore[currentNode.id] + edge.weight;
            if (tentative_gScore < gScore[neighbor.id]) {
                cameFrom[neighbor.id] = currentNode;
                gScore[neighbor.id] = tentative_gScore;
                fScore[neighbor.id] = gScore[neighbor.id] + heuristic(neighbor, goal);
                openSet.enqueue(neighbor, fScore[neighbor.id]);
                recordStep(`Updated scores for Node ${neighbor.id}.`, 13);
            }
        });
    }
}

// Heuristic function for A*
function heuristic(nodeA, nodeB) {
    return nodeA.position.distanceTo(nodeB.position);
}

// Priority Queue Implementation
class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    enqueue(node, priority) {
        this.elements.push({ node, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    dequeue() {
        return this.elements.shift().node;
    }
    isEmpty() {
        return this.elements.length === 0;
    }
}

// Record algorithm steps
function recordStep(message, codeLineIndex) {
    const step = {
        nodes: graph.nodes.map(node => ({
            id: node.id,
            visited: node.visited,
            color: node.mesh.material.color.clone()
        })),
        message: message,
        codeLineIndex: codeLineIndex
    };
    algorithmSteps.push(step);
}

// Apply a recorded step
function applyStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= algorithmSteps.length) {
        return;
    }
    const step = algorithmSteps[stepIndex];
    graph.nodes.forEach(node => {
        const nodeState = step.nodes.find(n => n.id === node.id);
        node.visited = nodeState.visited;
        node.mesh.material.color.copy(nodeState.color);
    });
    updateStatus(step.message);
    highlightCodeLine(step.codeLineIndex);
}

// Next step
function nextStep() {
    if (currentStepIndex < algorithmSteps.length - 1) {
        currentStepIndex++;
        applyStep(currentStepIndex);
    }
}

// Previous step
function previousStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        applyStep(currentStepIndex);
    }
}

// ==========================
// Algorithm Code Display
// ==========================

function toggleAlgorithmCode() {
    showAlgorithmCode = document.getElementById('toggleCode').checked;
    const codePanel = document.getElementById('algorithmCode');
    codePanel.style.display = showAlgorithmCode ? 'block' : 'none';
}

function loadAlgorithmCode(algorithm) {
    const codeContainer = document.getElementById('codeContainer');
    codeContainer.innerHTML = '';
    codeLines = getAlgorithmCodeLines(algorithm);
    codeLines.forEach((line, index) => {
        const codeLine = document.createElement('div');
        codeLine.className = 'code-line';
        codeLine.textContent = line;
        codeContainer.appendChild(codeLine);
    });
    currentCodeLineIndex = -1;
}

function highlightCodeLine(lineIndex) {
    const codeContainer = document.getElementById('codeContainer');
    const codeLineElements = codeContainer.getElementsByClassName('code-line');
    Array.from(codeLineElements).forEach((lineElem, idx) => {
        if (idx === lineIndex) {
            lineElem.classList.add('highlight');
        } else {
            lineElem.classList.remove('highlight');
        }
    });
}

function getAlgorithmCodeLines(algorithm) {
    switch (algorithm) {
        case 'bfs':
            return [
                'function BFS(start):',
                '  create a queue Q',
                '  mark start as visited',
                '  enqueue start into Q',
                '  while Q is not empty:',
                '    node = dequeue Q',
                '    for each neighbor of node:',
                '      if neighbor is not visited:',
                '        mark neighbor as visited',
                '        enqueue neighbor into Q'
            ];
        case 'dfs':
            return [
                'function DFS(node):',
                '  mark node as visited',
                '  for each neighbor of node:',
                '    if neighbor is not visited:',
                '      DFS(neighbor)'
            ];
        case 'dijkstra':
            return [
                'function Dijkstra(start):',
                '  for each node:',
                '    set distance to infinity',
                '    set previous node to null',
                '  distance[start] = 0',
                '  create a priority queue Q',
                '  enqueue start into Q with priority 0',
                '  while Q is not empty:',
                '    node = dequeue Q',
                '    for each neighbor of node:',
                '      alt = distance[node] + edge_weight(node, neighbor)',
                '      if alt < distance[neighbor]:',
                '        distance[neighbor] = alt',
                '        previous[neighbor] = node',
                '        enqueue neighbor into Q with priority alt',
                '  return distances, previous'
            ];
        case 'astar':
            return [
                'function A*(start, goal):',
                '  openSet = {start}',
                '  cameFrom = empty map',
                '  gScore[start] = 0',
                '  fScore[start] = heuristic(start, goal)',
                '  while openSet is not empty:',
                '    current = node in openSet with lowest fScore',
                '    if current == goal:',
                '      reconstruct path',
                '      return',
                '    remove current from openSet',
                '    for each neighbor of current:',
                '      tentative_gScore = gScore[current] + edge_weight(current, neighbor)',
                '      if tentative_gScore < gScore[neighbor]:',
                '        cameFrom[neighbor] = current',
                '        gScore[neighbor] = tentative_gScore',
                '        fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, goal)',
                '        if neighbor not in openSet:',
                '          add neighbor to openSet',
                '  return failure'
            ];
        default:
            return [];
    }
}

// ==========================
// Reset Functions
// ==========================

// Reset traversal state
function resetTraversal() {
    graph.nodes.forEach(node => {
        node.visited = false;
        node.mesh.material.color.setHex(0xffffff); // Reset color
    });
    algorithmSteps = [];
    currentStepIndex = -1;
    currentCodeLineIndex = -1;
    updateStatus('Traversal reset. Select a mode to continue.');
    updateHelpText();
    highlightCodeLine(-1);
}

// Reset graph
function resetGraph() {
    // Remove all objects from the scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    // Add lights and grid helper back
    const ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    scene.add(gridHelper);

    // Reset graph data
    graph.nodes = [];
    graph.edges = [];
    startNode = null;
    endNode = null;
    algorithmSteps = [];
    currentStepIndex = -1;
    currentCodeLineIndex = -1;
    updateHelpText('Graph reset. Select a mode to begin.');
    updateStatus('');
    highlightCodeLine(-1);
}

// ==========================
// Update Status Panel
// ==========================

function updateStatus(message) {
    const statusPanel = document.getElementById('statusPanel');
    statusPanel.textContent = message;
}

// ==========================
// Graph Generation Functions
// ==========================

function generateRandomGraph() {
    resetGraph();
    const numNodes = 10;
    const edgeProbability = 0.3;
    const nodes = [];

    // Create nodes
    for (let i = 0; i < numNodes; i++) {
        const x = Math.random() * 200 - 100;
        const y = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        nodes.push(graph.addNode(x, y, z));
    }

    // Create edges
    for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
            if (Math.random() < edgeProbability) {
                const weight = Math.floor(Math.random() * 10) + 1;
                graph.addEdge(nodes[i], nodes[j], weight);
            }
        }
    }

    updateHelpText('Random graph generated.');
}

function generateGridGraph() {
    resetGraph();
    const gridSize = 4;
    const spacing = 30;
    const nodes = [];

    // Create grid of nodes
    for (let x = -gridSize * spacing / 2; x <= gridSize * spacing / 2; x += spacing) {
        for (let z = -gridSize * spacing / 2; z <= gridSize * spacing / 2; z += spacing) {
            nodes.push(graph.addNode(x, 0, z));
        }
    }

    // Create edges
    const gridNodes = [];
    let index = 0;
    for (let x = 0; x <= gridSize; x++) {
        gridNodes[x] = [];
        for (let z = 0; z <= gridSize; z++) {
            gridNodes[x][z] = nodes[index++];
        }
    }

    for (let x = 0; x <= gridSize; x++) {
        for (let z = 0; z <= gridSize; z++) {
            if (x < gridSize) {
                const weight = Math.floor(Math.random() * 10) + 1;
                graph.addEdge(gridNodes[x][z], gridNodes[x + 1][z], weight);
            }
            if (z < gridSize) {
                const weight = Math.floor(Math.random() * 10) + 1;
                graph.addEdge(gridNodes[x][z], gridNodes[x][z + 1], weight);
            }
        }
    }

    updateHelpText('Grid graph generated.');
}

// ==========================
// Edge Weights and Grid Toggle
// ==========================

function toggleEdgeWeights() {
    showEdgeWeights = document.getElementById('toggleEdgeWeights').checked;
    graph.edges.forEach(edge => {
        if (edge.label) {
            edge.label.visible = showEdgeWeights;
        }
    });
}

function toggleGridHelper() {
    const showGrid = document.getElementById('toggleGrid').checked;
    gridHelper.visible = showGrid;
}

// ==========================
// Keydown Event Handling
// ==========================

function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowRight':
            nextStep();
            break;
        case 'ArrowLeft':
            previousStep();
            break;
        case 'ArrowUp':
            previousCodeLine();
            break;
        case 'ArrowDown':
            nextCodeLine();
            break;
        case 'r':
        case 'R':
            resetTraversal();
            break;
        default:
            break;
    }
}

// Code line navigation
function nextCodeLine() {
    if (currentCodeLineIndex < codeLines.length - 1) {
        currentCodeLineIndex++;
        highlightCodeLine(currentCodeLineIndex);
    }
}

function previousCodeLine() {
    if (currentCodeLineIndex > 0) {
        currentCodeLineIndex--;
        highlightCodeLine(currentCodeLineIndex);
    }
}

// ==========================
// Initialization
// ==========================

init();
