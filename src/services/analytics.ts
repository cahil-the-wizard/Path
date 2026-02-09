import posthog from 'posthog-js';
import {ANALYTICS_CONFIG} from '../config/analytics';

let initialized = false;

// Initialize PostHog immediately on module load
// Wrapped in try-catch to handle content blockers gracefully
if (typeof window !== 'undefined') {
  try {
    posthog.init(ANALYTICS_CONFIG.posthog.apiKey, {
      api_host: ANALYTICS_CONFIG.posthog.host,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      // Session recordings
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
          password: true,
        },
      },
      // Fail gracefully if blocked
      on_xhr_error: () => {
        console.warn('PostHog request blocked (likely by content blocker)');
      },
    });
    initialized = true;
    console.log('PostHog analytics initialized');
  } catch (error) {
    console.warn('PostHog failed to initialize:', error);
  }
}

class AnalyticsService {
  /**
   * Check if analytics is available
   */
  private get isEnabled(): boolean {
    return typeof window !== 'undefined' && initialized;
  }

  /**
   * Safely execute analytics calls - never throw
   */
  private safeCall(fn: () => void): void {
    if (!this.isEnabled) return;
    try {
      fn();
    } catch (error) {
      // Silently fail - analytics should never break the app
      console.warn('Analytics call failed:', error);
    }
  }

  /**
   * Identify a user (call after login/signup)
   */
  identify(userId: string, properties?: Record<string, any>): void {
    this.safeCall(() => posthog.identify(userId, properties));
  }

  /**
   * Reset user identity (call on logout)
   */
  reset(): void {
    this.safeCall(() => posthog.reset());
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    this.safeCall(() => posthog.capture(eventName, properties));
  }

  /**
   * Track a page view
   */
  pageView(pageName?: string): void {
    this.safeCall(() => posthog.capture('$pageview', pageName ? {page: pageName} : undefined));
  }
}

export const analytics = new AnalyticsService();
