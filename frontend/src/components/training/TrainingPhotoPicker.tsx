import { useEffect, useRef } from 'react'
import { Toast } from 'antd-mobile'
import {
  TRAINING_PHOTO_MAX_COUNT,
  TRAINING_PHOTO_MAX_FILE_SIZE_BYTES
} from '../../features/training/training.constants'
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

  function handleFilesSelected(files: File[]) {
    if (disabled) {
      return
    }

    const remainingCount = Math.max(maxCount - value.length, 0)
    if (remainingCount <= 0) {
      Toast.show({ content: `最多只能保存 ${maxCount} 张训练照片` })
      return
    }

    const existingSignatures = new Set(
      value.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`)
    )
    const nextItems: LocalTrainingPhoto[] = []
    let warningMessage = ''

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        warningMessage ||= '只能上传图片文件'
        continue
      }

      if (file.size > TRAINING_PHOTO_MAX_FILE_SIZE_BYTES) {
        warningMessage ||= `单张图片不能超过 ${formatMaxSizeLabel()}`
        continue
      }

      const signature = `${file.name}-${file.size}-${file.lastModified}`
      if (existingSignatures.has(signature)) {
        warningMessage ||= '相同照片已经添加过了'
        continue
      }

      existingSignatures.add(signature)
      nextItems.push({
        key: buildPhotoKey(file),
        file,
        previewUrl: URL.createObjectURL(file)
      })

      if (nextItems.length >= remainingCount) {
        break
      }
    }

    if (files.length > remainingCount && nextItems.length === remainingCount) {
      warningMessage ||= `最多只能保存 ${maxCount} 张训练照片`
    }

    if (nextItems.length > 0) {
      onChange([...value, ...nextItems])
    }

    if (warningMessage) {
      Toast.show({ content: warningMessage })
    }
  }

  return (
    <div className="training-photo-picker">
      <div className="training-photo-picker__meta">
        <span className="training-photo-picker__count">
          已选 {value.length} / {maxCount} 张
        </span>
      </div>

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
        addTile={
          value.length < maxCount ? (
            <button
              type="button"
              className="training-photo-add pressable"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <span className="training-photo-add__icon">
                <TrainingPhotoAddGlyph />
              </span>
              <span className="training-photo-add__title">添加照片</span>
            </button>
          ) : null
        }
      />

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          handleFilesSelected(files)
        }}
      />
    </div>
  )
}
