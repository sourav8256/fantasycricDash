const mindMap = {
    nodes: [],
    connections: [],
    isDragging: false,
    currentNode: null,
    offset: { x: 0, y: 0 },
    viewOffset: { x: 0, y: 0 },
    lastTouch: { x: 0, y: 0 },
    selectedNode: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },

    addNode() {
        const container = document.getElementById('mindmap-container');
        const node = document.createElement('div');
        node.className = 'node';
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = 'New Node';
        input.readOnly = true;  // Make input readonly by default
        
        // Add double click handler to make input editable
        input.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            input.readOnly = false;
            input.focus();
            input.select();
        });

        // Add blur handler to make input readonly again
        input.addEventListener('blur', () => {
            input.readOnly = true;
        });

        // Add keydown handler to handle Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });

        // Create delete button
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteNode(node);
        };

        node.appendChild(input);
        node.appendChild(deleteBtn);
        
        // Position the node to the right of the center
        const rect = container.getBoundingClientRect();
        const xOffset = this.nodes.length * 400; // Increased spacing to 400px
        node.style.left = (rect.width / 2 + xOffset + this.viewOffset.x) + 'px';
        node.style.top = (rect.height / 2 - 25 + this.viewOffset.y) + 'px';

        container.appendChild(node);
        this.nodes.push(node);

        // Add event listeners for dragging
        this.setupNodeEvents(node);

        // If there are other nodes, connect to the nearest node
        if (this.nodes.length > 1) {
            this.connectToNearestNode(node);
        }
    },

    setupNodeEvents(node) {
        node.addEventListener('mousedown', (e) => this.startDragging(e));
        node.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        
        // Prevent default behavior for touch events
        node.addEventListener('touchmove', (e) => e.preventDefault());
    },

    startDragging(e) {
        this.isDragging = true;
        this.currentNode = e.target.closest('.node');
        this.selectNode(this.currentNode);
        const rect = this.currentNode.getBoundingClientRect();
        this.offset.x = e.clientX - rect.left;
        this.offset.y = e.clientY - rect.top;
        
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDragging());
    },

    handleTouchStart(e) {
        this.isDragging = true;
        this.currentNode = e.target.closest('.node');
        this.selectNode(this.currentNode);
        const touch = e.touches[0];
        const rect = this.currentNode.getBoundingClientRect();
        
        this.offset.x = touch.clientX - rect.left;
        this.offset.y = touch.clientY - rect.top;
        this.lastTouch.x = touch.clientX;
        this.lastTouch.y = touch.clientY;

        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.addEventListener('touchend', () => this.handleTouchEnd());
    },

    handleTouchMove(e) {
        if (!this.isDragging) return;
        const touch = e.touches[0];
        
        const x = touch.clientX - this.offset.x;
        const y = touch.clientY - this.offset.y;
        
        this.currentNode.style.left = x + 'px';
        this.currentNode.style.top = y + 'px';
        
        this.updateConnections();
    },

    handleTouchEnd() {
        this.isDragging = false;
        this.currentNode = null;
        document.removeEventListener('touchmove', (e) => this.handleTouchMove(e));
        document.removeEventListener('touchend', () => this.handleTouchEnd());
    },

    drag(e) {
        if (!this.isDragging) return;
        
        const x = e.clientX - this.offset.x;
        const y = e.clientY - this.offset.y;
        
        this.currentNode.style.left = x + 'px';
        this.currentNode.style.top = y + 'px';
        
        this.updateConnections();
    },

    stopDragging() {
        this.isDragging = false;
        this.currentNode = null;
        document.removeEventListener('mousemove', (e) => this.drag(e));
        document.removeEventListener('mouseup', () => this.stopDragging());
    },

    connectToNearestNode(newNode) {
        let nearestNode = null;
        let minDistance = Infinity;

        this.nodes.forEach(node => {
            if (node !== newNode) {
                const distance = this.getDistance(newNode, node);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestNode = node;
                }
            }
        });

        if (nearestNode) {
            this.createConnection(newNode, nearestNode);
        }
    },

    getDistance(node1, node2) {
        const rect1 = node1.getBoundingClientRect();
        const rect2 = node2.getBoundingClientRect();
        const dx = rect1.left - rect2.left;
        const dy = rect1.top - rect2.top;
        return Math.sqrt(dx * dx + dy * dy);
    },

    createConnection(node1, node2) {
        const connection = document.createElement('div');
        connection.className = 'connection';
        document.getElementById('mindmap-container').appendChild(connection);
        this.connections.push({ line: connection, start: node1, end: node2 });
        this.updateConnections();
    },

    updateConnections() {
        this.connections.forEach(conn => {
            const rect1 = conn.start.getBoundingClientRect();
            const rect2 = conn.end.getBoundingClientRect();

            const x1 = rect1.left + rect1.width / 2;
            const y1 = rect1.top + rect1.height / 2;
            const x2 = rect2.left + rect2.width / 2;
            const y2 = rect2.top + rect2.height / 2;

            const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            conn.line.style.width = length + 'px';
            conn.line.style.left = x1 + 'px';
            conn.line.style.top = y1 + 'px';
            conn.line.style.transform = `rotate(${angle}deg)`;
            conn.line.style.height = '2px';
            conn.line.style.background = '#666';
            conn.line.style.transformOrigin = '0 50%';
        });
    },

    deleteNode(node) {
        // Remove connections associated with this node
        this.connections = this.connections.filter(conn => {
            if (conn.start === node || conn.end === node) {
                conn.line.remove();
                return false;
            }
            return true;
        });

        // Remove node from nodes array and DOM
        this.nodes = this.nodes.filter(n => n !== node);
        node.remove();
    },

    resetView() {
        this.viewOffset = { x: 0, y: 0 };
        this.nodes.forEach(node => {
            const rect = document.getElementById('mindmap-container').getBoundingClientRect();
            node.style.left = (rect.width / 2 - 50) + 'px';
            node.style.top = (rect.height / 2 - 25) + 'px';
            node.style.transform = 'translate(0px, 0px)';
        });
        this.updateConnections();
    },

    selectNode(node) {
        // Remove selection from previously selected node
        if (this.selectedNode) {
            this.selectedNode.classList.remove('selected');
        }
        
        // Select new node
        this.selectedNode = node;
        node.classList.add('selected');
    },

    init() {
        this.addNode();
        window.addEventListener('resize', () => this.updateConnections());
        
        // Add panning event listeners
        const container = document.getElementById('mindmap-container');
        container.addEventListener('mousedown', (e) => this.startPanning(e));
        container.addEventListener('mousemove', (e) => this.pan(e));
        container.addEventListener('mouseup', () => this.stopPanning());
        
        // Add touch events for panning
        container.addEventListener('touchstart', (e) => this.startTouchPanning(e));
        container.addEventListener('touchmove', (e) => this.touchPan(e));
        container.addEventListener('touchend', () => this.stopPanning());
        
        // Add click handler on container to deselect when clicking empty space
        container.addEventListener('click', (e) => {
            if (e.target.id === 'mindmap-container') {
                if (this.selectedNode) {
                    this.selectedNode.classList.remove('selected');
                    this.selectedNode = null;
                }
            }
        });
    },

    startPanning(e) {
        // Only start panning if clicking directly on the container
        if (e.target.id === 'mindmap-container') {
            this.isPanning = true;
            this.panStart = { x: e.clientX - this.viewOffset.x, y: e.clientY - this.viewOffset.y };
        }
    },

    pan(e) {
        if (!this.isPanning) return;
        
        this.viewOffset.x = e.clientX - this.panStart.x;
        this.viewOffset.y = e.clientY - this.panStart.y;
        
        // Update all nodes positions
        this.nodes.forEach(node => {
            const left = parseInt(node.style.left) || 0;
            const top = parseInt(node.style.top) || 0;
            node.style.transform = `translate(${this.viewOffset.x}px, ${this.viewOffset.y}px)`;
        });
        
        this.updateConnections();
    },

    startTouchPanning(e) {
        if (e.target.id === 'mindmap-container') {
            this.isPanning = true;
            const touch = e.touches[0];
            this.panStart = { x: touch.clientX - this.viewOffset.x, y: touch.clientY - this.viewOffset.y };
        }
    },

    touchPan(e) {
        if (!this.isPanning) return;
        const touch = e.touches[0];
        
        this.viewOffset.x = touch.clientX - this.panStart.x;
        this.viewOffset.y = touch.clientY - this.panStart.y;
        
        // Update all nodes positions
        this.nodes.forEach(node => {
            const left = parseInt(node.style.left) || 0;
            const top = parseInt(node.style.top) || 0;
            node.style.transform = `translate(${this.viewOffset.x}px, ${this.viewOffset.y}px)`;
        });
        
        this.updateConnections();
    },

    stopPanning() {
        this.isPanning = false;
    }
};

// Initialize the mindmap when the page loads
window.onload = () => mindMap.init(); 