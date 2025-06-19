import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from 'firebase/auth';

export type UserRole = 'admin' | 'interviewer';

export interface UserData {
  email: string;
  role: UserRole;
  name?: string;
  photoURL?: string;
}

export async function getOrCreateUser(authUser: User): Promise<UserData> {
  const userRef = doc(db, 'users', authUser.email!);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Create new user with default role
    const userData: UserData = {
      email: authUser.email!,
      role: 'interviewer',
      name: authUser.displayName || undefined,
      photoURL: authUser.photoURL || undefined,
    };

    // Create user document
    await setDoc(userRef, userData);

    // Also create an interviewer record
    const interviewerRef = doc(collection(db, 'interviewers'));
    await setDoc(interviewerRef, {
      email: authUser.email,
      name: authUser.displayName || authUser.email,
      available: true
    });

    return userData;
  }

  return userDoc.data() as UserData;
}

export async function getUserRole(email: string): Promise<UserRole | null> {
  try {
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().role as UserRole;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}
