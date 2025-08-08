import { useState, useEffect } from 'react';

interface UseStrictSequentialRevealOptions {
  textContent?: string;
  totalCards: number;
  typewriterIsComplete: boolean;
  cardDelay?: number;
  messageId?: string; // unique identifier for the message
}

// Global map to track revealed cards per message
const revealedCards = new Map<string, number>();

export const useStrictSequentialReveal = ({
  textContent,
  totalCards,
  typewriterIsComplete,
  cardDelay = 400,
  messageId
}: UseStrictSequentialRevealOptions) => {
  const [visibleCards, setVisibleCards] = useState(0);

  useEffect(() => {
    // If this message already has revealed cards, show them immediately
    if (messageId && revealedCards.has(messageId)) {
      const revealedCount = revealedCards.get(messageId)!;
      setVisibleCards(Math.min(revealedCount, totalCards));
      return;
    }

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
  }, [textContent, totalCards, typewriterIsComplete, cardDelay, messageId]);

  const showCardsSequentially = () => {
    const timers: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < totalCards; i++) {
      const timer = setTimeout(() => {
        setVisibleCards(i + 1);
        // Save the revealed state when all cards are shown
        if (i === totalCards - 1 && messageId) {
          revealedCards.set(messageId, totalCards);
        }
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