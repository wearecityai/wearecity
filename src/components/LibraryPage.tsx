import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Link, FileText, Upload, Trash2, Search, 
  BookOpen, MessageSquare, Send, Loader2, 
  ExternalLink, File, Globe, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { libraryService, LibrarySource, LibraryChatMessage } from '../services/libraryService';
import { enhancedLibraryService, EnhancedLibrarySource, RAGResponse } from '../services/enhancedLibraryService';

// Interfaces are now imported from libraryService

interface LibraryPageProps {
  user?: any;
  citySlug?: string;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ user, citySlug }) => {
  
  const [sources, setSources] = useState<LibrarySource[]>([]);
  const [enhancedSources, setEnhancedSources] = useState<EnhancedLibrarySource[]>([]);
  const [chatMessages, setChatMessages] = useState<LibraryChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sources');
  const [newSourceType, setNewSourceType] = useState<'url' | 'text' | 'document'>('url');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ragEnabled, setRagEnabled] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load sources from Firebase on mount
  useEffect(() => {
    loadSources();
    loadEnhancedSources();
  }, [user, citySlug]);

  const loadSources = async () => {
    try {
      console.log('🔄 Loading sources for user:', user?.uid, 'city:', citySlug);
      const loadedSources = await libraryService.getSources(user?.uid, citySlug);
      console.log('📚 Loaded sources:', loadedSources);
      setSources(loadedSources);
    } catch (error) {
      console.error('❌ Error loading sources:', error);
    }
  };

  const loadEnhancedSources = async () => {
    try {
      if (!user?.uid || !citySlug) return;
      
      console.log('🔄 Loading enhanced sources for user:', user?.uid, 'city:', citySlug);
      const loadedEnhancedSources = await enhancedLibraryService.getSourcesWithStatus(user.uid, citySlug);
      console.log('📚 Loaded enhanced sources:', loadedEnhancedSources);
      setEnhancedSources(loadedEnhancedSources);
      
      // Actualizar estados de procesamiento
      const statusMap: Record<string, string> = {};
      loadedEnhancedSources.forEach(source => {
        statusMap[source.id] = source.processingStatus;
      });
      setProcessingStatus(statusMap);
    } catch (error) {
      console.error('❌ Error loading enhanced sources:', error);
    }
  };

  const addSource = async () => {
    if (!newSourceTitle.trim()) return;

    try {
      console.log('➕ Adding new source:', { 
        type: newSourceType, 
        title: newSourceTitle, 
        url: newSourceUrl,
        user: user?.uid, 
        city: citySlug 
      });

      let content = newSourceContent.trim();
      let title = newSourceTitle.trim();

      // Process URL content if needed
      if (newSourceType === 'url' && newSourceUrl.trim()) {
        console.log('🌐 Processing URL content...');
        const urlContent = await libraryService.processUrlContent(newSourceUrl.trim());
        content = urlContent.content;
        title = urlContent.title;
        console.log('✅ URL processed:', { title, contentLength: content.length });
      }

      const sourceId = await libraryService.addSource({
        type: newSourceType,
        title,
        content,
        url: newSourceUrl.trim() || undefined
      }, user?.uid || 'anonymous', citySlug);

      console.log('✅ Source added with ID:', sourceId);

      // Reload sources
      await loadSources();

      // Reset form
      setNewSourceTitle('');
      setNewSourceContent('');
      setNewSourceUrl('');
    } catch (error) {
      console.error('❌ Error adding source:', error);
    }
  };

  const deleteSource = async (id: string) => {
    try {
      await libraryService.deleteSource(id);
      await loadSources();
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  // ===== NUEVAS FUNCIONES RAG =====

  const addSourceWithRAG = async () => {
    console.log('🚀 addSourceWithRAG called with:', { 
      newSourceTitle, 
      newSourceType, 
      newSourceUrl, 
      newSourceContent,
      ragEnabled 
    });
    
    if (!newSourceTitle.trim()) {
      console.warn('⚠️ No title provided, aborting');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Starting RAG source addition...');
      
      if (newSourceType === 'url' && newSourceUrl.trim()) {
        console.log('🌐 Processing URL with RAG:', newSourceUrl.trim());
        // Scraping avanzado con RAG
        const result = await enhancedLibraryService.addSourceWithScraping(
          newSourceUrl.trim(),
          user?.uid || 'anonymous',
          citySlug || 'default',
          {
            extractDocumentLinks: true,
            followInternalLinks: false,
            includeImages: false
          },
          newSourceTitle.trim() // Pasar el título personalizado
        );
        
        if (result.success && result.sourceId) {
          console.log('✅ Enhanced source added with ID:', result.sourceId);
          setProcessingStatus(prev => ({ ...prev, [result.sourceId!]: 'scraped' }));
          
          // Procesar documentos si hay enlaces
          if (result.documentLinks && result.documentLinks.length > 0) {
            for (const docUrl of result.documentLinks) {
              await enhancedLibraryService.processDocument(
                docUrl,
                result.sourceId,
                user?.uid || 'anonymous',
                citySlug || 'default'
              );
            }
            setProcessingStatus(prev => ({ ...prev, [result.sourceId!]: 'processed' }));
          }
          
          // Generar embeddings
          await enhancedLibraryService.generateEmbeddings(
            result.sourceId,
            user?.uid || 'anonymous',
            citySlug || 'default'
          );
          setProcessingStatus(prev => ({ ...prev, [result.sourceId!]: 'embedded' }));
        }
      } else if (newSourceType === 'text' && newSourceContent.trim()) {
        // Procesar texto manual con RAG
        const result = await enhancedLibraryService.processManualText(
          newSourceTitle.trim(),
          newSourceContent.trim(),
          user?.uid || 'anonymous',
          citySlug || 'default'
        );
        
        if (result.success && result.sourceId) {
          console.log('✅ Enhanced text source added with ID:', result.sourceId);
          setProcessingStatus(prev => ({ ...prev, [result.sourceId!]: 'processed' }));
          
          // Generar embeddings
          await enhancedLibraryService.generateEmbeddings(
            result.sourceId,
            user?.uid || 'anonymous',
            citySlug || 'default'
          );
          setProcessingStatus(prev => ({ ...prev, [result.sourceId!]: 'embedded' }));
        }
      }
      
      // Reset form
      setNewSourceTitle('');
      setNewSourceContent('');
      setNewSourceUrl('');
      
      // Reload sources
      await loadEnhancedSources();
    } catch (error) {
      console.error('❌ Error adding source with RAG:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendRAGMessage = async () => {
    if (!inputText.trim() || !user?.uid || !citySlug) return;

    try {
      setIsLoading(true);
      
      // Agregar mensaje del usuario
      const userMessage: LibraryChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: inputText,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      // Consulta RAG
      const ragResponse = await enhancedLibraryService.ragQuery(
        inputText,
        user.uid,
        citySlug,
        chatMessages.map(msg => ({ role: msg.role, content: msg.content }))
      );
      
      if (ragResponse.success) {
        const assistantMessage: LibraryChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: ragResponse.response || 'No se pudo generar una respuesta.',
          timestamp: new Date(),
          sources: ragResponse.relevantSources?.map(source => ({
            id: source.sourceId,
            type: 'url' as const,
            title: source.title,
            content: source.contentPreview,
            url: source.url,
            status: 'ready' as const,
            createdAt: new Date(),
            metadata: { wordCount: 0, language: 'es', tags: [], extractedText: '' }
          }))
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: LibraryChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${ragResponse.error || 'No se pudo procesar la consulta.'}`,
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('❌ Error sending RAG message:', error);
      const errorMessage: LibraryChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error al procesar la consulta. Por favor, inténtalo de nuevo.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRAGSystem = async () => {
    try {
      console.log('🚀 Setting up RAG system...');
      setIsLoading(true);
      const result = await enhancedLibraryService.setupRAGSystem();
      
      console.log('📊 RAG setup result:', result);
      
      if (result.success) {
        console.log('✅ RAG system setup completed');
        setRagEnabled(true);
      } else {
        console.error('❌ RAG setup failed:', result);
      }
    } catch (error) {
      console.error('❌ Error setting up RAG system:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newSource: LibrarySource = {
        id: crypto.randomUUID(),
        type: 'document',
        title: file.name,
        content: content.substring(0, 1000) + '...', // Limit content for display
        status: 'processing',
        createdAt: new Date()
      };

      const updatedSources = [...sources, newSource];
      saveSources(updatedSources);

      // Simulate processing
      setTimeout(() => {
        const processedSources = updatedSources.map(s => 
          s.id === newSource.id ? { ...s, status: 'ready' as const } : s
        );
        saveSources(processedSources);
      }, 3000);
    };
    reader.readAsText(file);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: LibraryChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get relevant sources from the library
      const relevantSources = await libraryService.getRelevantSources(
        inputText.trim(), 
        user?.uid, 
        citySlug
      );

      const assistantMessage: LibraryChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Basándome en las fuentes de tu biblioteca, puedo ayudarte con información sobre "${inputText}". He encontrado ${relevantSources.length} fuentes relevantes que pueden ser útiles para responder tu pregunta.`,
        timestamp: new Date(),
        sources: relevantSources
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Reload sources to update lastUsed timestamps
      await loadSources();
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: LibraryChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSources = sources.filter(s => 
    !searchQuery || 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: LibrarySource['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTypeIcon = (type: LibrarySource['type']) => {
    switch (type) {
      case 'url':
        return <Globe className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Biblioteca de Conocimiento</h2>
      </div>

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          Añade fuentes de conocimiento (URLs, documentos, texto) para que la IA pueda consultarlas y responder preguntas basándose en esa información.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sources">📚 Fuentes</TabsTrigger>
          <TabsTrigger value="rag">🧠 RAG</TabsTrigger>
          <TabsTrigger value="chat">💬 Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-6">
          {/* Add new source */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Añadir Nueva Fuente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={newSourceType === 'url' ? 'default' : 'outline'}
                  onClick={() => setNewSourceType('url')}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  URL
                </Button>
                <Button
                  variant={newSourceType === 'text' ? 'default' : 'outline'}
                  onClick={() => setNewSourceType('text')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Texto
                </Button>
                <Button
                  variant={newSourceType === 'document' ? 'default' : 'outline'}
                  onClick={() => setNewSourceType('document')}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Documento
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newSourceTitle}
                    onChange={(e) => setNewSourceTitle(e.target.value)}
                    placeholder="Título descriptivo de la fuente"
                  />
                </div>

                {newSourceType === 'url' && (
                  <div>
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://ejemplo.com"
                    />
                  </div>
                )}

                {(newSourceType === 'text' || newSourceType === 'document') && (
                  <div>
                    <Label htmlFor="content">Contenido</Label>
                    <Textarea
                      id="content"
                      value={newSourceContent}
                      onChange={(e) => setNewSourceContent(e.target.value)}
                      placeholder="Pega aquí el contenido de texto..."
                      rows={4}
                    />
                  </div>
                )}

                {newSourceType === 'document' && (
                  <div>
                    <Label htmlFor="file">Subir Archivo</Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".txt,.md,.pdf"
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={() => {
                  console.log('🖱️ Button clicked! RAG enabled:', ragEnabled);
                  if (ragEnabled) {
                    addSourceWithRAG();
                  } else {
                    addSource();
                  }
                }} 
                disabled={isLoading || !newSourceTitle.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isLoading ? 'Procesando...' : ragEnabled ? 'Añadir con RAG' : 'Añadir Fuente'}
              </Button>
            </CardContent>
          </Card>

          {/* Search and filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en fuentes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sources list */}
          <div className="space-y-3">
            {filteredSources.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {searchQuery ? 'No se encontraron fuentes que coincidan con tu búsqueda.' : 'No hay fuentes añadidas aún.'}
                </CardContent>
              </Card>
            ) : (
              filteredSources.map((source) => (
                <Card key={source.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(source.type)}
                          <h3 className="font-medium truncate">{source.title}</h3>
                          {getStatusIcon(source.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {source.content}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">{source.type}</Badge>
                          <span>
                            Creado: {source.createdAt.toLocaleDateString()}
                          </span>
                          {source.lastUsed && (
                            <span>
                              • Usado: {source.lastUsed.toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {source.url && (
                          <div className="mt-2">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {source.url}
                            </a>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSource(source.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rag" className="space-y-6">
          {/* RAG Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>🧠 Sistema RAG Avanzado</CardTitle>
              <CardDescription>
                Sistema de Retrieval-Augmented Generation con embeddings vectoriales y búsqueda semántica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={setupRAGSystem} 
                    disabled={isLoading || ragEnabled}
                    variant={ragEnabled ? "secondary" : "default"}
                  >
                    {ragEnabled ? "✅ RAG Activado" : "🚀 Activar RAG"}
                  </Button>
                  {ragEnabled && (
                    <Badge variant="outline" className="text-green-600">
                      Sistema RAG Activo
                    </Badge>
                  )}
                </div>
                
                {ragEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">📊 Fuentes RAG</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{enhancedSources.length}</div>
                        <p className="text-xs text-muted-foreground">Fuentes procesadas</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">🧠 Embeddings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {enhancedSources.filter(s => s.embedding).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Con embeddings</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">📄 Documentos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {enhancedSources.reduce((acc, s) => acc + s.documentLinks.length, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Enlaces a documentos</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Sources */}
          {ragEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>📚 Fuentes RAG</CardTitle>
                <CardDescription>
                  Fuentes procesadas con embeddings vectoriales para búsqueda semántica.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enhancedSources.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No hay fuentes RAG aún. Añade una fuente para comenzar.
                    </div>
                  ) : (
                    enhancedSources.map((source) => (
                      <div key={source.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{source.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={
                                source.processingStatus === 'embedded' ? 'default' :
                                source.processingStatus === 'processed' ? 'secondary' :
                                source.processingStatus === 'error' ? 'destructive' : 'outline'
                              }
                            >
                              {source.processingStatus}
                            </Badge>
                            {source.embedding && (
                              <Badge variant="outline" className="text-green-600">
                                🧠 Embedding
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {source.content.substring(0, 200)}...
                        </p>
                        
                        {source.documentLinks.length > 0 && (
                          <div className="text-xs text-blue-600">
                            📄 {source.documentLinks.length} documento(s) encontrado(s)
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>📊 {source.metadata.wordCount} palabras</span>
                          <span>🏷️ {source.metadata.tags.join(', ') || 'Sin tags'}</span>
                          <span>📅 {source.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat con Biblioteca
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Haz una pregunta sobre las fuentes de tu biblioteca</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/20">
                              <p className="text-xs opacity-75 mb-2">Fuentes consultadas:</p>
                              <div className="space-y-1">
                                {message.sources.map((source) => (
                                  <div key={source.id} className="flex items-center gap-1 text-xs">
                                    {getTypeIcon(source.type)}
                                    <span className="truncate">{source.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Pensando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Pregunta sobre las fuentes de tu biblioteca..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={!inputText.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { LibraryPage };
