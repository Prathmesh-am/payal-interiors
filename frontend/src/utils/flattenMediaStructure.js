// utils/flattenMediaStructure.js
export const flattenMediaStructure = (data, folderPath = '') => {
  let files = [];

  for (const key in data) {
    const value = data[key];

    if (key === 'files' && Array.isArray(value)) {
      // Add all files, include their folder path
      files.push(
        ...value.map((file) => ({
          ...file,
          path: folderPath,
        }))
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recurse deeper into the object
      files = files.concat(flattenMediaStructure(value, `${folderPath}/${key}`));
    }
  }

  return files;
};
