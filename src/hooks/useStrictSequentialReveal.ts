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
  const [hasStartedDelay, setHasStartedDelay] = useState(false);

  useEffect(() => {
    // If this message already has revealed cards, show them immediately
    if (messageId && revealedCards.has(messageId)) {
      const revealedCount = revealedCards.get(messageId)!;
      setVisibleCards(Math.min(revealedCount, totalCards));
      return;
    }

    // Reset when content changes
    setVisibleCards(0);
    setHasStartedDelay(false);
    
    // If there's no text content, start showing cards immediately
    if (!textContent || textContent.trim() === '') {
      if (totalCards > 0) {
        // Add a small delay to prevent flashing
        setTimeout(() => {
          showCardsSequentially();
        }, 100);
      }
      return;
    }

    // If there's text content, wait for typewriter to complete
    if (typewriterIsComplete && totalCards > 0 && !hasStartedDelay) {
      setHasStartedDelay(true);
      // Add a 1 second delay after typewriter completes to prevent premature card display
      setTimeout(() => {
        showCardsSequentially();
      }, 1000);
    }
  }, [textContent, totalCards, typewriterIsComplete, cardDelay, messageId, hasStartedDelay]);

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
    // AND the text content must match the final content (no partial text)
    if (textContent && textContent.trim() !== '') {
      if (!typewriterIsComplete || !hasStartedDelay) {
        return false;
      }
    }
    
    // Show cards sequentially
    return cardIndex < visibleCards;
  };

  return {
    shouldShowCard,
    visibleCards
  };
};