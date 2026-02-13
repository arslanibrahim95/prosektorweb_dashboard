/**
 * API Errors Module
 * 
 * Merkezi hata yönetimi modülü.
 * 
 * @example
 * import { createError, createValidationError } from '@/server/errors';
 */

export { ErrorCodes, ErrorCodeToStatus } from './error-codes';
export type { ErrorCode } from './error-codes';

export { errorMessages, translateError } from './messages.tr';

export {
    createError,
    createValidationError,
    createAuthError,
    createNotFoundError,
    createConflictError,
    createInternalError,
    createRateLimitError,
    getErrorStatus,
    isClientSafeError,
    type CreateErrorOptions,
    type ApiErrorBody,
    type ErrorDetails,
} from './error-service';
