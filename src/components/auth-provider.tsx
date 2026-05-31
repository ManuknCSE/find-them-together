import * as React from "react";
import { request } from "@/lib/api-client";

interface UserType {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  countryCode?: string;
  role: string;
  verifiedStatus: boolean;
  profilePhoto?: {
    url?: string;
  };
}

interface AuthContextType {
  user: UserType | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, any>) => Promise<void>;
  verifyOtp: (mobileNumber: string, countryCode: string, otp: string) => Promise<void>;
  resendOtp: (mobileNumber: string, countryCode: string) => Promise<void>;
  googleLogin: (firebaseIdToken: string, role?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: UserType) => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserType | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Initialize and check token validation on mount
  React.useEffect(() => {
    async function initAuth() {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem("ft-token");
      const storedUser = localStorage.getItem("ft-user");

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // If malformed, ignore
          }
        }

        // Validate token by fetching the latest user details
        try {
          const userData = await request("/users/me");
          if (userData && (userData.user || userData)) {
            const currentUser = userData.user || userData;
            setUser(currentUser);
            localStorage.setItem("ft-user", JSON.stringify(currentUser));
          }
        } catch (error) {
          console.error("Token verification failed on mount:", error);
          // Token is likely invalid/expired, clear it
          localStorage.removeItem("ft-token");
          localStorage.removeItem("ft-refresh-token");
          localStorage.removeItem("ft-user");
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const handleAuthSuccess = (data: { user: UserType; accessToken?: string; token?: string; refreshToken?: string }) => {
    const userObj = data.user;
    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;

    setUser(userObj);
    localStorage.setItem("ft-user", JSON.stringify(userObj));

    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem("ft-token", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("ft-refresh-token", refreshToken);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      handleAuthSuccess(data);
    } finally {
      setLoading(false);
    }
  };

  const register = async (signUpData: Record<string, any>) => {
    setLoading(true);
    try {
      const data = await request("/auth/register", {
        method: "POST",
        body: signUpData,
      });
      handleAuthSuccess(data);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (mobileNumber: string, countryCode: string, otp: string) => {
    setLoading(true);
    try {
      const data = await request("/auth/otp/verify", {
        method: "POST",
        body: { mobileNumber, countryCode, otp },
      });
      handleAuthSuccess(data);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (mobileNumber: string, countryCode: string) => {
    await request("/auth/otp/resend", {
      method: "POST",
      body: { mobileNumber, countryCode, purpose: "login" },
    });
  };

  const googleLogin = async (firebaseIdToken: string, role: string = "Family Member") => {
    setLoading(true);
    try {
      const data = await request("/auth/google", {
        method: "POST",
        body: { firebaseIdToken, role },
      });
      handleAuthSuccess(data);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("ft-token");
      localStorage.removeItem("ft-refresh-token");
      localStorage.removeItem("ft-user");
    }
  };

  const updateUser = (updatedUser: UserType) => {
    setUser(updatedUser);
    localStorage.setItem("ft-user", JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        googleLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
