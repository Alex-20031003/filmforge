export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details: unknown | null

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details: unknown | null = null,
  ) {
    super(message)

    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}
