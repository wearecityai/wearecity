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
    
    // MODIFICACIÓN: Lógica más rápida para mostrar cards
    // Si no hay typewriter activo (typewriterIsComplete = true), mostrar cards inmediatamente
    if (typewriterIsComplete) {
      if (totalCards > 0) {
        // Add a small delay to prevent flashing
        setTimeout(() => {
          showCardsSequentially();
        }, 200);
      }
      return;
    }

    // Si no hay textContent, mostrar cards inmediatamente
    if (!textContent || textContent.trim() === '') {
      if (totalCards > 0) {
        // Add a small delay to prevent flashing
        setTimeout(() => {
          showCardsSequentially();
        }, 100);
      }
      return;
    }

    // Si hay typewriter activo, esperar a que se complete
    if (typewriterIsComplete && totalCards > 0 && !hasStartedDelay) {
      setHasStartedDelay(true);
      // Reducir el delay después del typewriter de 1000ms a 300ms
      setTimeout(() => {
        showCardsSequentially();
      }, 300);
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
    // MODIFICACIÓN: Lógica más simple y rápida
    // Si el typewriter está completo, mostrar cards inmediatamente
    if (typewriterIsComplete) {
      return cardIndex < visibleCards;
    }
    
    // Si no hay textContent, mostrar cards inmediatamente
    if (!textContent || textContent.trim() === '') {
      return cardIndex < visibleCards;
    }
    
    // Si hay typewriter activo, esperar a que se complete
    if (!hasStartedDelay) {
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