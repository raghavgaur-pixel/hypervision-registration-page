import { useEffect, useRef } from 'react'

/**
 * Decorative 3D portal. Mobile devices and browsers without WebGL use a CSS
 * fallback, so the initial/mobile bundle does not download Three.js.
 */
export default function PortalScene({ variant = 'portal' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const small = window.matchMedia('(max-width: 700px)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const supportsWebGL = Boolean(window.WebGLRenderingContext || window.WebGL2RenderingContext)

    if (small || !supportsWebGL) {
      host.dataset.fallback = 'true'
      return undefined
    }

    let renderer
    let scene
    let frame = 0
    let observer
    let onPointerMove
    let disposed = false
    let pointerX = 0
    let pointerY = 0
    let time = 0

    const cleanup = () => {
      disposed = true
      if (frame) window.cancelAnimationFrame(frame)
      observer?.disconnect()
      if (onPointerMove) window.removeEventListener('pointermove', onPointerMove)
      if (scene) {
        scene.traverse((object) => {
          object.geometry?.dispose()
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            materials.forEach((material) => material.dispose())
          }
        })
      }
      renderer?.dispose()
      if (renderer?.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }

    // Import only on capable desktop browsers. The CSS fallback remains crisp
    // and lightweight for smaller screens and when a GPU/context is unavailable.
    import('three').then((THREE) => {
      if (disposed) return

      scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
      camera.position.set(0, 0, 9.5)
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      host.appendChild(renderer.domElement)

      const portal = new THREE.Group()
      scene.add(portal)
      const celebration = variant === 'celebration'
      portal.scale.setScalar(celebration ? 1.04 : 0.94)
      portal.position.set(celebration ? 0 : 0.72, celebration ? 0.02 : -0.05, 0)

      const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x17162c,
        metalness: 0.82,
        roughness: 0.21,
        clearcoat: 1,
        clearcoatRoughness: 0.13,
        emissive: 0x3422a0,
        emissiveIntensity: 0.55,
      })
      const core = new THREE.Mesh(new THREE.SphereGeometry(1.12, 48, 36), coreMaterial)
      portal.add(core)

      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(1.19, 24, 20),
        new THREE.MeshBasicMaterial({ color: 0x9b88ff, wireframe: true, transparent: true, opacity: 0.14 }),
      )
      portal.add(shell)

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(1.38, 32, 24),
        new THREE.MeshBasicMaterial({
          color: 0x8e7cff,
          transparent: true,
          opacity: 0.1,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      portal.add(halo)

      const rings = []
      const ringSpecs = [
        { radius: 1.58, tube: 0.018, color: 0xa99aff, rotation: [0.28, 0.18, 0.05], speed: 0.13 },
        { radius: 1.88, tube: 0.009, color: 0x83e7ed, rotation: [1.11, 0.27, 0.44], speed: -0.09 },
        { radius: 2.08, tube: 0.006, color: 0xf4d9a0, rotation: [0.46, 1.18, -0.25], speed: 0.055 },
      ]
      ringSpecs.forEach((spec, index) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(spec.radius, spec.tube, 8, 160),
          new THREE.MeshBasicMaterial({
            color: spec.color,
            transparent: true,
            opacity: index === 0 ? 0.75 : 0.52,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        )
        ring.rotation.set(spec.rotation[0], spec.rotation[1], spec.rotation[2])
        ring.userData.speed = spec.speed
        portal.add(ring)
        rings.push(ring)
      })

      const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.74, 0.012, 8, 112),
        new THREE.MeshBasicMaterial({ color: 0x72e7e2, transparent: true, opacity: 0.64, blending: THREE.AdditiveBlending }),
      )
      innerRing.rotation.set(1.28, 0.45, 0.1)
      portal.add(innerRing)

      const beads = new THREE.Group()
      const beadGeometry = new THREE.SphereGeometry(0.035, 10, 8)
      const beadMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xc3b8ff }),
        new THREE.MeshBasicMaterial({ color: 0x82f0dc }),
        new THREE.MeshBasicMaterial({ color: 0xf7dba3 }),
      ]
      for (let index = 0; index < 9; index += 1) {
        const angle = (index / 9) * Math.PI * 2
        const bead = new THREE.Mesh(beadGeometry, beadMaterials[index % beadMaterials.length])
        bead.position.set(Math.cos(angle) * 1.58, Math.sin(angle) * 1.58, (index % 3 - 1) * 0.17)
        beads.add(bead)
      }
      portal.add(beads)

      const particleCount = 260
      const positions = new Float32Array(particleCount * 3)
      for (let index = 0; index < particleCount; index += 1) {
        positions[index * 3] = (Math.random() - 0.5) * 15
        positions[index * 3 + 1] = (Math.random() - 0.5) * 10
        positions[index * 3 + 2] = (Math.random() - 0.5) * 6 - 1.5
      }
      const starGeometry = new THREE.BufferGeometry()
      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const stars = new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({
          color: celebration ? 0xd0c5ff : 0xaaa9ec,
          size: 0.028,
          transparent: true,
          opacity: 0.62,
          sizeAttenuation: true,
          depthWrite: false,
        }),
      )
      scene.add(stars)

      scene.add(new THREE.AmbientLight(0xa4a0ff, 1.4))
      const keyLight = new THREE.PointLight(0x9d83ff, 27, 11)
      keyLight.position.set(-2.4, 2.5, 3)
      scene.add(keyLight)
      const rimLight = new THREE.PointLight(0x7af0df, 22, 9)
      rimLight.position.set(2.2, -1.4, 2)
      scene.add(rimLight)

      const resize = () => {
        if (disposed || !renderer) return
        const width = Math.max(host.clientWidth, 1)
        const height = Math.max(host.clientHeight, 1)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.position.z = width < 500 ? 10.6 : 9.5
        camera.updateProjectionMatrix()
        portal.position.x = celebration ? 0 : width < 950 ? 0.25 : 0.72
        renderer.render(scene, camera)
      }

      onPointerMove = (event) => {
        if (reducedMotion) return
        pointerX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 0.13
        pointerY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 0.1
      }
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      observer = new ResizeObserver(resize)
      observer.observe(host)
      resize()

      const animate = () => {
        if (disposed || !renderer) return
        frame = window.requestAnimationFrame(animate)
        time += 0.0045
        if (!reducedMotion) {
          portal.rotation.y += 0.0017
          portal.rotation.x += 0.0004
          portal.rotation.y += (pointerX - portal.rotation.y * 0.08) * 0.004
          portal.rotation.x += (pointerY - portal.rotation.x * 0.08) * 0.004
          core.rotation.y -= 0.0013
          shell.rotation.y += 0.001
          shell.rotation.x -= 0.0006
          rings.forEach((ring) => { ring.rotation.z += ring.userData.speed * 0.006 })
          beads.rotation.z -= 0.003
          innerRing.rotation.z += 0.0018
          halo.scale.setScalar(1 + Math.sin(time * 3) * 0.018)
          stars.rotation.y += 0.00012
        }
        renderer.render(scene, camera)
      }
      frame = window.requestAnimationFrame(animate)
    }).catch(() => {
      if (!disposed) host.dataset.fallback = 'true'
    })

    return cleanup
  }, [variant])

  return <div className={'portal-scene portal-scene-' + variant} ref={hostRef} aria-hidden="true" />
}
