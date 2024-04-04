import * as THREE from 'three';

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 200;
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


let ang_rad = camera.fov * Math.PI / 180;
let fov_y = camera.position.z * Math.tan(ang_rad / 2) * 2;
var earthMap = new THREE.TextureLoader().load('../assets/land_ocean_ice_2048.png');
earthMap.minFilter = THREE.LinearFilter;
var earthGeometry = new THREE.PlaneGeometry(360, 180);
var earthMaterial = new THREE.MeshBasicMaterial({ map: earthMap, side: THREE.DoubleSide });
var earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.x = 0;
earth.position.y = 0;
earth.position.z = 0;

scene.add(earth);

var particleCount = 1036800;
var particles = new THREE.BufferGeometry();
var positions = new Float32Array(particleCount * 3);

const response = await fetch('../assets/wind_data.json');
const windData = await response.json();  
console.log(windData);

var i = 0;
var points = [];
    windData.forEach(data => {
        var x = data.longitude - 180; // Assuming longitude maps to x-axis
        var y = data.latitude;  // Assuming latitude maps to y-axis
        var z = Math.sqrt(data.u10*data.u10 + data.v10*data.v10); // Assuming z-coordinate is 0 for all points
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        i = i + 1;
    });

console.log(positions);
// for (var i = 0; i < particleCount; i++) {
// 	var x = Math.random() * 360 - 180;
//     var y = Math.random() * 180 - 90;
//     var z = 0;

//     positions[i * 3] = x;
//     positions[i * 3 + 1] = y;
//     positions[i * 3 + 2] = 0;
// }

particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

var particleMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.01 });
var particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

function animateParticles() {
    var positionAttribute = particles.getAttribute('position');

    for (var i = 0; i < particleCount; i++) {
        var x = positionAttribute.getX(i);
        var y = positionAttribute.getY(i);
        var z = positionAttribute.getZ(i);

        // x -= 0.001; // Adjust the speed of particles
        // if (x < 0) {
        //     x = 0.2; // Reset the particles when they move out of view
        // }

        positionAttribute.setXYZ(i, x, y, z);
    }

    positionAttribute.needsUpdate = true;
}

function animate() {
    requestAnimationFrame(animate);
    animateParticles();
    renderer.render(scene, camera);
}

// Add event listeners for zooming and panning
var zoomSpeed = 0.1;
var panSpeed = 0.01;

function zoom(delta) {
    camera.position.z -= delta * zoomSpeed;
    camera.fov *= 1 + delta * zoomSpeed;
    camera.updateProjectionMatrix();
}

function pan(deltaX, deltaY) {
    camera.position.x -= deltaX * panSpeed;
    camera.position.y += deltaY * panSpeed;
}

document.addEventListener('wheel', function(event) {
    zoom(event.deltaY);
});

var isDragging = false;
var previousX, previousY;

document.addEventListener('mousedown', function(event) {
    isDragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
});

document.addEventListener('mousemove', function(event) {
    if (isDragging) {
        var deltaX = event.clientX - previousX;
        var deltaY = event.clientY - previousY;
        previousX = event.clientX;
        previousY = event.clientY;
        pan(deltaX, deltaY);
    }
});

document.addEventListener('mouseup', function() {
    isDragging = false;
});

animate();
