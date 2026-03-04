import gsap from 'gsap'
import * as THREE from 'three'

const EXPLODE_OFFSET = 2.8  // units apart at start

/**
 * Explode-in: sections start spread apart, then ease into resting position.
 */
export function playExplodeIn(sections) {
  sections.forEach((section, i) => {
    const { restY } = section.userData
    const startY = restY + (i - 1) * EXPLODE_OFFSET

    // Start position
    section.position.y = startY
    section.material?.forEach?.(m => { m.opacity = 0 })

    gsap.to(section.position, {
      y: restY,
      duration: 1.6,
      delay: 0.2 + i * 0.12,
      ease: 'power3.out',
    })
  })
}

/**
 * Idle slow rotation on the whole cylinder group.
 * Called in the render loop.
 */
export function idleRotation(group, delta) {
  group.rotation.y += 0.004 * delta * 60
}

/**
 * Hover: float a section out along the cylinder axis.
 * @param {THREE.Group} section
 * @param {boolean} active
 */
export function hoverSection(section, active) {
  const { restY } = section.userData
  gsap.to(section.position, {
    y: active ? restY + 0.22 : restY,
    duration: 0.5,
    ease: 'power2.out',
  })
}

/**
 * Update floating HTML labels to follow 3D positions.
 * @param {THREE.Group[]} sections  — order: snack[0], main[1], dessert[2]
 * @param {THREE.Camera} camera
 * @param {HTMLElement} canvas
 */
export function updateLabels(sections, camera, canvas) {
  const ids = ['label-snack', 'label-main', 'label-dessert']
  const offsets = [
    { x: 140, y: 0 },   // snack  → right
    { x: -140, y: 0 },  // main   → left
    { x: 140, y: 0 },   // dessert → right
  ]

  const w = canvas.clientWidth
  const h = canvas.clientHeight

  sections.forEach((section, i) => {
    const el = document.getElementById(ids[i])
    if (!el) return

    const vec = new THREE.Vector3()
    section.getWorldPosition(vec)
    vec.project(camera)

    const screenX = (vec.x * 0.5 + 0.5) * w + offsets[i].x
    const screenY = (-vec.y * 0.5 + 0.5) * h + offsets[i].y

    el.style.left = screenX + 'px'
    el.style.top = screenY + 'px'
    el.classList.add('visible')
  })
}
