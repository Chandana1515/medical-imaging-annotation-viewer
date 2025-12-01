interface ToolbarProps {
  onLoadDemo: () => void
  onLoadDicomFile: () => void
}

const Toolbar = ({ onLoadDemo, onLoadDicomFile }: ToolbarProps) => {
  return (
    <div className="toolbar">
      <button type="button" onClick={onLoadDemo}>
        Load Demo Image
      </button>
      <button type="button" onClick={onLoadDicomFile}>
        Load DICOM File
      </button>
      <button type="button">Zoom</button>
    </div>
  )
}

export default Toolbar
