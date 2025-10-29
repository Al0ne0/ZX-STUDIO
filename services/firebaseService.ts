// =====================================================================================
// =============================   IMPORTANT SETUP INSTRUCTIONS   ============================
// =====================================================================================
//
// To fix the errors you are seeing ("client is offline", "storage/unauthorized"), you
// must configure your own Firebase project.
//
// STEP 1: REPLACE FIREBASE CONFIG
// The `firebaseConfig` object below is a sample. You MUST replace it with the
// configuration object from YOUR OWN Firebase project.
//
// How to get your config:
//   1. Go to the Firebase Console: https://console.firebase.google.com/
//   2. Select your project (or create a new one).
//   3. In the project overview, click the "</>" icon to "Add an app" and choose "Web".
//   4. Register your app.
//   5. Firebase will give you a `firebaseConfig` object. Copy it and paste it below,
//      replacing the existing one.
//
// -------------------------------------------------------------------------------------
//
// STEP 2: SET FIREBASE SECURITY RULES
// After setting your config, you must set security rules to allow users to access
// their own data.
//
// 1. Firestore Security Rules (In Firebase Console: Build -> Firestore Database -> Rules tab):
//    Replace everything with:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        // Users can only read and write their own data.
//        match /users/{userId}/{document=**} {
//          allow read, write: if request.auth != null && request.auth.uid == userId;
//        }
//      }
//    }
//
// 2. Storage Security Rules (In Firebase Console: Build -> Storage -> Rules tab):
//    Replace everything with:
//
//    rules_version = '2';
//    service firebase.storage {
//      match /b/{bucket}/o {
//        // Users can only read, write, and delete their own files.
//        match /users/{userId}/{allPaths=**} {
//          allow read, write, delete: if request.auth != null && request.auth.uid == userId;
//        }
//      }
//    }
//
// =====================================================================================
// =====================================================================================


import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    User as FirebaseUser
} from "firebase/auth";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { User, UserProfileUpdate } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAYIhLIlYDg21BNlnGMCOGEyhkTh5CyTHk",
  authDomain: "sowfit-4b20c.firebaseapp.com",
  databaseURL: "https://sowfit-4b20c.firebaseio.com",
  projectId: "sowfit-4b20c",
  storageBucket: "sowfit-4b20c.appspot.com",
  messagingSenderId: "347550139197",
  appId: "1:347550139197:web:cf3ed23e679a5962313b54",
  measurementId: "G-PQQWM904QH"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// Enable Firestore offline persistence to handle "client is offline" errors
// and provide a smoother user experience.
try {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.warn("Firestore persistence failed: Multiple tabs open. App will still work online.");
        } else if (err.code == 'unimplemented') {
          console.warn("Firestore persistence is not supported in this browser.");
        }
      });
} catch (error) {
    console.error("Error enabling Firestore persistence:", error);
}

const googleProvider = new GoogleAuthProvider();

const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser): User => {
    const { uid, email, displayName, photoURL } = firebaseUser;
    return { uid, email, displayName, photoURL };
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
        const user = firebaseUser ? mapFirebaseUserToAppUser(firebaseUser) : null;
        callback(user);
    });
};

export const signUpWithEmail = async (email: string, password: string, username: string, profilePicture: File): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const storageRef = ref(storage, `profilePictures/${user.uid}`);
    const snapshot = await uploadBytes(storageRef, profilePicture);
    const photoURL = await getDownloadURL(snapshot.ref);

    await updateProfile(user, {
        displayName: username,
        photoURL: photoURL
    });

    return mapFirebaseUserToAppUser(user);
};

export const updateUserProfile = async (uid: string, updates: UserProfileUpdate): Promise<User> => {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
        throw new Error("User not found or permission denied.");
    }
    
    let photoURL = user.photoURL;
    if (updates.newProfilePicture) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        const snapshot = await uploadBytes(storageRef, updates.newProfilePicture);
        photoURL = await getDownloadURL(snapshot.ref);
    }
    
    await updateProfile(user, {
        displayName: updates.displayName || user.displayName,
        photoURL: photoURL
    });

    // We need to return a fresh user object because the `user` object from auth is not immediately updated.
    return {
        uid: user.uid,
        email: user.email,
        displayName: updates.displayName || user.displayName,
        photoURL: photoURL
    };
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUserToAppUser(userCredential.user);
};

export const signInWithGoogle = async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUserToAppUser(result.user);
};

export const signOutUser = (): Promise<void> => {
    return signOut(auth);
};

export const sendPasswordReset = (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
};