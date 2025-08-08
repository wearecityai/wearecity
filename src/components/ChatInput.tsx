import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Send, Mic, MicOff, Plus, Check, MapPin, Loader2, Navigation, ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Toggle } from './ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { DEFAULT_LANGUAGE_CODE } from '../constants';

// Estilos CSS personalizados para el textarea sin border
const textareaStyles = `
  .chat-textarea {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  .chat-textarea:focus {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  .chat-textarea:focus-visible {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
`;

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  recommendedPrompts?: string[];
  currentLanguageCode: string;
  onSetLanguageCode: (code: string) => void;
  isInFinetuningMode?: boolean;
  onToggleLocation?: (enabled: boolean) => void;
  chatConfig?: any;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  recommendedPrompts,
  currentLanguageCode,
  onSetLanguageCode,
  isInFinetuningMode = false,
  onToggleLocation,
  chatConfig
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcribedTextRef = useRef<string>('');

  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSpeechApiSupported, setIsSpeechApiSupported] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const waveformDataArrayRef = useRef<Uint8Array | null>(null);
  const stopDelayTimerRef = useRef<number | null>(null); 
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // Auto-resize textarea like ChatGPT
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; // Altura máxima antes de mostrar scroll
      
      if (scrollHeight <= maxHeight) {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      } else {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      }
    }
  }, [inputValue]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSpeechApiSupported(!!SpeechRecognitionAPI);
    if (!SpeechRecognitionAPI) console.warn("Speech Recognition API no es soportada.");
    return () => {
      if (stopDelayTimerRef.current) window.clearTimeout(stopDelayTimerRef.current);
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
        speechRecognitionRef.current = null;
      }
      fullCleanupAndStopVisualizer();
    };
  }, []);

  // Sync local state with global state
  useEffect(() => {
    setIsLocationEnabled(chatConfig?.allowGeolocation || false);
  }, [chatConfig?.allowGeolocation]);

  useLayoutEffect(() => {
    if (isRecording && canvasRef.current) {
      canvasRef.current.width = canvasRef.current.offsetWidth;
      canvasRef.current.height = canvasRef.current.offsetHeight > 0 ? canvasRef.current.offsetHeight : 34;
    }
  }, [isRecording, canvasRef.current?.offsetWidth]);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      transcribedTextRef.current = '';
      setSpeechError(null);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const fullCleanupAndStopVisualizer = () => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animationFrameIdRef.current = null;
    sourceNodeRef.current?.disconnect(); 
    sourceNodeRef.current = null;
    analyserRef.current = null; 
    mediaStreamRef.current?.getTracks().forEach(track => track.stop()); 
    mediaStreamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error).finally(() => audioContextRef.current = null);
    } else { 
      audioContextRef.current = null; 
    }
    setIsRecording(false);
  };
  
  const handleActualSpeechRecognitionEnd = () => {
    const finalMessage = transcribedTextRef.current.trim();
    const wasNoErrorOrMinorError = !speechError || speechError === "Escuchando..." || speechError.includes("No se detectó voz") || speechError === "Finalizando...";
    if (finalMessage && wasNoErrorOrMinorError) { 
      onSendMessage(finalMessage); 
    }
    if (speechError === "Escuchando..." || speechError === "Finalizando..." || speechError?.includes("No se detectó voz")) { 
      setSpeechError(null); 
    }
    setInputValue(''); 
    transcribedTextRef.current = '';
    fullCleanupAndStopVisualizer();
  };

  const drawWaveform = () => {
    if (!isRecording || !analyserRef.current || !canvasRef.current || !waveformDataArrayRef.current) {
      if (isRecording && animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null; 
      return;
    }
    const canvas = canvasRef.current; 
    const ctx = canvas.getContext('2d'); 
    if (!ctx) return;
    const WIDTH = canvas.width; 
    const HEIGHT = canvas.height;
    analyserRef.current.getByteFrequencyData(waveformDataArrayRef.current);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const barColor = 'hsl(var(--primary))';
    const bufferLength = analyserRef.current.frequencyBinCount;
    const barWidth = (WIDTH / bufferLength) * 2.5; 
    let barHeight; 
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      barHeight = waveformDataArrayRef.current[i] * (HEIGHT / 255) * 0.8; 
      ctx.fillStyle = barColor; 
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
    animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
  };

  const startRecording = async () => {
    if (stopDelayTimerRef.current) { 
      window.clearTimeout(stopDelayTimerRef.current); 
      stopDelayTimerRef.current = null; 
    }
    if (isLoading) return;
    if (!isSpeechApiSupported) { 
      setSpeechError("Reconocimiento de voz no soportado."); 
      return; 
    }
    try {
      if (speechRecognitionRef.current) { 
        speechRecognitionRef.current.abort(); 
      }
      fullCleanupAndStopVisualizer(); 
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setSpeechError("Escuchando..."); 
      setInputValue(''); 
      transcribedTextRef.current = '';
      setIsRecording(true); 
      
      requestAnimationFrame(async () => { 
        if (canvasRef.current && mediaStreamRef.current && isRecording) { 
            canvasRef.current.width = canvasRef.current.offsetWidth;
            canvasRef.current.height = canvasRef.current.offsetHeight > 0 ? canvasRef.current.offsetHeight : 34;
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
            if(sourceNodeRef.current) sourceNodeRef.current.disconnect();
            sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            if(!analyserRef.current) analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 128; 
            const bufferLength = analyserRef.current.frequencyBinCount;
            waveformDataArrayRef.current = new Uint8Array(bufferLength);
            sourceNodeRef.current.connect(analyserRef.current);
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
        }
      });
      
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognitionAPI();
      speechRecognitionRef.current.lang = currentLanguageCode || DEFAULT_LANGUAGE_CODE;
      speechRecognitionRef.current.interimResults = true; 
      speechRecognitionRef.current.continuous = true;
      
      speechRecognitionRef.current.onresult = (event) => {
        let interimTranscript = ''; 
        let finalTranscript = transcribedTextRef.current; 
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) { 
            finalTranscript += event.results[i][0].transcript + ' '; 
          } else { 
            interimTranscript += event.results[i][0].transcript; 
          }
        }
        transcribedTextRef.current = finalTranscript.trim();
        setInputValue((finalTranscript + interimTranscript).trim());
        if (interimTranscript) setSpeechError("Procesando..."); 
        else setSpeechError("Escuchando...");
        if (stopDelayTimerRef.current) window.clearTimeout(stopDelayTimerRef.current);
      };
      
      speechRecognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        let errorMsg = "Error de reconocimiento.";
        if (event.error === 'no-speech') errorMsg = "No se detectó voz. Intenta de nuevo.";
        else if (event.error === 'audio-capture') errorMsg = "Error al capturar audio.";
        else if (event.error === 'not-allowed') errorMsg = "Permiso de micrófono denegado.";
        else if (event.error === 'network') errorMsg = "Error de red en reconocimiento.";
        setSpeechError(errorMsg);
      };
      
      speechRecognitionRef.current.onend = () => {
        if (stopDelayTimerRef.current) window.clearTimeout(stopDelayTimerRef.current);
        stopDelayTimerRef.current = window.setTimeout(() => {
             if (isRecording) { 
                setSpeechError(prev => (prev === "Escuchando..." || prev === "Procesando...") ? "Finalizando..." : prev);
                handleActualSpeechRecognitionEnd();
             } else { 
                handleActualSpeechRecognitionEnd(); 
             }
        }, transcribedTextRef.current.trim() ? 1000 : 300); 
      };
      
      speechRecognitionRef.current.onaudiostart = () => setSpeechError("Escuchando...");
      speechRecognitionRef.current.onspeechstart = () => setSpeechError("Habla detectada...");
      speechRecognitionRef.current.onspeechend = () => { setSpeechError("Fin de habla detectado, procesando..."); };
      speechRecognitionRef.current.onstart = () => setSpeechError("Reconocimiento iniciado...");
      speechRecognitionRef.current.start();
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setSpeechError(`Error al iniciar grabación: ${err.message}`);
      fullCleanupAndStopVisualizer(); 
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (stopDelayTimerRef.current) window.clearTimeout(stopDelayTimerRef.current);
    setIsRecording(false); 
    if (speechRecognitionRef.current) { 
      speechRecognitionRef.current.stop(); 
    } else { 
      handleActualSpeechRecognitionEnd(); 
    }
    setSpeechError(prev => (prev && prev !== "Escuchando..." && prev !== "Procesando...") ? prev : "Finalizando...");
  };

  const toggleRecording = () => { 
    if (isLoading) return; 
    if (isRecording) stopRecording(); 
    else startRecording(); 
  };

  const placeholder = isRecording
    ? (speechError || `Escribe tu consulta${chatConfig?.restrictedCity?.name ? ' sobre ' + chatConfig.restrictedCity.name : ''}`)
    : `Escribe tu consulta${chatConfig?.restrictedCity?.name ? ' sobre ' + chatConfig.restrictedCity.name : ''}`;

  return (
    <>
      <style>{textareaStyles}</style>
      <div className={`w-full flex flex-col items-center chat-input-container ${isInFinetuningMode 
        ? 'p-2 sm:p-4' 
        : 'pb-2 sm:pb-6 md:pb-8'
      }`}>
      <Card className={`w-full ${isInFinetuningMode ? 'max-w-full' : 'max-w-4xl'} rounded-xl ${isRecording ? 'border-red-500' : ''}`}>
        <CardContent className="p-0">
          <div className="flex items-center min-h-20 sm:min-h-20 px-2 sm:px-3 md:px-4 pb-2 sm:pb-4">
            <div className="flex-1 space-y-2 sm:space-y-3">
              {isRecording ? (
                // Recording mode - simplified interface
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between min-h-[32px] sm:min-h-[40px]">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm sm:text-base md:text-lg text-muted-foreground">Escuchando</span>
                        </div>
                        <div className="flex-1 flex items-center gap-0.5 min-w-0">
                          {[...Array(170)].map((_, i) => {
                            // Improved realistic frequency response simulation
                            const frequency = i * 0.03;
                            const time = Date.now() * 0.001; // For dynamic movement
                            
                            // Bass frequencies (low end)
                            const bass = Math.sin(frequency * 0.5 + time * 0.5) * 0.6 + 0.4;
                            
                            // Mid frequencies (vocals, instruments)
                            const mid = Math.sin(frequency * 1.5 + time * 0.8) * 0.4 + 0.6;
                            
                            // Treble frequencies (high end)
                            const treble = Math.sin(frequency * 3 + time * 1.2) * 0.3 + 0.7;
                            
                            // Combine frequencies with realistic weighting
                            const intensity = (bass * 0.4 + mid * 0.4 + treble * 0.2);
                            
                            // Add some randomness for more natural look
                            const randomFactor = Math.sin(i * 0.7 + time * 0.3) * 0.1 + 0.9;
                            const finalIntensity = intensity * randomFactor;
                            
                            // Map to height with more variation
                            const height = Math.max(2, Math.floor(finalIntensity * 12));
                            
                            const heightClass = height <= 3 ? 'h-1' : 
                                              height <= 5 ? 'h-2' : 
                                              height <= 7 ? 'h-3' : 
                                              height <= 9 ? 'h-4' : 
                                              height <= 11 ? 'h-5' : 'h-6';
                            
                            // More varied animation delays
                            const delayClass = i % 8 === 0 ? 'animate-pulse' : 
                                             i % 8 === 1 ? 'animate-pulse delay-75' : 
                                             i % 8 === 2 ? 'animate-pulse delay-150' : 
                                             i % 8 === 3 ? 'animate-pulse delay-300' :
                                             i % 8 === 4 ? 'animate-pulse delay-500' : 
                                             i % 8 === 5 ? 'animate-pulse delay-700' :
                                             i % 8 === 6 ? 'animate-pulse delay-1000' : 'animate-pulse delay-1500';
                            
                            return (
                              <div
                                key={i}
                                className={`bg-primary rounded-full w-0.5 ${heightClass} ${delayClass}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Action buttons row - same structure as normal mode */}
                  <div className="flex items-center justify-between mt-3 sm:mt-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Toggle
                        pressed={isLocationEnabled}
                        onPressedChange={(pressed) => {
                          setIsLocationEnabled(pressed);
                          if (typeof onToggleLocation === 'function') onToggleLocation(pressed);
                        }}
                        aria-label="Activar ubicación"
                        className="h-8 sm:h-7 px-2 sm:px-2"
                      >
                        <Navigation className="h-4 w-4 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-sm sm:text-sm font-medium">Ubicación</span>
                      </Toggle>
                    </div>
                    
                    {/* Microphone/Send button - now aligned with bottom buttons */}
                    <div className="flex items-center">
                      {inputValue.trim() ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                onClick={handleSubmit} 
                                disabled={isLoading || !inputValue.trim()}
                                size="icon"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 sm:h-12 sm:w-12 rounded-full"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                                ) : (
                                  <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Enviar Mensaje</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost"
                                size="icon"
                                onClick={toggleRecording} 
                                disabled={isLoading || !isSpeechApiSupported}
                                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full ${isSpeechApiSupported ? "text-primary hover:text-primary" : "text-muted-foreground"}`}
                              >
                                {isSpeechApiSupported ? (
                                  <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
                                ) : (
                                  <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isSpeechApiSupported ? "Iniciar Grabación" : "Grabación no soportada"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Normal mode - full interface
                <>
                  <Textarea
                    ref={textareaRef}
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => { if(!isRecording) setInputValue(e.target.value); }}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || (isRecording && speechError === "Permiso de micrófono denegado.")}
                    className="chat-textarea min-h-[48px] sm:min-h-[40px] max-h-[200px] resize-none pt-4 pb-0 px-2 sm:px-0 text-sm sm:text-base md:text-lg overflow-hidden"
                    rows={1}
                  />
                  
                  {/* Action buttons row */}
                  <div className="flex items-center justify-between mt-3 sm:mt-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Toggle
                        pressed={isLocationEnabled}
                        onPressedChange={(pressed) => {
                          setIsLocationEnabled(pressed);
                          if (typeof onToggleLocation === 'function') onToggleLocation(pressed);
                        }}
                        aria-label="Activar ubicación"
                        className="h-8 sm:h-7 px-2 sm:px-2"
                      >
                        <Navigation className="h-4 w-4 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-sm sm:text-sm font-medium">Ubicación</span>
                      </Toggle>
                    </div>
                    
                    {/* Microphone/Send button - now aligned with bottom buttons */}
                    <div className="flex items-center">
                      {inputValue.trim() ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                onClick={handleSubmit} 
                                disabled={isLoading || !inputValue.trim()}
                                size="icon"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 sm:h-12 sm:w-12 rounded-full"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                                ) : (
                                  <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Enviar Mensaje</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost"
                                size="icon"
                                onClick={toggleRecording} 
                                disabled={isLoading || !isSpeechApiSupported}
                                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full ${isSpeechApiSupported ? "text-primary hover:text-primary" : "text-muted-foreground"}`}
                              >
                                {isSpeechApiSupported ? (
                                  <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
                                ) : (
                                  <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isSpeechApiSupported ? "Iniciar Grabación" : "Grabación no soportada"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default ChatInput;