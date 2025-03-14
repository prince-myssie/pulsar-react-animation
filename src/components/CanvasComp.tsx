import React, { useRef, useState, useEffect } from 'react'

type AgentState =
  | 'disconnected'
  | 'connecting'
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking'

interface CanvasProps {
  size?: number // Taille du canvas
  state: AgentState // État de l'agent
  audioLevel?: number // Niveau audio pour l'animation entre -1 et 1
}

interface SphereConfig {
  baseRadius: number
  maxExtraRadius: number
  arcCount: number
  arcWidth: number
  rotation: number
  distortion: number
  velocityX: number
  velocityY: number
  x: number
  y: number
}

interface ColorPalette {
  primary: string
  secondary: string
  tertiary: string
  accent: string
  highlight: string
}

// Palettes de couleurs par état
const statePalettes: Record<AgentState, ColorPalette> = {
  disconnected: {
    primary: '#D3E4FD',
    secondary: '#9b87f5',
    tertiary: '#E5DEFF',
    accent: '#8B5CF6',
    highlight: '#FFDEE2'
  },
  connecting: {
    primary: '#D3E4FD',
    secondary: '#7E69AB',
    tertiary: '#E5DEFF',
    accent: '#8B5CF6',
    highlight: '#FFDEE2'
  },
  initializing: {
    primary: '#D3E4FD',
    secondary: '#6E59A5',
    tertiary: '#E5DEFF',
    accent: '#9b87f5',
    highlight: '#FFDEE2'
  },
  listening: {
    primary: '#D3E4FD',
    secondary: '#D946EF',
    tertiary: '#E5DEFF',
    accent: '#8B5CF6',
    highlight: '#FFDEE2'
  },
  thinking: {
    primary: '#D3E4FD',
    secondary: '#0EA5E9',
    tertiary: '#D6BCFA',
    accent: '#33C3F0',
    highlight: '#FFDEE2'
  },
  speaking: {
    primary: '#D3E4FD',
    secondary: '#1EAEDB',
    tertiary: '#D6BCFA',
    accent: '#0FA0CE',
    highlight: '#FFDEE2'
  }
}

// Simulation des bandes de fréquence à partir d'un seul niveau audio
interface AudioBands {
  low: number      // Basses fréquences (0-200Hz)
  mid: number      // Fréquences moyennes (200Hz-2kHz)
  high: number     // Hautes fréquences (2kHz-20kHz)
  transient: number // Transitoires (attaques rapides)
}

// Fonction pour simuler des bandes de fréquence à partir d'un seul niveau audio
const simulateAudioBands = (audioLevel: number, state: AgentState, time: number): AudioBands => {
  // Valeur absolue du niveau audio pour les calculs
  const absLevel = Math.abs(audioLevel);
  
  // Comportement différent selon l'état
  if (state === 'speaking') {
    // Plus de hautes fréquences et basses quand l'agent parle
    return {
      low: absLevel * (0.7 + 0.3 * Math.sin(time * 0.002)),
      mid: absLevel * (0.5 + 0.5 * Math.sin(time * 0.005)),
      high: absLevel * (0.8 + 0.2 * Math.sin(time * 0.01)),
      transient: absLevel * (Math.random() > 0.8 ? 1.5 : 0.1),
    };
  } else if (state === 'listening') {
    // Plus réactif aux transitoires quand l'agent écoute
    return {
      low: absLevel * (0.4 + 0.3 * Math.sin(time * 0.002)),
      mid: absLevel * (0.7 + 0.3 * Math.sin(time * 0.005)),
      high: absLevel * (0.5 + 0.2 * Math.sin(time * 0.01)),
      transient: absLevel * (Math.random() > 0.7 ? 1.2 : 0.1),
    };
  } else {
    // États inactifs ou autres
    return {
      low: absLevel * (0.3 + 0.2 * Math.sin(time * 0.001)),
      mid: absLevel * (0.3 + 0.2 * Math.sin(time * 0.003)),
      high: absLevel * (0.3 + 0.2 * Math.sin(time * 0.005)),
      transient: absLevel * (Math.random() > 0.9 ? 0.8 : 0.1),
    };
  }
};

const CanvasComp: React.FC<CanvasProps> = ({
  size = 300,
  state = 'disconnected',
  audioLevel = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const frameInterval = 1000 / 30 // Limiter à environ 30 FPS pour économiser les ressources
  
  // Configuration de référence pour la sphère
  const sphereConfigRef = useRef<SphereConfig>({
    baseRadius: size * 0.35,
    maxExtraRadius: size * 0.1,
    arcCount: 3,
    arcWidth: size * 0.03,
    rotation: 0,
    distortion: 0,
    velocityX: 0,
    velocityY: 0,
    x: 0,
    y: 0
  })
  
  // Temps de référence pour l'animation
  const timeRef = useRef<number>(0)
  const colorCycleRef = useRef<number>(0)
  const audioBandsRef = useRef<AudioBands>({
    low: 0,
    mid: 0,
    high: 0,
    transient: 0
  })
  
  // Initialize canvas - seulement une fois au démarrage
  useEffect(() => {
    if (!isInitialized) {
      const canvas = canvasRef.current
      if (!canvas) return

      // Set fixed dimensions with device pixel ratio for high-DPI displays
      const pixelRatio = Math.min(window.devicePixelRatio, 2)
      canvas.width = size * pixelRatio
      canvas.height = size * pixelRatio

      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`

      // Debug log
      console.log('Canvas initialized, size:', size, 'pixelRatio:', pixelRatio)

      setIsInitialized(true)
    }
  }, [size, isInitialized])

  // Mise à jour de la configuration lorsque la taille change
  useEffect(() => {
    sphereConfigRef.current = {
      ...sphereConfigRef.current,
      baseRadius: size * 0.35,
      maxExtraRadius: size * 0.1,
      arcWidth: size * 0.03
    }
  }, [size])

  // Main animation loop - optimisé pour réduire la consommation
  useEffect(() => {
    if (!isInitialized) return

    // Démarrer l'animation avec le timestamp actuel
    animationRef.current = requestAnimationFrame(animate)
    
    // Nettoyage à la désactivation du composant
    return (): void => {
      if (animationRef.current !== 0) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
    }
  }, [isInitialized])

  // Fonction pour créer un dégradé radial
  const createRadialGradient = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    colors: ColorPalette,
    bands: AudioBands
  ): CanvasGradient => {
    // Gradient influencé par les bandes de fréquence
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, radius * (1 + bands.low * 0.3)
    )
    
    // Ajuster l'opacité en fonction du niveau des bandes
    const alphaMultiplier = 0.8 + bands.mid * 0.2
    
    // Les couleurs sont influencées par les différentes bandes
    gradient.addColorStop(0, colors.primary)
    gradient.addColorStop(0.4, colors.secondary + 'CC') // Opacity 80%
    gradient.addColorStop(0.7, colors.tertiary + '99') // Opacity 60%
    gradient.addColorStop(1, colors.accent + '33')  // Opacity 20%
    
    return gradient
  }
  
  // Fonction pour dessiner un arc
  const drawArc = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    width: number,
    color: string,
    glow: boolean = false
  ): void => {
    ctx.lineWidth = width
    ctx.strokeStyle = color
    
    if (glow) {
      ctx.shadowBlur = width * 1.5
      ctx.shadowColor = color
    }
    
    ctx.beginPath()
    ctx.arc(x, y, radius, startAngle, endAngle)
    ctx.stroke()
    
    // Réinitialiser l'effet de lueur
    if (glow) {
      ctx.shadowBlur = 0
    }
  }
  
  // Fonction pour dessiner la sphère principale
  const drawMainSphere = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    config: SphereConfig,
    colors: ColorPalette,
    bands: AudioBands,
    time: number
  ): void => {
    // Calculer le rayon basé sur les bandes audio
    const pulseFactor = Math.sin(time * 0.002) * 0.15 + 0.85 // Fluctuation de base
    
    // Les basses fréquences influencent principalement la taille de la sphère
    const radius = config.baseRadius * (1 + bands.low * 0.4) * pulseFactor
    
    // Créer un dégradé pour la sphère principale
    const gradient = createRadialGradient(ctx, centerX, centerY, radius * 1.2, colors, bands)
    
    // Dessiner la sphère principale
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    
    // Ajouter un léger bord lumineux influencé par les hautes fréquences
    ctx.globalAlpha = 0.3 + bands.high * 0.4
    ctx.lineWidth = 1 + bands.transient * 3
    ctx.strokeStyle = colors.highlight
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  
  // Fonction pour dessiner les arcs orbitaux
  const drawOrbitalArcs = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    config: SphereConfig,
    colors: ColorPalette,
    bands: AudioBands,
    time: number
  ): void => {
    // Facteur de distorsion basé sur les fréquences moyennes
    const distortionFactor = 1 + bands.mid * 0.25
    
    // Dessiner plusieurs arcs orbitaux avec des espacements différents
    for (let i = 0; i < config.arcCount; i++) {
      // Calculer l'angle de base pour cet arc
      const baseRotation = config.rotation + (i * Math.PI * 2 / config.arcCount)
      
      // Rayon orbital plus grand que la sphère principale, influencé par les basses
      const orbitalRadius = config.baseRadius * (1.2 + i * 0.15 + bands.low * 0.1) * distortionFactor
      
      // Calculer l'épaisseur de l'arc en fonction des hautes fréquences
      const arcWidth = config.arcWidth * (0.6 + i * 0.2) * (1 + bands.high * 0.4)
      
      // Calculer les angles de début et de fin pour créer un arc interrompu
      // Les transitoires influencent la longueur des segments
      const segmentLength = Math.PI * (0.5 + bands.transient * 0.3 + Math.sin(time * 0.001 + i) * 0.2)
      const startAngle = baseRotation + Math.sin(time * 0.0015) * 0.2
      const endAngle = startAngle + segmentLength
      
      // Interpoler les couleurs en fonction du cycle de couleur
      const colorIndex = (i + Math.floor(colorCycleRef.current)) % Object.keys(colors).length
      const colorKey = Object.keys(colors)[colorIndex] as keyof ColorPalette
      const arcColor = colors[colorKey]
      
      // Dessiner l'arc avec un effet de lueur influencé par les transitoires
      ctx.globalAlpha = 0.7 + bands.transient * 0.3
      drawArc(
        ctx,
        centerX,
        centerY,
        orbitalRadius,
        startAngle,
        endAngle,
        arcWidth,
        arcColor,
        true
      )
      
      // Dessiner un second arc à l'opposé
      const oppositeStartAngle = startAngle + Math.PI
      const oppositeEndAngle = oppositeStartAngle + segmentLength * 0.8
      
      drawArc(
        ctx,
        centerX,
        centerY,
        orbitalRadius * 0.95,
        oppositeStartAngle,
        oppositeEndAngle,
        arcWidth * 0.8,
        arcColor,
        true
      )
    }
    
    ctx.globalAlpha = 1
  }
  
  // Fonction pour appliquer un léger mouvement aléatoire à la sphère
  const updateSpherePosition = (
    config: SphereConfig,
    centerX: number,
    centerY: number,
    bands: AudioBands,
    deltaTime: number
  ): { x: number, y: number } => {
    // Ajouter un peu de mouvement aléatoire, influencé par les transitoires et moyennes fréquences
    const movementFactor = bands.transient * 2 + bands.mid * 1.5
    
    // Accélération aléatoire
    const ax = (Math.random() - 0.5) * 0.01 * movementFactor
    const ay = (Math.random() - 0.5) * 0.01 * movementFactor
    
    // Mettre à jour la vélocité
    config.velocityX += ax
    config.velocityY += ay
    
    // Amortissement
    config.velocityX *= 0.95
    config.velocityY *= 0.95
    
    // Limiter la vélocité
    const maxVelocity = 0.5 + movementFactor * 0.5
    const velocityMagnitude = Math.sqrt(config.velocityX * config.velocityX + config.velocityY * config.velocityY)
    
    if (velocityMagnitude > maxVelocity) {
      config.velocityX = (config.velocityX / velocityMagnitude) * maxVelocity
      config.velocityY = (config.velocityY / velocityMagnitude) * maxVelocity
    }
    
    // Mettre à jour la position
    config.x += config.velocityX * deltaTime * 0.1
    config.y += config.velocityY * deltaTime * 0.1
    
    // Limiter le déplacement à l'intérieur d'une zone
    const maxDisplacement = size * 0.05
    config.x = Math.max(Math.min(config.x, maxDisplacement), -maxDisplacement)
    config.y = Math.max(Math.min(config.y, maxDisplacement), -maxDisplacement)
    
    return {
      x: centerX + config.x,
      y: centerY + config.y
    }
  }

  // Animation loop
  const animate = (timestamp: number): void => {
    if (!animationRef.current) return // Stop if animation was cancelled

    // Limiter le taux de rafraîchissement
    if (timestamp - lastFrameTime >= frameInterval) {
      const canvas = canvasRef.current
      const canvasContext = canvas?.getContext('2d', { alpha: true })
      
      if (!canvasContext) return

      // Calculer le delta temps pour des animations fluides
      const deltaTime = timestamp - lastFrameTime
      timeRef.current += deltaTime
      colorCycleRef.current += deltaTime * 0.0001 // Progression lente du cycle de couleurs
      
      // Simuler les bandes de fréquence à partir du niveau audio
      audioBandsRef.current = simulateAudioBands(audioLevel, state, timeRef.current)
      const bands = audioBandsRef.current
      
      // Obtenir le centre du canvas
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      // Mettre à jour la rotation de la sphère (rotation dans le sens des aiguilles d'une montre)
      // La vitesse de rotation est maintenant influencée par les moyennes fréquences
      sphereConfigRef.current.rotation += 0.005 * (1 + bands.mid * 0.7)
      
      // Mettre à jour la distorsion de la sphère basée sur les hautes fréquences
      sphereConfigRef.current.distortion = bands.high * 0.3
      
      // Mettre à jour la position de la sphère avec un mouvement aléatoire
      const position = updateSpherePosition(
        sphereConfigRef.current,
        centerX,
        centerY,
        bands,
        deltaTime
      )
      
      // Récupérer la palette de couleurs en fonction de l'état de l'agent
      const colorPalette = statePalettes[state]
      
      // Effacer le canvas
      canvasContext.clearRect(0, 0, canvas.width, canvas.height)
      
      // Dessiner la sphère principale
      drawMainSphere(
        canvasContext,
        position.x,
        position.y,
        sphereConfigRef.current,
        colorPalette,
        bands,
        timeRef.current
      )
      
      // Dessiner les arcs orbitaux
      drawOrbitalArcs(
        canvasContext,
        position.x,
        position.y,
        sphereConfigRef.current,
        colorPalette,
        bands,
        timeRef.current
      )
      
      lastFrameTime = timestamp
    }
    
    // Schedule next frame
    animationRef.current = requestAnimationFrame(animate)
  }

  // Variable pour limiter le taux de rafraîchissement
  let lastFrameTime = performance.now()

  return <canvas ref={canvasRef} style={{ borderRadius: '50%' }} />
}

export default CanvasComp
