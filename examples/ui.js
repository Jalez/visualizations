// ui.js

// ==========================
// User Interaction Variables
// ==========================

// Attach variables to window to make them globally accessible
window.mode = 'none';
window.selectedNode = null;
window.startNode = null;
window.endNode = null;
window.showEdgeWeights = false;
window.showAlgorithmCode = false;
window.statusMessages = [];
window.algorithmSteps = [];
window.currentStepIndex = -1;
window.currentCodeLineIndex = -1;
window.codeLines = [];

// ==========================
// Event Listeners
// ==========================

window.initEventListeners = function () {
    window.addEventListener('click', onMouseClick, false);
    window.addEventListener('keydown', onKeyDown, false);
};

// ==========================
// Mode Handling
// ==========================

window.changeMode = function (selectedMode) {
    mode = selectedMode;
    updateModeDisplay();
    updateHelpText();
};

// Update Mode Display
window.updateModeDisplay = function () {
    const modeDisplay = document.getElementById('modeDisplay');
    modeDisplay.textContent = `Mode: ${capitalizeFirstLetter(mode)}`;
};

// Capitalize First Letter
window.capitalizeFirstLetter = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// ==========================
// Mouse Interaction
// ==========================

window.onMouseClick = function (event) {
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
};

window.handleInteraction = function (object) {
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
                updateSelectionStatus();
                updateHelpText(`Start node set to Node ${node.id}. Select another node to change or change mode.`);
                break;
            case 'selectEndNode':
                if (endNode) {
                    highlightNode(endNode, 0xffffff); // Reset color
                }
                endNode = node;
                highlightNode(node, 0xff0000); // Red color
                updateSelectionStatus();
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
};

window.removeNode = function (node) {
    if (node === startNode) startNode = null;
    if (node === endNode) endNode = null;
    graph.removeNode(node);
    updateSelectionStatus();
};

window.removeEdgesOfNode = function (node) {
    node.edges.slice().forEach(edge => {
        graph.removeEdge(edge);
    });
};

// Keydown event handling
window.onKeyDown = function (event) {
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
        case ' ':
            event.preventDefault();
            executeCurrentCodeLine();
            break;
        case 'Enter':
            finishAlgorithm();
            break;
        case 'r':
        case 'R':
            resetTraversal();
            break;
        default:
            break;
    }
};

// UI Update functions
window.updateHelpText = function (message = '') {
    const helpText = document.getElementById('helpText');
    if (message) {
        helpText.textContent = message;
        return;
    }
    switch (mode) {
        case 'addNode':
            helpText.textContent = 'Click on the scene to add a node.';
            break;
        case 'addEdge':
            helpText.textContent = 'Select two nodes to add an edge between them.';
            break;
        case 'removeNode':
            helpText.textContent = 'Select a node to remove it.';
            break;
        case 'removeEdge':
            helpText.textContent = 'Select an edge to remove it.';
            break;
        case 'selectStartNode':
            helpText.textContent = 'Select a node to set as the start node.';
            break;
        case 'selectEndNode':
            helpText.textContent = 'Select a node to set as the end node.';
            break;
        default:
            helpText.textContent = 'Select a mode to begin.';
    }
};

window.updateStatus = function (message) {
    const statusPanel = document.getElementById('statusPanel');
    statusPanel.textContent = message;
};

window.updateSelectionStatus = function () {
    const startNodeDisplay = document.getElementById('startNodeDisplay');
    const endNodeDisplay = document.getElementById('endNodeDisplay');
    startNodeDisplay.textContent = startNode ? `Node ${startNode.id}` : 'None';
    endNodeDisplay.textContent = endNode ? `Node ${endNode.id}` : 'None';
};

// Toggle functions
window.toggleEdgeWeights = function () {
    showEdgeWeights = document.getElementById('toggleEdgeWeights').checked;
    graph.edges.forEach(edge => {
        if (edge.label) {
            edge.label.visible = showEdgeWeights;
        }
    });
};

window.toggleGridHelper = function () {
    const showGrid = document.getElementById('toggleGrid').checked;
    gridHelper.visible = showGrid;
};

window.toggleAlgorithmCode = function () {
    showAlgorithmCode = document.getElementById('toggleCode').checked;
    const codePanel = document.getElementById('algorithmCode');
    codePanel.style.display = showAlgorithmCode ? 'block' : 'none';
};
