import { Router } from 'express'
import { requireAccessToken } from '../../middleware/require-access-token.middleware.js'
import {
  getEmployeeController,
  getEmployeesController,
  updateEmployeeController,
} from './employees.controller.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middleware/validate-request.middleware.js'
import {
  employeeIdParamSchema,
  employeeQueryParamsSchema,
  updateEmployeeBodySchema,
} from './employees.schemas.js'

export const router = Router()

router.get(
  '/',
  requireAccessToken,
  validateQuery(employeeQueryParamsSchema),
  getEmployeesController,
)
router.get(
  '/:userId',
  requireAccessToken,
  validateParams(employeeIdParamSchema),
  getEmployeeController,
)
router.patch(
  '/:userId',
  requireAccessToken,
  validateParams(employeeIdParamSchema),
  validateBody(updateEmployeeBodySchema),
  updateEmployeeController,
)
