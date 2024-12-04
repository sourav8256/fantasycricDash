const canvas = document.getElementById('cityCanvas');
const ctx = canvas.getContext('2d');

// Add camera tracking
let cameraX = 0;
let followedCar = null;

// Car class to manage individual cars
class Car {
    constructor() {
        this.reset();
        this.height = 20;
        this.width = 40;
        this.color = this.getRandomColor();
    }

    reset() {
        this.x = -50;
        this.y = this.getRandomLane();
        this.speed = 2 + Math.random() * 3;
    }

    getRandomLane() {
        // Only one road now, centered vertically
        const lanes = [
            290,  // Right lane
            320   // Left lane
        ];
        return lanes[Math.floor(Math.random() * lanes.length)];
    }

    getRandomColor() {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.speed;
    }

    draw() {
        // Adjust x position based on camera
        const screenX = this.x - cameraX;
        
        // Only draw if car is visible on screen
        if (screenX > -50 && screenX < canvas.width + 50) {
            // Car body
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX, this.y, this.width, this.height);
            
            // Windows
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX + 8, this.y + 3, 10, this.height - 6);
            ctx.fillRect(screenX + 25, this.y + 3, 10, this.height - 6);
        }
    }
}

// Add scenery objects
class Scenery {
    constructor(type, x) {
        this.type = type; // 'tree' or 'house'
        this.x = x;
        this.y = type === 'tree' ? 240 : 200; // Trees closer to road
        
        // Random variations
        this.scale = 0.8 + Math.random() * 0.4;
        this.color = type === 'tree' 
            ? ['#2ecc71', '#27ae60', '#16a085'][Math.floor(Math.random() * 3)]  // Green variations
            : ['#e74c3c', '#c0392b', '#d35400'][Math.floor(Math.random() * 3)]; // Red/Orange variations
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        
        // Only draw if visible
        if (screenX > -100 && screenX < canvas.width + 100) {
            if (this.type === 'tree') {
                this.drawTree(ctx, screenX);
            } else {
                this.drawHouse(ctx, screenX);
            }
        }
    }

    drawTree(ctx, screenX) {
        // Tree trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX - 5 * this.scale, this.y + 20 * this.scale, 10 * this.scale, 20 * this.scale);
        
        // Tree crown
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(screenX, this.y - 30 * this.scale);
        ctx.lineTo(screenX + 20 * this.scale, this.y + 20 * this.scale);
        ctx.lineTo(screenX - 20 * this.scale, this.y + 20 * this.scale);
        ctx.fill();
    }

    drawHouse(ctx, screenX) {
        // House body
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX - 20 * this.scale, this.y + 20 * this.scale, 40 * this.scale, 40 * this.scale);
        
        // Roof
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.moveTo(screenX - 25 * this.scale, this.y + 20 * this.scale);
        ctx.lineTo(screenX, this.y - 10 * this.scale);
        ctx.lineTo(screenX + 25 * this.scale, this.y + 20 * this.scale);
        ctx.fill();
        
        // Window
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(screenX - 8 * this.scale, this.y + 30 * this.scale, 16 * this.scale, 16 * this.scale);
    }
}

// Create scenery array with alternating trees and houses
const scenerySpacing = 200; // Space between objects
const sceneryObjects = [];
for (let i = 0; i < 100; i++) { // Create 100 objects
    const type = Math.random() < 0.7 ? 'tree' : 'house'; // 70% trees, 30% houses
    sceneryObjects.push(new Scenery(type, i * scenerySpacing));
}

// Draw roads
function drawRoads() {
    // Clear the canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw scenery first (behind the road)
    sceneryObjects.forEach(obj => obj.draw(ctx, cameraX));
    
    // Main road - draw based on camera position
    ctx.fillStyle = '#7f8c8d';
    
    // Calculate visible area
    const visibleStart = Math.floor(cameraX / canvas.width) * canvas.width;
    const visibleEnd = visibleStart + canvas.width * 2;
    
    // Draw single road segment that covers the visible area
    for (let x = visibleStart; x < visibleEnd; x += canvas.width) {
        ctx.fillRect(x - cameraX, 280, canvas.width, 60);
    }
    
    // Road lines - adjust for camera
    ctx.strokeStyle = '#f1c40f';
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    
    // Draw dashed lines that cover the visible area
    const lineStart = Math.floor(cameraX / 40) * 40;
    const lineEnd = lineStart + canvas.width + 80;
    
    for (let x = lineStart; x < lineEnd; x += 40) {
        const screenX = x - cameraX;
        ctx.moveTo(screenX, 310);
        ctx.lineTo(screenX + 20, 310);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

// Create just one car
const car = new Car();
car.speed = 3; // Set a constant speed

// Animation loop
function animate() {
    // Update camera position to follow car
    const targetX = car.x - canvas.width/3;
    cameraX += (targetX - cameraX) * 0.1;

    // No need for clearRect since we're filling with white in drawRoads
    drawRoads();
    
    // Update and draw single car
    car.update();
    car.draw();
    
    requestAnimationFrame(animate);
}

// Start animation
animate(); 