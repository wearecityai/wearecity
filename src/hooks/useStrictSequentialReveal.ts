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
    
    // Esperar a que el typewriter se complete Y haya contenido de texto
    if (typewriterIsComplete && textContent && textContent.trim() !== '' && totalCards > 0 && !hasStartedDelay) {
      setHasStartedDelay(true);
      
      // Delay después de que termine la introducción para mostrar las cards
      setTimeout(() => {
        showCardsSequentially();
      }, 500); // 500ms después de terminar la introducción
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
    // 🎯 LÓGICA ESTRICTA: Solo mostrar cards DESPUÉS de la introducción
    // Si el typewriter NO está completo, no mostrar ninguna card
    if (!typewriterIsComplete) {
      return false;
    }
    
    // Si no hay contenido de texto, no mostrar cards
    if (!textContent || textContent.trim() === '') {
      return false;
    }
    
    // Si no ha empezado el delay, no mostrar cards
    if (!hasStartedDelay) {
      return false;
    }
    
    // Mostrar cards secuencialmente
    return cardIndex < visibleCards;
  };

  return {
    shouldShowCard,
    visibleCards
  };
};