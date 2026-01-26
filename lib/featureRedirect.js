/**
 * Feature Redirect System
 * Manages authentication-required feature access with redirect logic
 */

/**
 * Store the intended feature path before redirecting to login
 * @param {string} featurePath - The path user wanted to access
 */
export function setIntendedFeature(featurePath) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('intended_feature', featurePath);
    }
}

/**
 * Get the stored intended feature path
 * @returns {string|null} The stored feature path or null
 */
export function getIntendedFeature() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('intended_feature');
    }
    return null;
}

/**
 * Clear the stored intended feature after successful redirect
 */
export function clearIntendedFeature() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('intended_feature');
    }
}

/**
 * Check if user is authenticated and redirect to login if not
 * @param {string} featurePath - The feature path to access
 * @param {Function} router - Next.js router instance
 * @param {Object} user - Current user object (null if not authenticated)
 * @returns {boolean} True if authenticated, false if redirected to login
 */
export function requireAuth(featurePath, router, user) {
    if (!user) {
        setIntendedFeature(featurePath);
        router.push('/login');
        return false;
    }
    return true;
}
