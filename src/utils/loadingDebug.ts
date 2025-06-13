
export const debugLoading = (component: string, state: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${component}] Loading state:`, {
      timestamp: new Date().toISOString(),
      ...state
    });
  }
};

export const withLoadingTimeout = <T>(
  promise: Promise<T>, 
  timeoutMs: number = 10000,
  errorMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};
