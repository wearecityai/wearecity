import { useState, useEffect } from 'react';

interface UseStrictSequentialRevealOptions {
  textContent?: string;
  totalCards: number;
  typewriterIsComplete: boolean;
  cardDelay?: number;
}

export const useStrictSequentialReveal = ({
  textContent,
  totalCards,
  typewriterIsComplete,
  cardDelay = 400
}: UseStrictSequentialRevealOptions) => {
  const [visibleCards, setVisibleCards] = useState(0);

  useEffect(() => {
    // Reset when content changes
    setVisibleCards(0);
    
    // If there's no text content, start showing cards immediately
    if (!textContent || textContent.trim() === '') {
      if (totalCards > 0) {
        showCardsSequentially();
      }
      return;
    }

    // If there's text content, wait for typewriter to complete
    if (typewriterIsComplete && totalCards > 0) {
      showCardsSequentially();
    }
  }, [textContent, totalCards, typewriterIsComplete, cardDelay]);

  const showCardsSequentially = () => {
    const timers: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < totalCards; i++) {
      const timer = setTimeout(() => {
        setVisibleCards(i + 1);
      }, i * cardDelay);
      timers.push(timer);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  };

  const shouldShowCard = (cardIndex: number): boolean => {
    // If there's text content, cards can only show after typewriter is complete
    if (textContent && textContent.trim() !== '' && !typewriterIsComplete) {
      return false;
    }
    
    // Show cards sequentially
    return cardIndex < visibleCards;
  };

  return {
    shouldShowCard,
    visibleCards
  };
};