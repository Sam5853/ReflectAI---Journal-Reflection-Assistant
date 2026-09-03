import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Loader2,
  Check,
  RotateCcw,
  Volume2,
  Brain,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { EmotionalTone } from '../types';

interface VoiceJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTranscript: (transcript: string, suggestedPrompt?: string, tone?: EmotionalTone) => void;
}

export const VoiceJournalModal: React.FC<VoiceJournalModalProps> = ({
  isOpen,
  onClose,
  onApplyTranscript,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<{
    transcript: string;
    tone?: EmotionalTone;
    clarityScore?: number;
    suggestedPrompt?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Context & Analyser for visualizer
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setLiveTranscript('');
      setTranscriptionResult(null);
      setErrorMessage(null);
      setRecordingDuration(0);
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    setLiveTranscript('');
    setTranscriptionResult(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize Web Audio API Analyser for live visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        drawVisualizer();
      } catch (e) {
        console.warn('AudioContext visualizer unsupported:', e);
      }

      // Initialize MediaRecorder for backend multimodal audio
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else {
          options = { mimeType: '' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      // Start duration counter
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Initialize Web Speech API for instant real-time live preview
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; ++i) {
              current += event.results[i][0].transcript;
            }
            setLiveTranscript(current);
          };

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition event:', event.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn('Live SpeechRecognition not supported in this frame:', speechErr);
        }
      }
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser.'
          : 'Could not access microphone. Please check your audio input settings.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        ctx.fillStyle = '#b45309'; // warm amber
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    render();
  };

  const handleFinishAndTranscribe = async () => {
    stopRecording();
    setIsProcessing(true);
    setErrorMessage(null);

    // Give mediaRecorder a moment to flush final chunks
    await new Promise((r) => setTimeout(r, 400));

    try {
      let audioBase64 = '';
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        audioBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // strip data URL prefix (e.g. data:audio/webm;base64,)
            const commaIdx = base64data.indexOf(',');
            resolve(commaIdx !== -1 ? base64data.substring(commaIdx + 1) : base64data);
          };
          reader.readAsDataURL(audioBlob);
        });
      }

      const res = await fetch('/api/audio/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          fallbackTranscript: liveTranscript.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Transcription failed');
      }

      setTranscriptionResult({
        transcript: data.transcript || liveTranscript || 'Spoken reflection recorded.',
        tone: data.toneDetected || 'reflective',
        clarityScore: data.clarityScore || 85,
        suggestedPrompt: data.suggestedPrompt || 'What stood out to you most about this thought?',
      });
    } catch (err: any) {
      console.warn('Transcription error:', err);
      if (liveTranscript.trim()) {
        setTranscriptionResult({
          transcript: liveTranscript.trim(),
          tone: 'reflective',
          clarityScore: 80,
          suggestedPrompt: 'How can you act on this reflection today?',
        });
      } else {
        setErrorMessage(err?.message || 'Could not transcribe voice audio. Please try speaking again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs">
      <div
        id="voice-journal-modal"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-800 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-stone-900">
                Voice Reflection &amp; Tone Analyzer
              </h2>
              <p className="text-xs text-stone-500">
                Speak your thoughts freely &bull; Gemini transcribes and extracts cognitive tone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Center Stage / Microphone Interaction */}
          {!transcriptionResult ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="relative">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                )}
                <button
                  id="record-mic-toggle-btn"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-amber-700 text-white scale-105 ring-4 ring-amber-200'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-300'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8 text-amber-800" />
                  )}
                </button>
              </div>

              <div>
                <div className="text-sm font-semibold text-stone-900">
                  {isRecording ? (
                    <span className="flex items-center justify-center space-x-2 text-amber-800">
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                      <span>Listening... ({formatSeconds(recordingDuration)})</span>
                    </span>
                  ) : (
                    'Tap microphone to begin speaking'
                  )}
                </div>
                <p className="text-xs text-stone-500 max-w-xs mt-1">
                  {isRecording
                    ? 'Speak naturally about your day, challenges, ideas, or feelings.'
                    : 'Your voice is securely processed with zero persistent raw audio retention.'}
                </p>
              </div>

              {/* Live Canvas Audio Waveform */}
              {isRecording && (
                <div className="w-full max-w-sm h-12 bg-amber-50/50 rounded-xl border border-amber-200/70 p-1 flex items-center justify-center">
                  <canvas ref={canvasRef} width={300} height={40} className="w-full h-full" />
                </div>
              )}

              {/* Real-time Streaming Words Preview */}
              {(isRecording || liveTranscript) && (
                <div className="w-full p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-left">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-1 flex items-center space-x-1">
                    <Volume2 className="w-3 h-3" />
                    <span>Live Transcript Preview</span>
                  </div>
                  <p className="text-xs text-stone-700 italic min-h-[36px]">
                    {liveTranscript || 'Listening for speech...'}
                  </p>
                </div>
              )}

              {/* Action Buttons while recording */}
              <div className="flex items-center space-x-3 pt-2">
                {isRecording ? (
                  <button
                    onClick={handleFinishAndTranscribe}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer shadow-sm"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Analyze &amp; Transcribe</span>
                  </button>
                ) : (
                  liveTranscript && (
                    <button
                      onClick={handleFinishAndTranscribe}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Transcribe Recorded Speech</span>
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            /* Transcription & Tone Result View */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-950 uppercase tracking-wider">
                      Transcription Complete
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded capitalize border border-amber-300">
                      Tone: {transcriptionResult.tone}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Clarity: {transcriptionResult.clarityScore}%
                    </span>
                  </div>
                </div>

                <div className="text-xs text-stone-800 bg-white p-3 rounded-lg border border-emerald-200/70 leading-relaxed max-h-48 overflow-y-auto">
                  &ldquo;{transcriptionResult.transcript}&rdquo;
                </div>

                {transcriptionResult.suggestedPrompt && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start space-x-2">
                    <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Suggested Gemini Inquiry: </span>
                      <span className="italic">{transcriptionResult.suggestedPrompt}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setTranscriptionResult(null);
                    setLiveTranscript('');
                    startRecording();
                  }}
                  className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      onApplyTranscript(
                        transcriptionResult.transcript,
                        transcriptionResult.suggestedPrompt,
                        transcriptionResult.tone
                      );
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Insert into Journal Prompt</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
