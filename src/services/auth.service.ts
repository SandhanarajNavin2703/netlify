import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { getOrCreateUser, UserData } from './user.service';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<{ user: User; userData: UserData }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userData = await getOrCreateUser(result.user);
    return { user: result.user, userData };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
