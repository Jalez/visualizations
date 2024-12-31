// utils.js

// ==========================
// Utility Functions
// ==========================

// Create text sprite for labels
window.createTextSprite = function (message) {
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
};

// Update node label position
window.updateLabelPosition = function (node) {
    node.label.position.copy(node.position);
    node.label.position.y += 10;
};

// Update edge label position
window.updateEdgeLabelPosition = function (edge) {
    const midPoint = new THREE.Vector3().addVectors(edge.node1.position, edge.node2.position).multiplyScalar(0.5);
    edge.label.position.copy(midPoint);
    edge.label.position.y += 5;
};

// Highlight node
window.highlightNode = function (node, color) {
    node.mesh.material.color.setHex(color);
};
