import { useEffect, useRef, useState } from 'react'
import { Toast } from 'antd-mobile'
import {
  TRAINING_PHOTO_MAX_COUNT,
  TRAINING_PHOTO_MAX_FILE_SIZE_BYTES
} from '../../features/training/training.constants'
import { optimizeTrainingPhoto } from '../../features/training/training.image'
import { TrainingPhotoAddGlyph, TrainingPhotoGrid } from './TrainingPhotoGrid'

export type LocalTrainingPhoto = {
  key: string
  file: File
  previewUrl: string
}

type TrainingPhotoPickerProps = {
  disabled?: boolean
  maxCount?: number
  value: LocalTrainingPhoto[]
  onChange: (nextValue: LocalTrainingPhoto[]) => void
}

function buildPhotoKey(file: File) {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${file.name}-${file.lastModified}-${file.size}-${randomPart}`
}

function formatMaxSizeLabel() {
  return `${Math.round(TRAINING_PHOTO_MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB`
}

export function TrainingPhotoPicker({
  disabled = false,
  maxCount = TRAINING_PHOTO_MAX_COUNT,
  value,
  onChange
}: TrainingPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const trackedUrlsRef = useRef<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const nextUrls = new Set(value.map((item) => item.previewUrl))

    value.forEach((item) => {
      trackedUrlsRef.current.add(item.previewUrl)
    })

    trackedUrlsRef.current.forEach((url) => {
      if (!nextUrls.has(url)) {
        URL.revokeObjectURL(url)
        trackedUrlsRef.current.delete(url)
      }
    })
  }, [value])

  useEffect(() => {
    return () => {
      trackedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      trackedUrlsRef.current.clear()
    }
  }, [])

  async function handleFilesSelected(files: File[]) {
    if (disabled || processing) {
      return
    }

    const remainingCount = Math.max(maxCount - value.length, 0)
    if (remainingCount <= 0) {
      Toast.show({ content: `最多只能保存 ${maxCount} 张训练照片` })
      return
    }

    const nextFile = files[0]
    if (!nextFile) {
      return
    }

    if (!nextFile.type.startsWith('image/')) {
      Toast.show({ content: '只能上传图片文件' })
      return
    }

    setProcessing(true)

    try {
      const optimizedFile = await optimizeTrainingPhoto(nextFile)
      if (optimizedFile.size > TRAINING_PHOTO_MAX_FILE_SIZE_BYTES) {
        Toast.show({ content: `单张图片不能超过 ${formatMaxSizeLabel()}` })
        return
      }

      onChange([
        {
          key: buildPhotoKey(optimizedFile),
          file: optimizedFile,
          previewUrl: URL.createObjectURL(optimizedFile)
        }
      ])
    } catch {
      Toast.show({ content: '图片处理失败，请换一张试试' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="training-photo-picker">
      <TrainingPhotoGrid
        items={value.map((item) => ({
          key: item.key,
          url: item.previewUrl,
          label: item.file.name
        }))}
        deletable
        onDelete={(photoKey) => {
          onChange(value.filter((item) => item.key !== photoKey))
        }}
        previewMode="none"
        addTile={
          value.length < maxCount ? (
            <button
              type="button"
              className="training-photo-add pressable"
              disabled={disabled || processing}
              onClick={() => inputRef.current?.click()}
            >
              <span className="training-photo-add__icon">
                <TrainingPhotoAddGlyph />
              </span>
              <span className="training-photo-add__title">
                {processing ? '处理中' : '添加照片'}
              </span>
            </button>
          ) : null
        }
      />

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          void handleFilesSelected(files)
        }}
      />
    </div>
  )
}
