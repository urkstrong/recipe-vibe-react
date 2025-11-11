import imageCompression from 'browser-image-compression';

/**
 * Compress an image file before upload
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const defaultOptions = {
    maxSizeMB: 0.5,              // Maximum file size in MB (500KB)
    maxWidthOrHeight: 1024,      // Max width/height in pixels
    useWebWorker: true,          // Use web worker for better performance
    fileType: file.type,         // Maintain original file type
    initialQuality: 0.8,         // Quality (0-1), 0.8 is good balance
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compression ratio: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Validate and compress profile photo
 * @param {File} file - The image file
 * @returns {Promise<File>} Compressed and validated image
 */
export const compressProfilePhoto = async (file) => {
  // Profile photos can be smaller
  return compressImage(file, {
    maxSizeMB: 0.3,           // 300KB max for profile photos
    maxWidthOrHeight: 800,    // 800px is enough for profile photos
    initialQuality: 0.85,
  });
};

/**
 * Compress recipe image with higher quality
 * @param {File} file - The image file
 * @returns {Promise<File>} Compressed and validated image
 */
export const compressRecipeImage = async (file) => {
  // Recipe images can be larger and higher quality than profile photos
  return compressImage(file, {
    maxSizeMB: 1.0,           // 1MB max for recipe images
    maxWidthOrHeight: 1920,   // Full HD resolution
    initialQuality: 0.9,      // Higher quality for food photos
  });
};
