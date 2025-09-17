

export type ApiError = { message: string; status: number };
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try { message = JSON.parse(text)?.message ?? text; } catch {}
    const err: ApiError = { message, status: res.status };
    throw err;
  }
  return (await res.json()) as T;
}