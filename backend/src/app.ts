import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const app = express()
// Utilise le port défini par l'environnement ou 3000 par défaut
const PORT = process.env.PORT || 3000

// Middleware pour parser le JSON (optionnel mais recommandé)
app.use(express.json())

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

// On initialise le client une seule fois pour toute l'app
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// liste des utilisateurs
app.get('/users', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('id', { ascending: true })
  console.log('Data:', data)
  console.log('Error:', error)
  res.json({ data, error })
})

// inscription d'un utilisateur
app.post('/register', async (req: Request, res: Response) => {
  const { nom, prenom, email, password, confirmPassword, createdAt } = req.body
  console.log('body register', req.body)

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Les mots de passe ne correspondent pas',
        type: 'danger'
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const { data, error } = await supabase.from('users').insert([
      {
        nom,
        prenom,
        email,
        password: hashedPassword,
        createdAt
      }
    ])
    if (error) {
      console.log('Error:', error)
      res.status(500).json({ error })
    } else {
      console.log('Data register:', data)
      res.json({ data })
    }
  } catch (err: any) {
    console.error("Erreur lors de l'enregistrement :", err)
    res.status(400).json({
      message: err.message,
      type: 'danger'
    })
  }
})
// Connexion d'un utilisateur
app.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  console.log('body login', req.body)

  try {
    // Vérification si l'utilisateur existe

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    if (!data) {
      return res.status(400).json({
        message: 'Email ou mot de passe incorrect',
        type: 'danger'
      })
    }

    // Vérification du mot de passe
    const validPassword = await bcrypt.compare(password, data.password)
    if (!validPassword) {
      return res.status(400).json({
        message: 'Email ou mot de passe incorrect',
        type: 'danger'
      })
    }
    // Création d'un token
    const token = jwt.sign(
      { userId: data.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' } // Le token expire après 24h
    )

    if (error) {
      console.log('Error:', error)
      res.status(401).json({ error: 'Invalid email or password' })
    } else {
      console.log('Data login:', data)
      res.json({ data, token })
    }
  } catch (err) {
    console.error('Erreur lors de la connexion :', err)
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      type: 'danger'
    })
  }
})

// deconnexion d'un utilisateur
app.post('/logout', (req: Request, res: Response) => {
    try {
        res.status(200).json({
            message: "Déconnexion réussie!",
            type: "success"
        });
    } catch (err) {
        console.error("Erreur lors de la déconnexion :", err);
        res.status(500).json({
            message: "Erreur lors de la déconnexion",
            type: "danger"
        });
    }
})

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
