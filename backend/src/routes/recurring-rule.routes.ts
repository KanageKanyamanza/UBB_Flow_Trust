import { Router } from 'express'
import { RecurringRuleController } from '../controllers/recurring-rule.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAuthenticated)

router.get('/', RecurringRuleController.list)
router.post('/', RecurringRuleController.create)
router.get('/:id', RecurringRuleController.getOne)
router.put('/:id', RecurringRuleController.update)
router.delete('/:id', RecurringRuleController.delete)

export default router
