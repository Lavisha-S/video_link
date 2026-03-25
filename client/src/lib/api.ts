const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

export interface TokenResponse {
  token: string;
  identity: string;
  roomName: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetches a Twilio Video access token from the backend.
 * Handles network errors, HTTP errors, and malformed responses.
 */
export async function fetchToken(
  identity: string,
  roomName: string,
  signal?: AbortSignal
): Promise<TokenResponse> {
  let response: Response;

  try {
    response = await fetch(`${SERVER_URL}/generate-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, roomName }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Request was cancelled.");
    }
    // Network failure (server down, DNS issue, etc.)
    throw new ApiError(
      "Cannot connect to the server. Please check your connection and that the backend is running."
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("Server returned an invalid response.");
  }

  if (!response.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : `Server error (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (!data.token || typeof data.token !== "string") {
    throw new ApiError("Server response missing token.");
  }

  return data as unknown as TokenResponse;
}
