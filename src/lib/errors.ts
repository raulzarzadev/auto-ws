export class AppError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ValidationError extends AppError {
  constructor(readonly issues: string[]) {
    super('Datos inválidos')
    this.name = 'ValidationError'
  }
}
