import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthUser {
    id: number;
    username: string;
    role: 'COACH' | 'CLIENT';
    token: string;
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

        if (token && role && username && userId) {
            setUser({ id: Number(userId), username, role, token });
        }
        setIsLoading(false);
    }, []);

    const login = (userData: AuthUser) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('userId', String(userData.id));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
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
