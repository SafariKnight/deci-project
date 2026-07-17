export const ERROR_CODES = {
  AUTH: {
    EMAIL_IN_USE: "email_in_use",
    EMAIL_MISSING: "email_missing",
    WRONG_PASSWORD: "wrong_password",
    INVALID_TOKEN: "invalid_token",
    TOKEN_NOT_FOUND: "token_not_found",
    MISSING_TOKEN: "missing_token",
  },
  USER: {
    NOT_FOUND: "user_not_found",
    MISSING: "missing_user",
    UNAUTHORIZED: "not_authorized",
    FORBIDDEN: "forbidden",
    EMAIL_EXISTS: "email_exists",
  },
  FILE: {
    NOT_FOUND: "file_not_found",
    MISSING: "missing_file",
    UPLOAD_FAILED: "file_does_not_exist",
    DELETE_FAILED: "could_not_delete",
    UNKNOWN: "unknown_error",
  },
  PRODUCT: {
    NOT_FOUND: "product_not_found",
    DOCUMENT_NOT_FOUND: "document_not_found",
    INVALID_DATA: "invalid_product_data",
    DATABASE_ERROR: "database_error",
  },
  REVIEW: {
    NOT_FOUND: "review_not_found",
    INVALID_DATA: "invalid_review_data",
    DATABASE_ERROR: "review_database_error",
    PRODUCT_NOT_FOUND: "review_product_not_found",
  },
  CART: {
    NOT_FOUND: "cart_not_found",
    PRODUCT_NOT_FOUND: "cart_product_not_found",
    PRODUCT_ALREADY_IN_CART: "product_already_in_cart",
    DATABASE_ERROR: "cart_database_error",
    INVALID_DATA: "invalid_cart_data",
  },
} as const;

export type ErrorCode =
  | (typeof ERROR_CODES.AUTH)[keyof typeof ERROR_CODES.AUTH]
  | (typeof ERROR_CODES.USER)[keyof typeof ERROR_CODES.USER]
  | (typeof ERROR_CODES.FILE)[keyof typeof ERROR_CODES.FILE]
  | (typeof ERROR_CODES.PRODUCT)[keyof typeof ERROR_CODES.PRODUCT]
  | (typeof ERROR_CODES.REVIEW)[keyof typeof ERROR_CODES.REVIEW]
  | (typeof ERROR_CODES.CART)[keyof typeof ERROR_CODES.CART];

export type Result<S, E = { error: ErrorCode }> =
  (S & { ok: true }) | (E & { ok: false });
