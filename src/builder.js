import * as THREE from 'three'
import gsap from 'gsap'
import { LAYER_TYPES } from './layer-types.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const RADIUS   = 0.85
const RING_H   = 0.055
const GAP      = 0.04
const MAX_LAYERS = 5

// ── Canvas / Renderer ──────────────────────────────────────────────────────────
const canvasEl = document.getElementById('builder-canvas')
const wrap     = canvasEl.parentElement

function cSize() { return { w: wrap.clientWidth, h: wrap.clientHeight } }

const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.35
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x080808)

let { w: CW, h: CH } = cSize()
renderer.setSize(CW, CH)

const camera = new THREE.PerspectiveCamera(40, CW / CH, 0.1, 50)
camera.position.set(0, 0.5, 8)

// ── Lights ─────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.38))

const key = new THREE.DirectionalLight(0xffffff, 4.0)
key.position.set(4, 8, 5)
key.castShadow = true
key.shadow.mapSize.set(1024, 1024)
key.shadow.camera.left = key.shadow.camera.bottom = -5
key.shadow.camera.right = key.shadow.camera.top  =  5
key.shadow.camera.near  = 1
key.shadow.camera.far   = 30
key.shadow.bias = -0.001
scene.add(key)

const fill = new THREE.DirectionalLight(0xd0eeff, 1.6)
fill.position.set(-5, 2, 4)
scene.add(fill)

const rim = new THREE.PointLight(0x7edcdc, 8, 14)
rim.position.set(-3, 2, -4)
scene.add(rim)

const topSpot = new THREE.PointLight(0xffffff, 6, 6)
topSpot.position.set(0.5, 6, 2)
scene.add(topSpot)

// ── Shadow floor ───────────────────────────────────────────────────────────────
const floorMesh = new THREE.Mesh(
  new THREE.CircleGeometry(8, 64),
  new THREE.ShadowMaterial({ opacity: 0.5 })
)
floorMesh.rotation.x = -Math.PI / 2
floorMesh.receiveShadow = true
scene.add(floorMesh)

// ── Stack group (tilted like hero) ─────────────────────────────────────────────
const stackGroup = new THREE.Group()
stackGroup.rotation.z = THREE.MathUtils.degToRad(10)
stackGroup.rotation.x = THREE.MathUtils.degToRad(-6)
scene.add(stackGroup)

// ── Stack state ────────────────────────────────────────────────────────────────
let stackLayers = [
  LAYER_TYPES[0], // main
  LAYER_TYPES[1], // duo
  LAYER_TYPES[0], // main
]
const meshGroups = []   // THREE.Group per layer, same index as stackLayers

// ── Geometry helpers ───────────────────────────────────────────────────────────
function totalHeight() {
  return stackLayers.reduce((s, lt) => s + lt.height + RING_H * 2 + GAP, 0)
}

function layerCenterY(i) {
  let y = -totalHeight() / 2 + RING_H
  for (let k = 0; k < i; k++) y += stackLayers[k].height + RING_H * 2 + GAP
  return y + stackLayers[i].height / 2
}

function layerBottomY() { return -totalHeight() / 2 }

// ── Texture ────────────────────────────────────────────────────────────────────
function makeTopTexture(compartments, accentHex) {
  const S = 256, cx = S / 2, cy = S / 2, r = S / 2 - 4
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#0a1828'
  ctx.fill()

  if (compartments > 1) {
    ctx.save()
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
    ctx.strokeStyle = accentHex
    ctx.lineWidth = 5
    ctx.globalAlpha = 0.45

    if (compartments === 2) {
      ctx.beginPath(); ctx.moveTo(cx, 4); ctx.lineTo(cx, S - 4); ctx.stroke()
    } else if (compartments === 4) {
      ctx.beginPath(); ctx.moveTo(cx, 4); ctx.lineTo(cx, S - 4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(4, cy); ctx.lineTo(S - 4, cy); ctx.stroke()
    }
    ctx.restore()
  }

  // Subtle edge ring
  ctx.beginPath()
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 2
  ctx.stroke()

  return new THREE.CanvasTexture(c)
}

// ── Mesh factory ───────────────────────────────────────────────────────────────
function createLayerMesh(lt) {
  const g = new THREE.Group()
  g.userData.layerType = lt

  const sideMat = new THREE.MeshStandardMaterial({
    color: lt.color,
    emissive: lt.emissive,
    emissiveIntensity: lt.emissiveIntensity,
    metalness: 0.75,
    roughness: 0.22,
  })
  const topMat = new THREE.MeshStandardMaterial({
    map: makeTopTexture(lt.compartments, lt.accentCss),
    metalness: 0.5,
    roughness: 0.35,
  })

  // CylinderGeometry groups: 0=side, 1=top cap, 2=bottom cap
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(RADIUS, RADIUS, lt.height, 64),
    [sideMat, topMat, sideMat]
  )
  body.castShadow = true
  g.add(body)

  const ringMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.95, roughness: 0.1 })
  const ringGeo = new THREE.CylinderGeometry(RADIUS + 0.025, RADIUS + 0.025, RING_H, 64)
  const rt = new THREE.Mesh(ringGeo, ringMat)
  rt.position.y = (lt.height + RING_H) / 2
  rt.castShadow = true
  const rb = rt.clone()
  rb.position.y = -(lt.height + RING_H) / 2
  g.add(rt, rb)

  return g
}

// ── Stack management ───────────────────────────────────────────────────────────
function animateAll() {
  meshGroups.forEach((mg, i) => {
    gsap.to(mg.position, { y: layerCenterY(i), duration: 0.55, ease: 'power3.out' })
  })
  gsap.to(floorMesh.position, { y: layerBottomY() - 0.12, duration: 0.5, ease: 'power2.out' })
  updateUI()
}

function insertLayer(lt, index) {
  if (stackLayers.length >= MAX_LAYERS) return
  index = Math.max(0, Math.min(index, stackLayers.length))

  stackLayers.splice(index, 0, lt)
  const mg = createLayerMesh(lt)
  mg.position.y = layerCenterY(index) + 4.5  // drop in from above
  stackGroup.add(mg)
  meshGroups.splice(index, 0, mg)

  // Fly in, then settle all to new positions
  gsap.to(mg.position, { y: layerCenterY(index), duration: 0.65, ease: 'power3.out' })
  meshGroups.forEach((m, i) => {
    if (i === index) return
    gsap.to(m.position, { y: layerCenterY(i), duration: 0.5, ease: 'power2.out' })
  })
  gsap.to(floorMesh.position, { y: layerBottomY() - 0.12, duration: 0.5 })
  updateUI()
}

function removeLayer(index) {
  if (stackLayers.length <= 1) return
  const mg = meshGroups[index]
  stackLayers.splice(index, 1)
  meshGroups.splice(index, 1)

  gsap.to(mg.position, {
    y: mg.position.y + 3.5,
    duration: 0.4, ease: 'power2.in',
    onComplete: () => stackGroup.remove(mg),
  })
  animateAll()
}

function initStack() {
  stackLayers.forEach((lt, i) => {
    const mg = createLayerMesh(lt)
    mg.position.y = layerCenterY(i) + 4.5
    stackGroup.add(mg)
    meshGroups.push(mg)
    gsap.to(mg.position, { y: layerCenterY(i), duration: 0.8, delay: 0.1 + i * 0.12, ease: 'power3.out' })
  })
  floorMesh.position.y = layerBottomY() - 0.12
  updateUI()
}

function resetStack() {
  meshGroups.forEach(mg => {
    gsap.to(mg.position, { y: mg.position.y + 5, duration: 0.35,
      onComplete: () => stackGroup.remove(mg) })
  })
  meshGroups.length = 0
  stackLayers = [LAYER_TYPES[0], LAYER_TYPES[1], LAYER_TYPES[0]]
  setTimeout(() => {
    stackLayers.forEach((lt, i) => {
      const mg = createLayerMesh(lt)
      mg.position.y = layerCenterY(i) + 4.5
      stackGroup.add(mg)
      meshGroups.push(mg)
    })
    animateAll()
  }, 380)
}

// ── UI updates ─────────────────────────────────────────────────────────────────
function updateUI() {
  document.getElementById('layer-count').textContent = stackLayers.length
  updateDropZones()
}

// ── Drop zones ─────────────────────────────────────────────────────────────────
function slotWorldY(slotIndex) {
  if (stackLayers.length === 0) return 0
  if (slotIndex === 0) return layerBottomY() - 0.2
  if (slotIndex === stackLayers.length) {
    return layerCenterY(stackLayers.length - 1)
         + stackLayers[stackLayers.length - 1].height / 2
         + RING_H + 0.2
  }
  const below = layerCenterY(slotIndex - 1) + stackLayers[slotIndex - 1].height / 2 + RING_H
  const above = layerCenterY(slotIndex) - stackLayers[slotIndex].height / 2 - RING_H
  return (below + above) / 2
}

function worldToScreen(localY) {
  const pt = new THREE.Vector3(0, localY, 0)
  stackGroup.localToWorld(pt)
  pt.project(camera)
  const { w, h } = cSize()
  return { x: (pt.x * 0.5 + 0.5) * w, y: (-pt.y * 0.5 + 0.5) * h }
}

function updateDropZones() {
  const container = document.getElementById('drop-zones')
  container.innerHTML = ''
  const numSlots = stackLayers.length + 1
  for (let i = 0; i < numSlots; i++) {
    const { x, y } = worldToScreen(slotWorldY(i))
    const div = document.createElement('div')
    div.className = 'drop-zone'
    div.dataset.slot = i
    div.style.left = x + 'px'
    div.style.top  = y + 'px'
    container.appendChild(div)
  }
}

// ── Drag and drop ──────────────────────────────────────────────────────────────
let draggedType  = null
let activeSlot   = -1

function nearestSlot(clientY) {
  const zones = document.querySelectorAll('.drop-zone')
  let best = 0, minDist = Infinity
  zones.forEach((z, i) => {
    const rect = z.getBoundingClientRect()
    const dist = Math.abs(clientY - (rect.top + rect.height / 2))
    if (dist < minDist) { minDist = dist; best = i }
  })
  return best
}

function setActiveSlot(index) {
  document.querySelectorAll('.drop-zone').forEach((z, i) =>
    z.classList.toggle('active', i === index))
  activeSlot = index
}

function showZones(visible) {
  const c = document.getElementById('drop-zones')
  c.style.opacity = visible ? '1' : '0'
}

function populatePanel() {
  const container = document.getElementById('layer-options')
  LAYER_TYPES.forEach(lt => {
    const card = document.createElement('div')
    card.className = 'layer-option-card'
    card.draggable = true
    card.dataset.typeId = lt.id
    card.innerHTML = `
      <div class="layer-card-icon">
        <svg viewBox="0 0 40 40" fill="none" color="${lt.accentCss}">${lt.compartmentSvg}</svg>
      </div>
      <div class="layer-card-info">
        <div class="layer-card-name" style="color:${lt.accentCss}">${lt.label}</div>
        <div class="layer-card-badge">${lt.sublabel}</div>
        <div class="layer-card-meta">${lt.heightLabel}</div>
      </div>
      <div class="layer-card-drag">⠿</div>
    `

    card.addEventListener('dragstart', () => {
      draggedType = lt
      card.classList.add('dragging')
      showZones(true)
    })
    card.addEventListener('dragend', () => {
      draggedType = null
      card.classList.remove('dragging')
      showZones(false)
      setActiveSlot(-1)
    })

    container.appendChild(card)
  })
}

const dropTarget = document.getElementById('drop-target')

dropTarget.addEventListener('dragover', (e) => {
  e.preventDefault()
  if (!draggedType) return
  setActiveSlot(nearestSlot(e.clientY))
})

dropTarget.addEventListener('dragleave', (e) => {
  if (!dropTarget.contains(e.relatedTarget)) setActiveSlot(-1)
})

dropTarget.addEventListener('drop', (e) => {
  e.preventDefault()
  if (!draggedType || activeSlot < 0) return
  insertLayer(draggedType, activeSlot)
  showZones(false)
  setActiveSlot(-1)
})

// ── Click a layer in the 3D scene to remove it ─────────────────────────────────
const raycaster = new THREE.Raycaster()
const mouse     = new THREE.Vector2()

canvasEl.addEventListener('click', (e) => {
  if (draggedType) return   // ignore stray clicks during drag
  const rect = canvasEl.getBoundingClientRect()
  mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  const allMeshes = []
  meshGroups.forEach((mg, gi) => {
    mg.traverse(child => {
      if (child.isMesh) { child.userData.groupIndex = gi; allMeshes.push(child) }
    })
  })

  const hits = raycaster.intersectObjects(allMeshes)
  if (hits.length > 0) {
    const gi = hits[0].object.userData.groupIndex
    if (gi !== undefined) removeLayer(gi)
  }
})

// ── Render loop ────────────────────────────────────────────────────────────────
const clock = new THREE.Clock()
function animate() {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()
  stackGroup.rotation.y += 0.004 * delta * 60
  renderer.render(scene, camera)
}

// ── Resize ─────────────────────────────────────────────────────────────────────
new ResizeObserver(() => {
  const { w, h } = cSize()
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  updateDropZones()
}).observe(wrap)

// ── Init ───────────────────────────────────────────────────────────────────────
populatePanel()
initStack()
animate()
showZones(false)
document.getElementById('reset-btn').addEventListener('click', resetStack)
