import { useState, useEffect } from 'react';

export interface SequentialItem {
  type: 'text' | 'event' | 'place';
  content: string;
  data?: any;
  index?: number;
}

export const useSequentialReveal = (items: SequentialItem[], textSpeed: number = 8, cardDelay: number = 400) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentTextProgress, setCurrentTextProgress] = useState('');
  const [isTypingText, setIsTypingText] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (items.length === 0) return;

    setCurrentItemIndex(0);
    setCurrentTextProgress('');
    setIsTypingText(false);
    setCompletedItems(new Set());

    const processNextItem = (itemIndex: number) => {
      if (itemIndex >= items.length) return;

      const item = items[itemIndex];
      setCurrentItemIndex(itemIndex);

      if (item.type === 'text') {
        setIsTypingText(true);
        setCurrentTextProgress('');
        
        let charIndex = 0;
        const typeText = () => {
          if (charIndex < item.content.length) {
            setCurrentTextProgress(item.content.slice(0, charIndex + 1));
            charIndex++;
            setTimeout(typeText, textSpeed);
          } else {
            setIsTypingText(false);
            setCompletedItems(prev => new Set([...prev, itemIndex]));
            setTimeout(() => processNextItem(itemIndex + 1), 100);
          }
        };
        
        setTimeout(typeText, 200);
      } else {
        // Para cards, simplemente las marcamos como completadas después del delay
        setTimeout(() => {
          setCompletedItems(prev => new Set([...prev, itemIndex]));
          setTimeout(() => processNextItem(itemIndex + 1), 100);
        }, cardDelay);
      }
    };

    processNextItem(0);
  }, [items, textSpeed, cardDelay]);

  const skipToEnd = () => {
    setCurrentItemIndex(items.length - 1);
    setCurrentTextProgress(items.find(item => item.type === 'text')?.content || '');
    setIsTypingText(false);
    setCompletedItems(new Set(items.map((_, index) => index)));
  };

  return {
    currentItemIndex,
    currentTextProgress,
    isTypingText,
    completedItems,
    skipToEnd
  };
};