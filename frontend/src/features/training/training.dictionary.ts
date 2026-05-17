import type {
  TrainingMood,
  TrainingOption,
  TrainingPart
} from './training.types'

export const trainingPartOptions: TrainingOption<TrainingPart>[] = [
  { label: '胸', value: 'chest' },
  { label: '背', value: 'back' },
  { label: '肩', value: 'shoulder' },
  { label: '腿', value: 'legs' },
  { label: '手臂', value: 'arms' },
  { label: '核心', value: 'core' },
  { label: '有氧', value: 'cardio' },
  { label: '拉伸', value: 'stretch' }
]

export const trainingMoodOptions: TrainingOption<TrainingMood>[] = [
  { label: '很有感觉', value: 'effective' },
  { label: '正常发挥', value: 'normal' },
  { label: '有点累但完成了', value: 'tired_but_done' },
  { label: '恢复训练', value: 'recovery' },
  { label: '轻松活动一下', value: 'light' }
]

export function getTrainingPartLabel(part: TrainingPart) {
  return trainingPartOptions.find((option) => option.value === part)?.label ?? part
}

export function getTrainingMoodLabel(mood: TrainingMood) {
  return trainingMoodOptions.find((option) => option.value === mood)?.label ?? mood
}
