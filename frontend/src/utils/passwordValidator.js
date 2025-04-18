/**
 * Validates password strength based on enterprise requirements
 * @param {string} password - Password to validate
 * @returns {Object} Result object with valid flag and error messages
 */
export const validatePassword = (password) => {
    const errors = [];
    
    // Minimum length check
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    
    // Character variety checks
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must include at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must include at least one lowercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Password must include at least one number");
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("Password must include at least one special character");
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };