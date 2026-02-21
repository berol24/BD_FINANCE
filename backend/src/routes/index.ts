import { Router } from 'express'
import { register, login, refreshToken, logout } from '../controllers/authController.js'
import { getUsers } from '../controllers/userController.js'
import { getCurrentUser } from '../controllers/profileController.js'
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
} from '../controllers/transactionController.js'
import { authenticateAccessToken } from '../middleware/auth.js'

const router = Router()

router.post('/auth/register', register)
router.post('/auth/login', login)
router.post('/auth/refresh', refreshToken)
router.post('/auth/logout', authenticateAccessToken, logout)

router.get('/profile', authenticateAccessToken, getCurrentUser)
router.get('/users', authenticateAccessToken, getUsers)

// Categories routes
router.get('/categories', authenticateAccessToken, getCategories)
router.post('/categories', authenticateAccessToken, createCategory)
router.put('/categories/:id', authenticateAccessToken, updateCategory)
router.delete('/categories/:id', authenticateAccessToken, deleteCategory)

// Transactions routes
router.get('/transactions', authenticateAccessToken, getTransactions)
router.post('/transactions', authenticateAccessToken, createTransaction)
router.put('/transactions/:id', authenticateAccessToken, updateTransaction)
router.delete('/transactions/:id', authenticateAccessToken, deleteTransaction)

export default router
