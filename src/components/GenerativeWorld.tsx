import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PALETTE, seeded, type Artifact } from '../lib/experience'

type WorldProps = {
  saturation: number
  artifacts: Artifact[]
  stage: 'intro' | 'game' | 'praise' | 'reveal' | 'final'
  paused: boolean
}

type WorldApi = { updateArtifacts: (artifacts: Artifact[]) => void }

declare global {
  interface Window {
    __SCENE_READY__?: boolean
    __seek?: (time: number) => void
    __EIC_STATS__?: { calls: number; triangles: number; instances: number; fps: number }
  }
}

const MAX_INSTANCES = 1800
const palette = PALETTE.map((color) => new THREE.Color(color))

export function GenerativeWorld({ saturation, artifacts, stage, paused }: WorldProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<WorldApi | null>(null)
  const liveRef = useRef({ saturation, stage, paused })
  const artifactsRef = useRef(artifacts)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    liveRef.current = { saturation, stage, paused }
  }, [saturation, stage, paused])

  useEffect(() => {
    artifactsRef.current = artifacts
    apiRef.current?.updateArtifacts(artifacts)
  }, [artifacts])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      queueMicrotask(() => setFailed(true))
      window.__SCENE_READY__ = true
      return
    }

    const captureMode = new URLSearchParams(window.location.search).has('capture')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.domElement.setAttribute('aria-hidden', 'true')
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#080808')
    scene.fog = new THREE.FogExp2('#080808', 0.055)
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 1.1, 10)
    camera.lookAt(0, 0.35, 0)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = new RoomEnvironment()
    const envMap = pmrem.fromScene(environment, 0.04).texture
    scene.environment = envMap
    environment.dispose()
    pmrem.dispose()

    scene.add(new THREE.HemisphereLight('#e7f6ff', '#24091b', 2.1))
    const key = new THREE.DirectionalLight('#fff4df', 5)
    key.position.set(-4, 6, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight('#f33dba', 3)
    fill.position.set(5, 1, -3)
    scene.add(fill)
    const rim = new THREE.PointLight('#d9ff3f', 35, 16)
    rim.position.set(0, -2, 3)
    scene.add(rim)

    const sculpture = new THREE.Group()
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: '#f33dba', metalness: 0.12, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.1,
    })
    const core = new THREE.Mesh(new THREE.TorusKnotGeometry(1.45, 0.42, 160, 24, 2, 3), coreMaterial)
    core.rotation.set(0.65, 0.1, -0.25)
    sculpture.add(core)
    const pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: '#d9ff3f', metalness: 0.05, roughness: 0.12, clearcoat: 1,
    })
    const pearlGeometry = new THREE.IcosahedronGeometry(0.28, 2)
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2
      const pearl = new THREE.Mesh(pearlGeometry, i % 3 === 0 ? coreMaterial : pearlMaterial)
      pearl.position.set(Math.cos(angle) * 2.05, Math.sin(angle * 2) * 0.55, Math.sin(angle) * 1.25)
      pearl.scale.setScalar(0.65 + (i % 3) * 0.22)
      sculpture.add(pearl)
    }
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.018, 8, 160),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.42 }),
    )
    orbit.rotation.set(1.15, 0.25, 0.2)
    sculpture.add(orbit)
    scene.add(sculpture)

    const artifactGroup = new THREE.Group()
    scene.add(artifactGroup)
    const artifactGeometries = [
      new THREE.BoxGeometry(0.45, 1.6, 0.45),
      new THREE.IcosahedronGeometry(0.7, 0),
      new THREE.TorusGeometry(0.55, 0.16, 10, 32),
      new THREE.ConeGeometry(0.55, 1.25, 5),
      new THREE.OctahedronGeometry(0.7, 0),
      new THREE.BoxGeometry(1.1, 0.7, 0.22),
      new THREE.TorusKnotGeometry(0.42, 0.12, 48, 8),
      new THREE.CylinderGeometry(0.32, 0.65, 1.25, 6),
    ]

    const updateArtifacts = (items: Artifact[]) => {
      while (artifactGroup.children.length) {
        const child = artifactGroup.children[0]
        artifactGroup.remove(child)
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((material) => material.dispose())
        }
      }
      items.forEach((item, index) => {
        const angle = (index / 8) * Math.PI * 2 + 0.4
        const material = new THREE.MeshPhysicalMaterial({
          color: item.colors?.[0] || PALETTE[index % PALETTE.length],
          roughness: 0.24, metalness: 0.08, clearcoat: 0.8,
          transparent: true, opacity: 0.72,
        })
        const mesh = new THREE.Mesh(artifactGeometries[item.game % artifactGeometries.length], material)
        mesh.position.set(Math.cos(angle) * 4.4, Math.sin(angle * 1.7) * 2.1, -2.5 + Math.sin(angle) * 1.4)
        mesh.rotation.set(angle * 0.3, angle, angle * 0.15)
        const scoreScale = 0.72 + Math.min(0.5, item.score / 120)
        mesh.scale.setScalar(scoreScale)
        mesh.userData.phase = index * 0.8
        artifactGroup.add(mesh)
      })
    }
    apiRef.current = { updateArtifacts }
    updateArtifacts(artifactsRef.current)

    const crowdGeometry = new THREE.TetrahedronGeometry(0.14, 0)
    const crowdMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.82 })
    const crowd = new THREE.InstancedMesh(crowdGeometry, crowdMaterial, MAX_INSTANCES)
    crowd.instanceMatrix.setUsage(THREE.StaticDrawUsage)
    const random = seeded(84192)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < MAX_INSTANCES; i += 1) {
      const t = i / MAX_INSTANCES
      const angle = i * 2.399963 + random() * 0.25
      const radius = 3.8 + Math.pow(random(), 0.7) * 8.5
      dummy.position.set(Math.cos(angle) * radius, (random() - 0.5) * 9, -2 - random() * 12 + Math.sin(angle) * 2)
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI)
      const scale = 0.35 + random() * 1.7 + t * 0.4
      dummy.scale.set(scale, scale * (0.55 + random() * 1.4), scale)
      dummy.updateMatrix()
      crowd.setMatrixAt(i, dummy.matrix)
      crowd.setColorAt(i, palette[i % palette.length])
    }
    crowd.instanceMatrix.needsUpdate = true
    if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true
    crowd.count = 0
    scene.add(crowd)

    const ringGeometry = new THREE.TorusGeometry(5.8, 0.008, 4, 180)
    const ringMaterial = new THREE.MeshBasicMaterial({ color: '#d9ff3f', transparent: true, opacity: 0.1 })
    const rings = new THREE.Group()
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.set(Math.PI / 2 + i * 0.28, i * 0.5, 0)
      ring.scale.setScalar(1 + i * 0.35)
      rings.add(ring)
    }
    rings.position.z = -5
    scene.add(rings)

    const pointer = new THREE.Vector2()
    const onPointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const resize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', resize)

    let frame = 0
    let fps = 60
    let fpsTime = performance.now()
    let fpsFrames = 0
    let forcedTime: number | null = null
    const start = performance.now()

    const render = (time: number) => {
      const live = liveRef.current
      const sat = live.saturation / 100
      const isIntro = live.stage === 'intro'
      const isFinal = live.stage === 'final'
      const motion = reduceMotion ? 0.12 : 1
      sculpture.visible = isIntro || live.stage === 'reveal'
      sculpture.rotation.y = time * 0.16 * motion + pointer.x * 0.14
      sculpture.rotation.x = 0.08 + Math.sin(time * 0.35) * 0.08 * motion + pointer.y * 0.08
      const isNarrow = window.innerWidth < 700
      sculpture.position.y = (isNarrow ? 0.65 : 0) + Math.sin(time * 0.7) * 0.13 * motion
      const introScale = isNarrow ? 0.5 : 1
      sculpture.scale.setScalar(introScale * (live.stage === 'reveal' ? 0.8 : 1))
      artifactGroup.visible = !isIntro && !isFinal
      artifactGroup.children.forEach((child, index) => {
        child.rotation.y = time * (0.08 + index * 0.005) * motion + index
        child.position.y += Math.sin(time * 0.6 + index) * 0.0007 * motion
      })
      crowd.visible = !isFinal && live.stage !== 'reveal'
      crowd.count = Math.floor(MAX_INSTANCES * Math.pow(sat, 1.35))
      crowd.rotation.z = time * 0.006 * motion
      crowdMaterial.opacity = Math.max(0.12, 0.78 - sat * 0.25)
      rings.visible = !isFinal
      ringMaterial.opacity = 0.06 + sat * 0.08
      camera.position.x += ((isIntro ? pointer.x * 0.16 : 0) - camera.position.x) * 0.03
      camera.position.y += ((isIntro ? 1.1 - pointer.y * 0.12 : 1.1) - camera.position.y) * 0.03
      camera.lookAt(0, 0.35, 0)
      renderer.render(scene, camera)
      window.__EIC_STATS__ = {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        instances: crowd.count,
        fps: Math.round(fps),
      }
    }

    const loop = (now: number) => {
      fpsFrames += 1
      if (now - fpsTime > 500) {
        fps = (fpsFrames * 1000) / (now - fpsTime)
        fpsFrames = 0
        fpsTime = now
      }
      if (!liveRef.current.paused || captureMode) {
        const time = forcedTime ?? (now - start) / 1000
        render(time)
      }
      frame = requestAnimationFrame(loop)
    }

    window.__seek = (time: number) => {
      forcedTime = time
      render(time)
    }
    if (captureMode) {
      render(Number(new URLSearchParams(window.location.search).get('t') || 4))
      window.__SCENE_READY__ = true
    } else {
      frame = requestAnimationFrame(loop)
      window.__SCENE_READY__ = true
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      apiRef.current = null
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      envMap.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      window.__SCENE_READY__ = false
    }
  }, [])

  return (
    <div className={`world ${failed ? 'world--fallback' : ''}`} ref={mountRef} aria-hidden="true">
      {failed && <div className="fallback-sculpture"><span /><span /><span /></div>}
    </div>
  )
}
