// Simple language detection utility based on common words and patterns
// This is a basic implementation - for production, consider using a more robust solution

const LANGUAGE_PATTERNS = {
  es: {
    words: ['hola', 'qué', 'está', 'bien', 'gracias', 'donde', 'como', 'cuando', 'porqué', 'aquí', 'también', 'muy', 'mucho', 'poco', 'más', 'menos', 'día', 'noche', 'tiempo', 'año', 'mes', 'semana', 'ciudad', 'pueblo', 'casa', 'calle', 'restaurante', 'comida', 'comer', 'beber', 'agua', 'café', 'cerveza', 'vino', 'sí', 'no', 'puede', 'puedo', 'quiero', 'necesito', 'tengo', 'hacer', 'ir', 'venir', 'ver', 'tener', 'ser', 'estar', 'bueno', 'malo', 'grande', 'pequeño', 'nuevo', 'viejo', 'rápido', 'lento', 'fácil', 'difícil', 'importante', 'interesante'],
    patterns: [/¿.*\?/, /ñ/, /ción$/, /dad$/, /mente$/, /ar$/, /er$/, /ir$/]
  },
  en: {
    words: ['hello', 'hi', 'what', 'how', 'where', 'when', 'why', 'the', 'and', 'you', 'are', 'this', 'that', 'with', 'have', 'will', 'can', 'could', 'would', 'should', 'good', 'bad', 'great', 'nice', 'thanks', 'thank', 'please', 'sorry', 'yes', 'yeah', 'sure', 'okay', 'right', 'wrong', 'here', 'there', 'now', 'later', 'today', 'tomorrow', 'yesterday', 'time', 'day', 'night', 'week', 'month', 'year', 'city', 'town', 'house', 'street', 'restaurant', 'food', 'eat', 'drink', 'water', 'coffee', 'beer', 'wine'],
    patterns: [/\b(the|and|you|are|this|that|with|have|will)\b/i, /ing$/, /ed$/, /ly$/, /tion$/, /ness$/]
  },
  ca: {
    words: ['hola', 'què', 'com', 'on', 'quan', 'per', 'què', 'aquí', 'també', 'molt', 'poc', 'més', 'menys', 'dia', 'nit', 'temps', 'any', 'mes', 'setmana', 'ciutat', 'poble', 'casa', 'carrer', 'restaurant', 'menjar', 'beure', 'aigua', 'cafè', 'cervesa', 'vi', 'sí', 'no', 'pot', 'puc', 'vull', 'necessito', 'tinc', 'fer', 'anar', 'venir', 'veure', 'tenir', 'ser', 'estar', 'bo', 'dolent', 'gran', 'petit', 'nou', 'vell', 'ràpid', 'lent', 'fàcil', 'difícil', 'important', 'interessant'],
    patterns: [/ç/, /ny/, /ig$/, /ment$/, /tat$/, /ar$/, /re$/, /ir$/]
  },
  fr: {
    words: ['bonjour', 'salut', 'quoi', 'comment', 'où', 'quand', 'pourquoi', 'ici', 'aussi', 'très', 'peu', 'plus', 'moins', 'jour', 'nuit', 'temps', 'année', 'mois', 'semaine', 'ville', 'maison', 'rue', 'restaurant', 'nourriture', 'manger', 'boire', 'eau', 'café', 'bière', 'vin', 'oui', 'non', 'peut', 'peux', 'veux', 'besoin', 'avoir', 'faire', 'aller', 'venir', 'voir', 'être', 'bon', 'mauvais', 'grand', 'petit', 'nouveau', 'vieux', 'rapide', 'lent', 'facile', 'difficile', 'important', 'intéressant'],
    patterns: [/ç/, /tion$/, /ment$/, /ité$/, /er$/, /ir$/, /re$/]
  },
  de: {
    words: ['hallo', 'was', 'wie', 'wo', 'wann', 'warum', 'hier', 'auch', 'sehr', 'wenig', 'mehr', 'weniger', 'tag', 'nacht', 'zeit', 'jahr', 'monat', 'woche', 'stadt', 'haus', 'straße', 'restaurant', 'essen', 'trinken', 'wasser', 'kaffee', 'bier', 'wein', 'ja', 'nein', 'kann', 'will', 'brauche', 'haben', 'machen', 'gehen', 'kommen', 'sehen', 'sein', 'gut', 'schlecht', 'groß', 'klein', 'neu', 'alt', 'schnell', 'langsam', 'einfach', 'schwierig', 'wichtig', 'interessant'],
    patterns: [/ß/, /ung$/, /keit$/, /heit$/, /lich$/, /bar$/, /en$/]
  },
  it: {
    words: ['ciao', 'cosa', 'come', 'dove', 'quando', 'perché', 'qui', 'anche', 'molto', 'poco', 'più', 'meno', 'giorno', 'notte', 'tempo', 'anno', 'mese', 'settimana', 'città', 'casa', 'strada', 'ristorante', 'cibo', 'mangiare', 'bere', 'acqua', 'caffè', 'birra', 'vino', 'sì', 'no', 'può', 'posso', 'voglio', 'bisogno', 'avere', 'fare', 'andare', 'venire', 'vedere', 'essere', 'buono', 'cattivo', 'grande', 'piccolo', 'nuovo', 'vecchio', 'veloce', 'lento', 'facile', 'difficile', 'importante', 'interessante'],
    patterns: [/zione$/, /mente$/, /ità$/, /are$/, /ere$/, /ire$/]
  },
  pt: {
    words: ['olá', 'oi', 'que', 'como', 'onde', 'quando', 'por', 'que', 'aqui', 'também', 'muito', 'pouco', 'mais', 'menos', 'dia', 'noite', 'tempo', 'ano', 'mês', 'semana', 'cidade', 'casa', 'rua', 'restaurante', 'comida', 'comer', 'beber', 'água', 'café', 'cerveja', 'vinho', 'sim', 'não', 'pode', 'posso', 'quero', 'preciso', 'ter', 'fazer', 'ir', 'vir', 'ver', 'ser', 'estar', 'bom', 'mau', 'grande', 'pequeno', 'novo', 'velho', 'rápido', 'lento', 'fácil', 'difícil', 'importante', 'interessante'],
    patterns: [/ção$/, /mente$/, /dade$/, /ar$/, /er$/, /ir$/]
  },
  nl: {
    words: ['hallo', 'hoi', 'wat', 'hoe', 'waar', 'wanneer', 'waarom', 'hier', 'ook', 'veel', 'weinig', 'meer', 'minder', 'dag', 'nacht', 'tijd', 'jaar', 'maand', 'week', 'stad', 'huis', 'straat', 'restaurant', 'eten', 'drinken', 'water', 'koffie', 'bier', 'wijn', 'ja', 'nee', 'kan', 'wil', 'nodig', 'hebben', 'doen', 'gaan', 'komen', 'zien', 'zijn', 'goed', 'slecht', 'groot', 'klein', 'nieuw', 'oud', 'snel', 'langzaam', 'makkelijk', 'moeilijk', 'belangrijk', 'interessant'],
    patterns: [/lijk$/, /heid$/, /ing$/, /en$/]
  }
};

/**
 * Detects the language of a text message based on common words and patterns
 * Returns the detected language code or null if no clear match is found
 */
export const detectMessageLanguage = (text: string): string | null => {
  if (!text || text.trim().length < 3) {
    return null;
  }

  const normalizedText = text.toLowerCase().trim();
  const words = normalizedText.split(/\s+/);
  
  const scores: { [key: string]: number } = {};
  
  // Initialize scores
  Object.keys(LANGUAGE_PATTERNS).forEach(lang => {
    scores[lang] = 0;
  });
  
  // Score based on word matches
  Object.entries(LANGUAGE_PATTERNS).forEach(([lang, patterns]) => {
    patterns.words.forEach(word => {
      if (words.includes(word)) {
        scores[lang] += 3; // High weight for exact word matches
      }
      if (normalizedText.includes(word)) {
        scores[lang] += 1; // Lower weight for partial matches
      }
    });
    
    // Score based on pattern matches
    patterns.patterns.forEach(pattern => {
      if (pattern.test(normalizedText)) {
        scores[lang] += 2; // Medium weight for pattern matches
      }
    });
  });
  
  // Find the language with the highest score
  const maxScore = Math.max(...Object.values(scores));
  
  // Require a minimum confidence threshold
  if (maxScore < 2) {
    return null; // Not confident enough
  }
  
  // Find the language with the max score
  const detectedLang = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
  
  // Additional validation: if multiple languages have similar scores, be more conservative
  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const topTwo = sortedScores.slice(0, 2);
  
  if (topTwo.length >= 2 && topTwo[0][1] - topTwo[1][1] < 2) {
    // Too close, not confident enough
    return null;
  }
  
  return detectedLang || null;
};

/**
 * Checks if the detected language is different from the current language
 * and returns the new language if a switch is warranted
 */
export const shouldSwitchLanguage = (
  messageText: string, 
  currentLanguage: string, 
  isFirstMessage: boolean = false
): string | null => {
  const detectedLang = detectMessageLanguage(messageText);
  
  if (!detectedLang) {
    return null;
  }
  
  // For first message, switch if detection is confident
  if (isFirstMessage && detectedLang !== currentLanguage) {
    return detectedLang;
  }
  
  // For subsequent messages, be more conservative
  // Only switch if the detected language is very different and confident
  if (!isFirstMessage && detectedLang !== currentLanguage) {
    // Only switch if we're very confident (requires more analysis)
    const confidence = getDetectionConfidence(messageText, detectedLang);
    if (confidence > 0.8) {
      return detectedLang;
    }
  }
  
  return null;
};

/**
 * Gets a confidence score (0-1) for the detected language
 */
const getDetectionConfidence = (text: string, detectedLang: string): number => {
  const patterns = LANGUAGE_PATTERNS[detectedLang as keyof typeof LANGUAGE_PATTERNS];
  if (!patterns) return 0;
  
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/);
  
  let matches = 0;
  let totalChecks = 0;
  
  // Check word matches
  patterns.words.forEach(word => {
    totalChecks++;
    if (words.includes(word)) {
      matches += 2; // Higher weight for exact matches
    } else if (normalizedText.includes(word)) {
      matches += 1;
    }
  });
  
  // Check pattern matches
  patterns.patterns.forEach(pattern => {
    totalChecks++;
    if (pattern.test(normalizedText)) {
      matches += 1.5;
    }
  });
  
  return Math.min(matches / totalChecks, 1);
};