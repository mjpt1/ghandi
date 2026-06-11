/** کلاینت سبک API گلوسیا — مدیریت توکن و خطاهای فارسی */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => (accessToken = t);

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'خطا در ارتباط با سرور');
  }
  return res.json();
}

// ---------- نمونه‌های آماده ----------
export const AuthApi = {
  login: (phone: string, password: string) =>
    api<{ accessToken: string; refreshToken: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),
  register: (data: { phone: string; password: string; fullName: string; role?: string }) =>
    api<{ accessToken: string; refreshToken: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const PatientsApi = {
  list: () => api<any[]>('/patients'),
  detail: (id: string) => api<any>(`/patients/${id}`),
  me: () => api<any>('/patients/me'),
};

export const RxApi = {
  create: (data: unknown) =>
    api('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  mine: () => api<any[]>('/prescriptions/mine'),
};

export const AdminApi = {
  stats: () => api<any>('/admin/stats'),
  users: (q?: string) => api<any[]>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  toggle: (id: string) => api<any>(`/admin/users/${id}/toggle`, { method: 'PATCH' }),
};

export const ClinicalAiApi = {
  analyze: (patientId: string) => api<any[]>(`/ai/clinical/${patientId}`),
};

export const ChatApi = {
  partners: () => api<any[]>('/chat/partners'),
  conversations: () => api<any[]>('/chat/conversations'),
  open: (partnerUserId: string) =>
    api<any>('/chat/conversations', { method: 'POST', body: JSON.stringify({ partnerUserId }) }),
  messages: (id: string) => api<any[]>(`/chat/conversations/${id}/messages`),
  send: (id: string, body: string) =>
    api<any>(`/chat/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
};

export const FoodAiApi = {
  detect: (imageBase64: string) =>
    api<any>('/ai/food-photo', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
};

export const GlucoseApi = {
  list: () => api<unknown[]>('/glucose'),
  stats: (days = 7) => api<unknown>(`/glucose/stats?days=${days}`),
  create: (valueMgDl: number, context?: string) =>
    api('/glucose', { method: 'POST', body: JSON.stringify({ valueMgDl, context }) }),
};

export const AiApi = {
  coach: () => api<unknown[]>('/ai/coach'),
  predict: () => api<unknown>('/ai/predict'),
};

export const FoodsApi = {
  search: (q: string) => api<unknown[]>(`/foods?q=${encodeURIComponent(q)}`),
  impact: (id: string, servings = 1) => api<unknown>(`/foods/${id}/impact?servings=${servings}`),
};
