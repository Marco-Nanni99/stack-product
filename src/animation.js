import gsap from 'gsap'
import * as THREE from 'three'

const LOAD_EXPLODE_OFFSET = 2.8   // burst distance on page load

/**
 * Explode-in on page load: layers start spread apart, then ease into rest.
 */
export function playExplodeIn(sections) {
  const mid = (sections.length - 1) / 2

  sections.forEach((section, i) => {
    const { restZ } = section.userData
    section.position.z = restZ + (i - mid) * LOAD_EXPLODE_OFFSET

    gsap.to(section.position, {
      z: restZ,
      duration: 1.6,
      delay: 0.2 + i * 0.12,
      ease: 'power3.out',
    })
  })
}

/**
 * Idle slow Y-rotation on the whole group — call every frame.
 */
export function idleRotation(group, delta) {
  group.rotation.y += 0.004 * delta * 60
}

/**
 * Hover explode: spread all layers apart (active=true) or collapse (active=false).
 */
export function hoverExplode(sections, active) {
  sections.forEach((section) => {
    const { restZ, explodeOffset } = section.userData

    gsap.to(section.position, {
      z: active ? restZ + explodeOffset : restZ,
      duration: active ? 0.55 : 0.45,
      ease: active ? 'power2.out' : 'power2.inOut',
    })
  })
}

/**
 * Update floating HTML labels to follow their 3-D layer positions.
 * Lid has no label; bottom→snack, middle→main, top→dessert.
 */
export function updateLabels(sections, camera, canvas) {
  const LABEL_MAP = {
    bottom: { id: 'label-snack',   offset: { x: -140, y: 0 } },
    middle: { id: 'label-main',    offset: {  x: 140, y: 0 } },
    top:    { id: 'label-dessert', offset: { x: -140, y: 0 } },
    lid:    { id: 'label-lid',     offset: {  x: 140, y: 0 } },
  }

  const w = canvas.clientWidth
  const h = canvas.clientHeight

  sections.forEach((section) => {
    const cfg = LABEL_MAP[section.userData.layerName]
    if (!cfg) return  // lid — no label

    const el = document.getElementById(cfg.id)
    if (!el) return

    const vec = new THREE.Vector3()
    new THREE.Box3().setFromObject(section).getCenter(vec)
    vec.project(camera)

    el.style.left = ((vec.x * 0.5 + 0.5) * w + cfg.offset.x) + 'px'
    el.style.top  = ((-vec.y * 0.5 + 0.5) * h + cfg.offset.y) + 'px'
    el.classList.add('visible')
  })
}
