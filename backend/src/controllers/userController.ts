import type { Response } from 'express'
import { supabase } from '../config/supabase.js'
import type { User } from '../models/User.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nom, prenom, email, createdAt')
    .order('id', { ascending: true })

  const users = data as User[] | null
  res.json({ data: users, error })
}
