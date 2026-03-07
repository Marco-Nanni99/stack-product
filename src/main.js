import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { buildCylinder } from './cylinder.js'
import { playExplodeIn, idleRotation, updateLabels, hoverSection } from './animation.js'

// ── Renderer ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1

const isMobile = window.innerWidth < 768
renderer.shadowMap.enabled = !isMobile
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// ── Scene & Camera ────────────────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x2F4460)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50)
camera.position.set(0, 0.4, 7)
// Look slightly left so the cylinder sits in the right half of the screen
camera.lookAt(new THREE.Vector3(isMobile ? 0 : -1.2, 0, 0))

// ── Lights — studio 3-point setup ─────────────────────────────────────────────
// Soft base so shadows aren't pitch black
const ambient = new THREE.AmbientLight(0xffffff, 0.35)
scene.add(ambient)

// KEY — strong white from upper-right-front (main highlight on the surface)
const keyLight = new THREE.DirectionalLight(0xffffff, 4.5)
keyLight.position.set(5, 8, 6)
keyLight.castShadow = !isMobile
keyLight.shadow.mapSize.set(2048, 2048)
keyLight.shadow.camera.near = 1
keyLight.shadow.camera.far = 30
keyLight.shadow.camera.left = -5
keyLight.shadow.camera.right = 5
keyLight.shadow.camera.top = 6
keyLight.shadow.camera.bottom = -4
keyLight.shadow.bias = -0.001
scene.add(keyLight)

// FILL — cool-white from the left, softens the shadow side
const fillLight = new THREE.DirectionalLight(0xd0eeff, 1.8)
fillLight.position.set(-5, 2, 4)
scene.add(fillLight)

// RIM / BACK — muted blue from behind-left, creates a soft glowing edge
const rimTeal = new THREE.PointLight(0x8BB8C8, 7, 14)
rimTeal.position.set(-3, 2, -4)
scene.add(rimTeal)

// ACCENT — subtle slate-blue from below-right for the bottom sections
const accentLow = new THREE.PointLight(0x607090, 3, 10)
accentLow.position.set(3, -4, 3)
scene.add(accentLow)

// TOP SPOT — tight white point above to create a hot-spot on the top cap
const topSpot = new THREE.PointLight(0xffffff, 8, 6)
topSpot.position.set(0.5, 6, 2)
scene.add(topSpot)

// ── Cylinder ──────────────────────────────────────────────────────────────────
const { group, sections } = buildCylinder()
scene.add(group)

// Make every mesh in the cylinder cast shadows
group.traverse((child) => {
  if (child.isMesh) child.castShadow = true
})

// ── Floor ─────────────────────────────────────────────────────────────────────
const FLOOR_Y = -2.4

// ShadowMaterial: invisible except where shadows fall
const floorGeo = new THREE.CircleGeometry(9, 128)
const floorMat = new THREE.ShadowMaterial({ opacity: 0.55 })
const floor = new THREE.Mesh(floorGeo, floorMat)
floor.rotation.x = -Math.PI / 2
floor.position.y = FLOOR_Y
floor.receiveShadow = true
scene.add(floor)

// ── Post-processing (bloom) ───────────────────────────────────────────────────
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,    // strength
  0.5,    // radius
  0.85    // threshold — raised so the mid-blue bg doesn't trigger bloom
)
if (!isMobile) composer.addPass(bloom)

// ── Raycaster for hover ───────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2(9999, 9999)
let hoveredSection = null

canvas.addEventListener('mousemove', (e) => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
})

canvas.addEventListener('mouseleave', () => {
  mouse.set(9999, 9999)
  if (hoveredSection) {
    hoverSection(hoveredSection, false)
    hoveredSection = null
  }
})

canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0]
  mouse.x =  (touch.clientX / window.innerWidth)  * 2 - 1
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1
}, { passive: true })

canvas.addEventListener('touchend', () => {
  mouse.set(9999, 9999)
  if (hoveredSection) {
    hoverSection(hoveredSection, false)
    hoveredSection = null
  }
}, { passive: true })

// ── Start explode-in animation ────────────────────────────────────────────────
playExplodeIn(sections)

// ── Collect all meshes for raycasting ─────────────────────────────────────────
const sectionMeshes = []
sections.forEach((sec) => {
  sec.traverse((child) => {
    if (child.isMesh) {
      child.userData.sectionGroup = sec
      sectionMeshes.push(child)
    }
  })
})

// ── Render loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()

  // Idle rotation
  idleRotation(group, delta)

  // Hover detection
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(sectionMeshes)

  if (hits.length > 0) {
    const hit = hits[0].object.userData.sectionGroup
    if (hit !== hoveredSection) {
      if (hoveredSection) hoverSection(hoveredSection, false)
      hoverSection(hit, true)
      hoveredSection = hit
    }
  } else if (hoveredSection) {
    hoverSection(hoveredSection, false)
    hoveredSection = null
  }

  // Sync floating HTML labels
  updateLabels(sections, camera, canvas)

  composer.render()
}

animate()

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.lookAt(new THREE.Vector3(w < 768 ? 0 : -1.2, 0, 0))
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  composer.setSize(w, h)
})
