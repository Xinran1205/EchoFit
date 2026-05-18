import type { UserGender } from './auth.types'

export const userGenderOptions: Array<{
  value: UserGender
  title: string
}> = [
  {
    value: 'male',
    title: '男'
  },
  {
    value: 'female',
    title: '女'
  }
]

export function getUserGenderLabel(gender: UserGender) {
  return gender === 'female' ? '女' : '男'
}
