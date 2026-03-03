import { Router } from 'express'
import { register, login, refreshToken, logout } from '../controllers/authController.js'
import { getUsers } from '../controllers/userController.js'
import { getCurrentUser, updateProfile, changePassword } from '../controllers/profileController.js'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByPeriod,
  getChartData,
} from '../controllers/transactionController.js'
import { authenticateAccessToken } from '../middleware/auth.js'

const router = Router()

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prenom, email, password, confirmPassword]
 *             properties:
 *               nom: { type: string, example: "Dupont" }
 *               prenom: { type: string, example: "Jean" }
 *               email: { type: string, format: email, example: "jean.dupont@example.com" }
 *               password: { type: string, format: password, example: "MotDePasse123!" }
 *               confirmPassword: { type: string, format: password, example: "MotDePasse123!" }
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Erreur de validation ou email déjà utilisé
 */
router.post('/auth/register', register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "jean.dupont@example.com" }
 *               password: { type: string, format: password, example: "MotDePasse123!" }
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post('/auth/login', login)

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rafraîchir l'access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 *     responses:
 *       200:
 *         description: Nouveau token généré
 *       401:
 *         description: Refresh token invalide ou expiré
 */
router.post('/auth/refresh', refreshToken)

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/auth/logout', authenticateAccessToken, logout)

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 */
router.get('/profile', authenticateAccessToken, getCurrentUser)

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom: { type: string, example: "Dupont" }
 *               prenom: { type: string, example: "Jean" }
 *               email: { type: string, format: email, example: "jean.dupont@example.com" }
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       401:
 *         description: Non authentifié
 */
router.put('/profile', authenticateAccessToken, updateProfile)

/**
 * @swagger
 * /change-password:
 *   post:
 *     summary: Changer le mot de passe
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *               confirmPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Mot de passe modifié
 *       401:
 *         description: Mot de passe actuel incorrect
 */
router.post('/change-password', authenticateAccessToken, changePassword)

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Liste de tous les utilisateurs (admin)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */
router.get('/users', authenticateAccessToken, getUsers)

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Récupérer toutes les catégories de l'utilisateur
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [recette, depense]
 *         description: Filtrer par type de catégorie
 *     responses:
 *       200:
 *         description: Liste des catégories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/categories', authenticateAccessToken, getCategories)

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Créer une nouvelle catégorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, type]
 *             properties:
 *               nom: { type: string, example: "Alimentation" }
 *               type: { type: string, enum: [recette, depense], example: "depense" }
 *     responses:
 *       201:
 *         description: Catégorie créée
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: Catégorie déjà existante
 */
router.post('/categories', authenticateAccessToken, createCategory)

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Modifier une catégorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom: { type: string, example: "Alimentation" }
 *               type: { type: string, enum: [recette, depense], example: "depense" }
 *     responses:
 *       200:
 *         description: Catégorie modifiée
 *       404:
 *         description: Catégorie non trouvée
 */
router.put('/categories/:id', authenticateAccessToken, updateCategory)

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Supprimer une catégorie
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie supprimée
 *       404:
 *         description: Catégorie non trouvée
 */
router.delete('/categories/:id', authenticateAccessToken, deleteCategory)

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Récupérer toutes les transactions de l'utilisateur
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [recette, depense]
 *         description: Filtrer par type de transaction
 *     responses:
 *       200:
 *         description: Liste des transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */
router.get('/transactions', authenticateAccessToken, getTransactions)

/**
 * @swagger
 * /transactions/period:
 *   get:
 *     summary: Récupérer les transactions par période
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-12-31"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [recette, depense]
 *     responses:
 *       200:
 *         description: Transactions de la période
 */
router.get('/transactions/period', authenticateAccessToken, getTransactionsByPeriod)

/**
 * @swagger
 * /chart-data:
 *   get:
 *     summary: Données pour les graphiques (derniers mois)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Nombre de mois à récupérer
 *     responses:
 *       200:
 *         description: Données des graphiques
 */
router.get('/chart-data', authenticateAccessToken, getChartData)

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Créer une nouvelle transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *           example:
 *             type: "depense"
 *             designation: "Courses alimentaires"
 *             quantite: 1
 *             prix_unitaire: 45.50
 *             categorie_id: 1
 *             date: "2024-03-01T10:30:00Z"
 *     responses:
 *       201:
 *         description: Transaction créée
 *       400:
 *         description: Erreur de validation
 */
router.post('/transactions', authenticateAccessToken, createTransaction)

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Modifier une transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       200:
 *         description: Transaction modifiée
 *       404:
 *         description: Transaction non trouvée
 */
router.put('/transactions/:id', authenticateAccessToken, updateTransaction)

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Supprimer une transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la transaction
 *     responses:
 *       200:
 *         description: Transaction supprimée
 *       404:
 *         description: Transaction non trouvée
 */
router.delete('/transactions/:id', authenticateAccessToken, deleteTransaction)

export default router
