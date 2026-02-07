import posthog from 'posthog-js';
import {ANALYTICS_CONFIG} from '../config/analytics';

// Initialize PostHog immediately on module load
if (typeof window !== 'undefined') {
  posthog.init(ANALYTICS_CONFIG.posthog.apiKey, {
    api_host: ANALYTICS_CONFIG.posthog.host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
  console.log('PostHog analytics initialized');
}

class AnalyticsService {
  /**
   * Check if running in browser
   */
  private get isEnabled(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Identify a user (call after login/signup)
   */
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;
    posthog.identify(userId, properties);
  }

  /**
   * Reset user identity (call on logout)
   */
  reset(): void {
    if (!this.isEnabled) return;
    posthog.reset();
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;
    posthog.capture(eventName, properties);
  }

  /**
   * Track a page view
   */
  pageView(pageName?: string): void {
    if (!this.isEnabled) return;
    posthog.capture('$pageview', pageName ? {page: pageName} : undefined);
  }
}

export const analytics = new AnalyticsService();
