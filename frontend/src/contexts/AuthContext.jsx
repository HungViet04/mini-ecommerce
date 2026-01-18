/**
 * Auth Context
 * Global authentication state management
 * Pattern: React Context + Provider
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/auth.service";
import { tokenStorage } from "../utils/storage";

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps the app and provides auth state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from stored token
  useEffect(() => {
    // Khởi tạo user từ token khi mount
    const token = tokenStorage.get();
    console.log("[AuthContext] accessToken on mount:", token);
    async function initUser() {
      if (token) {
        const decoded = authService.decodeToken(token);
        console.log("[AuthContext] decoded token:", decoded);
        if (decoded && !authService.isTokenExpired(decoded)) {
          let userObj = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email,
          };
          // Nếu chưa có email, gọi API lấy profile
          if (!userObj.email) {
            try {
              const profile = await authService.getProfile();
              userObj = { ...userObj, ...profile };
              console.log(
                "[AuthContext] fetched profile for email (mount):",
                profile
              );
            } catch (err) {
              console.warn(
                "[AuthContext] Không lấy được profile (mount):",
                err
              );
            }
          }
          setUser(userObj);
          console.log("[AuthContext] setUser:", userObj);
        } else {
          setUser(null);
          tokenStorage.clear();
          console.log("[AuthContext] Token expired or invalid, setUser null");
        }
      } else {
        setUser(null);
        console.log("[AuthContext] No token, setUser null");
      }
      setLoading(false);
    }
    initUser();

    // Lắng nghe sự kiện storage để đồng bộ giữa các tab
    const handleStorage = (e) => {
      if (e.key === "ecom_access_token") {
        const token = tokenStorage.get();
        console.log("[AuthContext] accessToken on storage event:", token);
        async function syncUser() {
          if (token) {
            const decoded = authService.decodeToken(token);
            console.log(
              "[AuthContext] decoded token (storage event):",
              decoded
            );
            if (decoded && !authService.isTokenExpired(decoded)) {
              let userObj = {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email,
              };
              if (!userObj.email) {
                try {
                  const profile = await authService.getProfile();
                  userObj = { ...userObj, ...profile };
                  console.log(
                    "[AuthContext] fetched profile for email (storage event):",
                    profile
                  );
                } catch (err) {
                  console.warn(
                    "[AuthContext] Không lấy được profile (storage event):",
                    err
                  );
                }
              }
              setUser(userObj);
              console.log("[AuthContext] setUser (storage event):", userObj);
            } else {
              setUser(null);
              tokenStorage.clear();
              console.log(
                "[AuthContext] Token expired/invalid (storage event), setUser null"
              );
            }
          } else {
            setUser(null);
            console.log("[AuthContext] No token (storage event), setUser null");
          }
        }
        syncUser();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Login handler
  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    const { accessToken, user: userData } = result;
    console.log("[AuthContext] login result:", result);
    tokenStorage.set(accessToken);
    let finalUser = userData;
    // Nếu user không có email, gọi API lấy profile
    if (!userData?.email) {
      try {
        const profile = await authService.getProfile();
        finalUser = { ...userData, ...profile };
        console.log("[AuthContext] fetched profile for email:", profile);
      } catch (err) {
        console.warn("[AuthContext] Không lấy được profile:", err);
      }
    }
    setUser(finalUser);
    console.log("[AuthContext] setUser (login):", finalUser);
    // Trigger storage event for other tabs
    window.dispatchEvent(
      new StorageEvent("storage", { key: "ecom_access_token" })
    );
    return result;
  }, []);

  // Register handler
  const register = useCallback(async (data) => {
    return authService.register(data);
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    // Trigger storage event for other tabs
    window.dispatchEvent(
      new StorageEvent("storage", { key: "ecom_access_token" })
    );
  }, []);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Check if user is authenticated
  const isAuthenticated = !!user;

  const value = {
    user,
    loading, // truyền loading ra context
    isAdmin,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
