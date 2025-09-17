import { collection, getDocs, doc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../integrations/firebase/config';

/**
 * Servicio para gestionar operaciones RAG
 */
export class RAGService {
  /**
   * Limpiar todos los datos RAG del sistema
   */
  static async clearAllRAGData(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🧹 Starting RAG data cleanup...');
      
      const collections = [
        'document_chunks',
        'rag_conversations', 
        'library_sources_enhanced',
        'rag_dynamic_chunks',
        'rag_dynamic_responses'
      ];
      
      let totalDeleted = 0;
      const results = [];
      
      for (const collectionName of collections) {
        console.log(`🗑️ Clearing collection: ${collectionName}`);
        
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        if (snapshot.empty) {
          console.log(`✅ Collection ${collectionName} is already empty`);
          results.push({ collection: collectionName, deleted: 0, status: 'empty' });
          continue;
        }
        
        // Delete in batches of 500 (Firestore limit)
        const batch = writeBatch(db);
        let batchCount = 0;
        
        snapshot.docs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
          batchCount++;
          
          // Commit batch when it reaches 500 documents
          if (batchCount % 500 === 0) {
            batch.commit();
          }
        });
        
        // Commit remaining documents
        if (batchCount % 500 !== 0) {
          await batch.commit();
        }
        
        console.log(`✅ Deleted ${batchCount} documents from ${collectionName}`);
        totalDeleted += batchCount;
        results.push({ collection: collectionName, deleted: batchCount, status: 'cleared' });
      }
      
      // NO eliminar la configuración RAG - mantener para que funcione inmediatamente
      console.log('ℹ️ Manteniendo configuración RAG para funcionamiento inmediato');
      results.push({ collection: '_config/rag', deleted: 0, status: 'preserved' });
      
      console.log(`🎉 RAG cleanup completed! Total documents deleted: ${totalDeleted}`);
      
      return {
        success: true,
        message: 'All RAG data cleared successfully',
        data: {
          totalDeleted,
          results
        }
      };
      
    } catch (error) {
      console.error('❌ Error clearing all RAG data:', error);
      return {
        success: false,
        message: 'Failed to clear RAG data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Limpiar datos RAG de una ciudad específica
   */
  static async clearCityRAGData(citySlug: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log(`🧹 Clearing RAG data for city: ${citySlug}...`);
      
      const collections = [
        'document_chunks',
        'rag_conversations', 
        'library_sources_enhanced',
        'rag_dynamic_chunks',
        'rag_dynamic_responses'
      ];
      
      let totalDeleted = 0;
      const results = [];
      
      for (const collectionName of collections) {
        console.log(`🗑️ Clearing collection: ${collectionName} for city: ${citySlug}`);
        
        const collectionRef = collection(db, collectionName);
        
        // Query documents that match the city slug
        const q1 = query(collectionRef, where('citySlug', '==', citySlug));
        const q2 = query(collectionRef, where('city_slug', '==', citySlug));
        const q3 = query(collectionRef, where('city', '==', citySlug));
        
        const [snapshot1, snapshot2, snapshot3] = await Promise.all([
          getDocs(q1),
          getDocs(q2), 
          getDocs(q3)
        ]);
        
        // Combine all matching documents
        const allDocs = new Map();
        [...snapshot1.docs, ...snapshot2.docs, ...snapshot3.docs].forEach(doc => {
          allDocs.set(doc.id, doc);
        });
        
        if (allDocs.size === 0) {
          console.log(`ℹ️ No documents found for city ${citySlug} in ${collectionName}`);
          results.push({ collection: collectionName, deleted: 0, status: 'no_matches' });
          continue;
        }
        
        // Delete in batches
        const batch = writeBatch(db);
        let batchCount = 0;
        
        allDocs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
          batchCount++;
          
          // Commit batch when it reaches 500 documents
          if (batchCount % 500 === 0) {
            batch.commit();
          }
        });
        
        // Commit remaining documents
        if (batchCount % 500 !== 0) {
          await batch.commit();
        }
        
        console.log(`✅ Deleted ${batchCount} documents from ${collectionName} for city ${citySlug}`);
        totalDeleted += batchCount;
        results.push({ collection: collectionName, deleted: batchCount, status: 'cleared' });
      }
      
      console.log(`🎉 City RAG cleanup completed for ${citySlug}! Total documents deleted: ${totalDeleted}`);
      
      return {
        success: true,
        message: `RAG data cleared successfully for city: ${citySlug}`,
        data: {
          citySlug,
          totalDeleted,
          results
        }
      };
      
    } catch (error) {
      console.error(`❌ Error clearing RAG data for city ${citySlug}:`, error);
      return {
        success: false,
        message: 'Failed to clear city RAG data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}