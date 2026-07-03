import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    autocapture: false,
    person_profiles: 'identified_only',
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.opt_out_capturing();
    },
  });
}

export function identifyUser(userId: string, email?: string, name?: string) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, { email, name });
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function resetAnalytics() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}
