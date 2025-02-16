export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
    ) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 'NOT_FOUND')
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 'VALIDATION_ERROR')
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 'UNAUTHORIZED')
    }
}

export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 'DATABASE_ERROR')
    }
}

export function handleError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error
    }

    console.error('Unhandled error:', error)
    return new AppError('An unexpected error occurred', 'INTERNAL_SERVER_ERROR')
}
