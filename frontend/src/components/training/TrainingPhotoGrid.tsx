import { type ReactNode, useMemo, useState } from 'react'
import { ImageViewer } from 'antd-mobile'
import { AddOutline, CloseOutline } from 'antd-mobile-icons'

export type TrainingPhotoGridItem = {
  key: string
  url: string
  label?: string | null
}

type TrainingPhotoGridProps = {
  items: TrainingPhotoGridItem[]
  addTile?: ReactNode
  className?: string
  compact?: boolean
  deletable?: boolean
  onDelete?: (key: string) => void
}

export function TrainingPhotoGrid({
  items,
  addTile,
  className,
  compact = false,
  deletable = false,
  onDelete
}: TrainingPhotoGridProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const images = useMemo(() => items.map((item) => item.url), [items])

  return (
    <>
      <div
        className={[
          'training-photo-grid',
          compact ? 'training-photo-grid--compact' : '',
          className ?? ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {items.map((item, index) => (
          <div key={item.key} className="training-photo-thumb-shell">
            <button
              type="button"
              className="training-photo-thumb pressable"
              onClick={() => {
                setViewerIndex(index)
                setViewerOpen(true)
              }}
            >
              <img src={item.url} alt={item.label ?? '训练照片'} loading="lazy" />
              <div className="training-photo-thumb__veil">
                <span className="training-photo-thumb__action">查看大图</span>
              </div>
            </button>
            {deletable && onDelete ? (
              <button
                type="button"
                className="training-photo-thumb__delete"
                aria-label="移除照片"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(item.key)
                }}
              >
                <CloseOutline />
              </button>
            ) : null}
          </div>
        ))}
        {addTile}
      </div>

      <ImageViewer.Multi
        visible={viewerOpen}
        images={images}
        defaultIndex={viewerIndex}
        maxZoom="auto"
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
        renderFooter={(_, index) => (
          <div className="training-photo-viewer__footer">
            <span>{index + 1}</span>
            <span className="training-photo-viewer__divider">/</span>
            <span>{images.length}</span>
          </div>
        )}
      />
    </>
  )
}

export function TrainingPhotoAddGlyph() {
  return <AddOutline />
}
