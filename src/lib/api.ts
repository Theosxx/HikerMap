const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL belum dikonfigurasi");
}

type ApiResult = {
  message?: string;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  errors?: Record<string, string[]>;
};

async function request(
  path: string,
  body: Record<string, string>
): Promise<ApiResult> {
  let response: Response;

   try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("API URL:", API_URL);
    console.error("Request path:", path);
    console.error("Network error:", error);

    throw new Error(
      `Gagal menghubungi ${API_URL}${path}. Periksa koneksi dan terminal backend.`
    );
  }

  const result = (await response.json().catch(() => ({}))) as ApiResult;

  if (!response.ok) {
    const validationErrors = result.errors
      ? Object.values(result.errors).flat().join("\n")
      : "";

    throw new Error(
      validationErrors || result.message || "Permintaan gagal."
    );
  }

  return result;
}

export function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  return request("/api/auth/register", data);
}

export function loginUser(data: {
  identifier: string;
  password: string;
}) {
  return request("/api/auth/login", data);
}