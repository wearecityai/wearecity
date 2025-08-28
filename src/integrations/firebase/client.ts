// Firebase client that mimics Supabase's interface exactly
import { firestoreClient } from './database';
import { 
  signInWithPassword, 
  signUp, 
  signOutUser, 
  getSession, 
  onAuthStateChange,
  User,
  Session,
  AuthResponse
} from './auth';

// Enhanced query builder that supports Supabase-like chaining
class FirebaseQueryBuilder {
  private tableName: string;
  private queryBuilder: any;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.queryBuilder = firestoreClient.from(tableName);
  }

  select(fields?: string) {
    this.queryBuilder = this.queryBuilder.select(fields);
    return this;
  }

  eq(field: string, value: any) {
    this.queryBuilder = this.queryBuilder.eq(field, value);
    return this;
  }

  neq(field: string, value: any) {
    this.queryBuilder = this.queryBuilder.neq(field, value);
    return this;
  }

  gt(field: string, value: any) {
    this.queryBuilder = this.queryBuilder.gt(field, value);
    return this;
  }

  gte(field: string, value: any) {
    this.queryBuilder = this.queryBuilder.gte(field, value);
    return this;
  }

  lt(field: string, value: any) {
    this.queryBuilder = this.queryBuilder.lt(field, value);
    return this;
  }

  lte(field: string, value: any) {
    this.queryBuilder = this.queryBuilder.lte(field, value);
    return this;
  }

  in(field: string, values: any[]) {
    this.queryBuilder = this.queryBuilder.in(field, values);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.queryBuilder = this.queryBuilder.order(field, options);
    return this;
  }

  limit(count: number) {
    this.queryBuilder = this.queryBuilder.limit(count);
    return this;
  }

  single() {
    return this.queryBuilder.single();
  }

  maybeSingle() {
    return this.queryBuilder.maybeSingle();
  }

  // Support direct execution like Supabase
  then(onFulfilled?: any) {
    return this.queryBuilder.then(onFulfilled);
  }

  // Insert method
  async insert(data: any | any[]) {
    return await firestoreClient.insert(this.tableName, data);
  }

  // Track conditions for update/delete operations
  private conditions: { field: string; operator: string; value: any }[] = [];

  // Method to build update/delete query
  update(data: any) {
    return new FirebaseUpdateBuilder(this.tableName, data, this.queryBuilder);
  }

  delete() {
    return new FirebaseDeleteBuilder(this.tableName, this.queryBuilder);
  }
}

// Separate builder for update operations
class FirebaseUpdateBuilder {
  private tableName: string;
  private data: any;
  private queryBuilder: any;

  constructor(tableName: string, data: any, queryBuilder: any) {
    this.tableName = tableName;
    this.data = data;
    this.queryBuilder = queryBuilder;
  }

  eq(field: string, value: any) {
    this.queryBuilder = this.queryBuilder.eq(field, value);
    return this;
  }

  async execute() {
    // Find the document first using the query
    const result = await this.queryBuilder.single();
    if (result.data && result.data.id) {
      return await firestoreClient.update(this.tableName, this.data, result.data.id);
    }
    return { data: null, error: new Error('Document not found for update') };
  }

  // For direct execution like Supabase
  then(onFulfilled?: any) {
    return this.execute().then(onFulfilled);
  }
}

// Separate builder for delete operations
class FirebaseDeleteBuilder {
  private tableName: string;
  private queryBuilder: any;

  constructor(tableName: string, queryBuilder: any) {
    this.tableName = tableName;
    this.queryBuilder = queryBuilder;
  }

  eq(field: string, value: any) {
    this.queryBuilder = this.queryBuilder.eq(field, value);
    return this;
  }

  async execute() {
    // Find the document first using the query
    const result = await this.queryBuilder.single();
    if (result.data && result.data.id) {
      return await firestoreClient.delete(this.tableName, result.data.id);
    }
    return { error: new Error('Document not found for deletion') };
  }

  // For direct execution like Supabase
  then(onFulfilled?: any) {
    return this.execute().then(onFulfilled);
  }
}

// Auth object that mimics Supabase auth
const auth = {
  signInWithPassword,
  signUp,
  signOut: signOutUser,
  getSession,
  onAuthStateChange,
};

// Main Firebase client that mimics Supabase client
export const firebase = {
  auth,
  from: (tableName: string) => new FirebaseQueryBuilder(tableName),
};

// Export types for compatibility
export type { User, Session, AuthResponse };