type TransformableValue = string | number | boolean | null | undefined;

interface NestedObject {
  [key: string]: TransformableValue | TransformableValue[] | NestedObject | NestedObject[];
}

export const transformObject = (data: NestedObject): NestedObject => {
  // Loop through each key in the object
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];

      // If the value is an object and contains an array, transform it
      if (value && typeof value === "object" && !Array.isArray(value)) {
        // Check each key in the sub-object
        for (const subKey in value) {
          if (Array.isArray(value[subKey])) {
            // Replace the original object with an array of objects
            data[key] = value[subKey].map((item: any) => ({
              [subKey]: item,
            }));
          }
        }
      }

      // Recursively process nested objects
      if (typeof data[key] === "object" && !Array.isArray(data[key]) && data[key] !== null) {
        data[key] = transformObject(data[key] as NestedObject);
      }
    }
  }

  return data;
};
