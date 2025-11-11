import { ref, listAll, getMetadata, deleteObject } from 'firebase/storage';
import { storage, db } from '../services/firebase';
import { doc, getDoc, setDoc, runTransaction, collection, getDocs } from 'firebase/firestore';

// Storage limits (in bytes)
export const STORAGE_LIMITS = {
  FREE_TIER_TOTAL: 5 * 1024 * 1024 * 1024, // 5GB total for free tier
  PER_USER_LIMIT: 100 * 1024 * 1024,       // 100MB per user
  PER_FILE_LIMIT: 5 * 1024 * 1024,         // 5MB per file (before compression)
  PER_FILE_COMPRESSED: 500 * 1024,         // 500KB target after compression
};

/**
 * Get project-wide storage usage from Firestore
 * @returns {Promise<number>} Total bytes used across all users
 */
export const getProjectStorageUsage = async () => {
  try {
    const storageDocPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/metadata/storage`;
    const storageDoc = await getDoc(doc(db, storageDocPath));
    
    if (storageDoc.exists()) {
      return storageDoc.data().totalBytes || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting project storage usage:', error);
    return 0;
  }
};

/**
 * Update project-wide storage usage in Firestore
 * @param {number} bytesChange - Positive for additions, negative for deletions
 */
export const updateProjectStorage = async (bytesChange) => {
  try {
    const storageDocPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/metadata/storage`;
    const storageDocRef = doc(db, storageDocPath);
    
    await runTransaction(db, async (transaction) => {
      const storageDoc = await transaction.get(storageDocRef);
      const currentBytes = storageDoc.exists() ? (storageDoc.data().totalBytes || 0) : 0;
      const newTotal = Math.max(0, currentBytes + bytesChange);
      
      transaction.set(storageDocRef, {
        totalBytes: newTotal,
        lastUpdated: new Date(),
      }, { merge: true });
    });
  } catch (error) {
    console.error('Error updating project storage:', error);
    throw error;
  }
};

/**
 * Calculate total storage used by a user (including recipe images)
 * @param {string} userId - The user's UID
 * @returns {Promise<{totalBytes: number, fileCount: number}>}
 */
export const getUserStorageUsage = async (userId) => {
  try {
    let totalBytes = 0;
    let fileCount = 0;

    // Count profile photos
    const userPhotosRef = ref(storage, `profile-photos/${userId}`);
    const photosList = await listAll(userPhotosRef);
    
    if (photosList.items.length > 0) {
      const photosMetadata = await Promise.all(photosList.items.map(item => getMetadata(item)));
      photosMetadata.forEach(metadata => {
        totalBytes += metadata.size;
      });
      fileCount += photosList.items.length;
    }

    // Count recipe images
    const recipeImagesRef = ref(storage, `recipe-images/${userId}`);
    const recipesList = await listAll(recipeImagesRef);
    
    if (recipesList.items.length > 0) {
      const recipesMetadata = await Promise.all(recipesList.items.map(item => getMetadata(item)));
      recipesMetadata.forEach(metadata => {
        totalBytes += metadata.size;
      });
      fileCount += recipesList.items.length;
    }
    
    return {
      totalBytes,
      fileCount,
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { totalBytes: 0, fileCount: 0 };
  }
};

/**
 * Check if user can upload a new file (with project-wide limit)
 * @param {string} userId - The user's UID
 * @param {number} fileSize - Size of the file to upload in bytes
 * @returns {Promise<{canUpload: boolean, reason?: string, usage?: {user: number, project: number}}>}
 */
export const checkUploadQuota = async (userId, fileSize) => {
  // Check file size limit
  if (fileSize > STORAGE_LIMITS.PER_FILE_LIMIT) {
    return {
      canUpload: false,
      reason: `File size exceeds ${formatBytes(STORAGE_LIMITS.PER_FILE_LIMIT)} limit`,
    };
  }
  
  // Check project-wide limit first (most important)
  const projectBytes = await getProjectStorageUsage();
  if (projectBytes + fileSize > STORAGE_LIMITS.FREE_TIER_TOTAL) {
    return {
      canUpload: false,
      reason: `Project storage limit reached. ${formatBytes(projectBytes)} / ${formatBytes(STORAGE_LIMITS.FREE_TIER_TOTAL)} used.`,
      usage: { user: 0, project: projectBytes }
    };
  }
  
  // Get current user usage
  const { totalBytes } = await getUserStorageUsage(userId);
  
  // Check per-user limit
  if (totalBytes + fileSize > STORAGE_LIMITS.PER_USER_LIMIT) {
    return {
      canUpload: false,
      reason: `Upload would exceed your ${formatBytes(STORAGE_LIMITS.PER_USER_LIMIT)} limit. You've used ${formatBytes(totalBytes)}.`,
      usage: { user: totalBytes, project: projectBytes }
    };
  }
  
  return { 
    canUpload: true,
    usage: { user: totalBytes, project: projectBytes }
  };
};

/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Delete old photos to free up space (keep only the most recent)
 * @param {string} userId
 * @param {number} keepCount - Number of recent photos to keep (0 = delete all)
 */
export const cleanupOldPhotos = async (userId, keepCount = 3) => {
  try {
    const userPhotosRef = ref(storage, `profile-photos/${userId}`);
    const fileList = await listAll(userPhotosRef);
    
    if (fileList.items.length <= keepCount) {
      return { deleted: 0, bytesFreed: 0 };
    }
    
    // Get metadata for all files to sort by date
    const filesWithMetadata = await Promise.all(
      fileList.items.map(async (item) => {
        const metadata = await getMetadata(item);
        return { ref: item, metadata };
      })
    );
    
    // Sort by upload time (newest first)
    filesWithMetadata.sort((a, b) => 
      new Date(b.metadata.timeCreated) - new Date(a.metadata.timeCreated)
    );
    
    // Delete old files and track bytes freed
    // If keepCount is 0, delete all existing files
    const filesToDelete = keepCount === 0 ? filesWithMetadata : filesWithMetadata.slice(keepCount);
    let bytesFreed = 0;
    
    for (const file of filesToDelete) {
      bytesFreed += file.metadata.size;
      await deleteObject(file.ref);
    }
    
    // Update project storage counter
    if (bytesFreed > 0) {
      await updateProjectStorage(-bytesFreed);
    }
    
    return { deleted: filesToDelete.length, bytesFreed };
  } catch (error) {
    console.error('Error cleaning up old photos:', error);
    throw error;
  }
};

/**
 * Delete a recipe image from storage
 * @param {string} imageUrl - The full download URL of the image
 * @returns {Promise<number>} Bytes freed
 */
export const deleteRecipeImage = async (imageUrl) => {
  try {
    if (!imageUrl) return 0;

    // Extract the storage path from the download URL
    const urlObj = new URL(imageUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)\?/);
    
    if (!pathMatch) {
      console.error('Could not extract path from URL');
      return 0;
    }

    const storagePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, storagePath);
    
    // Get size before deleting
    const metadata = await getMetadata(imageRef);
    const bytesFreed = metadata.size;
    
    // Delete the image
    await deleteObject(imageRef);
    
    // Update project storage counter
    await updateProjectStorage(-bytesFreed);
    
    console.log(`Deleted recipe image, freed ${bytesFreed} bytes`);
    return bytesFreed;
  } catch (error) {
    console.error('Error deleting recipe image:', error);
    return 0;
  }
};

/**
 * Recalculate actual storage usage across all users and update Firestore
 * Uses Firestore users collection to find all users
 * @returns {Promise<{totalBytes: number, userCount: number}>}
 */
export const recalculateProjectStorage = async () => {
  try {
    const usersPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/users`;
    const usersSnapshot = await getDocs(collection(db, usersPath));
    
    let totalBytes = 0;
    let totalFiles = 0;
    let userCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Count profile photos
        const userPhotosRef = ref(storage, `profile-photos/${userId}`);
        const photosList = await listAll(userPhotosRef);
        
        if (photosList.items.length > 0) {
          const photosMetadata = await Promise.all(photosList.items.map(item => getMetadata(item)));
          const userPhotoBytes = photosMetadata.reduce((sum, metadata) => sum + metadata.size, 0);
          
          totalBytes += userPhotoBytes;
          totalFiles += photosMetadata.length;
        }

        // Count recipe images
        const recipeImagesRef = ref(storage, `recipe-images/${userId}`);
        const recipesList = await listAll(recipeImagesRef);
        
        if (recipesList.items.length > 0) {
          const recipesMetadata = await Promise.all(recipesList.items.map(item => getMetadata(item)));
          const userRecipeBytes = recipesMetadata.reduce((sum, metadata) => sum + metadata.size, 0);
          
          totalBytes += userRecipeBytes;
          totalFiles += recipesMetadata.length;
        }

        if (photosList.items.length > 0 || recipesList.items.length > 0) {
          userCount++;
        }
      } catch (error) {
        // User might not have any files, skip silently
      }
    }
    
    const storageDocPath = `/artifacts/${process.env.REACT_APP_FIREBASE_APP_ID}/metadata/storage`;
    await setDoc(doc(db, storageDocPath), {
      totalBytes: totalBytes,
      totalFiles: totalFiles,
      lastUpdated: new Date(),
      lastRecalculated: new Date(),
    });
    
    return {
      totalBytes,
      totalFiles,
      userCount,
    };
  } catch (error) {
    console.error('Error recalculating project storage:', error);
    throw error;
  }
};

const storageQuotaExports = {
  getUserStorageUsage,
  checkUploadQuota,
  formatBytes,
  cleanupOldPhotos,
  deleteRecipeImage,
  recalculateProjectStorage,
  STORAGE_LIMITS,
};

export default storageQuotaExports;
