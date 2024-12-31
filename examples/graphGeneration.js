// graphGeneration.js

// ==========================
// Graph Generation Functions
// ==========================

window.generateRandomGraph = function () {
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
};

window.generateGridGraph = function () {
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
};

// Reset Graph Function
window.resetGraph = function () {
    // Remove all objects from the scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    // Add ambient light and grid helper back
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
    updateSelectionStatus();
};

// Reset Traversal Function
window.resetTraversal = function () {
    graph.nodes.forEach(node => {
        node.visited = false;
        node.mesh.material.color.setHex(0xffffff); // Reset color
    });
    // Re-highlight start and end nodes
    if (startNode) {
        highlightNode(startNode, 0x00ff00); // Green color
    }
    if (endNode) {
        highlightNode(endNode, 0xff0000); // Red color
    }
    algorithmSteps = [];
    currentStepIndex = -1;
    currentCodeLineIndex = -1;
    updateStatus('Traversal reset. Select a mode to continue.');
    updateHelpText();
};
