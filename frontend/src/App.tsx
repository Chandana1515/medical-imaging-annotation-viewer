import { ChangeEvent, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import Viewer from './components/Viewer'
import Toolbar from './components/Toolbar'
import AnnotationPanel from './components/AnnotationPanel'

const API_BASE = 'http://localhost:8000'

interface Annotation {
  id: string
  label: string
  x: number
  y: number
}

function App() {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [status, setStatus] = useState('Ready to load a DICOM file')
  const DEMO_IMAGE_URL = 'https://placekitten.com/640/480'
  const DEMO_IMAGE_ID = `demo:${DEMO_IMAGE_URL}`
  const [currentImageId, setCurrentImageId] = useState<string>('')
  const [currentImageLabel, setCurrentImageLabel] = useState('No image loaded')
  const [reloadToken, setReloadToken] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!currentImageId) {
      setAnnotations([])
      return
    }

    setStatus('Loading annotations for current image...')
    axios
      .get(`${API_BASE}/annotations`, { params: { image_id: currentImageId } })
      .then((response) => {
        setAnnotations(
          response.data.map((item: any) => ({
            id: String(item.id),
            label: item.label,
            x: item.x,
            y: item.y,
          }))
        )
        setStatus(`Loaded annotations for ${currentImageLabel}`)
      })
      .catch(() => {
        setStatus('Failed to load annotations from backend')
      })
  }, [currentImageId, currentImageLabel])

  const addAnnotation = async (x: number, y: number) => {
    if (!currentImageId) {
      setStatus('Load an image before adding annotations.')
      return
    }

    const nextId = annotations.length + 1
    const newAnnotation = {
      image_id: currentImageId,
      label: `Marker ${nextId}`,
      x,
      y,
    }

    try {
      const response = await axios.post(`${API_BASE}/annotations`, newAnnotation)
      setAnnotations((current) => [
        ...current,
        {
          id: String(response.data.id),
          label: response.data.label,
          x: response.data.x,
          y: response.data.y,
        },
      ])
      setStatus('Annotation saved to backend')
    } catch (error) {
      console.error(error)
      setStatus('Failed to save annotation')
    }
  }

  const loadDemo = () => {
    setCurrentImageId(DEMO_IMAGE_ID)
    setCurrentImageLabel('Demo image')
    setReloadToken((value) => value + 1)
    setStatus('Loading demo image...')
  }

  const triggerFileInput = () => {
    inputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const url = URL.createObjectURL(file)
    setCurrentImageId(`wadouri:${url}`)
    setCurrentImageLabel(file.name)
    setReloadToken((value) => value + 1)
    setStatus(`Loading DICOM: ${file.name}`)
    event.target.value = ''
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Medical Imaging Annotation Viewer</h1>
          <p className="app-subtitle">
            Lightweight React + Cornerstone demo for medical imaging workflows.
          </p>
          <p className="image-label">{currentImageLabel}</p>
        </div>
        <div className="status-chip">{status}</div>
      </header>

      <Toolbar
        onLoadDemo={loadDemo}
        onLoadDicomFile={triggerFileInput}
      />
      <input
        ref={inputRef}
        type="file"
        accept=".dcm"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <main className="app-layout">
        <section className="viewer-wrapper">
          <Viewer
            imageId={currentImageId}
            annotations={annotations}
            triggerReload={reloadToken}
            onStatusChange={setStatus}
            onAddAnnotation={addAnnotation}
          />
        </section>

        <AnnotationPanel annotations={annotations} />
      </main>
    </div>
  )
}

export default App
