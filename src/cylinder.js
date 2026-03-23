import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Physical order bottom → top; drives explode direction
const LAYER_NAMES = ['bottom', 'middle', 'top', 'lid']

// Z offset (scene units) applied to each layer when exploded.
// With group.rotation.x = +90°, local +Z = world -Y (down), so bottom gets
// a positive offset to push it down and lid gets negative to push it up.
const EXPLODE_OFFSETS = [30, 10, -10, -30]

export function loadModel(isMobile = false) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()

    loader.load(
      './models/stack-bottle.glb',
      (gltf) => {
        const group = gltf.scene

        // Scale down from real-world units to scene units — tweak this value
        group.scale.setScalar(isMobile ? 0.017 : 0.020)

        // Correct orientation: bottle is along Blender Y (→ Three.js Z), rotate to stand up
        group.rotation.x = THREE.MathUtils.degToRad(90)

        // Outer group handles the decorative tilt + idle Y rotation
        const outer = new THREE.Group()
        outer.rotation.z = THREE.MathUtils.degToRad(15)
        outer.rotation.x = THREE.MathUtils.degToRad(-8)
        outer.position.y = isMobile ? -0.6 : -1.45   // shift down — tweak this value
        outer.add(group)

        const sections = []

        LAYER_NAMES.forEach((name, i) => {
          let found = null
          group.traverse((child) => {
            if (!found && child.name.toLowerCase() === name) found = child
          })

          if (!found) {
            console.warn(`[STACK] Layer "${name}" not found in GLB — check object names in Blender.`)
            return
          }

          // restZ is the Object3D's actual local Z (the assembled rest position)
          // If all Blender origins are at 0,0,0 this is 0 for all — that's correct.
          // The explode offsets push each layer away from that rest position.
          found.userData.restZ         = found.position.z
          found.userData.explodeOffset = EXPLODE_OFFSETS[i]
          found.userData.layerName     = name

          found.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.userData.sectionRef = found
            }
          })

          sections.push(found)
        })

        resolve({ group: outer, sections })
      },
      undefined,
      reject
    )
  })
}
