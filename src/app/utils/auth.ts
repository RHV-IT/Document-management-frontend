export function getCurrentUser() {
  const session = sessionStorage.getItem('rhv_session');
  if (!session) return null;
  
  try {
    const userData = JSON.parse(session);
    return userData.user;
  } catch {
    return null;
  }
}

export function isAdmin() {
  const user = getCurrentUser();
  return user?.role === 'admin';
}
