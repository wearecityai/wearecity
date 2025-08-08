import { useState, useEffect, useRef } from 'react';

interface TypewriterOptions {
  speed?: number; // milliseconds per character
  startDelay?: number; // delay before starting
}

export const useTypewriter = (
  targetText: string, 
  options: TypewriterOptions = {}
) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { speed = 30, startDelay = 100 } = options;

  useEffect(() => {
    // Reset state when target text changes
    setDisplayText('');
    setIsTyping(false);
    setIsComplete(false);
    indexRef.current = 0;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!targetText) {
      return;
    }

    // Start typing after delay
    const startTimer = setTimeout(() => {
      setIsTyping(true);
      
      const typeCharacter = () => {
        if (indexRef.current < targetText.length) {
          setDisplayText(targetText.slice(0, indexRef.current + 1));
          indexRef.current++;
          timerRef.current = setTimeout(typeCharacter, speed);
        } else {
          setIsTyping(false);
          setIsComplete(true);
        }
      };

      typeCharacter();
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [targetText, speed, startDelay]);

  const skipToEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setDisplayText(targetText);
    setIsTyping(false);
    setIsComplete(true);
    indexRef.current = targetText.length;
  };

  return {
    displayText,
    isTyping,
    isComplete,
    skipToEnd
  };
};