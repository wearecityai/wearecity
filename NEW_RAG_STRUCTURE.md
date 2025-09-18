# 🗂️ Nueva Estructura RAG Centralizada

## 🎯 Problema Actual
```
cities/
├── valencia/
│   └── events/ ❌ (Crea ciudades nuevas)
├── la-vila-joiosa/
│   └── events/ ❌ (Duplica estructura)
└── alicante/
    └── events/ ❌ (Datos dispersos)
```

## ✅ Nueva Estructura Propuesta
```
RAG/ (Colección centralizada)
├── doc_001
│   ├── content: "Festival de Valencia..."
│   ├── type: "event"
│   ├── citySlug: "valencia"
│   ├── cityName: "Valencia"
│   ├── adminIds: ["admin1", "admin2"]
│   ├── metadata: {...}
│   └── embedding: [vector]
├── doc_002
│   ├── content: "Trámites de empadronamiento..."
│   ├── type: "tramite"
│   ├── citySlug: "valencia"
│   ├── adminIds: ["admin1"]
│   └── ...
└── doc_003
    ├── content: "Fiestas de Moros y Cristianos..."
    ├── type: "event"
    ├── citySlug: "la-vila-joiosa"
    ├── adminIds: ["admin3"]
    └── ...
```

## 📋 Schema del Documento RAG
```typescript
interface RAGDocument {
  // Identificación
  id: string;
  type: 'event' | 'tramite' | 'noticia' | 'turismo' | 'servicio' | 'contacto';
  
  // Contenido
  title: string;
  content: string;
  description?: string;
  
  // Referencias
  citySlug: string;
  cityName: string;
  adminIds: string[]; // IDs de admins responsables
  
  // Metadatos específicos por tipo
  metadata: {
    // Para eventos
    date?: string;
    time?: string;
    location?: string;
    category?: string;
    tags?: string[];
    
    // Para trámites
    requiredDocuments?: string[];
    cost?: number;
    duration?: string;
    
    // Para cualquier tipo
    sourceUrl?: string;
    confidence?: number;
    language?: string;
  };
  
  // Vector y búsqueda
  embedding?: number[];
  searchKeywords: string[];
  
  // Control
  isActive: boolean;
  scrapedAt: Date;
  insertedByAgent: boolean;
  agentTimestamp: Date;
  lastUpdated: Date;
}
```

## 🔍 Ventajas de la Nueva Estructura

### ✅ **Centralización**
- Una sola colección para todos los datos
- Búsqueda unificada
- Gestión simplificada

### ✅ **Referencias Claras**
- `citySlug`: Identifica la ciudad
- `adminIds`: Administradores responsables
- `type`: Tipo de contenido

### ✅ **Escalabilidad**
- Fácil agregar nuevos tipos de contenido
- Búsqueda eficiente por ciudad/admin/tipo
- Vector search optimizado

### ✅ **Flexibilidad**
- Metadatos específicos por tipo
- Búsqueda multi-criterio
- Fácil filtrado y ordenación
