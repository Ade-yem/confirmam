export interface AuthResult {
  token: string
  user: {
    email: string
    name: string
  }
}
