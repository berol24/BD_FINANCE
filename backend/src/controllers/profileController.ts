import type { Response } from 'express'
import { supabase } from '../config/supabase.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { User } from '../models/User.js'
import bcrypt from 'bcrypt'
import { findCountry } from '../data/countries.js'

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

    // select('*' ) évite l'erreur 404 si les colonnes pays/devise n'existent pas encore
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      res.status(404).json({ message: 'User not found', error })
      return
    }

    const { password: _password, ...user } = data as User & { password?: string }
    res.json({
      user: {
        ...user,
        pays: (user as any).pays ?? null,
        devise: (user as any).devise ?? 'EUR',
      },
    })
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message })
  }
}

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ message: 'User not authenticated' })
    return
  }

  try {
    const userId = parseInt(req.userId, 10)
    const { nom, prenom, email, pays } = req.body

    if (!nom || !prenom || !email) {
      res.status(400).json({ message: 'nom, prenom, and email are required' })
      return
    }

    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle()

    if (existingEmail) {
      res.status(400).json({ message: 'Email already taken' })
      return
    }

    // 1) Mise à jour de base (toujours possible)
    const { data, error } = await supabase
      .from('users')
      .update({ nom, prenom, email })
      .eq('id', userId)
      .select('*')
      .single()

    if (error || !data) {
      res.status(400).json({ message: 'Error updating profile', error })
      return
    }

    let user = data as User & { password?: string; pays?: string; devise?: string }
    let countryWarning: string | undefined

    // 2) Mise à jour pays/devise (optionnelle — nécessite les colonnes en base)
    if (pays) {
      const country = findCountry(pays)
      if (!country) {
        res.status(400).json({ message: 'Pays non reconnu' })
        return
      }

      const countryUpdate = await supabase
        .from('users')
        .update({ pays: country.code, devise: country.currency })
        .eq('id', userId)
        .select('*')
        .single()

      if (countryUpdate.error) {
        countryWarning =
          'Profil enregistré, mais le pays/devise n’a pas pu être sauvé. Exécutez backend/supabase/add_pays_devise.sql dans Supabase.'
      } else if (countryUpdate.data) {
        user = countryUpdate.data as typeof user
      }
    }

    const { password: _password, ...safeUser } = user
    res.json({
      message: countryWarning || 'Profile updated successfully',
      warning: countryWarning,
      user: safeUser,
    })
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating profile', error: err.message })
  }
}

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ message: 'User not authenticated' })
    return
  }

  try {
    const userId = parseInt(req.userId, 10)
    const { currentPassword, newPassword, confirmPassword } = req.body

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ message: 'All password fields are required' })
      return
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ message: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' })
      return
    }

    // Get current password hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect' })
      return
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)

    if (updateError) {
      res.status(400).json({ message: 'Error changing password', error: updateError })
      return
    }

    res.json({ message: 'Password changed successfully' })
  } catch (err: any) {
    res.status(500).json({ message: 'Error changing password', error: err.message })
  }
}
