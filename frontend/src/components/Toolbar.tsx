interface ToolbarProps {
  onLoadDemo: () => void
  onLoadMriDemo: () => void
  onLoadDicomFile: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

const Toolbar = ({
  onLoadDemo,
  onLoadMriDemo,
  onLoadDicomFile,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ToolbarProps) => {
  return (
    <div className="toolbar">
      <button type="button" onClick={onLoadDemo}>
        Load Demo Image
      </button>
      <button type="button" onClick={onLoadMriDemo}>
        Load MRI Demo
      </button>
      <button type="button" onClick={onLoadDicomFile}>
        Load DICOM File
      </button>
      <button type="button" onClick={onZoomIn}>
        Zoom In
      </button>
      <button type="button" onClick={onZoomOut}>
        Zoom Out
      </button>
      <button type="button" onClick={onResetZoom}>
        Reset Zoom
      </button>
    </div>
  )
}

export default Toolbar
