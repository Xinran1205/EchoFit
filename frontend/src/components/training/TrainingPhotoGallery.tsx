import { useEffect, useState } from 'react'
import { DotLoading } from 'antd-mobile'
import type { TrainingRecordPhoto } from '../../features/training/training.types'
import { fetchApiBlob } from '../../lib/api'
import { TrainingPhotoGrid, type TrainingPhotoGridItem } from './TrainingPhotoGrid'

type TrainingPhotoGalleryProps = {
  photos: TrainingRecordPhoto[]
  compact?: boolean
  deletable?: boolean
  onDeletePhoto?: (photoId: string) => void
  previewMode?: 'external' | 'none' | 'viewer'
}

export function TrainingPhotoGallery({
  photos,
  compact = false,
  deletable = false,
  onDeletePhoto,
  previewMode = 'viewer'
}: TrainingPhotoGalleryProps) {
  const [items, setItems] = useState<TrainingPhotoGridItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const objectUrls: string[] = []

    async function loadPhotos() {
      if (photos.length === 0) {
        setItems([])
        return
      }

      setLoading(true)

      try {
        const results = await Promise.allSettled(
          photos.map(async (photo) => {
            const blob = await fetchApiBlob(photo.downloadPath)
            const url = URL.createObjectURL(blob)
            objectUrls.push(url)
            return {
              key: photo.id,
              url,
              label: photo.originalFilename ?? '训练照片'
            } satisfies TrainingPhotoGridItem
          })
        )

        if (!active) {
          objectUrls.forEach((url) => URL.revokeObjectURL(url))
          return
        }

        const nextItems = results.flatMap((result) =>
          result.status === 'fulfilled' ? [result.value] : []
        )

        setItems(nextItems)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadPhotos()

    return () => {
      active = false
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  if (photos.length === 0) {
    return null
  }

  if (loading && items.length === 0) {
    return (
      <div className="training-photo-gallery training-photo-gallery--loading">
        <DotLoading color="primary" />
        <span>正在加载训练照片...</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="training-photo-gallery training-photo-gallery--failed">
        训练照片加载失败，请稍后重试。
      </div>
    )
  }

  return (
    <div className="training-photo-gallery">
      <TrainingPhotoGrid
        items={items}
        compact={compact}
        deletable={deletable}
        onDelete={onDeletePhoto}
        previewMode={previewMode}
      />
    </div>
  )
}
