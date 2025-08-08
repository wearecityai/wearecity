import { useState, useEffect } from 'react';

export const useProgressiveReveal = (itemCount: number, delay: number = 300) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (itemCount === 0) {
      setVisibleCount(0);
      return;
    }

    setVisibleCount(0);
    
    const timers: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleCount(i + 1);
      }, i * delay);
      timers.push(timer);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [itemCount, delay]);

  return visibleCount;
};