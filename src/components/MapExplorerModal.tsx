import React, { useState } from 'react';
import { Interaction } from '../types';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  X,
  Compass,
  Calendar,
  Sparkles,
  ExternalLink,
  Key,
  Layers,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface MapExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
  onSelectInteraction: (entry: Interaction) => void;
}

export const MapExplorerModal: React.FC<MapExplorerModalProps> = ({
  isOpen,
  onClose,
  interactions,
  onSelectInteraction,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<Interaction | null>(null);
  const [customKey, setCustomKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [isKeyInputOpen, setIsKeyInputOpen] = useState(false);

  if (!isOpen) return null;

  // Filter entries that have valid location coordinates
  const locationEntries = interactions.filter(
    (e) =>
      e.location &&
      typeof e.location.lat === 'number' &&
      typeof e.location.lng === 'number'
  );

  // Compute default center (or fallback to Seattle / global coordinates)
  const defaultCenter =
    locationEntries.length > 0
      ? {
          lat: locationEntries[0].location!.lat,
          lng: locationEntries[0].location!.lng,
        }
      : { lat: 37.7749, lng: -122.4194 }; // San Francisco default

  const apiKey = customKey.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs">
      <div
        id="map-explorer-container"
        className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-semibold text-stone-900">
                Geographic Reflection Explorer
              </h2>
              <p className="text-xs text-stone-500">
                Discover your thoughts, moods, and breakthroughs across physical spaces
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="maps-key-toggle-btn"
              onClick={() => setIsKeyInputOpen(!isKeyInputOpen)}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
              title="Configure Google Maps API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {apiKey ? 'API Key Active' : 'Configure Maps Key'}
              </span>
            </button>

            <button
              id="close-map-modal-btn"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Banner / Config if requested or missing */}
        {isKeyInputOpen && (
          <div className="p-4 bg-amber-50/80 border-b border-amber-200/70 text-xs text-stone-800 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 font-medium text-amber-900">
                <Key className="w-4 h-4 text-amber-700" />
                <span>Google Maps Platform Prototyping &amp; Demo Key</span>
              </div>
              <a
                href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noreferrer"
                className="text-amber-800 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>Get Instant Maps Demo Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Mint a free Maps Demo Key in seconds with any Google account (no billing card
              required), or enter your standard Google Cloud API key with Maps JavaScript API
              enabled.
            </p>
            <div className="flex gap-2 items-center mt-1">
              <input
                id="maps-api-key-input"
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Paste VITE_GOOGLE_MAPS_API_KEY (e.g. AIzaSy...)"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono"
              />
              <button
                onClick={() => setIsKeyInputOpen(false)}
                className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                Apply Key
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area: Map and Entries Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Map Canvas Container */}
          <div className="flex-1 h-full min-h-[380px] bg-stone-100 relative">
            {apiKey ? (
              <APIProvider apiKey={apiKey} solutionChannel="gmp_mcp_codeassist_v1_aistudio">
                <Map
                  mapId="DEMO_MAP_ID"
                  defaultCenter={defaultCenter}
                  defaultZoom={locationEntries.length > 0 ? 11 : 4}
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  {locationEntries.map((entry) => (
                    <AdvancedMarker
                      key={entry.id}
                      position={{
                        lat: entry.location!.lat,
                        lng: entry.location!.lng,
                      }}
                      onClick={() => setSelectedEntry(entry)}
                      title={entry.title}
                    >
                      <Pin
                        background="#b45309"
                        borderColor="#78350f"
                        glyphColor="#ffffff"
                      />
                    </AdvancedMarker>
                  ))}

                  {selectedEntry && selectedEntry.location && (
                    <InfoWindow
                      position={{
                        lat: selectedEntry.location.lat,
                        lng: selectedEntry.location.lng,
                      }}
                      onCloseClick={() => setSelectedEntry(null)}
                    >
                      <div className="p-2 max-w-xs text-stone-900">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-900 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-700" />
                          <span className="truncate">{selectedEntry.title}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 mb-2">
                          {selectedEntry.location.name || selectedEntry.location.address}
                        </div>
                        <div className="text-[11px] text-stone-700 line-clamp-3 italic mb-3">
                          {selectedEntry.messages[0]?.content || 'Empty entry'}
                        </div>
                        <button
                          onClick={() => {
                            onSelectInteraction(selectedEntry);
                            onClose();
                          }}
                          className="w-full py-1 px-2 text-center text-xs font-medium bg-stone-900 hover:bg-stone-800 text-white rounded-md transition-colors cursor-pointer"
                        >
                          Open This Reflection
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              /* Fallback Interactive Radar / Map Preview when API key is pending */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-stone-50">
                <div className="w-16 h-16 rounded-2xl bg-amber-100/70 border border-amber-200 text-amber-800 flex items-center justify-center mb-4 shadow-sm">
                  <MapPin className="w-8 h-8 text-amber-700" />
                </div>
                <h3 className="text-base font-serif font-semibold text-stone-800 mb-1">
                  Google Maps Platform Integration Ready
                </h3>
                <p className="text-xs text-stone-600 max-w-md mb-4 leading-relaxed">
                  ReflectAI is instrumented with the official{' '}
                  <code className="bg-stone-200 px-1 py-0.5 rounded font-mono text-[11px]">
                    @vis.gl/react-google-maps
                  </code>{' '}
                  SDK, Advanced Markers, and Solution Attribution. Connect your free Maps Demo Key
                  to view full vector satellite &amp; street tiles.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setIsKeyInputOpen(true)}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Enter Maps Key</span>
                  </button>
                  <a
                    href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Get Free Maps Demo Key</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Simulated Geolocation Coordinates Grid */}
                {locationEntries.length > 0 && (
                  <div className="mt-6 w-full max-w-md p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs text-left">
                    <div className="text-[11px] font-semibold text-stone-700 mb-2 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-700" />
                      <span>{locationEntries.length} Geotagged Reflections Recorded</span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {locationEntries.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => {
                            onSelectInteraction(e);
                            onClose();
                          }}
                          className="p-2 rounded-lg bg-stone-50 hover:bg-amber-50/60 border border-stone-200/60 flex items-center justify-between text-xs cursor-pointer transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="font-medium text-stone-800 block truncate">
                              {e.title}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {e.location?.name || e.location?.address}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 shrink-0">
                            {e.location?.lat.toFixed(2)}, {e.location?.lng.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Geotagged Reflections List */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-stone-200 bg-stone-50/60 flex flex-col h-64 md:h-full overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-stone-200/80 bg-white flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800">
                Locations ({locationEntries.length})
              </span>
              <span className="text-[10px] text-stone-500">
                {interactions.length - locationEntries.length} unpinned
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {locationEntries.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500 px-4">
                  <MapPin className="w-6 h-6 text-stone-300 mx-auto mb-2" />
                  <p className="font-medium text-stone-700 mb-1">No Pinned Locations Yet</p>
                  <p className="text-[11px] text-stone-500">
                    Open a journal entry and tap &ldquo;Pin Location&rdquo; to anchor your reflection
                    to your physical surroundings.
                  </p>
                </div>
              ) : (
                locationEntries.map((entry) => {
                  const isSelected = selectedEntry?.id === entry.id;
                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-300 shadow-2xs'
                          : 'bg-white hover:bg-stone-50 border-stone-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs text-stone-800 truncate">
                          {entry.title}
                        </span>
                        <span className="text-[10px] text-stone-400 shrink-0 flex items-center space-x-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>
                            {new Date(entry.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-[11px] text-amber-800 mb-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {entry.location?.name || entry.location?.address}
                        </span>
                      </div>

                      {entry.summary && (
                        <p className="text-[11px] text-stone-600 line-clamp-2 italic mb-2">
                          {entry.summary}
                        </p>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInteraction(entry);
                          onClose();
                        }}
                        className="w-full py-1 text-center text-[11px] font-medium bg-stone-100 hover:bg-stone-200/80 text-stone-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Open Reflection</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
