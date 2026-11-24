import type { RequestHandler } from 'express'
import { getEmployee, getEmployees } from './employees.service.js'
import { updateEmployee } from './employees.service.js'

export const getEmployeesController: RequestHandler = async (req, res) => {
  const queryParams = res.locals.validatedQuery

  const { data, meta } = await getEmployees(queryParams)

  res.status(200).json({
    data,
    meta,
  })
}

export const getEmployeeController: RequestHandler = async (req, res) => {
  const { userId } = res.locals.validatedParams

  const data = await getEmployee(userId)

  res.status(200).json({
    data,
  })
}

export const updateEmployeeController: RequestHandler = async (req, res) => {
  const { userId: targetsUserId } = res.locals.validatedParams
  const { userId: requesterUserId } = res.locals.auth
  const updateData = req.body
  const data = await updateEmployee(targetsUserId, updateData, requesterUserId)

  res.status(200).json({
    data,
  })
}
