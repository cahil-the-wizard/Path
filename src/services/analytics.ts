import posthog from 'posthog-js';
import {ANALYTICS_CONFIG} from '../config/analytics';

class AnalyticsService {
  private initialized = false;

  /**
   * Initialize PostHog analytics
   */
  init(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    posthog.init(ANALYTICS_CONFIG.posthog.apiKey, {
      api_host: ANALYTICS_CONFIG.posthog.host,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
    });

    this.initialized = true;
    console.log('Analytics initialized');
  }

  /**
   * Identify a user (call after login/signup)
   */
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    posthog.identify(userId, properties);
  }

  /**
   * Reset user identity (call on logout)
   */
  reset(): void {
    if (!this.initialized) return;
    posthog.reset();
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    posthog.capture(eventName, properties);
  }

  /**
   * Track a page view
   */
  pageView(pageName?: string): void {
    if (!this.initialized) return;
    posthog.capture('$pageview', pageName ? {page: pageName} : undefined);
  }
}

export const analytics = new AnalyticsService();
