/**
 * Cliente HTTP tipado para a API.
 *
 * Centraliza base URL, headers e tratamento de erros.
 * Todos os services usam este client.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || "Erro na requisição");
  }

  return res.json();
}

// ─── Métodos de conveniência ─────────────────────────────────────────

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  healthCheck: () => request<{ status: string }>("/health"),
};
