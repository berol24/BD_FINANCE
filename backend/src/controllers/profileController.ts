import type { Response } from 'express'
import { supabase } from '../config/supabase.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { User } from '../models/User.js'

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ message: 'User not authenticated' })
    return
  }

  try {
    const userId = parseInt(req.userId, 10)
    const { data, error } = await supabase
      .from('users')
      .select('id, nom, prenom, email, createdAt')
      .eq('id', userId)
      .single()

    if (error || !data) {
      res.status(404).json({ message: 'User not found', error })
      return
    }

    res.json({ user: data })
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message })
  }
}
