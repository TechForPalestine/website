import axios from 'axios';

const API_URL = 'https://app.techforpalestine.org/api/method/';
// const API_URL = 'http://172.236.98.135/api/method/';

// Define Axios instance with headers
const axiosInstance = axios.create({
  baseURL: API_URL, // Set the base URL here
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'token bf60d1f18ef8fb3:b844ff47901eeb5',
  },
});

// ✅ Fetch form fields from API
export const fetchFormFields = async (url:any) => {
  try {
    const response = await axiosInstance.get(url); // Endpoint relative to the base URL
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to load form fields';
  }
};

export const convertToFormData = (data: any, form = new FormData(), parentKey = '') => {
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      const newKey = parentKey ? `${parentKey}[${key}]` : key;
      if (value instanceof File) {
        // ✅ Append files directly
        form.append(newKey, value);
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // If the value is an object, stringify it
        form.append(newKey, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        // If it's an array, stringify each array element (if it's an object)
        form.append(newKey, JSON.stringify(value));
      } else {
        // If it's a simple value, append it directly
        form.append(newKey, value);
      }
    }
  }
  return form;
};

export const submitForm = async (url: any, formData: any) => {
  try {
    // Convert the data object to FormData
    const form = convertToFormData(formData);

    // Send the FormData object via POST
    const response = await axiosInstance.post(url, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log(response.data ,"response.data")
    return response.data;
  } catch (error: any) {
    //throw error.response?.data?.message || 'An error occurred';
    return error.response?.data;
  }
};
