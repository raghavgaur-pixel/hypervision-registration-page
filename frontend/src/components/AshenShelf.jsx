import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowRight, Orbit, Sparkles } from 'lucide-react'
import './AshenShelf.css'

const VOLUMES = [
  { id: 'register', title: 'Register', meta: 'VOLUME I / A NEW IDENTITY', description: 'Begin a new chapter. Create your Hypervision identity and step beyond the familiar.', cta: 'Create an identity', authMode: 'signup', cloth: '#17121b', foil: '#d4b27e', accent: '#7c5d8c', baseX: -0.66 },
  { id: 'login', title: 'Login', meta: 'VOLUME II / RETURNING EXPLORER', description: 'Your place in the archive remains. Open the book and return to your own corner of Hypervision.', cta: 'Return to Hypervision', authMode: 'login', cloth: '#10171a', foil: '#b7c6c4', accent: '#536f75', baseX: 0.66 },
]
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const damp = (current, target, smoothing, delta) => current + (target - current) * (1 - Math.exp(-smoothing * delta))

function textureFromCanvas(THREE, canvas, repeat) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  if (repeat) texture.repeat.set(repeat[0], repeat[1])
  return texture
}

function paintCloth(THREE, color) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 2) {
    ctx.fillStyle = y % 4 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.09)'
    ctx.fillRect(0, y, 128, 1)
  }
  for (let x = 0; x < 128; x += 2) {
    ctx.fillStyle = x % 4 ? 'rgba(255,255,255,.028)' : 'rgba(0,0,0,.085)'
    ctx.fillRect(x, 0, 1, 128)
  }
  return textureFromCanvas(THREE, canvas, [3, 4])
}

function paintCover(THREE, volume) {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 900
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, 600, 900)
  bg.addColorStop(0, volume.cloth)
  bg.addColorStop(0.54, '#0b0c10')
  bg.addColorStop(1, volume.cloth)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 600, 900)
  const glow = ctx.createRadialGradient(300, 330, 5, 300, 330, 360)
  glow.addColorStop(0, volume.accent + '55')
  glow.addColorStop(1, volume.accent + '00')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 600, 900)

  let seed = volume.id === 'register' ? 73 : 109
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let i = 0; i < 8000; i += 1) {
    const alpha = random() * 0.13
    ctx.fillStyle = random() > 0.5 ? 'rgba(255,245,224,' + alpha + ')' : 'rgba(0,0,0,' + alpha + ')'
    ctx.fillRect(random() * 600, random() * 900, 1, 1)
  }

  ctx.strokeStyle = volume.foil + '9c'
  ctx.lineWidth = 1.4
  ctx.strokeRect(28, 28, 544, 844)
  ctx.strokeStyle = volume.foil + '52'
  ctx.lineWidth = 1
  ctx.strokeRect(39, 39, 522, 822)
  ctx.save()
  ctx.translate(300, 290)
  ctx.strokeStyle = volume.foil + 'c8'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath()
    ctx.ellipse(0, 0, 82 + i * 20, 126 + i * 13, (i - 1.5) * 0.24, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.strokeStyle = volume.foil + '55'
  ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = volume.foil
  ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.fillStyle = volume.foil + 'd9'
  ctx.font = '500 18px ui-monospace, monospace'
  ctx.fillText('H Y P E R V I S I O N', 300, 98)
  ctx.fillStyle = volume.foil
  ctx.font = '500 61px Georgia, serif'
  ctx.fillText(volume.title.toUpperCase(), 300, 553)
  ctx.fillStyle = volume.foil + 'c5'
  ctx.font = '400 17px ui-monospace, monospace'
  ctx.fillText(volume.id === 'register' ? 'CREATE AN IDENTITY' : 'RETURN TO YOUR ORBIT', 300, 596)
  ctx.strokeStyle = volume.foil + 'a0'
  ctx.beginPath(); ctx.moveTo(170, 635); ctx.lineTo(430, 635); ctx.stroke()
  ctx.fillStyle = volume.foil + 'ab'
  ctx.font = '400 14px Georgia, serif'
  ctx.fillText(volume.id === 'register' ? 'A study in beginnings' : 'A study in return', 300, 673)
  ctx.font = '400 12px ui-monospace, monospace'
  ctx.fillText(volume.id === 'register' ? 'VOL. I   /   OPEN HERE' : 'VOL. II   /   CONTINUE', 300, 810)
  return textureFromCanvas(THREE, canvas)
}


function paintPage(THREE, volume) {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1400
  const ctx = canvas.getContext('2d')
  const base = document.createElement('canvas')
  base.width = canvas.width
  base.height = canvas.height
  const paper = base.getContext('2d')

  const parchment = paper.createLinearGradient(40, 0, 870, 1400)
  parchment.addColorStop(0, '#f5ecd8')
  parchment.addColorStop(0.48, '#e9dcc2')
  parchment.addColorStop(1, '#d6c19d')
  paper.fillStyle = parchment
  paper.fillRect(0, 0, 900, 1400)

  const bloom = paper.createRadialGradient(470, 420, 30, 470, 420, 850)
  bloom.addColorStop(0, 'rgba(255,252,238,.42)')
  bloom.addColorStop(1, 'rgba(123,83,43,.08)')
  paper.fillStyle = bloom
  paper.fillRect(0, 0, 900, 1400)

  let seed = volume.id === 'register' ? 319 : 811
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let i = 0; i < 1900; i += 1) {
    const alpha = random() * 0.075
    paper.fillStyle = random() > 0.5 ? 'rgba(111,76,43,' + alpha + ')' : 'rgba(255,255,247,' + alpha + ')'
    paper.fillRect(random() * 900, random() * 1400, 1 + random() * 2, 1 + random() * 2)
  }

  paper.strokeStyle = 'rgba(130,94,53,.33)'
  paper.lineWidth = 2
  paper.strokeRect(43, 43, 814, 1314)
  paper.strokeStyle = 'rgba(130,94,53,.18)'
  paper.lineWidth = 1
  paper.strokeRect(54, 54, 792, 1292)

  paper.fillStyle = '#765937'
  paper.font = '500 18px ui-monospace, monospace'
  paper.textAlign = 'left'
  paper.fillText('H Y P E R V I S I O N', 102, 103)
  paper.textAlign = 'right'
  paper.fillStyle = 'rgba(118,89,55,.78)'
  paper.font = '400 15px ui-monospace, monospace'
  paper.fillText(volume.id === 'register' ? 'FOLIO 01' : 'FOLIO 02', 798, 103)

  paper.strokeStyle = 'rgba(153,112,65,.6)'
  paper.lineWidth = 1.5
  paper.beginPath()
  paper.moveTo(102, 142)
  paper.lineTo(798, 142)
  paper.stroke()

  paper.strokeStyle = 'rgba(153,112,65,.5)'
  paper.lineWidth = 2
  paper.beginPath()
  paper.arc(750, 205, 28, 0, Math.PI * 2)
  paper.stroke()
  paper.beginPath()
  paper.arc(750, 205, 19, 0, Math.PI * 2)
  paper.stroke()
  paper.fillStyle = '#9b774e'
  paper.beginPath()
  paper.arc(750, 205, 3, 0, Math.PI * 2)
  paper.fill()

  const glyphs = []
  let sequence = 0
  const ink = '#30251c'
  const goldInk = '#89663c'
  const addLine = (text, x, y, font, color) => {
    ctx.font = font
    let cursorX = x
    for (const char of text) {
      const width = ctx.measureText(char).width
      glyphs.push({ char, x: cursorX, y, font, color, index: sequence, drift: Math.sin(sequence * 17.17) * 19, angle: Math.sin(sequence * 6.17) * 0.13 })
      cursorX += width
      sequence += 1
    }
  }
  const addWrapped = (text, x, y, maxWidth, font, lineHeight, color) => {
    ctx.font = font
    const words = text.split(/\s+/)
    let line = ''
    let lineY = y
    for (const word of words) {
      const attempt = line ? line + ' ' + word : word
      if (line && ctx.measureText(attempt).width > maxWidth) {
        addLine(line, x, lineY, font, color)
        line = word
        lineY += lineHeight
      } else {
        line = attempt
      }
    }
    if (line) addLine(line, x, lineY, font, color)
    return lineY + lineHeight
  }

  addLine(
    volume.id === 'register' ? 'VOLUME I  /  A NEW IDENTITY' : 'VOLUME II  /  RETURNING EXPLORER',
    104, 231, '500 17px ui-monospace, monospace', goldInk,
  )
  addLine(volume.id === 'register' ? 'Every identity' : 'Some stories', 102, 352, '400 75px Georgia, serif', ink)
  addLine(volume.id === 'register' ? 'begins somewhere.' : 'are waiting still.', 102, 438, 'italic 68px Georgia, serif', goldInk)

  const firstParagraph = volume.id === 'register'
    ? 'Every identity begins as an unwritten page. Here, the unfamiliar becomes possibility, and a name becomes the first mark in a world still waiting to be discovered.'
    : 'Some stories are not finished; they are merely waiting to be continued. Every return is a small act of remembrance, every familiar threshold an invitation to begin once more.'
  const secondParagraph = volume.id === 'register'
    ? 'Step beyond the ordinary. The archive remembers only what you choose to write.'
    : 'Your place in the archive remains. Turn the page, and continue.'
  const quote = volume.id === 'register'
    ? 'Begin where the page is blank.'
    : 'Nothing true is ever entirely lost.'

  let nextY = addWrapped(firstParagraph, 104, 594, 692, '400 28px Georgia, serif', 47, ink)
  nextY = Math.max(nextY + 48, 824)
  nextY = addWrapped(secondParagraph, 104, nextY, 692, '400 28px Georgia, serif', 47, ink)
  addLine('“' + quote + '”', 104, 1080, 'italic 30px Georgia, serif', goldInk)

  paper.strokeStyle = 'rgba(153,112,65,.58)'
  paper.lineWidth = 1.5
  paper.beginPath()
  paper.moveTo(102, 1214)
  paper.lineTo(798, 1214)
  paper.stroke()
  paper.textAlign = 'left'
  paper.font = '400 14px ui-monospace, monospace'
  paper.fillStyle = 'rgba(85,64,43,.76)'
  paper.fillText('THE IDENTITY ARCHIVE', 104, 1253)
  paper.textAlign = 'right'
  paper.fillText(volume.id === 'register' ? 'VOL. I  /  BEGIN' : 'VOL. II  /  RETURN', 798, 1253)
  paper.textAlign = 'left'

  const texture = textureFromCanvas(THREE, canvas)
  const interval = 19
  const fallDuration = 440
  const duration = Math.max(0, sequence - 1) * interval + fallDuration + 80

  const drawAt = (elapsed, complete = false) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(base, 0, 0)
    for (const glyph of glyphs) {
      const raw = complete ? 1 : (elapsed - glyph.index * interval) / fallDuration
      if (raw < 0) continue
      const progress = Math.min(raw, 1)
      const eased = 1 - Math.pow(1 - progress, 2.45)
      const fromY = 100 + (glyph.index % 8) * 17
      const x = glyph.x + glyph.drift * (1 - eased)
      const y = fromY + (glyph.y - fromY) * eased
      const angle = glyph.angle * (1 - eased)
      ctx.save()
      ctx.globalAlpha = Math.min(1, progress * 1.8)
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.font = glyph.font
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = glyph.color
      ctx.fillText(glyph.char, 0, 0)
      ctx.restore()
    }
    texture.needsUpdate = true
  }

  drawAt(0, true)
  return { texture, drawAt, duration }
}

function paintWood(THREE) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 512)
  gradient.addColorStop(0, '#35271b')
  gradient.addColorStop(0.45, '#21170f')
  gradient.addColorStop(1, '#120e0a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1024, 512)
  for (let i = 0; i < 460; i += 1) {
    const y = Math.random() * 512
    const x = Math.random() * 1024
    const rgb = i % 3 ? '169,119,69' : '0,0,0'
    const alpha = Math.random() * 0.12 + 0.018
    ctx.strokeStyle = 'rgba(' + rgb + ',' + alpha + ')'
    ctx.lineWidth = Math.random() * 1.7 + 0.2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + 90, y - 9, x + 180, y + 8, x + 300, y + (Math.random() - 0.5) * 6)
    ctx.stroke()
  }
  for (let ring = 0; ring < 5; ring += 1) {
    ctx.strokeStyle = 'rgba(167,119,76,' + (0.025 + ring * 0.004) + ')'
    ctx.beginPath()
    ctx.ellipse(250, 240, 24 + ring * 20, 8 + ring * 7, 0.1, 0, Math.PI * 2)
    ctx.stroke()
  }
  return textureFromCanvas(THREE, canvas, [2, 1])
}

function paintWall(THREE) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#090a0e'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 1700; i += 1) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const alpha = Math.random() * 0.045
    ctx.fillStyle = i % 3 ? 'rgba(185,164,139,' + alpha + ')' : 'rgba(122,123,151,' + alpha + ')'
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2)
  }
  ctx.strokeStyle = 'rgba(215,185,139,.045)'
  for (let y = 24; y < 512; y += 34) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke()
  }
  return textureFromCanvas(THREE, canvas, [3, 2])
}

function wovenMaterial(THREE, map, roughness = 0.7) {
  const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map, roughness, metalness: 0.08, clearcoat: 0.16, clearcoatRoughness: 0.68 })
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nfloat hvWeave(vec2 p) { return sin(p.x * 760.0) * sin(p.y * 940.0); }')
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat weave = hvWeave(vMapUv) * 0.018; diffuseColor.rgb *= 0.985 + weave;')
  }
  material.customProgramCacheKey = () => 'hypervision-ashen-weave-r1'
  return material
}

export default function AshenShelf({ onChoose, renderAuthPanel, initialAuthMode = null, activeAuthMode = null }) {
  const hostRef = useRef(null)
  const chooseRef = useRef(onChoose)
  const selectedRef = useRef(null)
  const hoveredRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [fallback, setFallback] = useState(false)
  const [authOpen, setAuthOpen] = useState(Boolean(initialAuthMode))
  const authOpenRef = useRef(Boolean(initialAuthMode))
  authOpenRef.current = authOpen
  chooseRef.current = onChoose

  const selectVolume = (id) => {
    selectedRef.current = id
    setSelected(id)
    setAuthOpen(false)
  }
  const openAuth = (mode) => {
    const id = mode === 'login' ? 'login' : 'register'
    selectedRef.current = id
    setSelected(id)
    setAuthOpen(true)
    chooseRef.current?.(mode)
  }
  const closeDetails = () => {
    if (authOpen) {
      setAuthOpen(false)
      return
    }
    selectedRef.current = null
    setSelected(null)
  }
  useEffect(() => {
    if (!initialAuthMode) return
    const id = ['login', 'reset', 'update-password'].includes(initialAuthMode) ? 'login' : initialAuthMode === 'signup' ? 'register' : null
    if (id) { selectedRef.current = id; setSelected(id) }
    setAuthOpen(true)
  }, [initialAuthMode])
  const selectedVolume = VOLUMES.find((volume) => volume.id === selected)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let renderer, scene, camera, observer, frame = 0, ray, pointer, roomGroup, dust
    let disposed = false
    let books = []
    let lastTime = 0
    let pointerX = 0
    let pointerY = 0
    let pointerDown = null
    let dragging = null
    let lastPointer = null
    let removeListeners = () => {}
    const geometries = []
    const materials = []
    const textures = []
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rememberGeometry = (item) => (geometries.push(item), item)
    const rememberMaterial = (item) => (materials.push(item), item)
    const rememberTexture = (item) => (textures.push(item), item)

    const hitBook = (event) => {
      if (!renderer || !camera || !ray || !pointer) return null
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      ray.setFromCamera(pointer, camera)
      const hits = ray.intersectObjects(books.map((book) => book.root), true)
      for (const hit of hits) {
        let current = hit.object
        while (current) {
          if (current.userData && current.userData.bookId) return current.userData.bookId
          current = current.parent
        }
      }
      return null
    }

    import('three').then((THREE) => {
      if (disposed) return
      scene = new THREE.Scene()
      scene.background = new THREE.Color('#07080b')
      scene.fog = new THREE.Fog('#07080b', 7, 15)
      camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40)
      camera.position.set(0, 0.16, 5.55)
      camera.lookAt(0, -0.02, 0)
      try {
        renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' })
      } catch {
        if (!disposed) setFallback(true)
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setClearColor('#07080b', 1)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.16
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      host.appendChild(renderer.domElement)
      ray = new THREE.Raycaster()
      pointer = new THREE.Vector2()
      roomGroup = new THREE.Group()
      scene.add(roomGroup)

      const wallTexture = rememberTexture(paintWall(THREE))
      const wall = new THREE.Mesh(
        rememberGeometry(new THREE.PlaneGeometry(16, 8)),
        rememberMaterial(new THREE.MeshStandardMaterial({ map: wallTexture, color: 0x9a99a0, roughness: 0.96 })),
      )
      wall.position.set(0, 1.12, -2.15)
      roomGroup.add(wall)
      const panelMat = rememberMaterial(new THREE.MeshStandardMaterial({ color: 0x0d0e13, roughness: 0.9, metalness: 0.05 }))
      const trimMat = rememberMaterial(new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.6, metalness: 0.18 }))
      for (const x of [-3.5, -2.25, 2.25, 3.5]) {
        const trim = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(0.025, 4.2, 0.04)), trimMat)
        trim.position.set(x, 0.85, -1.99)
        roomGroup.add(trim)
      }
      for (const x of [-2.86, 2.86]) {
        const inset = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(1.15, 3.6, 0.07)), panelMat)
        inset.position.set(x, 0.86, -2.04)
        roomGroup.add(inset)
      }

      const woodTexture = rememberTexture(paintWood(THREE))
      const woodMat = rememberMaterial(new THREE.MeshPhysicalMaterial({
        map: woodTexture, color: 0xffffff, roughness: 0.31, metalness: 0.07, clearcoat: 0.82, clearcoatRoughness: 0.19,
      }))
      const darkWoodMat = rememberMaterial(new THREE.MeshPhysicalMaterial({
        map: woodTexture, color: 0x8e8d90, roughness: 0.42, metalness: 0.03, clearcoat: 0.36,
      }))
      const shelf = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(4.82, 0.18, 0.88)), [woodMat, woodMat, woodMat, darkWoodMat, woodMat, darkWoodMat])
      shelf.position.set(0.14, -0.78, 0.02)
      shelf.castShadow = true
      shelf.receiveShadow = true
      roomGroup.add(shelf)
      for (const x of [-2.12, 2.4]) {
        const support = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(0.17, 1.18, 0.72)), darkWoodMat)
        support.position.set(x, -1.31, -0.01)
        support.castShadow = true
        support.receiveShadow = true
        roomGroup.add(support)
      }
      const floor = new THREE.Mesh(
        rememberGeometry(new THREE.PlaneGeometry(18, 14)),
        rememberMaterial(new THREE.MeshPhysicalMaterial({ map: woodTexture, color: 0x858184, roughness: 0.47, metalness: 0.04, clearcoat: 0.34 })),
      )
      floor.rotation.x = -Math.PI / 2
      floor.position.set(0, -1.91, -1)
      floor.receiveShadow = true
      roomGroup.add(floor)

      scene.add(new THREE.AmbientLight(0x777789, 0.76))
      const warmKey = new THREE.SpotLight(0xe0b77f, 155, 12, Math.PI / 4.2, 0.72, 1.2)
      warmKey.position.set(-1.65, 3.3, 2.6)
      warmKey.target.position.set(0.2, -0.12, 0)
      warmKey.castShadow = true
      warmKey.shadow.mapSize.set(1024, 1024)
      warmKey.shadow.bias = -0.00015
      scene.add(warmKey, warmKey.target)
      const rim = new THREE.PointLight(0x8273aa, 30, 8, 2)
      rim.position.set(2.8, 1.5, -0.7)
      scene.add(rim)
      const bounce = new THREE.PointLight(0xd5a36e, 15, 6, 2)
      bounce.position.set(0.1, -0.4, 2.7)
      scene.add(bounce)

      const dustCount = 170
      const dustPositions = new Float32Array(dustCount * 3)
      for (let i = 0; i < dustCount; i += 1) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 7.5
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 3.6
        dustPositions[i * 3 + 2] = -0.8 + Math.random() * 2.2
      }
      const dustGeometry = rememberGeometry(new THREE.BufferGeometry())
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
      dust = new THREE.Points(dustGeometry, rememberMaterial(new THREE.PointsMaterial({ color: 0xd5bd96, size: 0.018, transparent: true, opacity: 0.38, depthWrite: false })))
      scene.add(dust)

      const W = 0.92
      const H = 1.47
      const D = 0.19
      const pageEdgeMat = rememberMaterial(new THREE.MeshStandardMaterial({ color: 0xc8bba5, roughness: 0.92 }))

      books = VOLUMES.map((volume, index) => {
        const page = paintPage(THREE, volume)
        rememberTexture(page.texture)
        const pageMat = rememberMaterial(new THREE.MeshStandardMaterial({ map: page.texture, color: 0xffffff, roughness: 0.92 }))
        const root = new THREE.Group()
        root.userData.bookId = volume.id
        root.position.set(volume.baseX, -0.68, 0.08)
        root.rotation.y = index === 0 ? -0.045 : 0.045
        root.rotation.z = index === 0 ? -0.012 : 0.012
        roomGroup.add(root)
        const body = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(W - 0.06, H - 0.05, D - 0.04)), [
          pageEdgeMat, pageEdgeMat, pageEdgeMat, pageEdgeMat, pageMat, pageEdgeMat,
        ])
        body.position.set(0.018, H / 2, 0)
        body.castShadow = true
        body.receiveShadow = true
        root.add(body)

        const clothTexture = rememberTexture(paintCloth(THREE, volume.cloth))
        const clothMat = rememberMaterial(wovenMaterial(THREE, clothTexture))
        const spine = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(0.095, H, D + 0.012)), clothMat)
        spine.position.set(-W / 2 + 0.046, H / 2, 0)
        spine.castShadow = true
        root.add(spine)
        const back = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(W, H, 0.04)), clothMat)
        back.position.set(0, H / 2, -D / 2 + 0.003)
        root.add(back)

        const coverTexture = rememberTexture(paintCover(THREE, volume))
        const coverMat = rememberMaterial(new THREE.MeshPhysicalMaterial({ map: coverTexture, roughness: 0.38, metalness: 0.12, clearcoat: 0.6, clearcoatRoughness: 0.29 }))
        coverMat.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nfloat hvCoverGrain(vec2 p) { return sin(p.x * 670.0) * sin(p.y * 830.0); }')
          shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat hvGrain = hvCoverGrain(vMapUv) * 0.012; diffuseColor.rgb *= 0.99 + hvGrain;')
        }
        coverMat.customProgramCacheKey = () => 'hypervision-ashen-cover-r1'
        const hinge = new THREE.Group()
        hinge.position.set(-W / 2 + 0.035, H / 2, D / 2 + 0.016)
        hinge.userData.bookId = volume.id
        root.add(hinge)
        const cover = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(W - 0.04, H, 0.045)), [clothMat, clothMat, clothMat, clothMat, coverMat, clothMat])
        cover.position.set((W - 0.04) / 2, 0, 0)
        cover.castShadow = true
        cover.receiveShadow = true
        hinge.add(cover)

        const giltMat = rememberMaterial(new THREE.MeshStandardMaterial({ color: volume.foil, metalness: 0.78, roughness: 0.28, emissive: volume.foil, emissiveIntensity: 0.08 }))
        for (const y of [0.16, 0.21, H - 0.22, H - 0.17]) {
          const gilt = new THREE.Mesh(rememberGeometry(new THREE.BoxGeometry(0.071, 0.009, D + 0.015)), giltMat)
          gilt.position.set(-W / 2 + 0.046, y, 0)
          root.add(gilt)
        }
        const seal = new THREE.Mesh(
          rememberGeometry(new THREE.TorusGeometry(0.105, 0.006, 8, 64)),
          rememberMaterial(new THREE.MeshStandardMaterial({ color: volume.foil, metalness: 0.62, roughness: 0.3 })),
        )
        seal.position.set(W / 2 - 0.19, H - 0.21, D / 2 + 0.043)
        root.add(seal)
        root.traverse((object) => { if (object.isMesh) object.userData.bookId = volume.id })
        return { ...volume, root, hinge, page, pageAnimating: false, pageRevealStart: 0, baseX: volume.baseX, baseY: -0.68, baseZ: 0.08, baseRot: index === 0 ? -0.045 : 0.045, dragYaw: 0, dragPitch: 0, flipped: false }
      })

      const resize = () => {
        if (disposed || !renderer || !camera) return
        const width = Math.max(host.clientWidth, 1)
        const height = Math.max(host.clientHeight, 1)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.position.z = width < 560 ? 9.3 : width < 850 ? 6.35 : 5.55
        camera.position.y = width < 560 ? 0.04 : 0.16
        camera.lookAt(width < 560 ? 0 : 0.05, -0.05, 0)
        camera.updateProjectionMatrix()
      }
      const onPointerMove = (event) => {
        const rect = host.getBoundingClientRect()
        pointerX = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2
        pointerY = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2
        if (dragging) {
          const dx = event.clientX - lastPointer.x
          const dy = event.clientY - lastPointer.y
          lastPointer = { x: event.clientX, y: event.clientY }
          dragging.moved += Math.abs(dx) + Math.abs(dy)
          dragging.book.dragYaw += dx * 0.007
          dragging.book.dragPitch = clamp(dragging.book.dragPitch - dy * 0.004, -0.3, 0.3)
          renderer.domElement.style.cursor = 'grabbing'
          return
        }
        const hit = hitBook(event)
        if (hoveredRef.current !== hit) {
          hoveredRef.current = hit
          setHovered(hit)
        }
        renderer.domElement.style.cursor = hit ? (selectedRef.current === hit ? 'grab' : 'pointer') : 'default'
      }
      const onPointerDown = (event) => {
        if (event.button !== undefined && event.button !== 0) return
        const hit = hitBook(event)
        pointerDown = { id: hit, x: event.clientX, y: event.clientY }
        if (hit && selectedRef.current === hit) {
          const book = books.find((item) => item.id === hit)
          if (book) {
            dragging = { book, moved: 0 }
            lastPointer = { x: event.clientX, y: event.clientY }
            renderer.domElement.setPointerCapture?.(event.pointerId)
          }
        }
      }
      const onPointerUp = (event) => {
        if (!pointerDown) return
        const down = pointerDown
        pointerDown = null
        const hit = hitBook(event) || down.id
        if (dragging) {
          const currentDrag = dragging
          dragging = null
          try { renderer.domElement.releasePointerCapture?.(event.pointerId) } catch {}
          if (currentDrag.moved < 9 && selectedRef.current === currentDrag.book.id) {
            currentDrag.book.flipped = !currentDrag.book.flipped
            if (currentDrag.book.flipped) {
              currentDrag.book.pageAnimating = !reducedMotion
              currentDrag.book.pageRevealStart = performance.now()
              currentDrag.book.page.drawAt(0, reducedMotion)
            } else {
              currentDrag.book.pageAnimating = false
            }
          }
          return
        }
        if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 10) return
        if (hit && selectedRef.current !== hit) {
          selectedRef.current = hit
          setSelected(hit)
          setAuthOpen(false)
        }
      }
      const onPointerLeave = () => {
        if (!dragging && hoveredRef.current !== null) {
          hoveredRef.current = null
          setHovered(null)
        }
      }
      const onKeyDown = (event) => {
        if (event.key === 'Escape' && authOpenRef.current) {
          setAuthOpen(false)
          return
        }
        if (event.key === 'Escape' && selectedRef.current) {
          selectedRef.current = null
          setSelected(null)
        }
      }
      host.addEventListener('pointermove', onPointerMove)
      host.addEventListener('pointerdown', onPointerDown)
      host.addEventListener('pointerup', onPointerUp)
      host.addEventListener('pointerleave', onPointerLeave)
      window.addEventListener('keydown', onKeyDown)
      removeListeners = () => {
        host.removeEventListener('pointermove', onPointerMove)
        host.removeEventListener('pointerdown', onPointerDown)
        host.removeEventListener('pointerup', onPointerUp)
        host.removeEventListener('pointerleave', onPointerLeave)
        window.removeEventListener('keydown', onKeyDown)
      }
      observer = new ResizeObserver(resize)
      observer.observe(host)
      resize()

      const animate = (now) => {
        if (disposed || !renderer) return
        frame = window.requestAnimationFrame(animate)
        const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016
        lastTime = now
        const chosen = selectedRef.current
        for (const book of books) {
          const isChosen = chosen === book.id
          const isHovered = hoveredRef.current === book.id
          const compact = host.clientWidth < 600
          const targetX = chosen
            ? compact
              ? isChosen ? 0.2 : -0.45
              : isChosen ? 0.86 : -1.12
            : book.baseX
          const targetY = book.baseY + (isHovered ? 0.065 : 0) + (isChosen ? 0.055 : 0)
          const targetZ = book.baseZ + (isChosen ? (compact ? 0.28 : 0.43) : isHovered ? 0.08 : 0)
          const targetScale = isChosen ? (compact ? 1.04 : 1.08) : isHovered ? 1.035 : 1
          book.root.position.x = damp(book.root.position.x, targetX, 5.5, delta)
          book.root.position.y = damp(book.root.position.y, targetY, 5.5, delta)
          book.root.position.z = damp(book.root.position.z, targetZ, 5.5, delta)
          const sway = reducedMotion ? 0 : Math.sin(now * 0.00045 + (book.id === 'login' ? 1.6 : 0)) * 0.007
          book.root.rotation.y = damp(book.root.rotation.y, book.baseRot + book.dragYaw + sway + (isHovered ? pointerX * 0.045 : 0), 5.5, delta)
          book.root.rotation.x = damp(book.root.rotation.x, book.dragPitch + (isHovered && !reducedMotion ? pointerY * -0.018 : 0), 5.5, delta)
          const openAngle = isChosen && book.flipped ? -Math.PI * 0.76 : 0
          book.hinge.rotation.y = damp(book.hinge.rotation.y, openAngle, 5.5, delta)
          if (book.flipped && book.pageAnimating) {
            const elapsed = now - book.pageRevealStart
            book.page.drawAt(elapsed)
            if (elapsed >= book.page.duration) book.pageAnimating = false
          }
          book.root.scale.setScalar(damp(book.root.scale.x, targetScale, 5.5, delta))
        }
        if (!reducedMotion) {
          roomGroup.rotation.y = damp(roomGroup.rotation.y, pointerX * 0.012, 1.2, delta)
          if (dust) { dust.rotation.y += 0.00012; dust.rotation.x = Math.sin(now * 0.00018) * 0.015 }
        }
        renderer.render(scene, camera)
      }
      frame = window.requestAnimationFrame(animate)
    }).catch(() => { if (!disposed) setFallback(true) })

    return () => {
      disposed = true
      if (frame) window.cancelAnimationFrame(frame)
      observer?.disconnect()
      removeListeners()
      if (renderer) {
        renderer.dispose()
        renderer.domElement.remove()
      }
      for (const geometry of geometries) geometry.dispose()
      for (const material of materials) material.dispose()
      for (const texture of textures) texture.dispose()
    }
  }, [])

  return (
    <main className="ashen-screen">
      <div className="ashen-vignette" aria-hidden="true" />
      <div className="ashen-glow ashen-glow-left" aria-hidden="true" />
      <div className="ashen-glow ashen-glow-right" aria-hidden="true" />
      <div className="ashen-renderer" ref={hostRef} aria-label="Interactive 3D shelf with Register and Login books" />
      {fallback && (
        <div className="ashen-fallback-books">
          {VOLUMES.map((volume) => (
            <button key={volume.id} type="button" className={'ashen-fallback-book ashen-fallback-' + volume.id} onClick={() => selectVolume(volume.id)}>
              <span>HYPERVISION</span><strong>{volume.title.toUpperCase()}</strong><small>{volume.meta}</small>
            </button>
          ))}
        </div>
      )}
      <header className="ashen-header">
        <div className="ashen-wordmark"><span className="ashen-mark"><img className="ashen-mark-image" src="/hypervision-mark.svg" alt="" /></span><span>HYPERVISION<span>.</span></span></div>
        <div className="ashen-header-meta"><span className="ashen-live-dot" /> THE IDENTITY ARCHIVE <span className="ashen-header-number">HV—01</span></div>
      </header>

      <section className="ashen-intro" aria-label="Choose an authentication book">
        <p className="ashen-kicker"><span /> THE ARCHIVE IS OPEN</p>
        <h1>Choose your<br /><em>volume.</em></h1>
        <p className="ashen-lede">Two ways forward. Take the one that feels like yours.</p>
      </section>

      <div className="ashen-scene-caption"><span>01 / 02</span><span>HOVER TO LIFT · SELECT TO OPEN</span><ArrowDownRight size={15} /></div>

      <section className={'ashen-detail ' + ((selectedVolume || authOpen) ? 'is-open' : '') + (authOpen ? ' has-auth' : '')} aria-live="polite" aria-hidden={!selectedVolume && !authOpen} inert={!selectedVolume && !authOpen}>
        <div className="ashen-detail-top">
          <span>{authOpen ? (activeAuthMode === 'reset' ? 'RECOVERY PROTOCOL' : activeAuthMode === 'update-password' ? 'SECURITY KEY / RENEWAL' : selectedVolume?.meta || 'IDENTITY ARCHIVE') : (selectedVolume?.meta || 'IDENTITY ARCHIVE')}</span>
          <button type="button" aria-label={authOpen ? 'Close form and return to book details' : 'Close book details'} onClick={closeDetails}><span>×</span></button>
        </div>
        {authOpen && renderAuthPanel ? (
          <div className="ashen-auth-content">{renderAuthPanel({ onModeChange: openAuth })}</div>
        ) : (
          <>
            <div className="ashen-paper-seal"><Orbit size={20} strokeWidth={1.4} /></div>
            <h2>{selectedVolume?.id === 'login' ? <>Return to<br /><em>your orbit.</em></> : <>A beginning<br /><em>of your own.</em></>}</h2>
            <p>{selectedVolume?.description || 'Choose a volume to begin.'}</p>
            <button className="ashen-primary" type="button" onClick={() => selectedVolume && openAuth(selectedVolume.authMode)}>
              <span>{selectedVolume?.cta || 'Open volume'}</span><ArrowRight size={17} />
            </button>
            <div className="ashen-detail-foot"><Sparkles size={13} /><span>YOUR NEXT CHAPTER STARTS HERE</span></div>
          </>
        )}
      </section>

      <footer className="ashen-footer">
        <div className="ashen-footer-note"><span className="ashen-footer-line" /><span>HYPERVISION / ACCESS POINTS</span></div>
        <div className="ashen-catalogue">
          {VOLUMES.map((volume, index) => (
            <button key={volume.id} className={'ashen-volume-tab ' + (selected === volume.id ? 'active' : '')} type="button" onClick={() => selectVolume(volume.id)} aria-pressed={selected === volume.id}>
              <span className={'ashen-volume-number ashen-number-' + volume.id}>0{index + 1}</span>
              <span><small>{volume.id === 'register' ? 'NEW IDENTITY' : 'RETURNING IDENTITY'}</small><strong>{volume.title}</strong></span>
            </button>
          ))}
        </div>
        <div className="ashen-footer-mark">EST. BEYOND THE ORDINARY <ArrowDownRight size={14} /></div>
      </footer>
    </main>
  )
}
