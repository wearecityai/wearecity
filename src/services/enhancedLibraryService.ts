import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../integrations/firebase/config';

export interface EnhancedLibrarySource {
  id: string;
  type: 'url' | 'text' | 'document';
  title: string;
  originalUrl?: string;
  content: string;
  embedding?: number[];
  documentLinks: string[];
  processingStatus: 'pending' | 'scraped' | 'processed' | 'embedded' | 'ready' | 'error';
  chunks?: DocumentChunk[];
  metadata: {
    wordCount: number;
    language: string;
    tags: string[];
    extractedText: string;
    chunksCount?: number;
    embeddingGenerated?: boolean;
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  citySlug: string;
}

export interface DocumentChunk {
  id: string;
  sourceId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  metadata: any;
  createdAt: Date;
}

export interface RAGResponse {
  success: boolean;
  response?: string;
  sourcesUsed?: number;
  modelUsed?: string;
  relevantSources?: any[];
  error?: string;
}

export interface ScrapingOptions {
  extractDocumentLinks: boolean;
  followInternalLinks: boolean;
  maxPages?: number;
  includeImages: boolean;
}

class EnhancedLibraryService {
  private static instance: EnhancedLibraryService;

  public static getInstance(): EnhancedLibraryService {
    if (!EnhancedLibraryService.instance) {
      EnhancedLibraryService.instance = new EnhancedLibraryService();
    }
    return EnhancedLibraryService.instance;
  }

  /**
   * Configurar sistema RAG inicial
   */
  async setupRAGSystem(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('https://us-central1-wearecity-2ab89.cloudfunctions.net/setupRAGSystem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error setting up RAG system:', error);
      throw error;
    }
  }

  /**
   * Añadir fuente con scraping avanzado usando HTTP function
   */
  async addSourceWithScraping(
    url: string, 
    userId: string, 
    citySlug: string,
    options: ScrapingOptions,
    title?: string
  ): Promise<{ success: boolean; sourceId?: string; documentLinks?: string[]; contentLength?: number; error?: string }> {
    try {
      console.log('🚀 Using HTTP Firecrawl scraping function');
      
      const response = await fetch('https://us-central1-wearecity-2ab89.cloudfunctions.net/httpFirecrawlScrapingFunction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          userId,
          citySlug,
          title,
          options
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ HTTP Firecrawl scraping result:', result);
      
      return result;
    } catch (error) {
      console.error('Error adding source with HTTP scraping:', error);
      throw error;
    }
  }

  /**
   * Crawling avanzado de múltiples páginas
   */
  async advancedCrawling(
    startUrl: string,
    maxPages: number,
    userId: string,
    citySlug: string
  ): Promise<{ success: boolean; pagesProcessed?: number; results?: any[]; error?: string }> {
    try {
      const advancedCrawling = httpsCallable(functions, 'advancedCrawlingFunction');
      
      const result = await advancedCrawling({
        startUrl,
        maxPages,
        userId,
        citySlug
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error with advanced crawling:', error);
      throw error;
    }
  }

  /**
   * Procesar documento PDF
   */
  async processDocument(
    documentUrl: string,
    sourceId: string,
    userId: string,
    citySlug: string
  ): Promise<{ success: boolean; chunksCount?: number; textLength?: number; message?: string }> {
    try {
      const processDocument = httpsCallable(functions, 'processDocumentFunction');
      
      const result = await processDocument({
        documentUrl,
        sourceId,
        userId,
        citySlug
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Procesar texto manual
   */
  async processManualText(
    title: string,
    content: string,
    userId: string,
    citySlug: string
  ): Promise<{ success: boolean; sourceId?: string; chunksCount?: number; textLength?: number }> {
    try {
      const processManualText = httpsCallable(functions, 'processManualTextFunction');
      
      const result = await processManualText({
        title,
        content,
        userId,
        citySlug
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error processing manual text:', error);
      throw error;
    }
  }

  /**
   * Generar embeddings para una fuente usando HTTP function
   */
  async generateEmbeddings(sourceId: string, userId: string, citySlug: string): Promise<{ success: boolean; chunksProcessed?: number; mainContentEmbedded?: boolean; error?: string }> {
    try {
      console.log('🚀 Using HTTP embeddings generation function');
      
      const response = await fetch('https://us-central1-wearecity-2ab89.cloudfunctions.net/httpGenerateEmbeddingsFunction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId,
          userId,
          citySlug
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ HTTP embeddings generation result:', result);
      
      return result;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Generar embeddings para múltiples fuentes
   */
  async generateBatchEmbeddings(
    sourceIds: string[],
    userId: string,
    citySlug: string
  ): Promise<{ success: boolean; totalProcessed?: number; successCount?: number; errorCount?: number; results?: any[] }> {
    try {
      const generateBatchEmbeddings = httpsCallable(functions, 'generateBatchEmbeddingsFunction');
      
      const result = await generateBatchEmbeddings({
        sourceIds,
        userId,
        citySlug
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Regenerar todos los embeddings de un usuario
   */
  async regenerateEmbeddings(userId: string, citySlug: string): Promise<{ success: boolean; totalProcessed?: number; successCount?: number; errorCount?: number; results?: any[] }> {
    try {
      const regenerateEmbeddings = httpsCallable(functions, 'regenerateEmbeddingsFunction');
      
      const result = await regenerateEmbeddings({
        userId,
        citySlug
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error regenerating embeddings:', error);
      throw error;
    }
  }

  /**
   * Búsqueda vectorial
   */
  async vectorSearch(
    query: string,
    userId: string,
    citySlug: string,
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<{ success: boolean; results?: any[]; totalChunks?: number; queryEmbedding?: number[]; error?: string }> {
    try {
      const vectorSearch = httpsCallable(functions, 'vectorSearchFunction');
      
      const result = await vectorSearch({
        query,
        userId,
        citySlug,
        limit,
        threshold
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error with vector search:', error);
      throw error;
    }
  }

  /**
   * Búsqueda híbrida (vectorial + texto)
   */
  async hybridSearch(
    query: string,
    userId: string,
    citySlug: string,
    limit: number = 5
  ): Promise<{ success: boolean; results?: any[]; vectorResults?: number; textResults?: number; totalCombined?: number }> {
    try {
      const hybridSearch = httpsCallable(functions, 'hybridSearchFunction');
      
      const result = await hybridSearch({
        query,
        userId,
        citySlug,
        limit
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error with hybrid search:', error);
      throw error;
    }
  }

  /**
   * Consulta RAG completa
   */
  async ragQuery(
    query: string,
    userId: string,
    citySlug: string,
    conversationHistory: any[] = [],
    useHybridSearch: boolean = true,
    maxSources: number = 3
  ): Promise<RAGResponse> {
    try {
      const ragQuery = httpsCallable(functions, 'ragQueryFunction');
      
      const result = await ragQuery({
        query,
        userId,
        citySlug,
        conversationHistory,
        useHybridSearch,
        maxSources
      });
      
      return result.data as RAGResponse;
    } catch (error) {
      console.error('Error with RAG query:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de conversaciones RAG
   */
  async getRAGConversations(
    userId: string,
    citySlug: string,
    limit: number = 10
  ): Promise<{ success: boolean; conversations?: any[]; count?: number }> {
    try {
      const getRAGConversations = httpsCallable(functions, 'getRAGConversationsFunction');
      
      const result = await getRAGConversations({
        userId,
        citySlug,
        limit
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error getting RAG conversations:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de RAG
   */
  async getRAGStats(userId: string, citySlug: string): Promise<{ success: boolean; stats?: any }> {
    try {
      const getRAGStats = httpsCallable(functions, 'getRAGStatsFunction');
      
      const result = await getRAGStats({
        userId,
        citySlug
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error getting RAG stats:', error);
      throw error;
    }
  }

  /**
   * Obtener fuentes con estado de procesamiento
   */
  async getSourcesWithStatus(userId: string, citySlug: string): Promise<EnhancedLibrarySource[]> {
    try {
      const sourcesRef = collection(db, 'library_sources_enhanced');
      const q = query(
        sourcesRef,
        where('userId', '==', userId),
        where('citySlug', '==', citySlug),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as EnhancedLibrarySource[];
    } catch (error) {
      console.error('Error getting sources with status:', error);
      return [];
    }
  }

  /**
   * Obtener chunks de una fuente
   */
  async getSourceChunks(sourceId: string): Promise<DocumentChunk[]> {
    try {
      const chunksRef = collection(db, 'document_chunks');
      const q = query(
        chunksRef,
        where('sourceId', '==', sourceId),
        orderBy('chunkIndex')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as DocumentChunk[];
    } catch (error) {
      console.error('Error getting source chunks:', error);
      return [];
    }
  }

  /**
   * Eliminar fuente y sus chunks
   */
  async deleteSource(sourceId: string): Promise<void> {
    try {
      // Eliminar chunks primero
      const chunksSnapshot = await getDocs(
        query(collection(db, 'document_chunks'), where('sourceId', '==', sourceId))
      );
      
      const batch = [];
      chunksSnapshot.docs.forEach(doc => {
        batch.push(deleteDoc(doc.ref));
      });
      
      // Eliminar fuente
      batch.push(deleteDoc(doc(db, 'library_sources_enhanced', sourceId)));
      
      await Promise.all(batch);
    } catch (error) {
      console.error('Error deleting source:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de procesamiento de una fuente
   */
  async updateSourceStatus(sourceId: string, status: EnhancedLibrarySource['processingStatus']): Promise<void> {
    try {
      const sourceRef = doc(db, 'library_sources_enhanced', sourceId);
      await updateDoc(sourceRef, { 
        processingStatus: status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating source status:', error);
      throw error;
    }
  }
}

export const enhancedLibraryService = EnhancedLibraryService.getInstance();
