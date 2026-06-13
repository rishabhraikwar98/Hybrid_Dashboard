const BASE = process.env.NEXT_PUBLIC_API_URL;

async function handleResponse(res: Response) {
  if (!res.ok) {
    try {
      const err = await res.json();
      const error = new Error(err.error || 'Something went wrong') as any;
      error.status = res.status; // ← preserve status code
      throw error;
    } catch (e: any) {
      if (e.status) throw e; // already a clean error, rethrow
      throw new Error(`Request failed with status ${res.status}`);
    }
  }
  return res.json();
}

export async function fetchProducts(
  params: Record<string, string>,
  signal?: AbortSignal
) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/api/products?${qs}`, {
    cache: 'no-store',
    signal,
  });
  return handleResponse(res);
}

export async function fetchProduct(id: string) {
  const res = await fetch(`${BASE}/api/products/${id}`, { cache: 'no-store' });
  return handleResponse(res);
}

export async function createProduct(data: Record<string, any>) {
  const res = await fetch(`${BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateProduct(id: string, data: Record<string, any>) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function toggleStock(id: string, stock: number, simulateError = false) {
  const res = await fetch(
    `${BASE}/api/products/${id}/stock${simulateError ? '?simulateError=true' : ''}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    }
  );
  return handleResponse(res);
}