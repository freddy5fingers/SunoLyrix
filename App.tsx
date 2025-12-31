
import React, { useState, useEffect, useRef } from 'react';
import { GENRES, MOODS, LANGUAGES, GENRE_ARTISTS, VOCAL_STYLES, INSTRUMENTAL_PROFILES, FAMOUS_NORTH_AMERICAN_ARTISTS } from './constants';
import { GenerationParams, SavedSong } from './types';
import { generateLyricsStream, generateCoverArt, getRandomArtistSuggestion, regenerateSection } from './services/geminiService';
import LyricDisplay from './components/LyricDisplay';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [params, setParams] = useState<GenerationParams>({
    topic: '',
    genre: 'Pop',
    mood: 'Happy',
    artist: '',
    vocalStyle: 'Auto (Best Suited)',
    instrumentalProfile: 'Auto (Best Suited)',
    includeBridge: true,
    language: 'English',
    isExplicit: false
  });

  const [loading, setLoading] = useState(false);
  const [isPickingArtist, setIsPickingArtist] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [coverArt, setCoverArt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasStartedArtGen, setHasStartedArtGen] = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [library, setLibrary] = useState<SavedSong[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  
  // Search state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredArtists, setFilteredArtists] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchLibrary(currentUser.uid);
      } else {
        setLibrary([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLibrary = async (userId: string) => {
    try {
      const q = query(
        collection(db, "songs"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const songs: SavedSong[] = [];
      querySnapshot.forEach((doc) => {
        songs.push({ id: doc.id, ...doc.data() } as SavedSong);
      });
      setLibrary(songs);
    } catch (err) {
      console.error("Error fetching library:", err);
    }
  };

  const handleSave = async () => {
    if (!user) {
      signInWithPopup(auth, googleProvider);
      return;
    }
    if (!streamingText) return;

    setIsSaving(true);
    const titleMatch = streamingText.match(/TITLE:\s*(.*)\n/);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled Masterpiece";

    try {
      const songData = {
        userId: user.uid,
        title,
        lyrics: streamingText,
        stylePrompt: getSunoPrompt(),
        coverArt: coverArt,
        params: params,
        createdAt: Date.now()
      };
      await addDoc(collection(db, "songs"), songData);
      await fetchLibrary(user.uid);
      alert("Saved to library!");
    } catch (err) {
      console.error("Error saving song:", err);
      setError("Failed to save song to library.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFromLibrary = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this song?")) return;
    try {
      await deleteDoc(doc(db, "songs", songId));
      setLibrary(library.filter(s => s.id !== songId));
    } catch (err) {
      console.error("Error deleting song:", err);
    }
  };

  const loadFromLibrary = (song: SavedSong) => {
    setStreamingText(song.lyrics);
    setCoverArt(song.coverArt);
    setParams(song.params);
    setShowLibrary(false);
    setHasStartedArtGen(true);
  };

  // Auto-trigger cover art when title is first detected in the stream
  useEffect(() => {
    if (streamingText.includes('TITLE:') && !hasStartedArtGen) {
      const titleMatch = streamingText.match(/TITLE:\s*(.*)\n/);
      if (titleMatch && titleMatch[1]) {
        setHasStartedArtGen(true);
        generateCoverArt(titleMatch[1].trim(), params.genre, params.mood)
          .then(img => setCoverArt(img))
          .catch(console.error);
      }
    }
  }, [streamingText, hasStartedArtGen, params.genre, params.mood]);

  // Handle outside clicks for search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleArtistInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setParams({ ...params, artist: val });
    
    if (val.length > 1) {
      const filtered = FAMOUS_NORTH_AMERICAN_ARTISTS.filter(a => 
        a.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 8);
      setFilteredArtists(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectArtist = (artistName: string) => {
    setParams({ ...params, artist: artistName });
    setShowSuggestions(false);
  };

  const handleRandomArtist = async () => {
    setIsPickingArtist(true);
    setShowSuggestions(false);
    try {
      const suggestion = await getRandomArtistSuggestion(params.genre);
      setParams(prev => ({ ...prev, artist: suggestion }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsPickingArtist(false);
    }
  };

  const handleRedoSection = async (label: string) => {
    if (loading || loadingSection) return;
    
    setLoadingSection(label);
    try {
      const newSectionText = await regenerateSection(label, streamingText, params);
      
      const sections = streamingText.split(/(\[.*?\])/);
      const labelTag = `[${label}]`;
      
      let foundIndex = -1;
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].trim() === labelTag) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex !== -1) {
        const newText = newSectionText.includes(`[${label}]`) 
          ? newSectionText 
          : `[${label}]\n${newSectionText}`;
          
        sections[foundIndex] = newText;
        sections[foundIndex + 1] = ""; 
        
        setStreamingText(sections.join(''));
      }
    } catch (err: any) {
      setError(`Failed to redo section: ${err.message}`);
    } finally {
      setLoadingSection(null);
    }
  };

  const handleGenerate = async () => {
    if (!params.topic.trim()) {
      setError('Please enter a topic or theme for your song.');
      return;
    }

    setLoading(true);
    setError(null);
    setStreamingText('');
    setCoverArt(null);
    setHasStartedArtGen(false);

    try {
      const stream = generateLyricsStream(params);
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingText(fullText);
      }
    } catch (err: any) {
      setError(err.message || 'The composition was interrupted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getSunoPrompt = () => {
    const match = streamingText.match(/STYLE:\s*(.*)\n/);
    return match ? match[1].trim() : '';
  };

  const getCleanLyrics = () => {
    return streamingText
      .replace(/TITLE:.*\n?/, '')
      .replace(/STYLE:.*\n?/, '')
      .replace(/EXPLANATION:.*\n?/, '')
      .trim();
  };

  const quickArtists = GENRE_ARTISTS[params.genre] || [];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Auth & Header */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              <i className="fas fa-music text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              SunoLyrix
            </span>
          </div>

          <div className="flex items-center gap-4">
            {loading && (
              <div className="hidden md:flex items-center gap-2 text-indigo-400 text-xs font-bold animate-pulse">
                <i className="fas fa-satellite-dish"></i>
                LIVE FEED ACTIVE
              </div>
            )}
            
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowLibrary(true)}
                  className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  <i className="fas fa-book-open text-indigo-400"></i> My Library
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                  <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-indigo-500/30" />
                  <button onClick={() => signOut(auth)} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Sign Out</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => signInWithPopup(auth, googleProvider)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-900/40 flex items-center gap-2"
              >
                <i className="fab fa-google"></i> Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Library Overlay */}
      {showLibrary && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fas fa-compact-disc text-indigo-500"></i> My Studio Library
              </h2>
              <button onClick={() => setShowLibrary(false)} className="text-slate-500 hover:text-white text-xl">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {library.length > 0 ? (
                library.map(song => (
                  <div 
                    key={song.id} 
                    onClick={() => loadFromLibrary(song)}
                    className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer group flex items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {song.coverArt ? (
                        <img src={song.coverArt} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <i className="fas fa-music"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-200 truncate">{song.title}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">{song.params.genre} • {song.params.mood}</p>
                      <p className="text-[10px] text-indigo-400 mt-1">{new Date(song.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={(e) => deleteFromLibrary(e, song.id)}
                      className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                  <i className="fas fa-box-open text-4xl"></i>
                  <p className="text-sm font-medium">Your library is empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg backdrop-blur-sm relative">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
                <i className="fas fa-sliders-h text-indigo-400"></i> Studio Controls
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Song Theme</label>
                  <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-24 text-sm"
                    placeholder="What should this song be about?"
                    value={params.topic}
                    onChange={(e) => setParams({...params, topic: e.target.value})}
                  />
                </div>

                <div className="relative" ref={searchRef}>
                  <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-user-tag text-[10px] text-purple-400"></i> Artist Influence
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="Search American/Canadian artists..."
                        value={params.artist}
                        onChange={handleArtistInput}
                        onFocus={() => (params.artist || "").length > 1 && setShowSuggestions(filteredArtists.length > 0)}
                      />
                      {showSuggestions && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[60] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredArtists.map((artist, idx) => (
                            <button
                              key={idx}
                              className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 border-b border-slate-700/50 last:border-0"
                              onClick={() => selectArtist(artist)}
                            >
                              <i className="fas fa-star text-[10px] text-purple-400 opacity-50"></i>
                              {artist}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleRandomArtist}
                      disabled={isPickingArtist}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 w-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 group active:scale-95 flex-shrink-0"
                      title="AI Randomizer"
                    >
                      <i className={`fas fa-dice text-lg ${isPickingArtist ? 'fa-spin text-purple-400' : 'group-hover:rotate-12'}`}></i>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {quickArtists.slice(0, 4).map(artist => (
                      <button
                        key={artist}
                        onClick={() => selectArtist(artist)}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                          params.artist === artist 
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200' 
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {artist}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Genre</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 text-sm outline-none focus:border-indigo-500"
                      value={params.genre}
                      onChange={(e) => setParams({...params, genre: e.target.value})}
                    >
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Mood</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 text-sm outline-none focus:border-indigo-500"
                      value={params.mood}
                      onChange={(e) => setParams({...params, mood: e.target.value})}
                    >
                      {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-2xl border border-indigo-500/20 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-300">
                  <i className="fas fa-dna animate-pulse"></i> Sonic DNA
                </h3>
                {(params.vocalStyle !== 'Auto (Best Suited)' || params.instrumentalProfile !== 'Auto (Best Suited)') && (
                  <button 
                    onClick={() => setParams({...params, vocalStyle: 'Auto (Best Suited)', instrumentalProfile: 'Auto (Best Suited)'})}
                    className="text-[10px] font-bold text-indigo-400/60 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                  >
                    Reset to Auto
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <i className="fas fa-microphone-lines text-[10px]"></i> Vocal Texture
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {VOCAL_STYLES.slice(0, 6).map(style => (
                      <button
                        key={style}
                        onClick={() => setParams({...params, vocalStyle: style})}
                        className={`text-[10px] p-2 rounded-lg border text-left transition-all ${
                          params.vocalStyle === style 
                          ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-lg shadow-indigo-500/20' 
                          : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-indigo-500/50'
                        }`}
                      >
                        {style === 'Auto (Best Suited)' ? 'Auto' : style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <i className="fas fa-guitar text-[10px]"></i> Instrumental Profile
                  </label>
                  <select 
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2 text-slate-200 text-sm outline-none focus:border-purple-500"
                    value={params.instrumentalProfile}
                    onChange={(e) => setParams({...params, instrumentalProfile: e.target.value})}
                  >
                    {INSTRUMENTAL_PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label htmlFor="explicit" className="text-sm font-bold text-slate-300">Explicit Mode</label>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Raw & Uncensored</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="explicit"
                      className="sr-only peer"
                      checked={params.isExplicit}
                      onChange={(e) => setParams({...params, isExplicit: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading || !!loadingSection}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-2xl ${
                  loading 
                  ? 'bg-indigo-900/40 cursor-not-allowed text-indigo-400 border border-indigo-500/30' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/40 hover:shadow-indigo-500/40'
                }`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-compact-disc fa-spin"></i> Architecting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt"></i> Stream Masterpiece
                  </>
                )}
              </button>
            </div>

            {streamingText.includes('STYLE:') && (
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg animate-in fade-in duration-500">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Detected Suno Tag</h3>
                <div className="bg-slate-900 p-4 rounded-xl relative group border border-indigo-500/20">
                  <p className="text-indigo-300 font-mono text-xs pr-10 leading-relaxed break-words">
                    {getSunoPrompt() || 'Waiting for style definition...'}
                  </p>
                  <button 
                    onClick={() => copyToClipboard(getSunoPrompt())}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                  >
                    <i className="far fa-copy"></i>
                  </button>
                </div>
              </div>
            )}
          </aside>

          <div className="lg:col-span-8 space-y-8">
            {streamingText ? (
              <>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-grow w-full">
                    <LyricDisplay 
                      rawText={streamingText} 
                      isStreaming={loading} 
                      onRedoSection={handleRedoSection}
                      loadingSection={loadingSection}
                    />
                  </div>
                  
                  <div className="w-full md:w-64 flex-shrink-0 space-y-6">
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 shadow-lg backdrop-blur-sm">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 text-center">Inspiration Canvas</h4>
                      <div className="aspect-square bg-slate-900 rounded-xl overflow-hidden relative shadow-inner group">
                        {coverArt ? (
                          <img src={coverArt} alt="Album Cover" className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                            <i className="fas fa-wand-magic-sparkles text-2xl animate-pulse"></i>
                            <span className="text-[10px] uppercase font-bold tracking-widest">Awaiting Title</span>
                          </div>
                        )}
                        {params.isExplicit && (
                          <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-1 py-0.5 rounded border border-white/20">
                            18+
                          </div>
                        )}
                        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors pointer-events-none"></div>
                      </div>
                    </div>

                    {!loading && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <button 
                          onClick={handleSave}
                          disabled={isSaving}
                          className={`w-full py-3 ${isSaving ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20`}
                        >
                          <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-bookmark'}`}></i> {isSaving ? 'Saving...' : 'Save to Library'}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(getCleanLyrics())}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
                        >
                          <i className="fas fa-copy"></i> Copy for Suno
                        </button>
                        <button 
                          onClick={() => window.open('https://suno.com/create', '_blank')}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          <i className="fas fa-external-link-alt"></i> Create on Suno
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {streamingText.includes('EXPLANATION:') && (
                  <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-sm animate-in fade-in">
                    <h4 className="text-indigo-400 font-semibold mb-2 flex items-center gap-2">
                      <i className="fas fa-microchip text-sm"></i> Architectural Analysis
                    </h4>
                    <p className="text-indigo-100/70 text-sm leading-relaxed italic">
                      {streamingText.split('EXPLANATION:')[1].trim()}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="h-[750px] bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-700/50 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-6 backdrop-blur-sm">
                <div className="relative">
                  <div className="w-32 h-32 bg-indigo-900/10 rounded-full flex items-center justify-center border border-indigo-500/10">
                    <i className="fas fa-compact-disc text-5xl text-indigo-500/20 animate-[spin_8s_linear_infinite]"></i>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-purple-900/20 rounded-lg border border-purple-500/20 flex items-center justify-center">
                    <i className="fas fa-microchip text-xl text-purple-500/30"></i>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-200">Live Composition Ready</h3>
                  <p className="max-w-md mx-auto mt-3 text-slate-400 leading-relaxed text-sm">
                    Configure your <span className="text-indigo-400 font-bold">Sonic DNA</span> in the studio sidebar to start the real-time architectural build. 
                    Every lyric and structural tag is optimized for Suno V4.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t border-slate-800 text-center text-slate-600 text-xs">
        <p>&copy; 2025 SunoLyrix AI Studio. Optimized for High-Fidelity Music Generation.</p>
      </footer>
    </div>
  );
};

export default App;
