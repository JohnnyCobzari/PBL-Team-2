import * as THREE from 'three';
// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
// import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 200;
camera.lookAt(scene.position);

let afterimagePass, composer;
const params = {

    enable: true

};

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );
// controls.addEventListener( 'change', renderer );
controls.screenSpacePanning = true;
controls.enableRotate = false;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;


// function loadSVG( url ) {

//     //

//     scene = new THREE.Scene();
//     scene.background = new THREE.Color( 0xb0b0b0 );

//     //

//     const helper = new THREE.GridHelper( 160, 10, 0x8d8d8d, 0xc1c1c1 );
//     helper.rotation.x = Math.PI / 2;
//     scene.add( helper );

//     //

//     const loader = new SVGLoader();

//     loader.load( url, function ( data ) {

//         const group = new THREE.Group();
//         group.scale.multiplyScalar( 0.25);
//         group.position.x = - 70;
//         group.position.y = 70;
//         group.scale.y *= - 1;

//         let renderOrder = 0;

//         for ( const path of data.paths ) {

//             const fillColor = path.userData.style.fill;

//             const material = new THREE.MeshBasicMaterial( {
//                 color: new THREE.Color().setStyle( fillColor ),
//                 opacity: path.userData.style.fillOpacity,
//                 transparent: false,
//                 side: THREE.DoubleSide,
//                 depthWrite: true,
//                 wireframe: true
//             } );

//             const shapes = SVGLoader.createShapes( path );

//             for ( const shape of shapes ) {

//                 const geometry = new THREE.ShapeGeometry( shape );
//                 const mesh = new THREE.Mesh( geometry, material );
//                 mesh.renderOrder = renderOrder ++;

//                 group.add( mesh );

//             }


//             const strokeColor = path.userData.style.stroke;

            

//             const material1 = new THREE.MeshBasicMaterial( {
//                 color: new THREE.Color().setStyle( strokeColor ),
//                 opacity: path.userData.style.strokeOpacity,
//                 transparent: true,
//                 side: THREE.DoubleSide,
//                 depthWrite: false,
//                 wireframe: true
//             } );

//             for ( const subPath of path.subPaths ) {

//                 const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );

//                 if ( geometry ) {

//                     const mesh = new THREE.Mesh( geometry, material1 );
//                     mesh.renderOrder = renderOrder ++;

//                     group.add( mesh );

//                 }

//             }

            

//         }

//         scene.add( group );

//         renderer();

//     } );

// }

// loadSVG("../assets/BlankMap-World-Equirectangular.svg");

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



const response = await fetch('../assets/wind_data.json');
const windData = await response.json();  
// console.log(windData);

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
// console.log(windSpeedU);
// console.log(windSpeedV);

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
var particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
var particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

composer = new EffectComposer( renderer );
composer.addPass( new RenderPass( scene, camera ) );

afterimagePass = new AfterimagePass();
composer.addPass( afterimagePass );

const outputPass = new OutputPass();
composer.addPass( outputPass );

if ( typeof TESTING !== 'undefined' ) {

    for ( let i = 0; i < 45; i ++ ) {

        render();

    }
}

function render() {

    afterimagePass.enabled = params.enable;

    composer.render();


}


function animateParticles() {
    var positionAttribute = particles.getAttribute('position');
    const speedFactor = 0.005;

    for (var i = 0; i < particleCount; i++) {
        var x = positionAttribute.getX(i);
        var y = positionAttribute.getY(i);
        var z = positionAttribute.getZ(i);
        var iy = Math.round(4 * Math.abs(y - 90));
        var jx = Math.round(4 * Math.abs(x + 180));
        
        var uComp = windSpeedU[iy][jx];
        var vComp = windSpeedV[iy][jx];
        var oldX = x;
        var oldY = y;
        x += speedFactor * uComp;
        y += speedFactor * vComp;

        var deltaX = Math.abs(x - oldX); // attempt to kill particles which 
        var deltaY = Math.abs(y - oldY);

        if ((x < -180)||(x >= 180)) x = Math.random() * 360 - 180;
        if ((y < -90)||(y > 90)) y = Math.random() * 180 - 90;
        var rand = Math.random();
        if ((deltaX < 0.0005) && (deltaY < 0.0005) || (isNaN(x) || (isNaN(y))) || (rand > 0.99)){
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
    render();

}


animate();
