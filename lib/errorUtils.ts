// Utility to convert technical errors to human-friendly messages
export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.'

  const errorMessage = error.message || error.toString()

  // Network/CORS errors
  if (errorMessage.includes('CORS') ||
      errorMessage.includes('Network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('ERR_NETWORK')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }

  // Timeout errors
  if (errorMessage.includes('timeout') ||
      errorMessage.includes('TimeoutError')) {
    return 'The request took too long to complete. Please try again.'
  }

  // Authentication errors
  if (errorMessage.includes('401') ||
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('Invalid credentials')) {
    return 'Your session has expired. Please log in again.'
  }

  // Permission errors
  if (errorMessage.includes('403') ||
      errorMessage.includes('Forbidden')) {
    return 'You don\'t have permission to perform this action.'
  }

  // Server errors
  if (errorMessage.includes('500') ||
      errorMessage.includes('Internal Server Error')) {
    return 'Something went wrong on our end. Please try again later.'
  }

  // File not found
  if (errorMessage.includes('404') ||
      errorMessage.includes('Not Found')) {
    return 'The requested item could not be found.'
  }

  // File too large
  if (errorMessage.includes('413') ||
      errorMessage.includes('Payload Too Large') ||
      errorMessage.includes('File too large')) {
    return 'The file you\'re trying to upload is too large. Please choose a smaller file.'
  }

  // Scanner agent not running
  if (errorMessage.includes('Scanner Agent') ||
      errorMessage.includes('agent not running')) {
    return 'The scanner agent is not connected. Please install and run the scanner agent.'
  }

  // Default fallback
  return 'Something went wrong. Please try again or contact support if the problem persists.'
}