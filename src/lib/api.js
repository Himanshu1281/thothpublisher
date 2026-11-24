const KEY = 'thoth-token';
export const token = { get: () => localStorage.getItem(KEY), set: t => t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY) };

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token.get() ? { Authorization: 'Bearer ' + token.get() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'request_failed'); e.code = data.error; e.status = res.status; e.data = data; throw e; }
  return data;
}
