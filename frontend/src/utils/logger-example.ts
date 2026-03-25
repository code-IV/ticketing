/**
 * Example usage of the centralized logger
 * This file demonstrates how to use the logger in your components
 */

import { logger, log, logRequest, logResponse, logError } from './logger';

// Example: Manual logging in components
export const exampleUsage = {
  // Log general debug information
  logComponentState: (componentName: string, state: any) => {
    log(`${componentName} - Component State`, state);
  },

  // Log user actions
  logUserAction: (action: string, data?: any) => {
    log(`User Action: ${action}`, data);
  },

  // Log form submissions
  logFormSubmission: (formName: string, formData: any) => {
    log(`Form Submission: ${formName}`, formData);
  },

  // Manual API logging (if needed outside of axios interceptors)
  manualApiLogging: {
    logApiCall: async (apiCall: () => Promise<any>, description: string) => {
      log(`Starting API call: ${description}`);
      try {
        const result = await apiCall();
        log(`API call successful: ${description}`, result);
        return result;
      } catch (error) {
        logError('MANUAL', description, error);
        throw error;
      }
    }
  },

  // Toggle logging for debugging
  enableDebugMode: () => {
    logger.setEnabled(true);
    log('Debug mode enabled');
  },

  disableDebugMode: () => {
    log('Debug mode disabled');
    logger.setEnabled(false);
  }
};
