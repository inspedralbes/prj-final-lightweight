import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthUser {
    id: number;
    username: string;
    role: 'COACH' | 'CLIENT';
    token: string;
    coachId?: number;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (userData: AuthUser) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true); // true mientras leemos localStorage

    // Al montar, restaurar sesión guardada en localStorage
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole') as 'COACH' | 'CLIENT' | null;
        const username = localStorage.getItem('username');
        const userId = localStorage.getItem('userId');
        const coachId = localStorage.getItem('coachId');

        if (token && role && username && userId) {
            setUser({ 
                id: Number(userId), 
                username, 
                role, 
                token,
                coachId: coachId ? Number(coachId) : undefined
            });
        }
        setIsLoading(false);
    }, []);

    const login = (userData: AuthUser) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('userId', String(userData.id));
        if (userData.coachId) {
            localStorage.setItem('coachId', String(userData.coachId));
        }
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('coachId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
