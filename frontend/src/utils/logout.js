/**
 * Centralized logout handler.
 * Invalidates backend session, clears all local state, redirects to Lovable login.
 */
const LOVABLE_LOGIN = `${process.env.REACT_APP_LOVABLE_URL || 'https://spetapp.com'}/login`;

export async function handleFullLogout(logoutFn) {
  try {
    const token = localStorage.getItem('spetap_token');
    const refreshToken = localStorage.getItem('spetap_refresh_token');
    if (token) {
      await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
  } catch {}
  if (logoutFn) logoutFn();
  localStorage.removeItem('spetap_token');
  localStorage.removeItem('spetap_refresh_token');
  window.location.href = LOVABLE_LOGIN;
}
