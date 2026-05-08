"use client";

import { useEffect } from "react";
import * as Sentry from '@sentry/react';
import { useAuthStore } from "@/store/auth-store";
import { AuthSession } from "@/lib/types";
import { getProfile, refreshTokens } from "@/lib/api/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const setSession = useAuthStore((state) => state.setSession);
    const clearSession = useAuthStore((state) => state.clearSession);
    const session = useAuthStore((state) => state.session);

    useEffect(() => {
        if (session?.user) {
            Sentry.setUser({
                id: session.user.id,
                email: session.user.email,
            });
            return;
        }

        Sentry.setUser(null);
    }, [session]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!token || !refreshToken) return;

        const loadSession = async () => {
            try {
                const user = await getProfile(token);
                setSession({
                    user,
                    accessToken: token,
                    refreshToken,
                } as AuthSession);
                return;
            } catch {
                try {
                    const refreshed = await refreshTokens(refreshToken);
                    localStorage.setItem("accessToken", refreshed.accessToken);
                    localStorage.setItem("refreshToken", refreshed.refreshToken);
                    const user = await getProfile(refreshed.accessToken);
                    setSession({
                        user,
                        accessToken: refreshed.accessToken,
                        refreshToken: refreshed.refreshToken,
                    } as AuthSession);
                } catch {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    clearSession();
                }
            }
        };

        void loadSession();
    }, [clearSession, setSession]);

    return <>{children}</>;
}