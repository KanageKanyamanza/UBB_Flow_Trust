import { Router } from 'express'
import { BudgetController } from '../controllers/budget.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router = Router()

router.use(isAuthenticated)

router.get('/', BudgetController.getBudgets)
router.post('/', BudgetController.setBudget)
router.get('/comparison', BudgetController.getComparison)

export default router
