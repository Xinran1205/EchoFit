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
}

export function TrainingPhotoGallery({
  photos,
  compact = false,
  deletable = false,
  onDeletePhoto
}: TrainingPhotoGalleryProps) {
  const [items, setItems] = useState<TrainingPhotoGridItem[]>([])
  const [loading, setLoading] = useState(false)
  const [failedCount, setFailedCount] = useState(0)

  useEffect(() => {
    let active = true
    const objectUrls: string[] = []

    async function loadPhotos() {
      if (photos.length === 0) {
        setItems([])
        setFailedCount(0)
        return
      }

      setLoading(true)
      setFailedCount(0)

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
        const nextFailedCount = results.length - nextItems.length

        setItems(nextItems)
        setFailedCount(nextFailedCount)
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
      />
      {failedCount > 0 ? (
        <div className="training-photo-gallery__status">
          有 {failedCount} 张照片暂时没加载出来。
        </div>
      ) : null}
    </div>
  )
}
