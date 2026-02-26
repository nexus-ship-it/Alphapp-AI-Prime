
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export const saveUserProfile = async (user: User) => {
    if (!user.uid) return;
    if (!db) {
        console.warn("Firestore not initialized. Cannot save profile.");
        return;
    }
    try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            username: user.username,
            email: user.email,
            lang: user.lang,
            persona: user.persona,
            lastLogin: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving user profile:", error);
        throw error;
    }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
    if (!db) {
        console.warn("Firestore not initialized. Cannot get profile.");
        return null;
    }
    try {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            return docSnap.data() as User;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
};
