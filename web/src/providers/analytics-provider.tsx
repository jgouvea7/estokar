"use client";

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initAnalytics, captureEvent, identifyUser, resetAnalytics } from '@/lib/analytics';
import { useAuthStore } from '@/store/auth-store';

function AnalyticsInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (pathname) {
      captureEvent('$pageview', { path: pathname });
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.id, session.user.email, session.user.name);
    } else {
      resetAnalytics();
    }
  }, [session]);

  return <>{children}</>;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <Suspense fallback={null}>
      <AnalyticsInner>{children}</AnalyticsInner>
    </Suspense>
  );
}
