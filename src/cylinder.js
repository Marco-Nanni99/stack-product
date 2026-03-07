import * as THREE from 'three'

const SECTION_RADIUS = 0.85
const SECTION_HEIGHT = 0.95
const RING_HEIGHT = 0.06
const SEGMENTS = 64

// Colors per section (bottom → top)
const SECTION_DATA = [
  { name: 'snack',   color: 0xA090C0, emissive: 0x8060b0, emissiveIntensity: 0.15 },
  { name: 'main',    color: 0x8AABCC, emissive: 0x5090c0, emissiveIntensity: 0.15 },
  { name: 'dessert', color: 0x70AAAA, emissive: 0x40a0a0, emissiveIntensity: 0.18 },
]

export function buildCylinder() {
  const group = new THREE.Group()
  const sections = []

  SECTION_DATA.forEach((data, i) => {
    const sectionGroup = new THREE.Group()

    // Main body
    const bodyGeo = new THREE.CylinderGeometry(
      SECTION_RADIUS, SECTION_RADIUS, SECTION_HEIGHT, SEGMENTS
    )
    const bodyMat = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.emissive,
      emissiveIntensity: data.emissiveIntensity,
      metalness: 0.45,
      roughness: 0.30,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    sectionGroup.add(body)

    // Top ring (separator / connector)
    const ringGeo = new THREE.CylinderGeometry(
      SECTION_RADIUS + 0.02,
      SECTION_RADIUS + 0.02,
      RING_HEIGHT,
      SEGMENTS
    )
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x8090a0,
      metalness: 0.90,
      roughness: 0.12,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.y = (SECTION_HEIGHT + RING_HEIGHT) / 2
    sectionGroup.add(ring)

    // Bottom ring
    const ringBottom = ring.clone()
    ringBottom.position.y = -(SECTION_HEIGHT + RING_HEIGHT) / 2
    sectionGroup.add(ringBottom)

    // Rest Y position (stacked, rings included)
    const restY = i * (SECTION_HEIGHT + RING_HEIGHT * 2)
    sectionGroup.position.y = restY
    sectionGroup.userData = { name: data.name, restY }

    group.add(sectionGroup)
    sections.push(sectionGroup)
  })

  // Centre the whole group vertically
  const totalH = SECTION_DATA.length * (SECTION_HEIGHT + RING_HEIGHT * 2)
  group.position.y = -totalH / 2

  // Tilt like the reference image
  group.rotation.z = THREE.MathUtils.degToRad(15)
  group.rotation.x = THREE.MathUtils.degToRad(-8)

  return { group, sections }
}

/**
 * Given a section mesh's world position and the camera,
 * returns normalised device coordinates {x, y} in [−1, 1].
 */
export function worldToNDC(object, camera) {
  const vec = new THREE.Vector3()
  object.getWorldPosition(vec)
  vec.project(camera)
  return { x: vec.x, y: vec.y }
}
