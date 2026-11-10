// Admin panel ki API calls — har call ke saath secret key header jayegi
export async function adminFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_API_KEY || "",
    },
  });
}