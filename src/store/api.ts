import axios, { isAxiosError } from "axios";

// All requests go through the server-side proxy at /api/project-proxy.
// The proxy adds the Authorization header — the secret key is never bundled
// into client-side JavaScript.
const proxyInstance = axios.create({
  baseURL: "/api/project-proxy",
  headers: { "Content-Type": "application/json" },
});

// Error contract (callers depend on it, do not unify): the fetch* helpers
// THROW a plain string (the API's message or a fallback), while submitForm
// RETURNS the error response body instead of throwing, so forms can render
// field-level errors from it.
function apiErrorMessage(error: unknown): string {
  const message = isAxiosError(error) ? error.response?.data?.message : undefined;
  return message || "Failed to load form fields";
}

// Fetch form fields from API
export const fetchFormFields = async (url: string) => {
  try {
    const response = await proxyInstance.get("", {
      params: { path: `/api/method${url}` },
    });
    return response.data;
  } catch (error) {
    throw apiErrorMessage(error);
  }
};

export const fetchFieldData = async (url: string) => {
  try {
    // url may be a full URL or a relative path — normalise to a relative path
    let path: string;
    try {
      path = new URL(url).pathname;
    } catch {
      path = url.startsWith("/") ? url : `/${url}`;
    }
    const response = await proxyInstance.get("", { params: { path } });
    return response.data;
  } catch (error) {
    throw apiErrorMessage(error);
  }
};

export const convertToFormData = (
  data: Record<string, unknown>,
  form = new FormData(),
  parentKey = ""
) => {
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      const newKey = parentKey ? `${parentKey}[${key}]` : key;
      if (value instanceof File) {
        form.append(newKey, value);
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        form.append(newKey, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        form.append(newKey, JSON.stringify(value));
      } else {
        form.append(newKey, value as string);
      }
    }
  }
  return form;
};

export const submitForm = async (url: string, formData: Record<string, unknown>) => {
  try {
    const form = convertToFormData(formData);
    const response = await proxyInstance.post("", form, {
      params: { path: `/api/method${url}` },
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    return isAxiosError(error) ? error.response?.data : undefined;
  }
};
