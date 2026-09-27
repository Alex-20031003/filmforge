import { Router } from 'express'
import { validateBody } from '../../middleware/validate-body.middleware.js'
import { loginBodySchema } from './auth.schemas.js'
import { loginController } from './auth.controller.js'

export const router = Router()

router.post('/login', validateBody(loginBodySchema), loginController)
