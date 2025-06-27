const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

interface FetchOptions extends RequestInit {
  isText?: boolean;
}

export async function api<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      throw new Error(
        errorData?.message || `HTTP error! status: ${response.status}`
      );
    }

    if (
      options.isText ||
      response.headers.get("content-type")?.includes("text/plain")
    ) {
      return response.text() as Promise<T>;
    }

    return response.json();
  } catch (error) {
    console.error(`API Error fetching ${endpoint}:`, error);
    throw error;
  }
}
