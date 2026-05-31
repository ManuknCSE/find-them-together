/**
 * API client to communicate with the Express backend.
 * Handles base URLs, standard headers, JWT injection, and token refresh.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Inject Access Token if available
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("ft-token") : null;
  if (accessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response = await fetch(fullUrl, fetchOptions);

  // If 401 Unauthorized, attempt to rotate refresh token
  if (response.status === 401) {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("ft-refresh-token") : null;
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.accessToken || refreshData.token;
          const newRefreshToken = refreshData.refreshToken;

          if (typeof window !== "undefined") {
            localStorage.setItem("ft-token", newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem("ft-refresh-token", newRefreshToken);
            }
          }

          // Retry original request with new access token
          headers["Authorization"] = `Bearer ${newAccessToken}`;
          response = await fetch(fullUrl, { ...fetchOptions, headers });
        } else {
          // Refresh token expired/invalid, clear auth state
          if (typeof window !== "undefined") {
            localStorage.removeItem("ft-token");
            localStorage.removeItem("ft-refresh-token");
            localStorage.removeItem("ft-user");
          }
        }
      } catch (refreshError) {
        console.error("Token rotation failed:", refreshError);
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch (e) {
      // JSON parsing failed, use fallback
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses or 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
