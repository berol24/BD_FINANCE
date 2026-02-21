import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import type { User } from '../models/User.js'

type RegisterBody = {
  nom: string
  prenom: string
  email: string
  password: string
  confirmPassword: string
  createdAt?: string | Date
}

type LoginBody = {
  email: string
  password: string
}

const getAccessSecret = (): string | undefined => {
  return process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET
}

const getRefreshSecret = (): string | undefined => {
  return process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET
}

const signAccessToken = (userId: string, secret: string): string => {
  return jwt.sign({ userId }, secret, { expiresIn: '15m' })
}

const signRefreshToken = (userId: string, secret: string): string => {
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

export const register = async (req: Request, res: Response): Promise<void> => {
  const { nom, prenom, email, password, confirmPassword, createdAt } =
    req.body as RegisterBody

  try {
    if (!password || !confirmPassword || password !== confirmPassword) {
      res.status(400).json({ message: 'Les mots de passe ne correspondent pas' })
      return
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const createdAtValue = createdAt ?? new Date()

    const { data, error } = await supabase.from('users').insert([
      {
        nom,
        prenom,
        email,
        password: hashedPassword,
        createdAt: createdAtValue
      }
    ])

    if (error) {
      res.status(500).json({ error })
      return
    }

    res.status(201).json({ data })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginBody

  try {
    const accessSecret = getAccessSecret()
    const refreshSecret = getRefreshSecret()

    if (!accessSecret || !refreshSecret) {
      res.status(500).json({ message: 'JWT secrets not configured' })
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      res.status(400).json({ message: 'Email ou mot de passe incorrect' })
      return
    }

    const user = data as User
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      res.status(400).json({ message: 'Email ou mot de passe incorrect' })
      return
    }

    const accessToken = signAccessToken(user.id.toString(), accessSecret)
    const refreshToken = signRefreshToken(user.id.toString(), refreshSecret)

    const { password: _password, ...safeUser } = user
    res.json({ user: safeUser, accessToken, refreshToken })
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la connexion' })
  }
}

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string }
  const refreshSecret = getRefreshSecret()
  const accessSecret = getAccessSecret()

  if (!refreshSecret || !accessSecret) {
    res.status(500).json({ message: 'JWT secrets not configured' })
    return
  }

  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token is required' })
    return
  }

  try {
    const payload = jwt.verify(refreshToken, refreshSecret) as jwt.JwtPayload
    const userId = payload.userId?.toString()

    if (!userId) {
      res.status(401).json({ message: 'Invalid refresh token' })
      return
    }

    const newAccessToken = signAccessToken(userId, accessSecret)
    const newRefreshToken = signRefreshToken(userId, refreshSecret)

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ message: 'Deconnexion reussie' })
}
