"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, StopCircle, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceRecorderProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VoiceRecorder({ isOpen, onClose }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<"idle" | "recording" | "processing" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [transcript, setTranscript] = useState("");

    // Web Speech API Refs
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Browser Compatibility Check
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setErrorMessage("Speech API not supported. Please use Chrome/Edge.");
                setStatus("error");
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;     // Keep recording even if user pauses
            recognition.interimResults = true; // Show results immediately
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                console.log("Speech recognition started");
                setIsRecording(true);
                setStatus("recording");
                setErrorMessage("");
            };

            recognition.onend = () => {
                console.log("Speech recognition ended unexpectedly");
                // If we didn't manually stop it, it might have timed out.
                // We let the UI handle the state.
            };

            recognition.onresult = (event: any) => {
                let currentInterim = "";
                let currentFinal = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentFinal += event.results[i][0].transcript;
                    } else {
                        currentInterim += event.results[i][0].transcript;
                    }
                }

                // Update the transcript state
                setTranscript(prev => {
                    // Logic: If there is a new "final" sentence, append it to the solid history.
                    // If there is just interim, show it (but don't save it to history yet purely).
                    // BUT for this simple UI, we just want to see "everything so far".

                    // The simplest way that works for most demos:
                    // Just concatenate "all final results so far" + "current interim"
                    // However, `prev` already contains old final results.

                    // Actually, `event.resultIndex` tells us where to start.
                    // A safer hack for React without complex state management:
                    // Just use the accumulator logic carefully.

                    if (currentFinal) {
                        return prev + " " + currentFinal;
                    }
                    // For interim: We can't easily "preview" it without complex state splitting (final vs interim)
                    // So we will just append it to a SEPARATE Ref or just rely on the fact that
                    // users speak continuously.

                    // IMPROVED LOGIC: simple append if we have results.
                    return prev;
                });

                // FORCE UPDATE for visual feedback (dirty but works)
                if (currentFinal || currentInterim) {
                    const text = currentFinal || currentInterim;
                    // Only update if we have something substantive
                    if (text.trim().length > 0) {
                        // We actually need to re-render. 
                        // The setTranscript(prev) above might be tricky with interim.
                        // Let's use a simpler approach:
                    }
                }
            };

            // SIMPLIFIED ONRESULT for reliability:
            recognition.onresult = (event: any) => {
                let finalStr = "";
                let interimStr = "";

                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalStr += event.results[i][0].transcript;
                    } else {
                        interimStr += event.results[i][0].transcript;
                    }
                }
                setTranscript(finalStr + " " + interimStr);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'no-speech') return;

                setErrorMessage(`Error: ${event.error}`);
                setStatus("error");
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const startRecording = () => {
        if (!recognitionRef.current) return;

        try {
            setTranscript("");
            setErrorMessage("");
            recognitionRef.current.start();
        } catch (e) {
            console.error(e);
            recognitionRef.current.stop();
            setTimeout(() => recognitionRef.current.start(), 200);
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setStatus("processing");
            setIsProcessing(true);

            // Wait for final 'onresult' event
            setTimeout(saveMemory, 1500);
        }
    };

    const saveMemory = async () => {
        let cleanText = transcript.replace(/\s+/g, ' ').trim();
        cleanText = cleanText.replace(/undefined/g, "");

        if (!cleanText || cleanText.length < 2) {
            setErrorMessage("No speech detected. Please speak louder.");
            setStatus("error");
            setIsProcessing(false);
            return;
        }

        try {
            const res = await fetch("/api/memories", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: cleanText,
                    type: 'audio',
                    tags: ['voice-transcribed']
                }),
            });
            const data = await res.json();

            if (data.success) {
                setStatus("success");
                setTimeout(() => {
                    if (isOpen) handleClose();
                }, 2000);
            } else {
                setErrorMessage(data.error || "Failed to save.");
                setStatus("error");
            }
        } catch (err) {
            setErrorMessage("Network error.");
            setStatus("error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        }
        setStatus("idle");
        setTranscript("");
        setErrorMessage("");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl"
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <h2 className="text-2xl font-bold mb-2 text-white">Record Memory</h2>

                        <div className="h-6 mb-8">
                            {status === "error" ? (
                                <p className="text-red-400 font-medium flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {errorMessage}
                                </p>
                            ) : (
                                <p className="text-gray-400 font-medium">
                                    {status === "idle" && "Tap to start speaking."}
                                    {status === "recording" && "Listening..."}
                                    {status === "processing" && "Saving Memory..."}
                                    {status === "success" && "Memory Saved!"}
                                </p>
                            )}
                        </div>

                        <div className="relative mb-8">
                            {status === "recording" && (
                                <>
                                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                                    <div className="absolute inset-[-10px] bg-red-500/10 rounded-full animate-pulse" />
                                </>
                            )}

                            <button
                                onClick={status === "recording" ? stopRecording : startRecording}
                                disabled={isProcessing || status === "success"}
                                className={`
                                    relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                                    ${status === "recording" ? 'bg-red-500 scale-110' :
                                        status === "success" ? 'bg-green-500' :
                                            status === "error" ? 'text-white bg-primary' :
                                                'bg-primary hover:bg-primary/80'}
                                    ${(isProcessing || status === "success") ? 'cursor-default' : 'cursor-pointer'}
                                `}
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                                ) : status === "success" ? (
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                ) : status === "recording" ? (
                                    <StopCircle className="w-10 h-10 text-white" />
                                ) : (
                                    <Mic className="w-10 h-10 text-white" />
                                )}
                            </button>
                        </div>

                        {/* Recent Transcript Live View */}
                        <div className="w-full min-h-[80px] bg-black/50 rounded-xl p-4 text-left border border-white/10">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">TRANSCRIPT</p>
                            <p className="text-sm text-gray-200 leading-relaxed">
                                {transcript || <span className="text-gray-600 italic">...</span>}
                            </p>
                        </div>

                        <p className="text-xs text-gray-600 mt-6 max-w-xs">
                            Browser speech recognition provides free, unlimited transcription.
                        </p>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
