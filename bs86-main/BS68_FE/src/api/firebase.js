import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();

// ─── Register ────────────────────────────────────────────────────────────────
export const registerWithEmail = async (email, password, displayName = '') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// ─── Google Login ─────────────────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ─── Password Reset ───────────────────────────────────────────────────────────
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateUserProfile = async (displayName, photoURL) => {
  try {
    await updateProfile(auth.currentUser, { displayName, photoURL });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ─── Update Email ─────────────────────────────────────────────────────────────
export const updateUserEmail = async (newEmail) => {
  try {
    await updateEmail(auth.currentUser, newEmail);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ─── Update Password ──────────────────────────────────────────────────────────
export const updateUserPassword = async (newPassword) => {
  try {
    await updatePassword(auth.currentUser, newPassword);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ─── Re-authenticate (required before updateEmail/updatePassword) ─────────────
export const reauthenticate = async (currentPassword) => {
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ─── Auth State Observer ──────────────────────────────────────────────────────
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getCurrentUser = () => {
  return auth.currentUser;
};

export default app;