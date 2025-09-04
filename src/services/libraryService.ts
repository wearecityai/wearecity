import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../integrations/firebase/config';

export interface LibrarySource {
  id: string;
  type: 'url' | 'text' | 'document';
  title: string;
  content: string;
  url?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  createdAt: Date;
  lastUsed?: Date;
  citySlug?: string;
  userId?: string;
  metadata?: {
    wordCount?: number;
    language?: string;
    tags?: string[];
    extractedText?: string;
  };
}

export interface LibraryChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: LibrarySource[];
  conversationId?: string;
}

class LibraryService {
  private static instance: LibraryService;

  public static getInstance(): LibraryService {
    if (!LibraryService.instance) {
      LibraryService.instance = new LibraryService();
    }
    return LibraryService.instance;
  }

  /**
   * Añadir una nueva fuente a la biblioteca
   */
  async addSource(source: Omit<LibrarySource, 'id' | 'createdAt' | 'status'>, userId?: string, citySlug?: string): Promise<string> {
    try {
      console.log('➕ LibraryService.addSource called with:', { 
        source: { ...source, content: source.content.substring(0, 100) + '...' }, 
        userId, 
        citySlug 
      });

      const newSource: Omit<LibrarySource, 'id'> = {
        ...source,
        status: 'processing',
        createdAt: new Date(),
        userId: userId || 'anonymous',
        citySlug: citySlug || 'default',
        metadata: {
          wordCount: source.content.split(' ').length,
          language: this.detectLanguage(source.content),
          tags: this.extractTags(source.content),
          extractedText: source.content
        }
      };

      console.log('📝 Creating document in Firestore...');
      const docRef = await addDoc(collection(db, 'library_sources'), {
        ...newSource,
        createdAt: newSource.createdAt.toISOString(),
        lastUsed: newSource.lastUsed ? newSource.lastUsed.toISOString() : null
      });

      console.log('✅ Document created with ID:', docRef.id);

      // Simular procesamiento
      setTimeout(async () => {
        console.log('🔄 Updating source status to ready...');
        await this.updateSourceStatus(docRef.id, 'ready');
      }, 2000);

      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding source to library:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las fuentes de la biblioteca
   */
  async getSources(userId?: string, citySlug?: string): Promise<LibrarySource[]> {
    try {
      console.log('🔍 LibraryService.getSources called with:', { userId, citySlug });

      const sourcesRef = collection(db, 'library_sources');
      // Usar solo orderBy para evitar problemas de índices
      let q = query(sourcesRef, orderBy('createdAt', 'desc'));

      console.log('🔍 Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('📊 Query returned', querySnapshot.docs.length, 'documents');
      
      const allSources = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Document data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data,
          createdAt: new Date(data.createdAt),
          lastUsed: data.lastUsed ? new Date(data.lastUsed) : undefined
        };
      }) as LibrarySource[];

      // Filtrar por ciudad en el cliente para evitar problemas de índices
      const filteredSources = citySlug 
        ? allSources.filter(source => source.citySlug === citySlug)
        : allSources;

      console.log('✅ Processed sources:', filteredSources);
      return filteredSources;
    } catch (error) {
      console.error('❌ Error getting sources from library:', error);
      return [];
    }
  }

  /**
   * Buscar fuentes por contenido
   */
  async searchSources(query: string, userId?: string, citySlug?: string): Promise<LibrarySource[]> {
    try {
      const allSources = await this.getSources(userId, citySlug);
      const searchTerm = query.toLowerCase();
      
      return allSources.filter(source => 
        source.status === 'ready' && (
          source.title.toLowerCase().includes(searchTerm) ||
          source.content.toLowerCase().includes(searchTerm) ||
          source.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        )
      );
    } catch (error) {
      console.error('Error searching sources:', error);
      return [];
    }
  }

  /**
   * Actualizar el estado de una fuente
   */
  async updateSourceStatus(sourceId: string, status: LibrarySource['status']): Promise<void> {
    try {
      const sourceRef = doc(db, 'library_sources', sourceId);
      await updateDoc(sourceRef, { status });
    } catch (error) {
      console.error('Error updating source status:', error);
    }
  }

  /**
   * Marcar una fuente como usada
   */
  async markSourceAsUsed(sourceId: string): Promise<void> {
    try {
      const sourceRef = doc(db, 'library_sources', sourceId);
      await updateDoc(sourceRef, { lastUsed: new Date().toISOString() });
    } catch (error) {
      console.error('Error marking source as used:', error);
    }
  }

  /**
   * Eliminar una fuente
   */
  async deleteSource(sourceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'library_sources', sourceId));
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  }

  /**
   * Procesar contenido de URL (web scraping)
   */
  async processUrlContent(url: string): Promise<{ title: string; content: string }> {
    try {
      console.log('🌐 Attempting to fetch URL:', url);
      
      // Para desarrollo, simular el contenido de la URL
      // En producción, esto se haría en el backend
      const mockContent = this.generateMockContentFromUrl(url);
      
      console.log('✅ URL processed (mock mode), content length:', mockContent.content.length);
      
      return mockContent;
    } catch (error) {
      console.error('❌ Error processing URL content:', error);
      return {
        title: 'Contenido de URL',
        content: `Contenido extraído de: ${url}\n\nNota: No se pudo procesar el contenido automáticamente.`
      };
    }
  }

  /**
   * Generar contenido simulado basado en la URL
   */
  private generateMockContentFromUrl(url: string): { title: string; content: string } {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    let title = 'Contenido de URL';
    let content = `Contenido extraído de: ${url}\n\n`;
    
    // Generar contenido específico basado en la URL
    if (domain.includes('villajoyosa.com')) {
      if (path.includes('evento')) {
        title = 'Eventos de La Vila Joiosa';
        content += `Información sobre eventos y actividades en La Vila Joiosa.\n\n`;
        content += `Esta fuente contiene información actualizada sobre:\n`;
        content += `- Eventos culturales y festivos\n`;
        content += `- Actividades municipales\n`;
        content += `- Fiestas locales\n`;
        content += `- Conciertos y espectáculos\n\n`;
        content += `Fuente oficial del Ayuntamiento de La Vila Joiosa.`;
      } else if (path.includes('turismo')) {
        title = 'Turismo en La Vila Joiosa';
        content += `Información turística de La Vila Joiosa.\n\n`;
        content += `Esta fuente contiene información sobre:\n`;
        content += `- Atracciones turísticas\n`;
        content += `- Playas y naturaleza\n`;
        content += `- Historia y cultura\n`;
        content += `- Gastronomía local\n\n`;
        content += `Guía oficial de turismo de La Vila Joiosa.`;
      } else {
        title = 'Información Municipal de La Vila Joiosa';
        content += `Información oficial del Ayuntamiento de La Vila Joiosa.\n\n`;
        content += `Esta fuente contiene información sobre:\n`;
        content += `- Servicios municipales\n`;
        content += `- Trámites administrativos\n`;
        content += `- Noticias locales\n`;
        content += `- Normativas municipales\n\n`;
        content += `Portal oficial del Ayuntamiento de La Vila Joiosa.`;
      }
    } else {
      title = `Contenido de ${domain}`;
      content += `Información obtenida de ${domain}.\n\n`;
      content += `Esta fuente contiene información relevante para la ciudad.\n`;
      content += `Se recomienda verificar la información directamente en la fuente original.`;
    }
    
    return { title, content };
  }

  /**
   * Procesar documento PDF
   */
  async processPdfContent(file: File): Promise<{ title: string; content: string }> {
    try {
      // En un entorno real, esto se haría en el backend
      const text = await this.extractTextFromPdf(file);
      return {
        title: file.name,
        content: text
      };
    } catch (error) {
      console.error('Error processing PDF content:', error);
      return {
        title: file.name,
        content: 'Error al procesar el PDF'
      };
    }
  }

  /**
   * Detectar idioma del contenido
   */
  private detectLanguage(content: string): string {
    // Detección simple basada en patrones comunes
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las'];
    const englishWords = ['the', 'of', 'and', 'a', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word'];
    
    const words = content.toLowerCase().split(/\s+/);
    const spanishCount = words.filter(word => spanishWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return spanishCount > englishCount ? 'es' : 'en';
  }

  /**
   * Extraer tags del contenido
   */
  private extractTags(content: string): string[] {
    // Extraer palabras clave simples
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extraer texto de PDF (simulado)
   */
  private async extractTextFromPdf(file: File): Promise<string> {
    // En un entorno real, esto se haría con una librería como pdf-parse
    return `Contenido extraído del PDF: ${file.name}`;
  }

  /**
   * Obtener fuentes relevantes para una consulta
   */
  async getRelevantSources(query: string, userId?: string, citySlug?: string): Promise<LibrarySource[]> {
    try {
      const relevantSources = await this.searchSources(query, userId, citySlug);
      
      // Marcar fuentes como usadas
      await Promise.all(
        relevantSources.map(source => this.markSourceAsUsed(source.id))
      );
      
      return relevantSources;
    } catch (error) {
      console.error('Error getting relevant sources:', error);
      return [];
    }
  }
}

export const libraryService = LibraryService.getInstance();
