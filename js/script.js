import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const PARTICLE_SCENE = 1;
const particleLayer = new THREE.Layers();
particleLayer.set(PARTICLE_SCENE);

let scene, camera, renderer, stats, particleComposer, finalComposer, particleSystem, particles, target, controls, earth;
const particleCount = 25000;
const windSpeedU = Array.from({ length: 721 }, () => Array(1440).fill(0));
const windSpeedV = Array.from({ length: 721 }, () => Array(1440).fill(0));

const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
const materials = {};
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 200;
camera.lookAt(scene.position);
camera.far = 1000;
camera.updateProjectionMatrix();

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);
stats = new Stats();
document.body.appendChild( stats.dom );

controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.enableRotate = false;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
controls.maxDistance = 200;
controls.minDistance = 10;
controls.maxTargetRadius = 180;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

async function init() {

  const earthMap = new THREE.TextureLoader().load('../assets/worldm.jpeg');
  earthMap.minFilter = THREE.LinearFilter;
  const earthGeometry = new THREE.PlaneGeometry(360, 180);
  const earthMaterial = new THREE.MeshBasicMaterial({ map: earthMap, side: THREE.DoubleSide });
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
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
  const colors = new Float32Array(particleCount * 3); // colors array
  for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = Math.random() * 360 - 180;
      positions[i * 3 + 1] = Math.random() * 180 - 90;
      positions[i * 3 + 2] = 1;

      // Init colors to white
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
  }
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Set color attribute
  
  const particleTexture = new THREE.TextureLoader().load('../assets/circle.png');
  const particleMaterial = new THREE.PointsMaterial({ 
    size: 1,
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    alphaTest: 0.5
   });
  
  
  particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);
  particleSystem.layers.toggle(PARTICLE_SCENE);

  const renderScene = new RenderPass( scene, camera );

  const particlePass = new AfterimagePass();
  particlePass.uniforms['damp'] = { value: 0.96 };

  particleComposer = new EffectComposer(renderer);
  particleComposer.renderToScreen = false;
  particleComposer.addPass(renderScene);
  particleComposer.addPass(particlePass);

  const mixPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: particleComposer.renderTarget2.texture }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          vec4 baseColor = texture2D(baseTexture, vUv);
          vec4 bloomColor = texture2D(bloomTexture, vUv);
          gl_FragColor = baseColor + bloomColor;
        }
      `,
      defines: {}
    }), 'baseTexture'
  );
  mixPass.needsSwap = true;

  const outputPass = new OutputPass();
  
  finalComposer = new EffectComposer( renderer );
  finalComposer.addPass( renderScene );
  finalComposer.addPass( mixPass );
  finalComposer.addPass( outputPass );

  target = new THREE.Vector2(); 
  camera.getViewSize( camera.position.z, target );
  // console.log(target.x);
  // console.log(target.y);

  animate();
}

function animateParticles() {
  const positionAttribute = particles.getAttribute('position');
  const colorAttribute = particles.getAttribute('color'); // Get color attribute
  const speedFactor = 0.01;

  for (let i = 0; i < particleCount; i++) {
      let x = positionAttribute.getX(i);
      let y = positionAttribute.getY(i);
      const iy = Math.round(Math.abs(y - 90) * 4);
      const jx = Math.round((x + 180) * 4);

      if (iy < 0 || iy >= 721 || jx < 0 || jx >= 1440) continue;

      const uComp = windSpeedU[iy][jx];
      const vComp = windSpeedV[iy][jx];
      const velocity = Math.sqrt(uComp * uComp + vComp * vComp); // Calculate velocity

      // Map velocity to hue (0 to 120)
      const maxVelocity = 7.5; // Adjust based on expected wind speed range
      const hue = (velocity / maxVelocity) * 120; // Map velocity to hue (0 to 120)
      const color = new THREE.Color();
      color.setHSL(hue / 360, 1.0, 0.25); // Convert hue to HSL

      colorAttribute.setXYZ(i, color.r, color.g, color.b); // Set color

      x += speedFactor * uComp;
      y += speedFactor * vComp;

      if ((x <= -180) || (x >= 180)) x = Math.random() * 360 - 180;
      if ((y <= -90) || (y >= 90)) y = Math.random() * 180 - 90;

      if (Math.abs(uComp) < 0.0005 && Math.abs(vComp) < 0.0005 || Math.random() > 0.99) {
          x = Math.random() * 360 - 180;
          y = Math.random() * 180 - 90;
      }

      positionAttribute.setXYZ(i, x, y, 0.5);
  }

  positionAttribute.needsUpdate = true;
  colorAttribute.needsUpdate = true; // Update color attribute
}

function getCameraCenter() {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  raycaster.set(camera.position, direction);

  const intersects = raycaster.intersectObject(earth);
  if (intersects.length > 0) {
      return intersects[0].point;
  }
  return null;
}

window.onresize = function () {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );

    particleComposer.setSize( width, height );
    finalComposer.setSize( width, height );

    animate();

};

controls.addEventListener('change', () => {
  camera.getViewSize( camera.position.z, target );
  // console.log(target.x);
  // console.log(target.y);
  // console.log(getCameraCenter());
  // console.log("\n");
});

function animate() {
  stats.update();
  animateParticles();
  scene.traverse( darkenNonParticle );
  particleComposer.render();
  scene.traverse( restoreMaterial );

  finalComposer.render();
  requestAnimationFrame(animate);
}

function darkenNonParticle( obj ) {

    if ( obj.isMesh && particleLayer.test( obj.layers ) === false ) {

        materials[ obj.uuid ] = obj.material;
        obj.material = darkMaterial;

    }

}

function restoreMaterial( obj ) {

    if ( materials[ obj.uuid ] ) {

        obj.material = materials[ obj.uuid ];
        delete materials[ obj.uuid ];

    }

}

init();
