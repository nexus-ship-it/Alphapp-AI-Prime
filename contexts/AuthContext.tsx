
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import { useToastContext } from './ToastContext';
import { auth } from '../services/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { saveUserProfile, getUserProfile } from '../services/dbService';

interface AuthContextType {
    currentUser: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (username: string, password: string, lang: 'es' | 'en', persona: 'Desarrollador' | 'QA' | 'DevOps') => Promise<boolean>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToastContext();

    useEffect(() => {
        if (!auth) {
            console.warn("Firebase Auth not initialized.");
            setIsLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Fetch extended user profile from Firestore
                const userProfile = await getUserProfile(firebaseUser.uid);
                if (userProfile) {
                    setCurrentUser(userProfile);
                } else {
                    // Fallback if profile missing (shouldn't happen on new register)
                    setCurrentUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        username: firebaseUser.displayName || 'User',
                        lang: 'es',
                        persona: 'Desarrollador'
                    });
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        if (!auth) {
            addToast({ type: 'error', title: 'Error de Configuración', message: 'Firebase no está configurado.' });
            return false;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            addToast({ type: 'success', title: '¡Bienvenido!', message: 'Has iniciado sesión exitosamente.' });
            return true;
        } catch (error: any) {
            console.error("Login failed:", error);
            let message = 'Error de inicio de sesión.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Email o contraseña incorrectos.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'El formato del email no es válido.';
            }
            addToast({ type: 'error', title: 'Error', message });
            return false;
        }
    };

    const register = async (email: string, password: string, lang: 'es' | 'en', persona: 'Desarrollador' | 'QA' | 'DevOps'): Promise<boolean> => {
        if (!auth) {
            addToast({ type: 'error', title: 'Error de Configuración', message: 'Firebase no está configurado.' });
            return false;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const newUser: User = {
                uid: user.uid,
                email: user.email || email,
                username: email.split('@')[0], // Default username from email
                lang,
                persona
            };

            await saveUserProfile(newUser);
            setCurrentUser(newUser);

            addToast({ type: 'success', title: '¡Registro exitoso!', message: 'Tu cuenta ha sido creada.' });
            return true;
        } catch (error: any) {
            console.error("Registration failed:", error);
            let message = 'Ocurrió un error al registrarse.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'El correo electrónico ya está en uso.';
            } else if (error.code === 'auth/weak-password') {
                message = 'La contraseña es muy débil (mínimo 6 caracteres).';
            }
            addToast({ type: 'error', title: 'Error', message });
            return false;
        }
    };

    const logout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            setCurrentUser(null);
            addToast({ type: 'info', title: 'Sesión cerrada', message: 'Has cerrado sesión exitosamente.' });
        } catch (error) {
            console.error("Logout failed", error);
        }
    };
    
    const value = {
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        register,
        logout,
        isLoading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
