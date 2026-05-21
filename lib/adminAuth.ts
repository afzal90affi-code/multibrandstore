export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "123456";
const STORAGE_KEY = "multibrand-admin-auth";

export function isAdminLoggedIn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function loginAdmin(username: string, password: string) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem(STORAGE_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
