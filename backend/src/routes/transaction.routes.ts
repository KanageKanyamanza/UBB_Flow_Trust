import { Router } from 'express'
import { TransactionController } from '../controllers/transaction.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router = Router()

// All transaction routes require authentication
router.use(isAuthenticated)

/**
 * @route   POST /transactions
 * @desc    Create a new transaction and update account balance
 * @access  Private
 */
router.post('/', TransactionController.create)

/**
 * @route   GET /transactions
 * @desc    List all transactions with optional filters (accountId, category, direction, date range)
 * @access  Private
 */
router.get('/', TransactionController.list)

/**
 * @route   GET /transactions/:id
 * @desc    Get detailed info of a single transaction
 * @access  Private
 */
router.get('/:id', TransactionController.getOne)

/**
 * @route   DELETE /transactions/:id
 * @desc    Delete a transaction and reverse its impact on account balance
 * @access  Private
 */
router.delete('/:id', TransactionController.delete)

export default router
