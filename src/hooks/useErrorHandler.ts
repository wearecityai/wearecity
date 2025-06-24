
import { API_KEY_ERROR_MESSAGE } from '../constants';

export const useErrorHandler = () => {
  const getFriendlyError = (error: any, defaultMessage: string): string => {
    let message = defaultMessage;
    if (!error) return defaultMessage;

    if (typeof error.message === 'string') {
      if (error.message.toLowerCase().includes('failed to fetch') || error.message.toLowerCase().includes('networkerror')) {
        message = "Error de red. Verifica tu conexión a internet.";
      } else if (error.message.includes("API Key") || error.message.toLowerCase().includes("api_key")) {
        message = API_KEY_ERROR_MESSAGE;
      } else {
        message = error.message;
      }
    }

    if (message === defaultMessage && navigator && !navigator.onLine) {
      message = "Parece que no hay conexión a internet.";
    }
    return message;
  };

  return { getFriendlyError };
};
