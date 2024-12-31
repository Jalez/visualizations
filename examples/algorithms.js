// algorithms.js

// ==========================
// Algorithm Implementations
// ==========================

window.startAlgorithm = function () {
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
    currentStepIndex = -1;
    currentCodeLineIndex = -1;
};

// Implementations of BFS, DFS, Dijkstra, and A* go here
// For brevity, I'll include BFS as an example

window.bfs = function (start) {
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
};

// Similarly, implement DFS, Dijkstra, and A* algorithms here

// Record step function
window.recordStep = function (message, codeLineIndex) {
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
};

// Apply step function
window.applyStep = function (stepIndex) {
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
};

// Next and previous step functions
window.nextStep = function () {
    if (currentStepIndex < algorithmSteps.length - 1) {
        currentStepIndex++;
        applyStep(currentStepIndex);
    }
};

window.previousStep = function () {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        applyStep(currentStepIndex);
    }
};

// Execute current code line and finish algorithm functions
window.executeCurrentCodeLine = function () {
    if (currentStepIndex < algorithmSteps.length - 1) {
        currentStepIndex++;
        applyStep(currentStepIndex);
    }
    if (currentCodeLineIndex < codeLines.length - 1) {
        currentCodeLineIndex++;
        highlightCodeLine(currentCodeLineIndex);
    }
};

window.finishAlgorithm = function () {
    while (currentStepIndex < algorithmSteps.length - 1) {
        currentStepIndex++;
        applyStep(currentStepIndex);
    }
    currentCodeLineIndex = codeLines.length - 1;
    highlightCodeLine(currentCodeLineIndex);
};

// Heuristic function for A*
window.heuristic = function (nodeA, nodeB) {
    return nodeA.position.distanceTo(nodeB.position);
};

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

window.PriorityQueue = PriorityQueue;


window.loadAlgorithmCode = function (algorithm) {
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


window.highlightCodeLine = function (lineIndex) {
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

window.getAlgorithmCodeLines = function (algorithm) {
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
