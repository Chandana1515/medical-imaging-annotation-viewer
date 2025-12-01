import { useEffect, useRef } from 'react'
import * as cornerstone from '@cornerstonejs/core'

interface Annotation {
  id: string
  label: string
  x: number
  y: number
}

interface ViewerProps {
  imageId: string
  annotations: Annotation[]
  triggerReload: number
  onStatusChange: (message: string) => void
  onAddAnnotation: (x: number, y: number) => void
}

const demoImageUrl = 'https://placekitten.com/640/480'
let dicomLoaderRegistered = false
let demoLoaderRegistered = false
const demoImageMetadata = new Map<string, Record<string, any>>()

const createDemoImageLoader = async (imageId: string) => {
  const imageUrl = imageId.replace('demo:', '')
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch demo image: ${response.status}`)
  }

  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Unable to get canvas rendering context')
  }

  ctx.drawImage(bitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixelData = new Uint8Array(imageData.data.buffer)

  const metadata = {
    imagePlaneModule: {
      rows: canvas.height,
      columns: canvas.width,
      columnPixelSpacing: 1,
      rowPixelSpacing: 1,
      imageOrientationPatient: [1, 0, 0, 0, 1, 0],
      imagePositionPatient: [0, 0, 0],
      frameOfReferenceUID: 'demo',
    },
    imagePixelModule: {
      bitsAllocated: 8,
      bitsStored: 8,
      highBit: 7,
      photometricInterpretation: 'RGB',
      samplesPerPixel: 4,
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
    rows: canvas.height,
    columns: canvas.width,
    height: canvas.height,
    width: canvas.width,
    color: true,
    rgba: true,
    numComps: 4,
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
  onStatusChange,
  onAddAnnotation,
}: ViewerProps) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const renderingEngineRef = useRef<any>(null)

  useEffect(() => {
    const loadImage = async () => {
      if (!elementRef.current) {
        return
      }

      const loadId = imageId || `demo:${demoImageUrl}`
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
        if (typeof viewport.render === 'function') {
          viewport.render()
        }
        onStatusChange(imageId ? 'DICOM image loaded' : 'Demo image loaded')
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

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.round(event.clientX - rect.left)
    const y = Math.round(event.clientY - rect.top)
    onAddAnnotation(x, y)
  }

  return (
    <div className="viewer-box" onClick={handleClick}>
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
