import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Clock } from 'three'
import * as dat from 'dat.gui'

import vertexShader from './shaders/test/vertex.glsl'
import fragmentShader from './shaders/test/fragment.glsl'
import squareVertexShader from './shaders/square/vertex.glsl'
import squareFragmentShader from './shaders/square/fragment.glsl'
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'

let mouse = new THREE.Vector2(0, 0)
const clock = new Clock()

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 1000)
camera.position.set(0, 0, 2)
scene.add(camera)
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true //плавность вращения камеры

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //ограничение кол-ва рендеров в завис-ти от плотности пикселей
renderer.setClearColor('#ffffff', 1)
// renderer.physicallyCorrectLights = true;
// renderer.outputEncoding = THREE.sRGBEncoding;

window.addEventListener('resize', () => {
  //update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  //update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  //update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

//video texture
let video = document.getElementById('video')
video.play()

let texture = new THREE.VideoTexture(video)

texture.minFilter = THREE.LinearFilter
texture.magFilter = THREE.LinearFilter
texture.format = THREE.RGBFormat

//------------------------------------------------------------------------------------------------------

const behindPlane = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(0.3, 0.3),
  new THREE.MeshBasicMaterial({color: 0x00ffff, side: THREE.DoubleSide})
)
behindPlane.position.z = -0.4
scene.add(behindPlane)

const squareCount = 40
const dummy = new THREE.Object3D()
let counter = 0

const linesGeometry = new THREE.Geometry()

for (let i = -squareCount / 2; i < squareCount / 2; ++i) {
  linesGeometry.vertices.push(new THREE.Vector3(-5, i / 10 + 0.05, 0));
  linesGeometry.vertices.push(new THREE.Vector3(5, i / 10 + 0.05, 0));
}

for (let i = -squareCount / 2; i < squareCount / 2; ++i) {
  linesGeometry.vertices.push(new THREE.Vector3(i / 10 + 0.05, -5, 0));
  linesGeometry.vertices.push(new THREE.Vector3(i / 10 + 0.05, 5, 0));
}

const linesMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.02,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})

const lines = new THREE.LineSegments(linesGeometry, linesMaterial)
lines.position.z = 0.009
scene.add(lines)

const geometry = new THREE.PlaneBufferGeometry(1, 1, 10, 10)
const material = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  // transparent: true,
  // depthWrite: false,
  // blending: THREE.AdditiveBlending,
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTexture: {value: texture},
    resolution: {value: new THREE.Vector4()},
    uTime: {value: 0},
    uMouse: {value: new THREE.Vector2(mouse.x, mouse.y)}
  }
})

const particle = new THREE.Mesh(geometry, material)
scene.add(particle)

const instancedMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  transparent: true,
  // depthWrite: false,
  // blending: THREE.AdditiveBlending,
  vertexShader: squareVertexShader,
  fragmentShader: squareFragmentShader,
  uniforms: {
    uTexture: {value: texture},
    resolution: {value: new THREE.Vector4()},
    uTime: {value: 0},
    uMouse: {value: new THREE.Vector3()}
  }
})
const instancedGeometry = new THREE.PlaneBufferGeometry(0.1, 0.1)
const square = new THREE.InstancedMesh(instancedGeometry, instancedMaterial, squareCount ** 2)

for (let i = -squareCount / 2; i < squareCount / 2; ++i) {
  for (let j = -squareCount / 2; j < squareCount / 2; ++j) {
    dummy.position.set(i / 10, j / 10, 0.01)
    dummy.updateMatrix()
    square.setMatrixAt(counter++, dummy.matrix)
  }
}

square.position.z = 0.01
scene.add(square)

const pointsGeometry = new THREE.BufferGeometry()
let vertices = []

for (let i = -squareCount / 2; i < squareCount / 2; ++i) {
  for (let j = -squareCount / 2; j < squareCount / 2; ++j) {
    vertices.push(i / 10 + 0.05, j / 10 + 0.05, 0)
  }
}

pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
const pointsMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: particlesVertexShader,
  fragmentShader: particlesFragmentShader,
  uniforms: {
    uTexture: {value: texture},
    resolution: {value: new THREE.Vector4()},
    uTime: {value: 0},
  }
})
const points = new THREE.Points(pointsGeometry, pointsMaterial)
points.position.z = 0.008
scene.add(points)

//raycaster (intersect objects by mouse)
const raycaster = new THREE.Raycaster()

window.addEventListener('mousemove', (event) => {
  mouse = {
    x: event.clientX / window.innerWidth * 2 - 1,
    y: -(event.clientY / window.innerHeight) * 2 + 1,
  }

  const rayPlane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(5, 5),
    new THREE.MeshBasicMaterial()
  )

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([rayPlane]);
  instancedMaterial.uniforms.uMouse.value = intersects[0].point
})


//uniform resolution options===========================================
let imageAspect = 1080 / 1920
let a1, a2
if (sizes.height / sizes.width > imageAspect) {
  a1 = (sizes.width / sizes.height) * imageAspect
  a2 = 1
} else {
  a1 = 1
  a2 = (sizes.height / sizes.width) / imageAspect
}

material.uniforms.resolution.value.x = sizes.width
material.uniforms.resolution.value.y = sizes.height
material.uniforms.resolution.value.z = a1
material.uniforms.resolution.value.w = a2
//=======================================================================

//полноэкранный режим видео
const dist = camera.position.z
const height = 0.85
camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist))

if (sizes.width / sizes.height > 1) {
  particle.scale.x = camera.aspect
} else {
  particle.scale.y = 1 / camera.aspect
}
camera.updateProjectionMatrix()

//---------------------------------------------------------------------------------------------------------

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  material.uniforms.uTime.value = elapsedTime
  instancedMaterial.uniforms.uTime.value = elapsedTime
  pointsMaterial.uniforms.uTime.value = elapsedTime

  camera.position.x += (-mouse.x / 5 - camera.position.x) * .09;
  camera.position.y += (-mouse.y / 5 - camera.position.y) * .09;
  camera.lookAt(scene.position);

  //Update controls
  // controls.update() //если включён Damping для камеры необходимо её обновлять в каждом кадре

  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()