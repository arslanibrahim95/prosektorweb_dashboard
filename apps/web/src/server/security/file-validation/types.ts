export interface ValidationResult {
    valid: boolean;
    error?: string;
    details?: {
        detectedType?: string;
        declaredType?: string;
        extension?: string;
        size?: number;
        isPolyglot?: boolean;
        hasValidStructure?: boolean;
    };
}
