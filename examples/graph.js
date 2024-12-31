// graph.js

// ==========================
// Graph Data Structures
// ==========================

// GraphNode class
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

// GraphEdge class
class GraphEdge {
    constructor(node1, node2, weight = 1) {
        this.node1 = node1;
        this.node2 = node2;
        this.weight = weight;
        this.line = null; // Three.js line representation
        this.label = null; // Label sprite
    }
}

// Graph class
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

// Attach classes to window if needed
window.GraphNode = GraphNode;
window.GraphEdge = GraphEdge;
window.Graph = Graph;
