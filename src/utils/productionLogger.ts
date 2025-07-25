// Production-specific logging and error handling utilities

export const logProduction = (message: string, data?: any) => {
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname !== 'localhost';
    if (isProduction) {
      console.log(`[PROD] ${message}`, data);
    }
  }
};

export const logProductionError = (error: any, context: string) => {
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname !== 'localhost';
    if (isProduction) {
      console.error(`[PROD ERROR] ${context}:`, error);
      
      // Log additional environment info
      console.log('[PROD INFO]', {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    }
  }
};

export const safeImageLoad = (imageSrc: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => {
      logProductionError(`Failed to load image: ${imageSrc}`, 'IMAGE_LOAD');
      resolve(false);
    };
    img.src = imageSrc;
  });
};