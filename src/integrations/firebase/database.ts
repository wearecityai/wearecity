import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Query,
  DocumentData,
  WriteBatch,
  writeBatch,
  Timestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// Types to match Supabase's interface
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseArrayResponse<T> {
  data: T[] | null;
  error: Error | null;
}

// Convert Firestore timestamp to ISO string for compatibility
const convertTimestamp = (value: any): any => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value && typeof value === 'object') {
    const converted: any = {};
    for (const [key, val] of Object.entries(value)) {
      converted[key] = convertTimestamp(val);
    }
    return converted;
  }
  return value;
};

// Query builder class that mimics Supabase's interface
export class FirestoreQueryBuilder<T> {
  private collectionName: string;
  private constraints: QueryConstraint[] = [];
  private selectFields?: string[];

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  select(fields?: string): this {
    if (fields && fields !== '*') {
      this.selectFields = fields.split(',').map(f => f.trim());
    }
    return this;
  }

  eq(field: string, value: any): this {
    this.constraints.push(where(field, '==', value));
    return this;
  }

  neq(field: string, value: any): this {
    this.constraints.push(where(field, '!=', value));
    return this;
  }

  gt(field: string, value: any): this {
    this.constraints.push(where(field, '>', value));
    return this;
  }

  gte(field: string, value: any): this {
    this.constraints.push(where(field, '>=', value));
    return this;
  }

  lt(field: string, value: any): this {
    this.constraints.push(where(field, '<', value));
    return this;
  }

  lte(field: string, value: any): this {
    this.constraints.push(where(field, '<=', value));
    return this;
  }

  in(field: string, values: any[]): this {
    this.constraints.push(where(field, 'in', values));
    return this;
  }

  order(field: string, options?: { ascending?: boolean }): this {
    const direction = options?.ascending !== false ? 'asc' : 'desc';
    this.constraints.push(orderBy(field, direction));
    return this;
  }

  limit(count: number): this {
    this.constraints.push(limit(count));
    return this;
  }

  // Execute query and return single document
  async single(): Promise<DatabaseResponse<T>> {
    try {
      const q = query(collection(db, this.collectionName), ...this.constraints, limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { data: null, error: null };
      }

      const docData = querySnapshot.docs[0].data();
      const convertedData = convertTimestamp({ id: querySnapshot.docs[0].id, ...docData });
      
      return { data: convertedData as T, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Execute query and return single document (may be null)
  async maybeSingle(): Promise<DatabaseResponse<T>> {
    return this.single();
  }

  // Execute query and return array of documents
  async execute(): Promise<DatabaseArrayResponse<T>> {
    try {
      const q = query(collection(db, this.collectionName), ...this.constraints);
      const querySnapshot = await getDocs(q);
      
      const docs = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return convertTimestamp({ id: doc.id, ...docData });
      });

      return { data: docs as T[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // For compatibility with Supabase's direct execution
  async then(onFulfilled?: (value: DatabaseArrayResponse<T>) => any): Promise<any> {
    const result = await this.execute();
    return onFulfilled ? onFulfilled(result) : result;
  }
}

// Main database class for Firebase/Firestore operations
export class FirestoreClient {
  // Get a query builder for a collection
  from(tableName: string) {
    return new FirestoreQueryBuilder(tableName);
  }

  // Insert data
  async insert(tableName: string, data: any | any[]): Promise<DatabaseArrayResponse<any>> {
    try {
      if (Array.isArray(data)) {
        // Batch insert
        const batch = writeBatch(db);
        const results: any[] = [];

        for (const item of data) {
          const docRef = doc(collection(db, tableName));
          const dataWithTimestamp = {
            ...item,
            createdAt: item.createdAt || Timestamp.now(),
            updatedAt: item.updatedAt || Timestamp.now(),
          };
          batch.set(docRef, dataWithTimestamp);
          results.push({ id: docRef.id, ...dataWithTimestamp });
        }

        await batch.commit();
        return { data: results, error: null };
      } else {
        // Single insert
        const dataWithTimestamp = {
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
        };
        
        let docRef;
        if (data.id) {
          // Use provided ID
          docRef = doc(db, tableName, data.id);
          await updateDoc(docRef, dataWithTimestamp);
        } else {
          // Generate ID
          docRef = await addDoc(collection(db, tableName), dataWithTimestamp);
        }
        
        const result = { id: docRef.id, ...dataWithTimestamp };
        return { data: [convertTimestamp(result)], error: null };
      }
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Update data
  async update(tableName: string, data: any, id: string): Promise<DatabaseResponse<any>> {
    try {
      const docRef = doc(db, tableName, id);
      const dataWithTimestamp = {
        ...data,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(docRef, dataWithTimestamp);
      
      // Get updated document
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        const result = { id: updatedDoc.id, ...updatedDoc.data() };
        return { data: convertTimestamp(result), error: null };
      }
      
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Delete data
  async delete(tableName: string, id: string): Promise<{ error: Error | null }> {
    try {
      const docRef = doc(db, tableName, id);
      await deleteDoc(docRef);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Get single document by ID
  async getById(tableName: string, id: string): Promise<DatabaseResponse<any>> {
    try {
      const docRef = doc(db, tableName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const result = { id: docSnap.id, ...docSnap.data() };
        return { data: convertTimestamp(result), error: null };
      }
      
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}

// Create and export the client instance
export const firestoreClient = new FirestoreClient();