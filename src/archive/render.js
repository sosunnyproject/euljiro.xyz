// https://threejsfundamentals.org/threejs/lessons/threejs-cameras.html
/**
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/dracoloader';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import Stats from 'three/examples/jsm/libs/stats.module';
import { WEBGL } from 'three/examples/jsm/WebGL';

import { generateDistrictGardenObjects } from './renderDistrictGarden.js';
import { generateDistrictOneObjects } from './renderDistrictOne.js';
import { generateDistrictTwoObjects } from './renderDistrictTwo.js';
import { generateDistrictThreeObjects } from './renderDistrictThree.js';

import { Loader } from 'three';
import { statSync } from 'fs';
import { getRandomArbitrary } from '../utils.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

// import model urls
import { DISTRICT_ONE_GLB, DISTRICT_TWO_GLB } from '../models/glbLoader.js';
import uhbeeFont from "../assets/fonts/uhbeeRiceRegular.json"
import euljiro10years from "../assets/fonts/bmEuljiro10years.json"
import euljiroRegular from "../assets/fonts/bmEuljiroRegular.json"
import { generateTerrain } from './models/Terrain.js';
import { generateGround } from '../models/ground.js';

let stats, camera, renderer, pointerControls, character, character1;
let currentScene, districtGarden, districtOne, districtTwo, districtThree;
let sceneOneTerrain;

let accSteps = 0;
let prevDistrictIndex = 1;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const DISTRICT_NAMES = ["D_GARDEN", "D_ONE", "D_TWO", "D_THREE"]

// Clock: autoStart, elapsedTime, oldTime, running, startTime
var clock = new THREE.Clock();

// Loading Manager for 3d models and animation
window.mixers = [];
const loadManager = new THREE.LoadingManager();
loadManager.onLoad = init;
const gltfLoader = new GLTFLoader(loadManager);
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('three/examples/js/libs/draco');
gltfLoader.setDRACOLoader(dracoLoader);

const fontLoader = new FontLoader(loadManager)
loadAssets()

function loadAssets() {
  const loadNum = DISTRICT_TWO_GLB.length + DISTRICT_ONE_GLB.length + 1;
  let count = 0
  
  DISTRICT_ONE_GLB.forEach(model => {
    gltfLoader.load(model.url, 
      (gltf) => {
      model.gltf = gltf;
      count++;
      console.log("loaded")
      let per = Math.floor((count / loadNum) * 100)
      loadProgress(per);
    })
  })
  DISTRICT_TWO_GLB.forEach(model => {
    gltfLoader.load(model.url, 
      (gltf) => {
      model.gltf = gltf;
      count++;
      console.log("loaded")
      let per = Math.floor((count / loadNum) * 100)
      loadProgress(per);
    })
  })

  // Load Font for TextGeometry
  fontLoader.load(
    uhbeeFont,
    (font) => {
      window.UHBEE_FONT = font;
      count++;
      console.log("loaded")
      let per = Math.floor((count / loadNum) * 100)
      loadProgress(per);
    }
  )
}

// Load Progress Bar
var leftBar = document.querySelector('.left .bar');
var rightBar = document.querySelector('.right .bar');
var per = document.querySelector('.value');
function loadProgress(value) {
  per.innerHTML=value +'%';
  if (value <= 50) {
    var degree = 18*value/5;
    rightBar.style.transform = "rotate("+degree+"deg)";
    leftBar.style.transform = "rotate(0deg)";
  } else {
    var degree = 18*(value-50)/5;
    rightBar.style.transform = "rotate(180deg)";
    leftBar.style.transform = "rotate("+degree+"deg)";
  }
}

// Step Counter Bar
var stepCounter = document.querySelector('#stepCounter')
var stepLeftBar = stepCounter.querySelector('.left .bar');
var stepRightBar = stepCounter.querySelector('.right .bar');
var stepPer = stepCounter.querySelector('.value');

function stepProgress(value) {
  stepPer.innerHTML=value +'%';
  if (value <= 50) {
    var degree = 18*value/5;
    stepRightBar.style.transform = "rotate("+degree+"deg)";
    stepLeftBar.style.transform = "rotate(0deg)";
  } else {
    var degree = 18*(value-50)/5;
    stepRightBar.style.transform = "rotate(180deg)";
    stepLeftBar.style.transform = "rotate("+degree+"deg)";
  }
}

// Canvas
const canvas = document.querySelector('#c');
const WIDTH = window.innerWidth, HEIGHT = window.innerHeight
renderer = new THREE.WebGLRenderer({ canvas });
renderer.setClearColor(new THREE.Color(0x000, 1.0));
renderer.setSize(WIDTH, HEIGHT);
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Camera
const params = {
  fov: 20,
  aspect: 0.5, 
  zNear: 5,
  zFar: 4000
}
function makeCamera() {
  const { fov, aspect, zNear, zFar} = params;  // the canvas default
  return new THREE.PerspectiveCamera(fov, aspect, zNear, zFar);
}
camera = makeCamera();
// camera.position.set(-100, 100, 0) //.multiplyScalar(1);
// camera.lookAt(0, 0, 0);
camera.position.x = 800;
camera.position.y = 1;
camera.position.z = 0;
camera.lookAt(new THREE.Vector3(0, 0, 0));

// Camera GUI Input
// const gui = new GUI();
// const guiBox = gui.addFolder('guiBox');
// guiBox.add(params, 'fov', 1, 100).onChange(makeCamera)
// guiBox.add(params, 'aspect', 1, 20).onChange(makeCamera)
// guiBox.add(params, 'zNear', 0.1, 1).onChange(makeCamera)
// guiBox.add(params, 'zFar', 500, 2000).onChange(makeCamera)


// Orbit Controls
const controls = new OrbitControls( camera, renderer.domElement);
controls.enableZoom = true;
controls.enableDamping = true;
controls.update();

// Pointer Lock Controls & Instructions
pointerControls = new PointerLockControls(camera, document.body);
const instructions = document.getElementById( 'instructions' );
const blocker = document.getElementById( 'blocker' );

instructions.addEventListener( 'click', function () {
  pointerControls.lock();
} );
pointerControls.addEventListener( 'lock', function () {

  instructions.style.display = 'none';
  blocker.style.display = 'none';

} );

pointerControls.addEventListener( 'unlock', function () {

  blocker.style.display = 'block';
  instructions.style.display = '';

} );

// Key Controls
const onKeyDown = function ( event ) {
  accSteps++;
  
  let per = Math.floor((accSteps / 1000) * 100 )
  stepProgress(per)

  switch ( event.code ) {

    case 'ArrowUp':
    case 'KeyW':
      moveForward = true;
      break;

    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = true;
      break;

    case 'ArrowDown':
    case 'KeyS':
      moveBackward = true;
      break;

    case 'ArrowRight':
    case 'KeyD':
      moveRight = true;
      break;

    case 'Space':
      if ( canJump === true ) velocity.y += 350;
      canJump = false;
      break;
  }
};

const onKeyUp = function ( event ) {

  switch ( event.code ) {

    case 'ArrowUp':
    case 'KeyW':
      moveForward = false;
      break;

    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = false;
      break;

    case 'ArrowDown':
    case 'KeyS':
      moveBackward = false;
      break;

    case 'ArrowRight':
    case 'KeyD':
      moveRight = false;
      break;
  }
};

document.addEventListener( 'keydown', onKeyDown );
document.addEventListener( 'keyup', onKeyUp );

// orientation
// document.addEventListener('DOMContentLoaded', addListenMouse, false); 

// function addListenMouse() {
//   document.addEventListener('mousemove', e => {
//     console.log("move x: ", e.movementX, ", move y: ", e.movementY)
//     console.log("camera: ", camera.quaternion)
//   })
// }

// GamePad Interaction
let gamepadConnected = false;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let raycaster;

window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index, e.gamepad.id,
    e.gamepad.buttons.length, e.gamepad.axes.length);
  gamepadConnected = true; 
});
window.addEventListener("gamepaddisconnected", function(e) {
  console.log("Gamepad DISconnected")
  gamepadConnected = false;
})

raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

function xboxKeyPressed (gamepad) {
  if(!gamepad) {
    console.log("ERROR: XBOX CONNECTION LOST")
    return
  }

  
  let per = Math.floor((accSteps / 1000) * 100 )
  stepProgress(per)

  const buttons = gamepad.buttons;

  if(buttons[1].touched) {  // B button
    if(!pointerControls.isLocked) {
      pointerControls.lock();
    }
  }

  if(buttons[12].touched) {  // up
    moveForward = true;
    accSteps++;
  } 
  if(!buttons[12].touched) {
    moveForward = false;
  }
  if(buttons[15].touched) {
    moveRight = true;
    accSteps++;
  }
  if(!buttons[15].touched){
    moveRight = false;
  }
  if(buttons[13].touched) {
    moveBackward = true;
    accSteps++;
  }
  if(!buttons[13].touched){
    moveBackward = false;
  }
  if(buttons[14].touched) {
    moveLeft = true;
    accSteps++;
  }
  if(!buttons[14].touched){
    moveLeft = false;
  }
}

let prevAxisX = 0;
let prevAxisY = 0;
let staleX = 0;
let staleY = 0;

function xboxAxesPressed(gamepad) {
  const _euler = new THREE.Euler( 0, 0, 0, 'YXZ' );
  const minPolarAngle = 0; // radians
  const maxPolarAngle = Math.PI; // radians 
  const _PI_2 = Math.PI / 2;

  const movementX = gamepad.axes[2]
  const movementY = gamepad.axes[3]

  prevAxisY === movementY ? staleY++ : staleY = 0;
  prevAxisX === movementX ? staleX++ : staleX = 0; 

  if(staleX > 10 && staleY > 10){  // prevent constant camera rotation
    return
  } else {
    _euler.setFromQuaternion( camera.quaternion );
  
    _euler.y -= movementX * 0.02;
    _euler.x -= movementY * 0.02;
  
    _euler.x = Math.max( _PI_2 - maxPolarAngle, Math.min( _PI_2 - minPolarAngle, _euler.x ) );
  
    camera.quaternion.setFromEuler( _euler );
  }

  prevAxisX = movementX;
  prevAxisY = movementY;
}

function tick() {

  //gamepad
  if (gamepadConnected) {
    const gamepad = navigator.getGamepads()[0];
    
    if(!gamepad) {
      console.log("ERROR: XBOX CONNECTION LOST") 
      return;

    } else {
      try {
        xboxKeyPressed(gamepad);
        xboxAxesPressed(gamepad);
      } catch (err) {
        console.log("XBOX ERROR: ", err)
      }  
    }
  } 

  render();

  requestAnimationFrame( tick );

  checkPointerControls()
};

// including animation loop
function render() {

  const time = performance.now();
  if(accSteps > 1000) {
    switchDistrictBySteps()
  }

  // send time data to shaders
  // const mushroomMesh = scene.children[ 1 ].children[0];
  // if(shaderTree !== undefined) {
  //   shaderTree.rotation.y = time * 0.00075;
  //   shaderTree.material.uniforms.u_time.value = time * 0.00075;  
  // }
  // mushroomMesh.rotation.y = time * 0.00075;
  // mushroomMesh.material.uniforms.u_time.value = time * 0.01;

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix(); 

  if(currentScene.name === "D_ONE" && districtOne.children.length > 0) {
    // districtOne.children[0].intensity = Math.abs(Math.sin(time*0.001))
    // sceneOneTerrain.rotateY(Math.sin(time*0.00002)) 
    // sceneOneTerrain.rotateX(Math.sin(time*0.00002)) 
    // sceneOneTerrain.rotateZ(Math.sin(time*0.00002)) 

    districtOne.traverse(obj => {
      if (typeof obj.tick === 'function') {
        obj.tick(time*0.0001);
      }
    });
  
  }
  
  // districtGarden.children[0].material.uniforms.u_time.value = time * 0.005;
  if(currentScene.name === "D_TWO" && districtTwo.children.length > 0) {
    districtTwo.children[0].material.uniforms.u_time.value = time * 0.001;
  }

  if(currentScene.name === "D_GARDEN" ) {

    districtGarden.traverse(obj => {
      if (typeof obj.tick === 'function') {
        obj.tick(time);
      }
    });
    
  }

  var delta = clock.getDelta();

  // if(currentScene.name === "D_TWO") {
    if(window.mixers.length > 0) {
      window.mixers.forEach(mixer => mixer.update(delta))
      // mixer.update(delta);
    }  
  // }

  renderer.autoClear = true;
  renderer.clear();
  renderer.render( currentScene, camera );
  stats.update()
}

document.addEventListener('keypress', switchScene);

function switchDistrictBySteps() {

  switch(currentScene.name) {
      case DISTRICT_NAMES[0]: // garden
        const newDistrictIndex = (prevDistrictIndex+1)%4
        console.log("new Index", newDistrictIndex)
        switchScene(null, newDistrictIndex)
        break;

      case DISTRICT_NAMES[1]:
        prevDistrictIndex = 1;
        switchScene(null, 0);
        break;

      case DISTRICT_NAMES[2]:
        prevDistrictIndex = 2;
        switchScene(null, 0);
        break;

      case DISTRICT_NAMES[3]:
        prevDistrictIndex = 3;
        switchScene(null, 0);
        break;
  }

}

function initSteps() {
  // Init Steps
  console.log("Init steps")
  accSteps = 0;
  stepProgress(0);
}

function switchScene(e, index) {
  pointerControls.getObject().removeFromParent();
  
  const code = e?.code || index;

  switch(code) {

    case 'Digit1':
    case 1:
      console.log("1 pressed")
      districtOne.add(pointerControls.getObject());
      setTimeout(() => {
        currentScene = districtOne;
      }, 1000)
      initSteps()
      break;

    case 'Digit2':
    case 2:
      console.log("2 pressed")
      districtTwo.add(pointerControls.getObject());
      setTimeout(() => {
        currentScene = districtTwo;
      }, 1000)
      initSteps()
      break;

    case 'Digit3':
    case 3:
      console.log("3 pressed")
      currentScene = districtThree;
      initSteps()
      break;

    case 'Digit0':
    case 0:
      console.log("0 pressed")
      districtGarden.add(pointerControls.getObject());
      setTimeout(() => {
        currentScene = districtGarden;
      }, 1000)
      initSteps()
      break;
  }
}

function init() {

  if(!WEBGL.isWebGLAvailable()) {
    const warning = WEBGL.getWebGLErrorMessage();
    document.getElementById( 'container' ).appendChild( warning );
  } else {
    console.log("init")
    initStats();

    createDistrictGarden();
    createDistrictOne();
    createDistrictTwo();
    createDistrictThree();
    currentScene = districtOne;
    currentScene.add(pointerControls.getObject())
    tick();
  }

}

function initStats() {
  stats = new Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.querySelector("#stats-output").append(stats.domElement);
  return stats;
}

function createDistrictGarden() {
  console.log("createDistrictGarden")

  // create a scene, that will hold all our elements such as objects, cameras and lights.
  districtGarden = new THREE.Scene();
  districtGarden.background = new THREE.Color().setHSL( 0.6, 0, 1 );
  districtGarden.fog = new THREE.Fog( districtGarden.background, 1, 5000 );
  districtGarden.fog.color.copy(new THREE.Color( 0xffffff ))
  districtGarden.name = "D_GARDEN"

  const objects = generateDistrictGardenObjects()
  
  for(let i = 0; i < objects.length; i++){
    districtGarden.add(objects[i])
  }
}

function createDistrictOne() {
  console.log("createDistrictOne")

  districtOne = new THREE.Scene();
  districtOne.background = new THREE.Color(0x000000);
  
  const alphaFog= new THREE.Color().setHSL( 0.2, 0, 0.1 );
  districtOne.name = "D_ONE"
  districtOne.fog = new THREE.Fog( alphaFog, 1400, 1800 );


  sceneOneTerrain = generateGround(900, 900, 10, 60, THREE.DoubleSide)
  sceneOneTerrain.rotateY(Math.PI/6.0)
  sceneOneTerrain.position.set(-1400, 150, 0)
  districtOne.add(sceneOneTerrain)

  const objects = generateDistrictOneObjects()
  for(let i = 0; i < objects.length; i++){
    districtOne.add(objects[i])
  }

   for (let i = 0; i < DISTRICT_ONE_GLB.length; i++) {
    const currentModel = DISTRICT_ONE_GLB[i]
    try {
      onLoadAnimation(currentModel.gltf, currentModel, DISTRICT_NAMES[1])
    } catch (err) {
      console.log(err)
    }
  }
  
}

function createDistrictTwo() {
  console.log("createDistrictTwo")

  districtTwo = new THREE.Scene();
  districtTwo.background = new THREE.Color(0xffffff);
  districtTwo.name = "D_TWO"

  const objects = generateDistrictTwoObjects()
  for(let i = 0; i < objects.length; i++){
    districtTwo.add(objects[i]);
  }
  
  for (let i = 0; i < DISTRICT_TWO_GLB.length; i++) {
    const currentModel = DISTRICT_TWO_GLB[i]
    onLoadAnimation(currentModel.gltf, currentModel, DISTRICT_NAMES[2])
  }

}

function createDistrictThree() {
  districtThree = new THREE.Scene();
  districtThree.background = new THREE.Color(0xffffff);
  districtThree.name = "D_THREE"

  const objects = generateDistrictThreeObjects();

  for(let i = 0; i < objects.length; i++){
    districtThree.add(objects[i]);
  }
}

function onLoadAnimation(model, data, district) {
  // console.log("load animated models: ", data)
  const { posX, posY, posZ, rx, ry, rz } = data
  if(model){
    model.scene.position.set(posX, posY, posZ);
    model.scene.rotation.set(rx, ry, rz);
    model.scene.rotation.y = Math.PI/2.0; // face front  
  }

  if(data.name === "cctv") {

    // Particles
    const particlesGeometry = new THREE.SphereGeometry(5, 32, 32)
    const particlesMaterial = new THREE.PointsMaterial({
      size: 5,
      sizeAttenuation: true
    })
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    model.scene.rotateX(Math.PI/6.0)
    model.scene.add(particles)
  }

  if(data.scale) {
    const inputScale = data.scale
    model.scene.scale.set(inputScale, inputScale, inputScale)
  } else {
    model.scene.scale.set(25, 25, 25);
  }

  if(model.animations.length) {
    let mixer = new THREE.AnimationMixer(model.scene);
    window.mixers.push(mixer)

    var action = mixer.clipAction(model.animations[0])
    action.play();   
  }

  switch(district) {
    case DISTRICT_NAMES[0]:
      districtGarden.add(model.scene);
      break;
    case DISTRICT_NAMES[1]:
      districtOne.add(model.scene);
      break;
    case DISTRICT_NAMES[2]:
      districtTwo.add(model.scene);
      break;
    case DISTRICT_NAMES[3]:
      districtThree.add(model.scene);
      break;
  }
}


function checkPointerControls() {
  const time = performance.now();

  if ( pointerControls.isLocked === true ) {

    raycaster.ray.origin.copy( pointerControls.getObject().position );
    raycaster.ray.origin.y -= 10;

    // const intersections = raycaster.intersectObjects( objects, false );

    // const onObject = intersections.length > 0;

    // control speed of movement
    const delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta;

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
    if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

    // if ( onObject === true ) {

    //   velocity.y = Math.max( 0, velocity.y );
    //   canJump = true;

    // }

    pointerControls.moveRight( - velocity.x * delta );
    pointerControls.moveForward( - velocity.z * delta );

    pointerControls.getObject().position.y += ( velocity.y * delta ); // new behavior

    if ( pointerControls.getObject().position.y < 10 ) {

      velocity.y = 0;
      pointerControls.getObject().position.y = 5;

      canJump = true;

    }
  }

  prevTime = time;
}
 */