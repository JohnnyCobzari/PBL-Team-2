import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 200;
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );
controls.addEventListener( 'change', renderer );
controls.screenSpacePanning = true;


var earthMap = new THREE.TextureLoader().load('../assets/land_ocean_ice_2048.png');
// var earthMap = new THREE.TextureLoader().load('../assets/BlankMap-World-Equirectangular.svg');
earthMap.minFilter = THREE.LinearFilter;
var earthGeometry = new THREE.PlaneGeometry(360, 180);
var earthMaterial = new THREE.MeshBasicMaterial({ map: earthMap, side: THREE.DoubleSide });
// var earthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
var earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.x = 0;
earth.position.y = 0;
earth.position.z = 0;
scene.add(earth);

// Load the SVG map
// const loader = new SVGLoader();
// loader.load(
//     '../assets/BlankMap-World-Equirectangular.svg',
//     function (data) {
//         const paths = data.paths;
//         const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Adjust color as needed
//         for (let i = 0; i < paths.length; i++) {
//             const path = paths[i];

//             const shapes = path.toShapes(true);
//             for (let j = 0; j < shapes.length; j++) {
//                 const shape = shapes[j];
//                 const geometry = new THREE.ShapeGeometry(shape);
//                 const mesh = new THREE.Mesh(geometry, material);
//                 earth.add(mesh);
//             }
//         }
//     },
//     function (xhr) {
//         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//     },
//     function (error) {
//         console.log('An error happened');
//     }
// );


const response = await fetch('../assets/wind_data.json');
const windData = await response.json();  
console.log(windData);

let windSpeedV = [];
let windSpeedU = [];


for (let i = 0; i < 721; i++) {
    
    let row = [];
    for (let j = 0; j < 1440; j++) {
        row.push(0);
    }
    windSpeedU.push(row);
}

for (let i = 0; i < 721; i++) {
    
    let row = [];
    for (let j = 0; j < 1440; j++) {
        row.push(0);
    }
    windSpeedV.push(row);
}

    windData.forEach(data => {
        var i = Math.abs(data.latitude - 90)*4;
        var j = data.longitude * 4; 
        var uSpeed = data.u10; 
        var vSpeed = data.v10;
        // console.log(i, j);
        windSpeedU[i][j] = uSpeed;
        windSpeedV[i][j] = vSpeed;
    });
console.log(windSpeedU);
console.log(windSpeedV);

const particleCount = 100000;
var particles = new THREE.BufferGeometry();
var positions = new Float32Array(particleCount * 3);

for (var i = 0; i < particleCount; i++) {
    var x1 = Math.random() * 360 - 180;
    var y1 = Math.random() * 180 - 90;
    var z1 = 0;

    positions[i * 3] = x1;
    positions[i * 3 + 1] = y1;
    positions[i * 3 + 2] = z1;
}

particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
var particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.01 });
var particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

function animateParticles() {
    var positionAttribute = particles.getAttribute('position');
    const speedFactor = 0.005;

    for (var i = 0; i < particleCount; i++) {
        var x = positionAttribute.getX(i);
        var y = positionAttribute.getY(i);
        var z = positionAttribute.getZ(i);
        var iy = Math.round(4 * Math.abs(y - 90));
        var jx = Math.round(4 * Math.abs(x + 179.5));
        
        var uComp = windSpeedU[iy][jx];
        var vComp = windSpeedV[iy][jx];
        var oldX = x;
        var oldY = y;
        x += speedFactor * uComp;
        y += speedFactor * vComp;

        var deltaX = Math.abs(x - oldX); // attempt to kill particles which 
        var deltaY = Math.abs(y - oldY);

        if ((x < -180)||(x >= 180)) x = Math.random() * 359.99 - 179.49;
        if ((y < -90)||(y > 90)) y = Math.random() * 180 - 90;
        var rand = Math.random();
        if ((deltaX < 0.005) && (deltaY < 0.005) || (isNaN(x) || (isNaN(y)))){
            x = Math.random() * 360 - 180;
            y = Math.random() * 180 - 90;
        }

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

// function pan(deltaX, deltaY) {
//     camera.position.x -= deltaX * panSpeed;
//     camera.position.y += deltaY * panSpeed;
// }

// document.addEventListener('wheel', function(event) {
//     zoom(event.deltaY);
// });

// var isDragging = false;
// var previousX, previousY;

// document.addEventListener('mousedown', function(event) {
//     isDragging = true;
//     previousX = event.clientX;
//     previousY = event.clientY;
// });

// document.addEventListener('mousemove', function(event) {
//     if (isDragging) {
//         var deltaX = event.clientX - previousX;
//         var deltaY = event.clientY - previousY;
//         previousX = event.clientX;
//         previousY = event.clientY;
//         pan(deltaX, deltaY);
//     }
// });

// document.addEventListener('mouseup', function() {
//     isDragging = false;
// });

animate();
