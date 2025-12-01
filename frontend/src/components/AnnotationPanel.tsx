interface Annotation {
  id: string
  label: string
  x: number
  y: number
}

interface AnnotationPanelProps {
  annotations: Annotation[]
}

const AnnotationPanel = ({ annotations }: AnnotationPanelProps) => {
  return (
    <aside className="annotation-panel">
      <h3>Annotation Panel</h3>
      <p className="panel-description">
        Track annotation markers and save overlay state for study review.
      </p>
      <ul className="annotation-list">
        {annotations.map((annotation) => (
          <li key={annotation.id}>
            <strong>{annotation.label}</strong>
            <div>Location: {annotation.x}, {annotation.y}</div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default AnnotationPanel
