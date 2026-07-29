export const authStore = {
  // We strictly rely on HttpOnly backend cookies for authentication tokens (`vm_token`).
  // Profile metadata (email, role, name) is kept inside sessionStorage so it clears automatically when the browser session ends.
  
  getUser: () => {
    try {
      const data = sessionStorage.getItem('vm_user') || localStorage.getItem('vm_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Failed to parse user profile from session:", e);
      return null;
    }
  },
  
  setAuth: (user) => {
    if (!user) return;
    // Sanitize: ensure no token or sensitive credentials are ever written to browser storage
    const sanitizedUser = {
      email: user.email || user.emp_id || '',
      role: user.role || 'analyst',
      name: user.name || user.email || ''
    };
    try {
      sessionStorage.setItem('vm_user', JSON.stringify(sanitizedUser));
      // Clean up any legacy localStorage entry if present
      localStorage.removeItem('vm_user');
    } catch (e) {
      console.error("Failed to persist user profile:", e);
    }
  },
  
  clearAuth: () => {
    sessionStorage.removeItem('vm_user');
    localStorage.removeItem('vm_user');
  },
};
