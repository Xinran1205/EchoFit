export type UserGender = 'male' | 'female'

export type UserProfile = {
  id: string
  email: string
  nickname?: string | null
  gender: UserGender
}

export type AuthSession = {
  token: string
  user: UserProfile
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  verificationCode: string
  password: string
}

export type UpdateUserProfileInput = {
  gender: UserGender
}

export type UpdatePasswordInput = {
  verificationCode: string
  newPassword: string
}
