import axios from "axios";

// All requests go through the server-side proxy at /api/project-proxy.
// The proxy adds the Authorization header — the secret key is never bundled
// into client-side JavaScript.
const proxyInstance = axios.create({
  baseURL: "/api/project-proxy",
  headers: { "Content-Type": "application/json" },
});

// ✅ Fetch form fields from API
export const fetchFormFields = async (url: any) => {
  try {
    const response = await proxyInstance.get("", {
      params: { path: `/api/method${url}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to load form fields";
  }
};

export const fetchFieldData = async (url: any) => {
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
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to load form fields";
  }
};

export const convertToFormData = (data: any, form = new FormData(), parentKey = "") => {
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
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
        form.append(newKey, value);
      }
    }
  }
  return form;
};

export const submitForm = async (url: any, formData: any) => {
  try {
    const form = convertToFormData(formData);
    const response = await proxyInstance.post("", form, {
      params: { path: `/api/method${url}` },
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data;
  }
};
