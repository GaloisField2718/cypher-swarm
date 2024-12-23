/**
 * Utility function to pause execution for a specified duration
 * @param ms - Duration to sleep in milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}; 