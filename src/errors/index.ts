export class ExtensionError extends Error {
    constructor(
        message: string,
        public code: string,
    ) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

export class ValidationError extends ExtensionError {
    constructor(message = 'Validation failed') {
        super(message, 'VALIDATION_ERROR')
    }
}

export function handleError(error: unknown): ExtensionError {
    if (error instanceof ExtensionError) {
        return error
    }

    console.error('Unhandled error:', error)
    return new ExtensionError(
        'An unexpected error occurred',
        'INTERNAL_SERVER_ERROR',
    )
}
