import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../firebase/authContext';
import {
  Interaction,
  InteractionMessage,
  ReflectionMode,
  SaveStatus,
} from '../types';
import {
  saveInteraction,
  getUserInteractions,
  deleteInteraction,
} from '../firebase/interactionService';
import {
  Sparkles,
  LogOut,
  Plus,
  History,
  Send,
  Loader2,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Search,
  BookOpen,
  Lightbulb,
  FileText,
  ListTodo,
  Download,
  Clock,
  User,
  Shield,
  MapPin,
  Compass,
  X,
  Mic,
  Brain,
} from 'lucide-react';
import { MapExplorerModal } from './MapExplorerModal';
import { AdminConsoleModal } from './AdminConsoleModal';
import { VoiceJournalModal } from './VoiceJournalModal';
import { CognitiveDashboardModal } from './CognitiveDashboardModal';
import { EmotionalTone } from '../types';

const MODE_CONFIGS: Record<
  ReflectionMode,
  { label: string; icon: React.FC<{ className?: string }>; description: string }
> = {
  reflection: {
    label: 'Mindful Reflection',
    icon: Sparkles,
    description: 'Empathetic inquiry, deep questions, and perspective exploration.',
  },
  summary: {
    label: 'Executive Summary',
    icon: FileText,
    description: 'Distill core sentiments, breakthrough insights, and highlights.',
  },
  brainstorm: {
    label: 'Creative Brainstorming',
    icon: Lightbulb,
    description: 'Expand ideas with fresh angles, analogies, and innovative paths.',
  },
  action_items: {
    label: 'Actionable Next Steps',
    icon: ListTodo,
    description: 'Synthesize actionable, prioritized, realistic steps forward.',
  },
};

const INSPIRATION_PROMPTS: Record<ReflectionMode, string[]> = {
  reflection: [
    'What was the most challenging moment today, and what did it reveal about me?',
    'What feeling or thought have I been subtly avoiding lately?',
    'Where did I experience genuine peace or flow this week?',
  ],
  summary: [
    'Here is my journal dump from today; help me summarize the main emotional shift...',
    'Synthesize the key lessons from my latest team review and conversations...',
    'Summarize my notes on my new project roadmap and core concerns...',
  ],
  brainstorm: [
    'I want to reinvent my morning routine for better creative focus. What are non-obvious ideas?',
    'How can I approach resolving a recurring miscommunication with empathy?',
    'Give me 3 innovative concepts for balancing deep technical work and well-being.',
  ],
  action_items: [
    'Help me turn these rambling thoughts into 3 high-leverage steps for tomorrow morning.',
    'I feel overwhelmed by my goals; extract the single most impactful next action.',
    'Break down this complex decision into small, reversible micro-experiments.',
  ],
};

export const Dashboard: React.FC = () => {
  const { user, signOutUser, isDemoMode, isConfigured, isAdmin, toggleRole } = useAuth();

  // Active reflection state
  const [currentEntry, setCurrentEntry] = useState<Interaction>({
    id: `entry_${Date.now()}`,
    userId: user?.uid || '',
    title: 'Morning Reflection',
    mode: 'reflection',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Past reflections state
  const [historyList, setHistoryList] = useState<Interaction[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Summary generation loading
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Geographic Map Explorer state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Admin Console & Telemetry state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Voice/Audio Capture & Cognitive Dashboard states
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCognitiveModalOpen, setIsCognitiveModalOpen] = useState(false);

  const handleApplyVoiceTranscript = (
    transcript: string,
    suggestedPrompt?: string,
    tone?: EmotionalTone
  ) => {
    if (!transcript.trim()) return;
    setInputPrompt((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${transcript.trim()}` : transcript.trim();
    });
  };

  // Auto-scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch past interactions on mount or user change
  useEffect(() => {
    if (user?.uid) {
      loadHistory();
    }
  }, [user?.uid]);

  // Scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentEntry.messages, isGenerating]);

  const loadHistory = async () => {
    if (!user?.uid) return;
    setIsLoadingHistory(true);
    try {
      const items = await getUserInteractions(user.uid, isDemoMode);
      setHistoryList(items);
    } catch (e) {
      console.error('Failed to load interactions:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Explicit Save Helper
  const persistEntry = async (entryToSave: Interaction): Promise<boolean> => {
    if (!user?.uid) return false;
    setSaveStatus('saving');
    setSaveErrorMessage(null);

    try {
      const result = await saveInteraction(user.uid, entryToSave, isDemoMode);
      if (result.success) {
        setSaveStatus('saved');
        // Refresh history cache
        loadHistory();
        return true;
      } else {
        setSaveStatus('error');
        setSaveErrorMessage(result.error || 'Failed to persist to database');
        return false;
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMessage(err?.message || 'Database write error');
      return false;
    }
  };

  // Submit Prompt to Gemini with Multi-Turn Context
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? inputPrompt).trim();
    if (!textToSend || isGenerating || !user?.uid) return;

    const userMessage: InteractionMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentEntry.messages, userMessage];
    const updatedEntry: Interaction = {
      ...currentEntry,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update entry state
    setCurrentEntry(updatedEntry);
    if (!customPrompt) {
      setInputPrompt('');
    }
    setIsGenerating(true);

    try {
      // Call server-side Gemini API endpoint
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          mode: currentEntry.mode,
          location: currentEntry.location,
          history: currentEntry.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive response from Gemini');
      }

      const geminiMessage: InteractionMessage = {
        id: `msg_model_${Date.now()}`,
        role: 'model',
        content: data.response,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed,
      };

      const finalEntry: Interaction = {
        ...updatedEntry,
        messages: [...updatedMessages, geminiMessage],
        updatedAt: new Date().toISOString(),
      };

      setCurrentEntry(finalEntry);

      // Guaranteed Transaction Verification (Persist both user prompt & Gemini response)
      await persistEntry(finalEntry);
    } catch (error: any) {
      console.error('Generation failure:', error);
      // Restore input prompt so user does not lose their typed thoughts
      setInputPrompt(textToSend);
      setSaveStatus('error');
      setSaveErrorMessage(
        `Gemini Generation Error: ${error?.message || 'Could not reach server API'}. Your input was preserved.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Pin current physical location to active reflection
  const handlePinLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser environment.');
      return;
    }

    setIsLocating(true);
    setSaveErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Call server reverse geocoding proxy
          const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();

          const address = data?.address || `Coordinates (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          const updated: Interaction = {
            ...currentEntry,
            location: {
              lat,
              lng,
              address,
              name: address.split(',')[0] || 'Current Location',
              accuracy: position.coords.accuracy,
            },
            updatedAt: new Date().toISOString(),
          };

          setCurrentEntry(updated);
          await persistEntry(updated);
        } catch (err: any) {
          console.warn('Reverse geocoding error:', err);
          // Still save coordinates even if reverse geocoding failed
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const updated: Interaction = {
            ...currentEntry,
            location: {
              lat,
              lng,
              address: `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
            },
            updatedAt: new Date().toISOString(),
          };
          setCurrentEntry(updated);
          await persistEntry(updated);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn('Geolocation failed:', error);
        setIsLocating(false);
        setSaveErrorMessage(
          error.code === 1
            ? 'Location access was denied. Please allow location permissions to tag your reflection.'
            : 'Could not determine your location. Try again or enter it manually.'
        );
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Generate Reflection Summary
  const handleGenerateSummary = async () => {
    if (currentEntry.messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    setSaveErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentEntry.title,
          messages: currentEntry.messages,
          mode: currentEntry.mode,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to summarize reflection');
      }

      const updatedEntry: Interaction = {
        ...currentEntry,
        summary: data.summary,
        updatedAt: new Date().toISOString(),
      };

      setCurrentEntry(updatedEntry);
      await persistEntry(updatedEntry);
    } catch (err: any) {
      console.error('Summary error:', err);
      setSaveErrorMessage(`Summary failed: ${err?.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Start a fresh entry
  const handleNewEntry = () => {
    const fresh: Interaction = {
      id: `entry_${Date.now()}`,
      userId: user?.uid || '',
      title: `Reflection - ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`,
      mode: 'reflection',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentEntry(fresh);
    setSaveStatus('idle');
    setSaveErrorMessage(null);
  };

  // Select a past entry from history
  const handleSelectHistoryEntry = (entry: Interaction) => {
    setCurrentEntry(entry);
    setSaveStatus('saved');
    setSaveErrorMessage(null);
    setIsHistoryOpen(false);
  };

  // Delete an entry from history
  const handleDeleteEntry = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    if (!window.confirm('Delete this reflection entry? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteInteraction(user.uid, entryId, isDemoMode);
      setHistoryList((prev) => prev.filter((item) => item.id !== entryId));
      if (currentEntry.id === entryId) {
        handleNewEntry();
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message}`);
    }
  };

  // Export current reflection as Markdown
  const handleExportMarkdown = () => {
    let md = `# ${currentEntry.title}\n\n`;
    md += `**Date:** ${new Date(currentEntry.createdAt).toLocaleString()}\n`;
    md += `**Mode:** ${MODE_CONFIGS[currentEntry.mode].label}\n\n`;

    if (currentEntry.summary) {
      md += `## Key Summary & Insights\n\n${currentEntry.summary}\n\n---\n\n`;
    }

    md += `## Dialogue & Journal Notes\n\n`;
    currentEntry.messages.forEach((msg) => {
      const author = msg.role === 'model' ? `Gemini (${msg.modelUsed || 'AI'})` : 'You';
      md += `### ${author} [${new Date(msg.timestamp).toLocaleTimeString()}]\n\n${msg.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEntry.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter history
  const filteredHistory = historyList.filter(
    (item) =>
      item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.messages.some((m) => m.content.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-stone-200/90 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-lg tracking-tight font-serif text-stone-900">
                ReflectAI
              </span>
              <span className="hidden md:inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                <Shield className="w-3 h-3 text-emerald-600" />
                <span>Isolated UID: {user?.uid.slice(0, 10)}...</span>
              </span>
            </div>
          </div>

          {/* Center Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="new-reflection-btn"
              onClick={handleNewEntry}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden">New</span>
            </button>

            <button
              id="open-map-explorer-btn"
              onClick={() => setIsMapModalOpen(true)}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 rounded-lg transition-colors cursor-pointer"
              title="Explore reflections on Google Maps"
            >
              <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden md:inline">
                Map ({historyList.filter((e) => e.location && typeof e.location.lat === 'number').length})
              </span>
              <span className="md:hidden">Map</span>
            </button>

            <button
              id="open-cognitive-dashboard-btn"
              onClick={() => setIsCognitiveModalOpen(true)}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-amber-950 bg-amber-100/70 hover:bg-amber-100 border border-amber-300/80 rounded-lg transition-colors cursor-pointer"
              title="Cognitive Trend Dashboard & Heatmap"
            >
              <Brain className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span className="hidden lg:inline">Cognitive Trends</span>
              <span className="lg:hidden">Trends</span>
            </button>

            <button
              id="open-voice-journal-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 rounded-lg transition-colors cursor-pointer"
              title="Voice Reflection (Audio Capture & Tone Analysis)"
            >
              <Mic className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span className="hidden sm:inline">Voice</span>
            </button>

            <button
              id="toggle-history-btn"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isHistoryOpen
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">History ({historyList.length})</span>
              <span className="sm:hidden">({historyList.length})</span>
            </button>

            {isAdmin && (
              <button
                id="open-admin-console-btn"
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-amber-950 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                title="Open Admin Console & Security Auditor"
              >
                <Shield className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>

          {/* User profile, RBAC badge & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAdmin ? (
              <span
                id="user-role-badge"
                title="Verified Administrator (samshaikh5853@gmail.com)"
                className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border bg-amber-100 text-amber-900 border-amber-300"
              >
                ADMIN
              </span>
            ) : (
              <span
                id="user-role-badge"
                title="Standard User (Isolated Tenant Record)"
                className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border bg-stone-100 text-stone-600 border-stone-200"
              >
                USER
              </span>
            )}

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-stone-800 leading-tight">
                {user?.displayName || 'Reflector'}
              </span>
              <span className="text-[10px] text-stone-500 leading-tight">
                {user?.email || 'Authenticated User'}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-xs font-semibold text-stone-700">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>

            <button
              id="signout-btn"
              onClick={signOutUser}
              title="Sign Out"
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex gap-6 relative">
        {/* Left / Active Reflection Workspace */}
        <main className="flex-1 flex flex-col bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden min-h-[680px]">
          {/* Workspace Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50/50">
            <div className="flex-1 w-full sm:w-auto">
              <input
                id="reflection-title-input"
                type="text"
                value={currentEntry.title}
                onChange={(e) => {
                  const updated = { ...currentEntry, title: e.target.value };
                  setCurrentEntry(updated);
                  setSaveStatus('idle');
                }}
                onBlur={() => persistEntry(currentEntry)}
                placeholder="Name your reflection..."
                className="w-full text-lg sm:text-xl font-serif font-medium text-stone-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-stone-400"
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(currentEntry.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
                <span>&bull;</span>
                <span>{currentEntry.messages.length} exchanges</span>

                {/* Location Chip / Pin Button */}
                {currentEntry.location ? (
                  <div className="flex items-center space-x-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md text-[11px]">
                    <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                    <span className="font-medium max-w-[200px] truncate">
                      {currentEntry.location.name || currentEntry.location.address || `${currentEntry.location.lat.toFixed(2)}, ${currentEntry.location.lng.toFixed(2)}`}
                    </span>
                    <button
                      onClick={() => {
                        const updated = { ...currentEntry, location: undefined };
                        setCurrentEntry(updated);
                        persistEntry(updated);
                      }}
                      title="Remove location"
                      className="text-amber-700 hover:text-red-700 cursor-pointer p-0.5 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    id="pin-location-btn"
                    onClick={handlePinLocation}
                    disabled={isLocating}
                    className="flex items-center space-x-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                    ) : (
                      <MapPin className="w-3 h-3 text-stone-500" />
                    )}
                    <span>{isLocating ? 'Detecting Location...' : 'Pin Location'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Save Status & Secondary Actions */}
            <div className="flex items-center space-x-2 self-end sm:self-center">
              {/* Save Indicator */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium">
                {saveStatus === 'saving' && (
                  <span className="text-amber-700 flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-emerald-700 flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded">
                    <Check className="w-3 h-3" />
                    <span>Saved to Firestore</span>
                  </span>
                )}
                {saveStatus === 'error' && (
                  <button
                    id="retry-save-btn"
                    onClick={() => persistEntry(currentEntry)}
                    className="text-red-700 flex items-center space-x-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>Retry Save</span>
                  </button>
                )}
              </div>

              {/* Summarize Action */}
              {currentEntry.messages.length >= 2 && (
                <button
                  id="summarize-entry-btn"
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing}
                  className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSummarizing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  <span>Summarize</span>
                </button>
              )}

              {/* Export Markdown */}
              <button
                id="export-markdown-btn"
                onClick={handleExportMarkdown}
                title="Export as Markdown"
                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="px-4 py-2 border-b border-stone-100 bg-white flex items-center space-x-1 overflow-x-auto">
            {(Object.keys(MODE_CONFIGS) as ReflectionMode[]).map((modeKey) => {
              const cfg = MODE_CONFIGS[modeKey];
              const Icon = cfg.icon;
              const isActive = currentEntry.mode === modeKey;
              return (
                <button
                  key={modeKey}
                  id={`mode-tab-${modeKey}`}
                  onClick={() => {
                    const updated = { ...currentEntry, mode: modeKey };
                    setCurrentEntry(updated);
                    persistEntry(updated);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-100/80 text-amber-900 font-semibold shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-800' : 'text-stone-500'}`} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Error Banner if save fails */}
          {saveErrorMessage && (
            <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{saveErrorMessage}</span>
              </div>
              <button
                onClick={() => persistEntry(currentEntry)}
                className="ml-3 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Executive Summary Card (if present) */}
          {currentEntry.summary && (
            <div className="m-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 text-stone-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-amber-900">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Executive Insights &amp; Takeaways</span>
                </div>
                <span className="text-[10px] text-amber-700/80 font-mono">Gemini 3.6 Flash</span>
              </div>
              <div className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line font-serif">
                {currentEntry.summary}
              </div>
            </div>
          )}

          {/* Conversation Transcript Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {currentEntry.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-100">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-medium text-stone-800 mb-1">
                  Begin Your {MODE_CONFIGS[currentEntry.mode].label}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mb-6">
                  {MODE_CONFIGS[currentEntry.mode].description} Type below or tap an inspiration prompt to begin.
                </p>

                {/* Inspiration Prompts */}
                <div className="flex flex-col gap-2 w-full max-w-lg text-left">
                  {INSPIRATION_PROMPTS[currentEntry.mode].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 rounded-xl transition-all text-left flex items-start space-x-2 hover:border-amber-300 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentEntry.messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                      isUser ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-[11px] text-stone-400 mb-1 px-1">
                      <span className="font-medium text-stone-600">
                        {isUser ? 'You' : 'Gemini'}
                      </span>
                      {msg.modelUsed && (
                        <span className="bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded text-[9px] font-mono border border-amber-200/50">
                          {msg.modelUsed}
                        </span>
                      )}
                      <span>&bull;</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-stone-900 text-stone-100 rounded-tr-xs shadow-xs'
                          : 'bg-stone-100/90 text-stone-800 rounded-tl-xs border border-stone-200/70'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}

            {isGenerating && (
              <div className="flex flex-col items-start max-w-3xl mr-auto">
                <div className="flex items-center space-x-2 text-[11px] text-amber-800 mb-1 px-1">
                  <span className="font-medium">Gemini 3.6 Flash</span>
                  <span className="text-stone-400">&bull;</span>
                  <span>Reflecting...</span>
                </div>
                <div className="p-4 rounded-2xl rounded-tl-xs bg-amber-50/70 border border-amber-200/60 text-stone-700 text-sm flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  <span className="italic font-serif">Deepening thoughts and structuring perspective...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-stone-100 bg-stone-50/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 bg-white p-2 rounded-xl border border-stone-200 focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400 transition-all shadow-xs"
            >
              <textarea
                id="prompt-textarea"
                rows={2}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Share your thoughts, challenges, or reflections... (Press Enter to send)`}
                className="flex-1 max-h-36 resize-none p-1.5 text-sm text-stone-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-stone-400"
              />

              <button
                id="inline-mic-btn"
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                title="Voice Reflection (Audio recording & tone analysis)"
                className="p-2.5 rounded-lg text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors cursor-pointer shrink-0"
              >
                <Mic className="w-4 h-4 text-amber-800" />
              </button>

              <button
                id="send-prompt-btn"
                type="submit"
                disabled={!inputPrompt.trim() || isGenerating}
                className="p-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400 px-1">
              <span>Shift + Enter for new line</span>
              <span>Cloud Firestore isolation active</span>
            </div>
          </div>
        </main>

        {/* History Drawer / Side Panel (Responsive Slide-over on mobile/tablet, side-by-side on desktop) */}
        {isHistoryOpen && (
          <>
            {/* Mobile / Tablet Backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-stone-900/40 z-30 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsHistoryOpen(false)}
            />
            <aside
              id="history-panel"
              className="fixed lg:relative inset-y-0 right-0 top-0 lg:top-auto h-full lg:h-auto w-80 sm:w-88 lg:w-80 bg-white lg:rounded-2xl border-l lg:border border-stone-200/90 shadow-2xl lg:shadow-lg flex flex-col overflow-hidden shrink-0 z-40 lg:z-10 animate-in slide-in-from-right lg:animate-none duration-200"
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-stone-700" />
                  <h3 className="font-semibold text-sm text-stone-900">Past Reflections</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={loadHistory}
                    title="Refresh history"
                    className="p-1 text-stone-500 hover:text-stone-800 rounded transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="lg:hidden p-1 text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
                    title="Close History"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* History Search */}
            <div className="p-3 border-b border-stone-100">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5" />
                <input
                  id="history-search-input"
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search reflections..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-stone-500 flex flex-col items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-stone-400 mb-2" />
                  <span>Loading reflections...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  No saved reflections found.
                </div>
              ) : (
                filteredHistory.map((entry) => {
                  const isSelected = currentEntry.id === entry.id;
                  const ModeIcon = MODE_CONFIGS[entry.mode]?.icon || Sparkles;
                  return (
                    <div
                      key={entry.id}
                      onClick={() => handleSelectHistoryEntry(entry)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                          : 'bg-stone-50/60 hover:bg-stone-100/70 border-stone-200/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center space-x-1.5 font-medium text-xs text-stone-800 truncate">
                          <ModeIcon className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="truncate">{entry.title || 'Untitled'}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                          title="Delete entry"
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 rounded transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="mt-1 text-[11px] text-stone-500 line-clamp-2">
                        {entry.messages[0]?.content || 'Empty entry'}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
                        <span>
                          {new Date(entry.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>{entry.messages.length} msg</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </>
      )}
      </div>

      {/* Google Maps Explorer Modal */}
      <MapExplorerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        interactions={historyList}
        onSelectInteraction={(entry) => handleSelectHistoryEntry(entry)}
      />

      {/* Admin Console & Security Auditor Modal */}
      <AdminConsoleModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        interactions={historyList}
      />

      {/* Voice Journal (Audio Capture & Tone Analysis) Modal */}
      <VoiceJournalModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyTranscript={handleApplyVoiceTranscript}
      />

      {/* Cognitive Trend Dashboard & Heatmap Modal */}
      <CognitiveDashboardModal
        isOpen={isCognitiveModalOpen}
        onClose={() => setIsCognitiveModalOpen(false)}
        interactions={historyList}
        onSelectInteraction={(entry) => handleSelectHistoryEntry(entry)}
      />
    </div>
  );
};
