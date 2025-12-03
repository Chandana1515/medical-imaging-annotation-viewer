import { useEffect, useRef } from 'react'
import * as cornerstone from '@cornerstonejs/core'

interface Annotation {
  id: string
  label: string
  x: number
  y: number
}

interface ZoomAction {
  action: 'none' | 'in' | 'out' | 'reset'
  token: number
}

interface ViewerProps {
  imageId: string
  annotations: Annotation[]
  triggerReload: number
  zoomAction: ZoomAction
  onStatusChange: (message: string) => void
  onAddAnnotation: (x: number, y: number) => void
}

let dicomLoaderRegistered = false
let demoLoaderRegistered = false
const demoImageMetadata = new Map<string, Record<string, any>>()

const drawMriPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.fillStyle = '#0d1220'
  ctx.fillRect(0, 0, width, height)

  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    width * 0.05,
    width * 0.5,
    height * 0.45,
    width * 0.7
  )
  gradient.addColorStop(0, '#65708f')
  gradient.addColorStop(0.6, '#2c3b5c')
  gradient.addColorStop(1, '#101426')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(230,230,255,0.12)'
  ctx.beginPath()
  ctx.ellipse(width * 0.5, height * 0.5, width * 0.4, height * 0.55, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 3
  for (let i = 0; i < 12; i += 1) {
    const radius = width * (0.25 + i * 0.03)
    ctx.beginPath()
    ctx.ellipse(width * 0.5, height * 0.5, radius, radius * 0.7, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  for (let i = 0; i < 6; i += 1) {
    const x = width * (0.35 + i * 0.06)
    const y = height * (0.35 + Math.sin(i * 1.1) * 0.04)
    ctx.beginPath()
    ctx.ellipse(x, y, width * 0.08, height * 0.03, Math.PI * 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.font = 'bold 22px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('MRI Demo', width * 0.5, height * 0.14)
}

const drawColorDemo = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#0f172a')
  gradient.addColorStop(0.5, '#2563eb')
  gradient.addColorStop(1, '#93c5fd')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 36px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Demo Image', width / 2, height / 2 - 12)
  ctx.font = '18px Inter, sans-serif'
  ctx.fillText('Cornerstone viewer sample', width / 2, height / 2 + 30)
}

const createDemoImageLoader = async (imageId: string) => {
  const width = 640
  const height = 480
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Unable to get canvas rendering context')
  }

  if (imageId.includes('mri')) {
    drawMriPattern(ctx, width, height)
  } else {
    drawColorDemo(ctx, width, height)
  }

  const imageData = ctx.getImageData(0, 0, width, height)
  const rgbaData = imageData.data
  const pixelData = new Uint8Array(width * height * 3)

  for (let i = 0; i < width * height; i++) {
    pixelData[i * 3] = rgbaData[i * 4]
    pixelData[i * 3 + 1] = rgbaData[i * 4 + 1]
    pixelData[i * 3 + 2] = rgbaData[i * 4 + 2]
  }

  const metadata = {
    imagePlaneModule: {
      rows: height,
      columns: width,
      pixelSpacing: [1, 1],
      imageOrientationPatient: [1, 0, 0, 0, 1, 0],
      imagePositionPatient: [0, 0, 0],
      frameOfReferenceUID: 'demo',
    },
    imagePixelModule: {
      bitsAllocated: 8,
      bitsStored: 8,
      highBit: 7,
      photometricInterpretation: 'RGB',
      samplesPerPixel: 3,
      pixelRepresentation: 0,
      planarConfiguration: 0,
    },
    generalSeriesModule: {
      modality: 'OT',
    },
  }
  demoImageMetadata.set(imageId, metadata)

  return {
    imageId,
    minPixelValue: 0,
    maxPixelValue: 255,
    slope: 1,
    intercept: 0,
    windowCenter: [128],
    windowWidth: [256],
    voiLUTFunction: 'LINEAR',
    getPixelData: () => pixelData,
    getCanvas: () => canvas,
    rows: height,
    columns: width,
    height,
    width,
    color: true,
    rgba: false,
    numComps: 3,
    columnPixelSpacing: 1,
    rowPixelSpacing: 1,
    invert: false,
    photometricInterpretation: 'RGB',
    sizeInBytes: pixelData.byteLength,
  }
}

const demoMetaDataProvider = (type: string, imageId: string) => {
  if (!imageId.startsWith('demo:')) {
    return undefined
  }

  const metadata = demoImageMetadata.get(imageId)
  if (!metadata) {
    return undefined
  }

  return metadata[type]
}

const registerDemoLoader = () => {
  if (demoLoaderRegistered) {
    return
  }

  cornerstone.registerImageLoader('demo', (imageId: string) => {
    const promise = createDemoImageLoader(imageId)
    return {
      promise,
      cancelFn: () => undefined,
    }
  })

  cornerstone.metaData.addProvider(demoMetaDataProvider)
  demoLoaderRegistered = true
}

const registerDicomLoader = async () => {
  if (dicomLoaderRegistered) {
    return
  }

  const loaderModule = await import(
    '@cornerstonejs/dicom-image-loader/dist/dynamic-import/cornerstoneDICOMImageLoader.min.js'
  )
  const cornerstoneDICOMImageLoader = (loaderModule as any).default ?? loaderModule

  cornerstoneDICOMImageLoader.external.cornerstone = cornerstone
  if (cornerstoneDICOMImageLoader.webWorkerManager?.initialize) {
    cornerstoneDICOMImageLoader.webWorkerManager.initialize({
      maxWebWorkers: navigator.hardwareConcurrency || 1,
      startWebWorkersOnDemand: true,
    })
  }

  dicomLoaderRegistered = true
}

const Viewer = ({
  imageId,
  annotations,
  triggerReload,
  zoomAction,
  onStatusChange,
  onAddAnnotation,
}: ViewerProps) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const renderingEngineRef = useRef<any>(null)
  const viewportRef = useRef<any>(null)

  useEffect(() => {
    const loadImage = async () => {
      if (!elementRef.current) {
        return
      }

      const loadId = imageId || 'demo:sample'
      registerDemoLoader()

      if (loadId.startsWith('wadouri:') || loadId.startsWith('dicomweb:')) {
        await registerDicomLoader()
      }

      await cornerstone.init()
      onStatusChange('Initializing viewer...')

      if (!renderingEngineRef.current) {
        renderingEngineRef.current = new cornerstone.RenderingEngine(
          'cornerstone-engine'
        )
      }

      const renderingEngine = renderingEngineRef.current
      renderingEngine.enableElement({
        viewportId: 'mainViewport',
        element: elementRef.current,
        type: cornerstone.Enums.ViewportType.STACK,
        defaultOptions: {
          background: [0, 0, 0],
        },
      })

      const viewport = renderingEngine.getViewport('mainViewport') as any
      if (!viewport?.setStack) {
        onStatusChange('Cornerstone stack viewer unavailable.')
        return
      }

      try {
        await viewport.setStack([loadId])
        viewportRef.current = viewport
        if (typeof viewport.render === 'function') {
          viewport.render()
        }
        const isDemo = loadId.startsWith('demo:')
        onStatusChange(isDemo ? 'Demo image loaded' : 'DICOM image loaded')
      } catch (error) {
        console.error(error)
        onStatusChange(
          `Failed to load image into viewer: ${
            (error as Error).message || String(error)
          }`
        )
      }
    }

    loadImage()
  }, [imageId, triggerReload, onStatusChange])

  useEffect(() => {
    if (!viewportRef.current || zoomAction.action === 'none') {
      return
    }

    const viewport = viewportRef.current
    const currentZoom = viewport.getZoom()
    if (zoomAction.action === 'reset') {
      viewport.resetCamera(false, true)
    } else {
      const factor = zoomAction.action === 'in' ? 1.2 : 1 / 1.2
      viewport.setZoom(Math.max(0.1, currentZoom * factor), true)
    }

    if (typeof viewport.render === 'function') {
      viewport.render()
    }
  }, [zoomAction])

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!viewportRef.current) {
      return
    }

    const viewport = viewportRef.current
    const currentZoom = viewport.getZoom()
    const scale = event.deltaY < 0 ? 1.1 : 0.9
    viewport.setZoom(Math.max(0.1, currentZoom * scale), true)
    if (typeof viewport.render === 'function') {
      viewport.render()
    }
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.round(event.clientX - rect.left)
    const y = Math.round(event.clientY - rect.top)
    onAddAnnotation(x, y)
  }

  return (
    <div className="viewer-box" onClick={handleClick} onWheel={handleWheel}>
      <div className="viewer-status">Click inside viewer to add annotation</div>
      <div ref={elementRef} className="cornerstone-element" />
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="annotation-marker"
          style={{ left: annotation.x, top: annotation.y }}
          title={annotation.label}
        >
          <span>{annotation.label}</span>
        </div>
      ))}
    </div>
  )
}

export default Viewer
