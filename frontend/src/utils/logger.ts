/**
 * Centralized logging utility for debugging browser requests
 * Set DEBUG_MODE to false to disable all logging in production
 */

const DEBUG_MODE = true; // Toggle this for production

export interface LogData {
  method?: string;
  url?: string;
  data?: any;
  response?: any;
  error?: any;
  timestamp?: string;
}

class Logger {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = DEBUG_MODE;
  }

  /**
   * Log outgoing API requests
   */
  logRequest(method: string, url: string, data?: any) {
    if (!this.isEnabled) return;

    const logData: LogData = {
      timestamp: new Date().toISOString(),
      method,
      url,
      data
    };

    console.group(`🚀 API REQUEST: ${method} ${url}`);
    console.log('Timestamp:', logData.timestamp);
    if (data) {
      console.log('Request Data:', data);
    }
    console.groupEnd();
  }

  /**
   * Log API responses
   */
  logResponse(method: string, url: string, response?: any) {
    if (!this.isEnabled) return;

    const logData: LogData = {
      timestamp: new Date().toISOString(),
      method,
      url,
      response
    };

    console.group(`✅ API RESPONSE: ${method} ${url}`);
    console.log('Timestamp:', logData.timestamp);
    if (response) {
      console.log('Response Data:', response);
    }
    console.groupEnd();
  }

  /**
   * Log API errors
   */
  logError(method: string, url: string, error: any) {
    if (!this.isEnabled) return;

    const logData: LogData = {
      timestamp: new Date().toISOString(),
      method,
      url,
      error
    };

    console.group(`❌ API ERROR: ${method} ${url}`);
    console.log('Timestamp:', logData.timestamp);
    console.error('Error Details:', error);
    console.groupEnd();
  }

  /**
   * Log general debug information
   */
  log(message: string, data?: any) {
    if (!this.isEnabled) return;

    console.group(`🔍 DEBUG: ${message}`);
    console.log('Timestamp:', new Date().toISOString());
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Check if logging is enabled
   */
  isLoggingEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logRequest = (method: string, url: string, data?: any) => 
  logger.logRequest(method, url, data);

export const logResponse = (method: string, url: string, response?: any) => 
  logger.logResponse(method, url, response);

export const logError = (method: string, url: string, error: any) => 
  logger.logError(method, url, error);

export const log = (message: string, data?: any) => 
  logger.log(message, data);
