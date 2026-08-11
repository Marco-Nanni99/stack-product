import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { loadModel } from './cylinder.js'
import { playExplodeIn, idleRotation, updateLabels, hoverExplode } from './animation.js'

// ── Renderer ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas')

function canvasSize() {
  return { w: Math.round(window.innerWidth * 0.58), h: window.innerHeight }
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
const { w: initW, h: initH } = canvasSize()
renderer.setSize(initW, initH, false)
renderer.toneMapping = THREE.NoToneMapping
renderer.setClearColor(0x000000, 0)

const isMobile = window.innerWidth < 768
renderer.shadowMap.enabled = !isMobile
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// ── Scene & Camera ────────────────────────────────────────────────────────────
const scene = new THREE.Scene()
// transparent — let the hero background show through

const { w: cW, h: cH } = canvasSize()
const camera = new THREE.PerspectiveCamera(45, (cW || window.innerWidth * 0.58) / (cH || window.innerHeight), 0.1, 50)
camera.position.set(0, 0.4, 6.3)
camera.lookAt(new THREE.Vector3(0, 0, 0))

// ── Lights — studio 3-point setup ─────────────────────────────────────────────
// Low ambient so dark sides of product stay dark vs background
const ambient = new THREE.AmbientLight(0xffffff, 0.18)
scene.add(ambient)

// KEY — bright from upper-right-front, casts hard directional shadow
const keyLight = new THREE.DirectionalLight(0xffffff, 6.5)
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

// FILL — subtle cool fill from the left, kept weak so contrast is preserved
const fillLight = new THREE.DirectionalLight(0xd0eeff, 0.8)
fillLight.position.set(-5, 2, 4)
scene.add(fillLight)

// RIM — strong teal edge light from behind-left to separate product from background
const rimTeal = new THREE.PointLight(0x8BB8C8, 14, 14)
rimTeal.position.set(-3, 2, -4)
scene.add(rimTeal)

// ACCENT — slate-blue from below-right
const accentLow = new THREE.PointLight(0x607090, 3, 10)
accentLow.position.set(3, -4, 3)
scene.add(accentLow)

// TOP SPOT — tight white above for a hot-spot on the lid
const topSpot = new THREE.PointLight(0xffffff, 10, 6)
topSpot.position.set(0.5, 6, 2)
scene.add(topSpot)

// ── Floor (shadow only) ───────────────────────────────────────────────────────
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(9, 128),
  new THREE.ShadowMaterial({ opacity: 0.18 })
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -2.4
floor.receiveShadow = true
scene.add(floor)

// ── Post-processing (bloom) ───────────────────────────────────────────────────
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloom = new UnrealBloomPass(
  new THREE.Vector2(initW, initH),
  0.5,   // strength
  0.5,   // radius
  0.85   // threshold
)
if (!isMobile) composer.addPass(bloom)

// ── State ─────────────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster()
const mouse     = new THREE.Vector2(9999, 9999)
let isExploded  = false
let sections    = []
let allMeshes   = []
let group       = null
const clock     = new THREE.Clock()

// ── Load GLB ──────────────────────────────────────────────────────────────────
loadModel(isMobile)
  .then(({ group: g, sections: s }) => {
    group    = g
    sections = s
    scene.add(group)
    if (isMobile) group.scale.setScalar(0.85)

    // Collect every mesh for raycasting
    group.traverse((child) => {
      if (child.isMesh) allMeshes.push(child)
    })

    playExplodeIn(sections)
    animate()
  })
  .catch((err) => {
    console.error('[STACK] Failed to load stack-bottle.glb:', err)
    console.error('Place your GLB at public/models/stack-bottle.glb')
  })

// ── Mouse / Touch events ──────────────────────────────────────────────────────
canvas.addEventListener('mousemove', (e) => {
  if (isMobile) return
  const rect = canvas.getBoundingClientRect()
  mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
})

canvas.addEventListener('mouseleave', () => {
  if (isMobile) return
  mouse.set(9999, 9999)
  if (isExploded) { hoverExplode(sections, false); isExploded = false }
})

// Mobile tap-to-toggle explode
let tapStartX = 0
let tapStartY = 0

canvas.addEventListener('touchstart', (e) => {
  tapStartX = e.touches[0].clientX
  tapStartY = e.touches[0].clientY
}, { passive: true })

canvas.addEventListener('touchend', (e) => {
  const dx = Math.abs(e.changedTouches[0].clientX - tapStartX)
  const dy = Math.abs(e.changedTouches[0].clientY - tapStartY)
  if (dx > 10 || dy > 10) return  // was a scroll/swipe, not a tap

  const t = e.changedTouches[0]
  const rect = canvas.getBoundingClientRect()
  const tapMouse = new THREE.Vector2(
    ((t.clientX - rect.left) / rect.width)  * 2 - 1,
    -((t.clientY - rect.top)  / rect.height) * 2 + 1
  )
  raycaster.setFromCamera(tapMouse, camera)
  const hit = raycaster.intersectObjects(allMeshes).length > 0
  if (!hit) return

  isExploded = !isExploded
  hoverExplode(sections, isExploded)
}, { passive: true })

// ── Render loop ───────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()

  if (!group) return

  idleRotation(group, delta)

  // Desktop hover: any mesh hit → explode; nothing hit → collapse
  if (!isMobile) {
    raycaster.setFromCamera(mouse, camera)
    const hovering = raycaster.intersectObjects(allMeshes).length > 0

    if (hovering && !isExploded) {
      hoverExplode(sections, true)
      isExploded = true
    } else if (!hovering && isExploded) {
      hoverExplode(sections, false)
      isExploded = false
    }
  }

  renderer.render(scene, camera)
}

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const { w, h } = canvasSize()
  camera.aspect = w / h
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
})
