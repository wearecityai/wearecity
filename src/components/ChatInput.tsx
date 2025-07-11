import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Box, TextField, IconButton, Paper, Stack, Menu, MenuItem, Button, Typography, CircularProgress, useTheme, ListItemIcon, ListItemText } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import AddIcon from '@mui/icons-material/Add'; // For the "+" button
import CheckIcon from '@mui/icons-material/Check';

import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE } from '../constants';
import { SupportedLanguage } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  recommendedPrompts?: string[]; // Keep for potential future use, but Gemini UI has fixed chips
  currentLanguageCode: string;
  onSetLanguageCode: (code: string) => void; // Keep for settings menu
  isInFinetuningMode?: boolean; // Nueva prop para ajustar el padding en modo finetuning
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  recommendedPrompts,
  currentLanguageCode,
  onSetLanguageCode, // Retained for settings, not used directly in this input bar
  isInFinetuningMode = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcribedTextRef = useRef<string>('');
  const theme = useTheme();

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
      handleSubmit(e as any); // Type assertion, as it's a form-like submission
    }
  };

  const fullCleanupAndStopVisualizer = () => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animationFrameIdRef.current = null;
    sourceNodeRef.current?.disconnect(); sourceNodeRef.current = null;
    analyserRef.current = null; 
    mediaStreamRef.current?.getTracks().forEach(track => track.stop()); mediaStreamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error).finally(() => audioContextRef.current = null);
    } else { audioContextRef.current = null; }
    setIsRecording(false);
  };
  
  const handleActualSpeechRecognitionEnd = () => {
    const finalMessage = transcribedTextRef.current.trim();
    const wasNoErrorOrMinorError = !speechError || speechError === "Escuchando..." || speechError.includes("No se detectó voz") || speechError === "Finalizando...";
    if (finalMessage && wasNoErrorOrMinorError) { onSendMessage(finalMessage); }
    if (speechError === "Escuchando..." || speechError === "Finalizando..." || speechError?.includes("No se detectó voz")) { setSpeechError(null); }
    setInputValue(''); transcribedTextRef.current = '';
    fullCleanupAndStopVisualizer();
  };

  const drawWaveform = () => {
    if (!isRecording || !analyserRef.current || !canvasRef.current || !waveformDataArrayRef.current) {
      if (isRecording && animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null; return;
    }
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const WIDTH = canvas.width; const HEIGHT = canvas.height;
    analyserRef.current.getByteFrequencyData(waveformDataArrayRef.current);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const barColor = theme.palette.mode === 'dark' ? 'rgba(137, 180, 252, 0.7)' : 'rgba(25, 118, 210, 0.7)';
    const bufferLength = analyserRef.current.frequencyBinCount;
    const barWidth = (WIDTH / bufferLength) * 2.5; let barHeight; let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      barHeight = waveformDataArrayRef.current[i] * (HEIGHT / 255) * 0.8; 
      ctx.fillStyle = barColor; ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
    animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
  };

  const startRecording = async () => {
    if (stopDelayTimerRef.current) { window.clearTimeout(stopDelayTimerRef.current); stopDelayTimerRef.current = null; }
    if (isLoading) return;
    if (!isSpeechApiSupported) { setSpeechError("Reconocimiento de voz no soportado."); return; }
    try {
      if (speechRecognitionRef.current) { speechRecognitionRef.current.abort(); }
      fullCleanupAndStopVisualizer(); 
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setSpeechError("Escuchando..."); setInputValue(''); transcribedTextRef.current = '';
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
      speechRecognitionRef.current.interimResults = true; speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.onresult = (event) => {
        let interimTranscript = ''; let finalTranscript = transcribedTextRef.current; 
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript + ' '; } 
          else { interimTranscript += event.results[i][0].transcript; }
        }
        transcribedTextRef.current = finalTranscript.trim();
        setInputValue((finalTranscript + interimTranscript).trim());
        if (interimTranscript) setSpeechError("Procesando..."); else setSpeechError("Escuchando...");
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
             } else { handleActualSpeechRecognitionEnd(); }
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
      fullCleanupAndStopVisualizer(); setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (stopDelayTimerRef.current) window.clearTimeout(stopDelayTimerRef.current);
    setIsRecording(false); 
    if (speechRecognitionRef.current) { speechRecognitionRef.current.stop(); } 
    else { handleActualSpeechRecognitionEnd(); }
    setSpeechError(prev => (prev && prev !== "Escuchando..." && prev !== "Procesando...") ? prev : "Finalizando...");
  };

  const toggleRecording = () => { if (isLoading) return; if (isRecording) stopRecording(); else startRecording(); };

  return (
    <Box sx={{ 
      padding: isInFinetuningMode 
        ? { xs: '4px 8px 8px 8px', sm: '8px 20px 12px 20px' } 
        : { xs: '8px 12px 24px 12px', sm: '12px 24px 32px 24px' },
      bgcolor: 'background.default',
      maxWidth: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: 0, // Prevenir overflow
    }}>
      {isRecording && (
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            maxWidth: isInFinetuningMode ? '100%' : '800px',
            height: '34px',
            display: 'block',
            backgroundColor: theme.palette.background.paper, // Match input paper
            borderTopLeftRadius: theme.shape.borderRadius,
            borderTopRightRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
            borderBottom: 'none',
            boxSizing: 'border-box',
            marginBottom: '4px'
          }}
        />
      )}
      <Paper
        elevation={0} // Flat like Gemini
        sx={{
          display: 'flex',
          alignItems: 'center', // Center items vertically
          p: { xs: '4px 6px 4px 4px', sm: '4px 8px 4px 4px' }, // Inner padding responsive
          borderRadius: '28px', // Highly rounded
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`, // Subtle border like Gemini
          maxWidth: isInFinetuningMode ? '100%' : '800px',
          width: '100%',
          minWidth: 0, // Prevenir overflow
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
          }
        }}
      >
        <IconButton
            onClick={() => console.log("Add button clicked")} // Placeholder
            disabled={isLoading || isRecording}
            title="Adjuntar archivo o más opciones"
            color="primary"
            sx={{
              p: { xs: 1, sm: 1.25 }, 
              color: theme.palette.text.secondary,
              flexShrink: 0, // Prevenir que se encoja
            }}
        >
            <AddIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </IconButton>
        
        <Stack direction="column" sx={{ flexGrow: 1, mx: { xs: 0.25, sm: 0.5 }, minWidth: 0 }}>
            <TextField
                inputRef={textareaRef}
                fullWidth
                multiline
                maxRows={5}
                placeholder={isRecording ? (speechError || "Escuchando...") : "Escribir una consulta"}
                value={inputValue}
                onChange={(e) => { if(!isRecording) setInputValue(e.target.value); }}
                InputProps={{
                    disableUnderline: true,
                    onKeyDown: handleKeyDown,
                    sx: { 
                        py: { xs: '4px', sm: '6px' }, // Fine-tune padding for alignment
                        fontSize: { xs: '0.9rem', sm: '0.95rem' },
                        lineHeight: '1.4',
                        minWidth: 0, // Prevenir overflow
                    }
                }}
                disabled={isLoading || (isRecording && speechError === "Permiso de micrófono denegado.")}
                variant="standard" // No border from TextField itself
                sx={{
                    '& .MuiInputBase-root': {
                        backgroundColor: 'transparent', // TextField transparent, Paper provides bg
                        minWidth: 0, // Prevenir overflow
                    },
                    minWidth: 0, // Prevenir overflow
                }}
            />
        </Stack>
       
        {inputValue.trim() || isRecording ? (
            isRecording ? (
                <IconButton 
                  onClick={toggleRecording} 
                  color="error" 
                  disabled={isLoading} 
                  title="Detener Grabación" 
                  sx={{
                    p: { xs: 1, sm: 1.25 },
                    flexShrink: 0, // Prevenir que se encoja
                  }}
                >
                    <MicOffIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </IconButton>
            ) : (
                <IconButton 
                  type="submit" 
                  color="primary" 
                  onClick={handleSubmit} 
                  disabled={isLoading || !inputValue.trim()} 
                  title="Enviar Mensaje" 
                  sx={{
                    p: { xs: 1, sm: 1.25 },
                    flexShrink: 0, // Prevenir que se encoja
                  }}
                >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                </IconButton>
            )
        ) : (
             <IconButton 
               onClick={toggleRecording} 
               color={isSpeechApiSupported ? "primary" : "default"} 
               disabled={isLoading || !isSpeechApiSupported} 
               title={isSpeechApiSupported ? "Iniciar Grabación" : "Grabación no soportada"} 
               sx={{
                 p: { xs: 1, sm: 1.25 }, 
                 color: theme.palette.text.secondary,
                 flexShrink: 0, // Prevenir que se encoja
               }}
             >
                {isSpeechApiSupported ? <MicIcon sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <MicOffIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
            </IconButton>
        )}
      </Paper>
      {isRecording && speechError && (
        <Typography 
          variant="caption" 
          color={speechError.includes("Error") || speechError.includes("denegado") ? "error" : "text.secondary"} 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 0.5, 
            fontSize: { xs: '0.65rem', sm: '0.7rem' },
            px: 1, // Padding horizontal para evitar que el texto toque los bordes
          }}
        >
            {speechError}
        </Typography>
      )}
    </Box>
  );
};

export default ChatInput;
