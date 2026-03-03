import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { getItem, setItem, removeItem } from "../utils/localStorage";
import { use } from "react";




// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [accessToken, setAccessToken] = useState(getItem("accessToken") || null);
    const [refreshToken, setRefreshToken] = useState(getItem("refreshToken") || null);
    const [user, setUser] = useState(getItem("user") ? getItem("user") : null);
    console.log("AuthProvider user:", user);
    const [loading, setLoading] = useState(true);

    // -------------------------------------------
    // 1️ LOGIN FUNCTION
    // -------------------------------------------
    const login = async (email, password) => {
        try {
            const response = await axios.post("/api/login", {
                email,
                password,
            });

            const { name, accessToken, refreshToken } = response.data;

            // Save to localStorage
            setItem("accessToken", accessToken);
            setItem("refreshToken", refreshToken);


            setAccessToken(accessToken);
            setRefreshToken(refreshToken);

            // Set axios default Authorization header
            axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

            // const userData = {  };
            const userData = { name, email: email };
            // (Optional) Fetch user details or decode JWT here
            setUser(userData);
            //saving username and email to local storage
            setItem("user", userData);

            return true;
        } catch (error) {
            console.error("Login failed:", error.response?.data || error.message);
            return false;
        }
    };

    // -------------------------------------------
    //  Register FUNCTION
    // -------------------------------------------

    const register = async (name, email, password) => {
    try {
        const response = await axios.post("/api/register", { name, email, password });
        console.log(response.data.message);
        return { success: true, message: response.data.message };
    } catch (error) {
        console.error("Registration failed:", error.response?.data || error.message);
        return { success: false, message: error.response?.data?.message || "Registration failed" };
    }
    };


    // -------------------------------------------
    //  LOGOUT FUNCTION
    // -------------------------------------------
    const logout = async () => {
        try {
            if (refreshToken) {
                await axios.post("/api/logout", {
                    refreshToken,
                });
            }
        } catch (error) {
            console.error("Logout error:", error.response?.data || error.message);
        } finally {
            // Always clear local state and storage
            removeItem("accessToken");
            removeItem("refreshToken");
            removeItem("user");

            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
            delete axios.defaults.headers.common["Authorization"];

        }
    };


    // -------------------------------------------
    //   REFRESH TOKEN FUNCTION
    // -------------------------------------------
    const refreshAccessToken = async () => {
        try {
            if (!refreshToken) return null;

            const response = await axios.post("/api/refresh", {
                refreshToken,
            });

            const { accessToken: newAccessToken } = response.data;

            setAccessToken(newAccessToken);
            setItem("accessToken", newAccessToken);
            axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
            return newAccessToken;
        } catch (error) {
            console.error("Token refresh failed:", error.response?.data || error.message);
            logout(); // If refresh fails, force logout
            return null;
        }
    };

    // -------------------------------------------
    //  AXIOS INTERCEPTOR — AUTO REFRESH TOKEN
    // -------------------------------------------
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If access token expired (401), try refreshing once
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const newToken = await refreshAccessToken();

                    if (newToken) {
                        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                        return axios(originalRequest);
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, [refreshToken]);

    // -------------------------------------------
    //  INITIALIZE ON PAGE LOAD
    // -------------------------------------------
    useEffect(() => {
        const initializeAuth = async () => {
            if (refreshToken && !accessToken) {
                await refreshAccessToken();
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    // -------------------------------------------
    //  PROVIDER VALUE
    // -------------------------------------------
    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                login,
                register,
                logout,
                loading,
                refreshAccessToken,
                isAuthenticated: !!accessToken,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};
