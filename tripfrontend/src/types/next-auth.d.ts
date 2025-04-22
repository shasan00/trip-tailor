import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      token: string
      firstName: string
      lastName: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    token: string
    firstName: string
    lastName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    token: string
    firstName: string
    lastName: string
  }
} 