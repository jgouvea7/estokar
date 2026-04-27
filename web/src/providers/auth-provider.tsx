"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { AuthSession } from "@/lib/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const setSession = useAuthStore((state) => state.setSession);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!token || !refreshToken) return;

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((user) => {
                setSession({
                    user,
                    accessToken: token,
                    refreshToken: token,
                } as AuthSession);
            })
            .catch(() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
            });
    }, [setSession]);

    return <>{children}</>;
}