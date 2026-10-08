import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

function logFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Warn/Error (handled gracefully):', JSON.stringify(errInfo));
}

export interface UserProfileData {
  ownerName: string;
  shopName: string;
  shopType: string;
  email: string;
  phone: string;
  createdAt: string;
  setupCompleted?: boolean;
}

// Local Storage Helper functions to act as persistent cache
function getLocalProfile(uid: string): UserProfileData | null {
  try {
    const cached = localStorage.getItem(`user_profile_${uid}`);
    if (cached) {
      return JSON.parse(cached) as UserProfileData;
    }
  } catch (err) {
    console.error('Failed to read profile from localStorage:', err);
  }
  return null;
}

function setLocalProfile(uid: string, profile: UserProfileData) {
  try {
    localStorage.setItem(`user_profile_${uid}`, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to write profile to localStorage:', err);
  }
}

// Timeout helper for Firestore queries to prevent hanging in offline/proxy sandbox environments
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Fetches user profile details from Firestore users/{uid}.
 * Gracefully falls back to local storage cache if offline or error occurs.
 */
export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    // Timeout of 2 seconds for offline resilience
    const userSnapshot = await withTimeout(getDoc(userDocRef), 2000);
    if (userSnapshot.exists()) {
      const data = userSnapshot.data() as UserProfileData;
      setLocalProfile(uid, data);
      return data;
    }
    // Document doesn't exist, check local storage in case we created it offline
    return getLocalProfile(uid);
  } catch (error) {
    logFirestoreError(error, OperationType.GET, path);
    // If we're offline, read from localStorage fallback
    return getLocalProfile(uid);
  }
}

/**
 * Creates user profile in Firestore users/{uid} if it doesn't already exist.
 * If the document exists, do NOT overwrite.
 * Gracefully caches locally first to support offline environments.
 */
export async function createUserProfile(
  uid: string,
  profile: Omit<UserProfileData, 'createdAt'>
): Promise<UserProfileData> {
  const path = `users/${uid}`;
  
  // Construct the new profile
  const newProfile: UserProfileData = {
    ...profile,
    createdAt: new Date().toISOString()
  };

  // Always write to local storage first for offline resilience
  setLocalProfile(uid, newProfile);

  try {
    const userDocRef = doc(db, 'users', uid);
    
    // Check if it already exists in Firestore first
    try {
      const existing = await withTimeout(getDoc(userDocRef), 2000);
      if (existing.exists()) {
        const existingData = existing.data() as UserProfileData;
        setLocalProfile(uid, existingData);
        return existingData;
      }
    } catch (err) {
      // If we can't read to check existence, we'll proceed to try writing
      logFirestoreError(err, OperationType.GET, path);
    }

    // Try to write to Firestore
    await withTimeout(setDoc(userDocRef, newProfile), 2000);
    return newProfile;
  } catch (error) {
    logFirestoreError(error, OperationType.WRITE, path);
    // Return the locally saved profile, don't crash the user
    return newProfile;
  }
}

/**
 * Updates an existing user profile in Firestore.
 * Gracefully handles offline state by saving to localStorage first.
 */
export async function updateUserProfile(
  uid: string,
  profile: Partial<Omit<UserProfileData, 'createdAt' | 'email'>>
): Promise<void> {
  const path = `users/${uid}`;
  
  // 1. Get existing profile from local storage or Firestore
  let existingData = getLocalProfile(uid);

  try {
    const userDocRef = doc(db, 'users', uid);
    try {
      const existing = await withTimeout(getDoc(userDocRef), 2000);
      if (existing.exists()) {
        existingData = existing.data() as UserProfileData;
      }
    } catch (err) {
      logFirestoreError(err, OperationType.GET, path);
    }

    if (!existingData) {
      // If we have absolutely no record of this profile, construct a basic placeholder
      existingData = {
        ownerName: profile.ownerName || 'Merchant',
        shopName: profile.shopName || "Merchant's Shop",
        shopType: profile.shopType || 'Grocery Store / Supermarket',
        email: auth.currentUser?.email || '',
        phone: profile.phone || '+91 99999 99999',
        createdAt: new Date().toISOString()
      };
    }

    const updatedProfile: UserProfileData = {
      ...existingData,
      ...profile,
    };

    // Always update local cache
    setLocalProfile(uid, updatedProfile);

    // Try to write to Firestore
    await withTimeout(setDoc(userDocRef, updatedProfile), 2000);
  } catch (error) {
    logFirestoreError(error, OperationType.WRITE, path);
    // Don't throw - the updated profile is already in local storage and will be used as a fallback
  }
}
