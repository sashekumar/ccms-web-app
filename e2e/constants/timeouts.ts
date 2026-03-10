/**
 * Timeout constants for E2E tests
 * All values in milliseconds
 * 
 * Following coding-standards.md: No magic numbers, use constants
 */
export const TIMEOUTS = {
  // UI Transitions
  SIDEBAR_TRANSITION: 800,
  MODAL_ANIMATION: 500,
  
  // Angular Rendering
  ANGULAR_RENDER_DELAY: 1500,
  CHANGE_DETECTION: 300,
  PAGE_LOAD_DELAY: 1000,
  
  // Network & Loading
  NETWORK_IDLE: 5000,
  PAGE_LOAD: 15000,
  API_RESPONSE: 10000,
  
  // Element Visibility
  ELEMENT_VISIBLE: 10000,
  ELEMENT_ATTACHED: 15000,
  BUTTON_VISIBLE: 5000,
  
  // User Interactions
  CLICK_DELAY: 100,
  TYPE_DELAY: 50,
  
  // Navigation
  NAVIGATION: 30000,
} as const;
