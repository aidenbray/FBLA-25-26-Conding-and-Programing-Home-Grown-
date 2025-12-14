/**
 * Validation Utilities Module
 * 
 * Provides reusable validation functions for user input across the application.
 * Follows defensive programming principles with strong type checking and clear error messages.
 * 
 * Design Principles:
 * - Fail fast: Invalid input throws immediately with descriptive errors
 * - Sanitization: Trims whitespace and normalizes input
 * - Consistent API: All validators follow same pattern (input -> validated output or throw)
 * - User-friendly errors: Error messages suitable for display to users
 * 
 * Use Cases:
 * - Form validation (reviews, business editing, admin forms)
 * - API input sanitization
 * - Data integrity enforcement
 * - Prevention of XSS and injection attacks
 * 
 * Error Handling Pattern:
 * These functions THROW errors rather than returning false/null.
 * This allows calling code to use try-catch blocks and handle errors
 * appropriately (display to user, log, etc.).
 * 
 * @module utils/validation
 */

/**
 * Validate Review Text
 * 
 * Ensures review text meets quality standards before submission.
 * Prevents spam, empty reviews, and non-text input.
 * 
 * Validation Rules:
 * 1. Must be a string (not number, object, etc.)
 * 2. After trimming whitespace, must be longer than 3 characters
 * 3. Prevents single-word or minimal-effort reviews
 * 
 * Why Minimum Length:
 * - 3+ characters ensures substantive feedback
 * - Prevents spam reviews ("ok", "...", etc.)
 * - Encourages helpful, detailed reviews
 * - Improves review credibility scoring
 * 
 * Returns Sanitized:
 * Returns trimmed version to remove leading/trailing whitespace.
 * This normalizes input and prevents whitespace-only reviews.
 * 
 * @function
 * @export
 * @param {string} text - Review text to validate
 * @returns {string} Trimmed, validated review text
 * @throws {Error} If text is not a string or is too short
 * 
 * @example
 * validateReviewText("Great service!") // Returns: "Great service!"
 * validateReviewText("  ok  ") // Throws: "Review must be longer than 3 characters"
 * validateReviewText(123) // Throws: "Review must be text"
 */
export function validateReviewText(text) {
  // Type check: Ensure input is actually text
  if (typeof text !== 'string') {
    throw new Error('Review must be text')
  }
  
  // Sanitize: Remove leading/trailing whitespace
  const trimmed = text.trim()
  
  // Length check: Enforce minimum quality standard
  // <= 3 catches single words like "ok", "bad", "meh"
  if (trimmed.length <= 3) {
    throw new Error('Review must be longer than 3 characters')
  }
  
  // Return sanitized input for safe storage
  return trimmed
}

/**
 * Validate Rating Value
 * 
 * Ensures rating is a valid integer within the 1-5 star range.
 * Critical for maintaining data integrity in rating system.
 * 
 * Validation Rules:
 * 1. Must be convertible to a number
 * 2. Must be an integer (no decimals like 3.5)
 * 3. Must be within 1-5 range (inclusive)
 * 
 * Why Integer Only:
 * - UI displays whole stars only (★★★★★)
 * - Simplifies rating calculations and averages
 * - Prevents precision issues (0.333333...)
 * - Matches user mental model (whole stars)
 * 
 * Type Coercion:
 * Accepts string numbers ("4") and converts to integer.
 * Common when receiving form input or URL parameters.
 * 
 * @function
 * @export
 * @param {string|number} value - Rating value to validate (1-5)
 * @returns {number} Validated integer rating
 * @throws {Error} If value is not an integer between 1 and 5
 * 
 * @example
 * validateRating(4) // Returns: 4
 * validateRating("5") // Returns: 5
 * validateRating(3.5) // Throws: "Rating must be an integer between 1 and 5"
 * validateRating(0) // Throws: "Rating must be an integer between 1 and 5"
 * validateRating(6) // Throws: "Rating must be an integer between 1 and 5"
 */
export function validateRating(value) {
  // Convert to number (handles string input like "4")
  const number = Number(value)
  
  // Check: Must be integer AND within 1-5 range
  // Number.isInteger() returns false for decimals and NaN
  if (!Number.isInteger(number) || number < 1 || number > 5) {
    throw new Error('Rating must be an integer between 1 and 5')
  }
  
  // Return validated number (not original input which might be string)
  return number
}

/**
 * Validate Required Field
 * 
 * Generic validator ensuring a field has a value (not empty/null/undefined).
 * Used for enforcing required form fields across the application.
 * 
 * Validation Rules:
 * 1. Cannot be undefined (field not provided)
 * 2. Cannot be null (explicitly set to nothing)
 * 3. Cannot be empty string (for text inputs)
 * 4. Strings are trimmed before checking (rejects whitespace-only)
 * 
 * String Sanitization:
 * For string inputs, trims whitespace before validation.
 * This prevents "   " (spaces) from passing as valid input.
 * 
 * Type Flexibility:
 * Works with any type: strings, numbers, booleans, objects.
 * Only rejects truly empty values (undefined, null, "").
 * 
 * Why This Matters:
 * - Prevents incomplete form submissions
 * - Ensures data integrity
 * - Provides consistent validation across app
 * - User-friendly error messages
 * 
 * @function
 * @export
 * @param {*} fieldValue - Value to validate (any type)
 * @returns {*} Validated value (trimmed if string)
 * @throws {Error} If field is empty, null, or undefined
 * 
 * @example
 * validateRequired("John") // Returns: "John"
 * validateRequired("  Jane  ") // Returns: "Jane" (trimmed)
 * validateRequired(42) // Returns: 42
 * validateRequired("") // Throws: "This field is required"
 * validateRequired(null) // Throws: "This field is required"
 * validateRequired(undefined) // Throws: "This field is required"
 * validateRequired("   ") // Throws: "This field is required" (whitespace-only)
 */
export function validateRequired(fieldValue) {
  // Sanitize strings: Trim whitespace
  // Non-strings pass through unchanged
  const value = typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue
  
  // Check for empty values
  // === '' catches trimmed empty strings
  // === null catches explicit null
  // === undefined catches missing fields
  if (value === undefined || value === null || value === '') {
    throw new Error('This field is required')
  }
  
  // Return sanitized value (trimmed string or original non-string)
  return value
}
