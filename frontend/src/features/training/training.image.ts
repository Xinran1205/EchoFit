import {
  TRAINING_PHOTO_COMPRESS_MAX_EDGE_PX,
  TRAINING_PHOTO_COMPRESS_TARGET_BYTES
} from './training.constants'

const JPEG_OUTPUT_QUALITIES = [0.88, 0.82, 0.76]
const JPEG_OUTPUT_TYPE = 'image/jpeg'

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片读取失败'))
    image.src = src
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片处理失败'))
        return
      }

      resolve(blob)
    }, type, quality)
  })
}

function buildOutputFilename(originalName: string) {
  const normalizedName = originalName.trim() || 'training-photo'
  const extensionIndex = normalizedName.lastIndexOf('.')
  const basename =
    extensionIndex > 0 ? normalizedName.slice(0, extensionIndex) : normalizedName
  return `${basename}.jpg`
}

export async function optimizeTrainingPhoto(file: File) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight)
    const scale =
      longestEdge > TRAINING_PHOTO_COMPRESS_MAX_EDGE_PX
        ? TRAINING_PHOTO_COMPRESS_MAX_EDGE_PX / longestEdge
        : 1

    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale))
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))

    if (
      scale === 1 &&
      file.size <= TRAINING_PHOTO_COMPRESS_TARGET_BYTES &&
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    ) {
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const context = canvas.getContext('2d')
    if (!context) {
      return file
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, targetWidth, targetHeight)
    context.drawImage(image, 0, 0, targetWidth, targetHeight)

    let optimizedBlob: Blob | null = null

    for (const quality of JPEG_OUTPUT_QUALITIES) {
      const candidate = await canvasToBlob(canvas, JPEG_OUTPUT_TYPE, quality)
      optimizedBlob = candidate

      if (candidate.size <= TRAINING_PHOTO_COMPRESS_TARGET_BYTES) {
        break
      }
    }

    if (!optimizedBlob || optimizedBlob.size >= file.size * 0.98) {
      return file
    }

    return new File([optimizedBlob], buildOutputFilename(file.name), {
      type: JPEG_OUTPUT_TYPE,
      lastModified: Date.now()
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
