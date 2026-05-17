export type UserProfile = {
  id: string
  email: string
  nickname?: string | null
}

export type AuthSession = {
  token: string
  user: UserProfile
}
