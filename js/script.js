import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let scene, camera, renderer, composer, particleSystem, particles, afterimagePass;
const params = { enable: true };
const particleCount = 50000;
const windSpeedU = Array.from({ length: 721 }, () => Array(1440).fill(0));
const windSpeedV = Array.from({ length: 721 }, () => Array(1440).fill(0));

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 200;
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.enableRotate = false;
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;

    const earthMap = new THREE.TextureLoader().load('../assets/land_ocean_ice_2048.png');
    earthMap.minFilter = THREE.LinearFilter;
    const earthGeometry = new THREE.PlaneGeometry(360, 180);
    const earthMaterial = new THREE.MeshBasicMaterial({ map: earthMap, side: THREE.DoubleSide });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    const response = await fetch('../assets/wind_data.json');
    const windData = await response.json();
    windData.forEach(data => {
        const i = Math.round(Math.abs(data.latitude - 90) * 4);
        const j = Math.round((data.longitude) * 4);
        windSpeedU[i][j] = data.u10;
        windSpeedV[i][j] = data.v10;
    });

    particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = Math.random() * 360 - 180;
        positions[i * 3 + 1] = Math.random() * 180 - 90;
        positions[i * 3 + 2] = 0;
    }
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    afterimagePass = new AfterimagePass();
    composer.addPass(afterimagePass);
    composer.addPass(new OutputPass());

    animate();
}

function animateParticles() {
    const positionAttribute = particles.getAttribute('position');
    const speedFactor = 0.005;

    for (let i = 0; i < particleCount; i++) {
        let x = positionAttribute.getX(i);
        let y = positionAttribute.getY(i);
        const iy = Math.round(Math.abs(y - 90) * 4);
        const jx = Math.round((x + 180) * 4);

        if (iy < 0 || iy >= 721 || jx < 0 || jx >= 1440) continue;

        const uComp = windSpeedU[iy][jx];
        const vComp = windSpeedV[iy][jx];

        x += speedFactor * uComp;
        y += speedFactor * vComp;


        if ((x < -180) || (x >= 180)) x = Math.random() * 360 - 180;
        if ((y < -90) || (y > 90)) y = Math.random() * 180 - 90;
        

        if (Math.abs(uComp) < 0.0005 && Math.abs(vComp) < 0.0005 || Math.random() > 0.99) {
            x = Math.random() * 360 - 180;
            y = Math.random() * 180 - 90;

        }

        positionAttribute.setXYZ(i, x, y, 0);
    }

    positionAttribute.needsUpdate = true;
}

function animate() {
    requestAnimationFrame(animate);
    animateParticles();
    composer.render();
}

init();
