import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Keyboard, FileText, Headphones, Award, Trophy, 
  AlertCircle, UserCircle2, BookText, Globe, FlaskConical, Calculator, 
  LayoutList, PenLine, ChevronLeft, ArrowRight
} from 'lucide-react';
import { REAL_WORDS, FAKE_WORDS } from './data/words';
import WordRecognition from './components/WordRecognition';
import ContextualSpelling from './components/ContextualSpelling';
import ReadAndComplete from './components/ReadAndComplete';
import Dictation from './components/Dictation';
import GedReading from './components/GedReading';

// Import our new JSON file
import gedData from './data/gedContent.json';

export default function App() {
  const [appState, setAppState] = useState('MENU'); 
  const [activeRound, setActiveRound] = useState(0);
  const [activeGedLesson, setActiveGedLesson] = useState(null); // Tracks which specific GED lesson is open
  const [currentPool, setCurrentPool] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('betProfile');
    return saved ? JSON.parse(saved) : { name: '', praId: '' };
  });

  const [tempProfile, setTempProfile] = useState({ name: '', praId: '' });

  // DET Scores
  const [roundScores, setRoundScores] = useState(() => {
    const saved = localStorage.getItem('betScoresV6');
    return saved ? JSON.parse(saved) : {};
  });

  // NEW: GED Scores
  const [gedScores, setGedScores] = useState(() => {
    const saved = localStorage.getItem('gedScoresV1');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('betScoresV6', JSON.stringify(roundScores));
  }, [roundScores]);

  useEffect(() => {
    localStorage.setItem('gedScoresV1', JSON.stringify(gedScores));
  }, [gedScores]);

  useEffect(() => {
    localStorage.setItem('betProfile', JSON.stringify(profile));
  }, [profile]);

  // --- DET Logic ---
  const loadPoolForRound = (rIndex) => {
    const realStart = (rIndex * 10) % REAL_WORDS.length;
    const fakeStart = (rIndex * 10) % FAKE_WORDS.length;
    let roundReal = REAL_WORDS.slice(realStart, realStart + 10);
    let roundFake = FAKE_WORDS.slice(fakeStart, fakeStart + 10);
    return [...roundReal, ...roundFake].sort(() => Math.random() - 0.5);
  };

  const startMode = (rIndex, mode) => {
    setActiveRound(rIndex); 
    setCurrentPool(loadPoolForRound(rIndex)); 
    setAppState(mode);
  };

  const pushToDatabase = (section, score, isFirstTry) => {
    if (!profile.praId || !profile.name) return;
    const normalizedScore = section === 'p1' ? Math.floor(score / 2) : score;
    const payload = {
      praId: profile.praId,
      name: profile.name,
      level: activeRound + 1,
      section: section,
      score: normalizedScore,
      isFirstTry: isFirstTry,
      timestamp: new Date().toISOString()
    };
    console.log("📡 [Groundwork] Pushing to Google Sheets:", payload);
  };

  const saveScore = (section, score) => {
    setRoundScores(prev => {
      const levelData = prev[activeRound] || {};
      const sectionData = levelData[section] || {};
      const isFirstTry = sectionData.first === undefined;
      const firstScore = isFirstTry ? score : sectionData.first;
      pushToDatabase(section, score, isFirstTry);

      return {
        ...prev,
        [activeRound]: {
          ...levelData,
          [section]: {
            first: firstScore,
            current: score > (sectionData.current || 0) ? score : (sectionData.current || score) 
          }
        }
      };
    });
    setAppState('MENU');
  };

  // --- NEW: GED Logic ---
  const startGedMode = (lessonObj, mode) => {
    setActiveGedLesson(lessonObj);
    setAppState(mode);
  };

  const saveGedScore = (lessonId, score) => {
    setGedScores(prev => {
      const lessonData = prev[lessonId] || {};
      const isFirstTry = lessonData.first === undefined;
      const firstScore = isFirstTry ? score : lessonData.first;
      
      // Note: You can expand pushToDatabase to handle GED scores later if desired.
      
      return {
        ...prev,
        [lessonId]: {
          first: firstScore,
          current: score > (lessonData.current || 0) ? score : (lessonData.current || score)
        }
      };
    });
    setAppState('MENU');
    setActiveGedLesson(null);
  };

  const confirmReset = () => {
    setRoundScores({});
    setGedScores({});
    localStorage.removeItem('betScoresV6');
    localStorage.removeItem('gedScoresV1');
    setShowResetModal(false);
  };

  const saveProfile = () => {
    setProfile(tempProfile);
    setShowProfileModal(false);
  };

  const normalizeP1 = (val) => val !== undefined ? Math.floor(val / 2) : 0;

  const totalXP = Object.values(roundScores).reduce((acc, curr) => {
    return acc + normalizeP1(curr.p1?.current) + (curr.p2?.current || 0) + (curr.p3?.current || 0) + (curr.p4?.current || 0);
  }, 0);
  const maxXP = 10 * 40;

  const getGrade = (levelData) => {
    if (!levelData) return null;
    const attemptedCount = Object.keys(levelData).length;
    if (attemptedCount < 4) return null; 

    const total = normalizeP1(levelData.p1?.current) + (levelData.p2?.current || 0) + (levelData.p3?.current || 0) + (levelData.p4?.current || 0);
    const percent = total / 40;
    if (percent >= 0.96) return { text: "A+", color: "text-green-700 bg-green-100 border-green-300" };
    if (percent >= 0.90) return { text: "A", color: "text-green-600 bg-green-50 border-green-200" };
    if (percent >= 0.80) return { text: "B", color: "text-blue-600 bg-blue-50 border-blue-200" };
    if (percent >= 0.70) return { text: "C", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
    return { text: "Needs Review", color: "text-red-600 bg-red-50 border-red-200" };
  };

  // Helper component for GED placeholder screens
  const GedPlaceholder = ({ title, icon: Icon, colorClass }) => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg ${colorClass}`}>
        <Icon className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-4xl font-black text-gray-800 mb-4">{title}</h1>
      <p className="text-gray-500 mb-8 font-medium">Activity component is currently under construction.</p>
      <button 
        onClick={() => setAppState('MENU')}
        className="flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all shadow-sm"
      >
        <ChevronLeft className="w-5 h-5 mr-2" />
        Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans selection:bg-blue-100 relative">
      {appState === 'MENU' && (
        <div className="min-h-screen flex flex-col items-center">
          
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => { setTempProfile(profile); setShowProfileModal(true); }}
              className="flex items-center bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white shadow-sm px-4 py-2 rounded-full transition-all text-sm font-bold tracking-wide"
            >
              <UserCircle2 className="w-5 h-5 mr-2 opacity-90" />
              {profile.name ? `${profile.name} (ID: ${profile.praId})` : 'Set Student ID'}
            </button>
          </div>

          <div className="w-full bg-gradient-to-br from-[#1CB0F6] to-[#1899D6] px-6 py-16 pt-24 text-center shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full inline-block mb-6 backdrop-blur-sm border border-white/20">
                <BookOpen className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-4 text-white tracking-tight drop-shadow-sm">Study Dashboard</h1>
              <div className="inline-flex items-center bg-white/20 rounded-2xl p-4 backdrop-blur-md border border-white/30 shadow-sm">
                <div className="bg-white/30 p-3 rounded-xl mr-4 shadow-sm"><Trophy className="w-8 h-8 text-yellow-300 drop-shadow-sm" /></div>
                <div className="text-left">
                  <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-0.5">DET Global Mastery</div>
                  <div className="text-white font-black text-2xl tracking-tight drop-shadow-sm">{totalXP} <span className="text-blue-100 text-base font-bold">/ {maxXP} XP</span></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ========================================= */}
          {/* NEW SECTION: GED PREPARATION (4 Columns) */}
          {/* ========================================= */}
          <div className="max-w-7xl w-full px-4 sm:px-6 -mt-8 relative z-20 mb-8">
            <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-10 border border-gray-100">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight mb-8">GED Preparation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* English Column (UPDATED with Level Lists) */}
                <div className="bg-blue-50/50 rounded-3xl p-5 border-2 border-blue-100">
                  <div className="flex items-center mb-5">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3 shadow-sm"><BookText className="w-5 h-5 text-white" /></div>
                    <h4 className="font-black text-lg text-gray-800">English (RLA)</h4>
                  </div>
                  
                  {/* Reading Lessons Iterator */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2 ml-1">Reading Comprehension</h5>
                    <div className="space-y-2">
                      {gedData.rlaReading.map((lesson) => {
                        const scoreData = gedScores[lesson.id];
                        return (
                          <button 
                            key={lesson.id} 
                            onClick={() => startGedMode(lesson, 'GED_RLA_READING')} 
                            className="w-full flex flex-col items-start px-4 py-3 bg-white rounded-xl border-b-4 border-2 border-gray-200 border-b-gray-300 hover:bg-gray-50 active:border-b-0 active:translate-y-[4px] transition-all"
                          >
                            <div className="flex items-center w-full justify-between mb-1">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                <span className="font-bold text-gray-700 text-sm truncate max-w-[140px]">{lesson.title}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-300" />
                            </div>
                            
                            {/* Score Display Logic */}
                            {scoreData ? (
                              <div className="flex items-center gap-3 w-full text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">
                                <div className="bg-gray-100 px-2 py-0.5 rounded">First: <span className="text-blue-600">{scoreData.first}/10</span></div>
                                <div className="bg-blue-100 px-2 py-0.5 rounded text-blue-800">Best: {scoreData.current}/10</div>
                              </div>
                            ) : (
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Not Started</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grammar Placeholders */}
                  <div>
                    <h5 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2 ml-1">Grammar Editing</h5>
                    <button onClick={() => setAppState('GED_RLA_GRAMMAR')} className="w-full group flex items-center px-4 py-3 bg-white rounded-xl border-b-4 border-2 border-gray-200 border-b-gray-300 hover:bg-gray-50 active:border-b-0 active:translate-y-[4px] transition-all">
                      <LayoutList className="w-4 h-4 mr-3 text-blue-500" />
                      <span className="font-bold text-gray-700 text-sm">Grammar P1 (Coming)</span>
                    </button>
                  </div>
                </div>

                {/* Social Studies Column */}
                <div className="bg-purple-50/50 rounded-3xl p-5 border-2 border-purple-100">
                  <div className="flex items-center mb-5">
                    <div className="bg-purple-500 p-2 rounded-lg mr-3 shadow-sm"><Globe className="w-5 h-5 text-white" /></div>
                    <h4 className="font-black text-lg text-gray-800">Social Studies</h4>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => setAppState('GED_SS_HISTORY')} className="w-full group flex items-center px-4 py-3 bg-white rounded-xl border-b-4 border-2 border-gray-200 border-b-gray-300 hover:bg-gray-50 active:border-b-0 active:translate-y-[4px] transition-all">
                      <BookOpen className="w-4 h-4 mr-3 text-purple-500" />
                      <span className="font-bold text-gray-700 text-sm">US History</span>
                    </button>
                    <button onClick={() => setAppState('GED_SS_ECON')} className="w-full group flex items-center px-4 py-3 bg-white rounded-xl border-b-4 border-2 border-gray-200 border-b-gray-300 hover:bg-gray-50 active:border-b-0 active:translate-y-[4px] transition-all">
                      <LayoutList className="w-4 h-4 mr-3 text-purple-500" />
                      <span className="font-bold text-gray-700 text-sm">Economics</span>
                    </button>
                  </div>
                </div>

                {/* Science Column */}
                <div className="bg-green-50/50 rounded-3xl p-5 border-2 border-green-100 opacity-60 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                  <div className="flex items-center mb-5">
                    <div className="bg-green-500 p-2 rounded-lg mr-3 shadow-sm"><FlaskConical className="w-5 h-5 text-white" /></div>
                    <h4 className="font-black text-lg text-gray-800">Science</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="w-full text-center px-4 py-3 bg-white rounded-xl border-2 border-gray-200 border-dashed">
                      <span className="font-bold text-gray-400 text-sm">Coming Soon</span>
                    </div>
                  </div>
                </div>

                {/* Math Column */}
                <div className="bg-orange-50/50 rounded-3xl p-5 border-2 border-orange-100 opacity-60 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                  <div className="flex items-center mb-5">
                    <div className="bg-orange-500 p-2 rounded-lg mr-3 shadow-sm"><Calculator className="w-5 h-5 text-white" /></div>
                    <h4 className="font-black text-lg text-gray-800">Math</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="w-full text-center px-4 py-3 bg-white rounded-xl border-2 border-gray-200 border-dashed">
                      <span className="font-bold text-gray-400 text-sm">Coming Soon</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* ORIGINAL SECTION: DET VOCAB PATH          */}
          {/* ========================================= */}
          <div className="max-w-6xl w-full px-4 sm:px-6 relative z-20 pb-20">
            <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-10 border border-gray-100">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">DET Learning Path</h3>
              </div>
              
              <div className="space-y-8">
                {Array.from({ length: 10 }).map((_, i) => {
                  const s = roundScores[i] || {};
                  const levelTotal = normalizeP1(s.p1?.current) + (s.p2?.current || 0) + (s.p3?.current || 0) + (s.p4?.current || 0);
                  const hasStarted = Object.keys(s).length > 0;
                  const grade = getGrade(s);

                  return (
                    <div key={i} className="rounded-3xl p-6 border-2 border-gray-100 bg-white shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-black text-xl mr-4 text-gray-500">{i + 1}</div>
                          <div>
                            <h4 className="font-black text-xl text-gray-800 tracking-tight">Level {i + 1}</h4>
                            <p className="text-sm font-bold text-gray-400">10 Core Words</p>
                          </div>
                        </div>
                        
                        {hasStarted ? (
                          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                            <div className="px-5 py-2.5 rounded-2xl font-black border-2 border-yellow-200 bg-yellow-50 text-[#FFC800] flex items-center text-sm uppercase tracking-widest shadow-sm">
                              <Trophy className="w-5 h-5 mr-2.5 fill-current" />
                              {levelTotal} / 40 XP
                            </div>
                            {grade && (
                              <div className={`px-4 py-2.5 rounded-2xl font-black border-2 text-sm uppercase tracking-wider ${grade.color}`}>
                                {grade.text}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 sm:mt-0 px-4 py-2.5 rounded-2xl font-bold border-2 border-gray-100 bg-gray-50 text-gray-400 text-sm uppercase tracking-widest">
                            Not Started
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Recognition */}
                        <button onClick={() => startMode(i, 'WORD_REC')} className="group flex flex-col justify-center px-4 py-4 rounded-2xl border-b-4 border-2 transition-all active:border-b-0 active:translate-y-[4px] bg-[#58A700] border-[#468500] hover:bg-[#468500]">
                          <div className="flex items-center w-full mb-1.5">
                            <Search className="w-5 h-5 mr-2 text-white opacity-90"/> 
                            <span className="font-bold text-white">Recognition</span>
                          </div>
                          {s.p1 ? (
                            <div className="flex items-center gap-3 w-full text-[11px] font-bold uppercase tracking-wider text-green-100/90">
                              <div>First: <span className="text-white">{normalizeP1(s.p1.first)}/10</span></div>
                              <div>Best: <span className="text-white">{normalizeP1(s.p1.current)}/10</span></div>
                            </div>
                          ) : <div className="text-left text-[11px] font-bold text-green-100/80 uppercase">Not Started</div>}
                        </button>
                        
                        {/* Spelling */}
                        <button onClick={() => startMode(i, 'SPELLING')} className="group flex flex-col justify-center px-4 py-4 rounded-2xl border-b-4 border-2 transition-all active:border-b-0 active:translate-y-[4px] bg-[#1CB0F6] border-[#1899D6] hover:bg-[#1899D6]">
                          <div className="flex items-center w-full mb-1.5">
                            <Keyboard className="w-5 h-5 mr-2 text-white opacity-90"/> 
                            <span className="font-bold text-white">Spelling</span>
                          </div>
                          {s.p2 ? (
                            <div className="flex items-center gap-3 w-full text-[11px] font-bold uppercase tracking-wider text-blue-100/90">
                              <div>First: <span className="text-white">{s.p2.first}/10</span></div>
                              <div>Best: <span className="text-white">{s.p2.current}/10</span></div>
                            </div>
                          ) : <div className="text-left text-[11px] font-bold text-blue-100/80 uppercase">Not Started</div>}
                        </button>

                        {/* Reading */}
                        <button onClick={() => startMode(i, 'READ_COMP')} className="group flex flex-col justify-center px-4 py-4 rounded-2xl border-b-4 border-2 transition-all active:border-b-0 active:translate-y-[4px] bg-[#FF9600] border-[#D17A00] hover:bg-[#E58700]">
                          <div className="flex items-center w-full mb-1.5">
                            <FileText className="w-5 h-5 mr-2 text-white opacity-90"/> 
                            <span className="font-bold text-white">Reading</span>
                          </div>
                          {s.p4 ? (
                            <div className="flex items-center gap-3 w-full text-[11px] font-bold uppercase tracking-wider text-orange-100/90">
                              <div>First: <span className="text-white">{s.p4.first}/10</span></div>
                              <div>Best: <span className="text-white">{s.p4.current}/10</span></div>
                            </div>
                          ) : <div className="text-left text-[11px] font-bold text-orange-100/80 uppercase">Not Started</div>}
                        </button>

                        {/* Listening */}
                        <button onClick={() => startMode(i, 'DICTATION')} className="group flex flex-col justify-center px-4 py-4 rounded-2xl border-b-4 border-2 transition-all active:border-b-0 active:translate-y-[4px] bg-[#CE82FF] border-[#B560EF] hover:bg-[#C26BFF]">
                          <div className="flex items-center w-full mb-1.5">
                            <Headphones className="w-5 h-5 mr-2 text-white opacity-90"/> 
                            <span className="font-bold text-white">Listening</span>
                          </div>
                          {s.p3 ? (
                            <div className="flex items-center gap-3 w-full text-[11px] font-bold uppercase tracking-wider text-purple-100/90">
                              <div>First: <span className="text-white">{s.p3.first}/10</span></div>
                              <div>Best: <span className="text-white">{s.p3.current}/10</span></div>
                            </div>
                          ) : <div className="text-left text-[11px] font-bold text-purple-100/80 uppercase">Not Started</div>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(roundScores).length > 0 && (
                <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-100 text-center">
                  <button onClick={() => setShowResetModal(true)} className="text-gray-400 hover:text-[#EA4335] font-bold text-sm uppercase tracking-widest transition-colors">Reset Progress</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 text-[#1CB0F6] rounded-full flex items-center justify-center mx-auto mb-6"><UserCircle2 className="w-8 h-8" strokeWidth={2.5} /></div>
            <h2 className="text-2xl font-black text-gray-800 mb-2 text-center">Student Profile</h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">First Name</label>
                <input type="text" value={tempProfile.name} onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-colors" placeholder="e.g. John"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">PRA ID (3 Digits)</label>
                <input type="text" maxLength={3} value={tempProfile.praId} onChange={(e) => setTempProfile({...tempProfile, praId: e.target.value.replace(/[^0-9]/g, '')})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-colors text-center tracking-widest text-lg" placeholder="123"/>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button onClick={() => setShowProfileModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl uppercase tracking-widest text-sm">Cancel</button>
              <button disabled={!tempProfile.name || tempProfile.praId.length !== 3} onClick={saveProfile} className="flex-1 bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-bold py-3.5 rounded-xl shadow-sm uppercase tracking-widest text-sm border-b-4 border-[#1899D6] active:border-b-0 active:translate-y-[4px] disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-[#EA4335] rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-8 h-8" strokeWidth={2.5} /></div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">Reset Progress?</h2>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl uppercase tracking-widest text-sm">Cancel</button>
              <button onClick={confirmReset} className="flex-1 bg-[#EA4335] hover:bg-[#C9362A] text-white font-bold py-3.5 rounded-xl shadow-sm uppercase tracking-widest text-sm border-b-4 border-[#C9362A] active:border-b-0 active:translate-y-[4px]">Yes, Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* DET Modules (Unchanged) */}
      {appState === 'WORD_REC' && <WordRecognition pool={currentPool} onComplete={(s) => saveScore('p1', s)} onQuit={() => setAppState('MENU')} />}
      {appState === 'SPELLING' && <ContextualSpelling pool={currentPool} onComplete={(s) => saveScore('p2', s)} onQuit={() => setAppState('MENU')} />}
      {appState === 'DICTATION' && <Dictation pool={currentPool} onComplete={(s) => saveScore('p3', s)} onQuit={() => setAppState('MENU')} />}
      {appState === 'READ_COMP' && <ReadAndComplete levelIndex={activeRound} pool={currentPool} onComplete={(s) => saveScore('p4', s)} onQuit={() => setAppState('MENU')} />}

      {/* GED Modules */}
      {appState === 'GED_RLA_READING' && (
        <GedReading 
          lessonData={activeGedLesson} 
          onComplete={(score) => saveGedScore(activeGedLesson.id, score)} 
          onQuit={() => { setAppState('MENU'); setActiveGedLesson(null); }} 
        />
      )}
      
      {/* Placeholders for future GED components */}
      {appState === 'GED_RLA_GRAMMAR' && <GedPlaceholder title="RLA Grammar Editing" icon={LayoutList} colorClass="bg-blue-500" />}
      {appState === 'GED_SS_HISTORY' && <GedPlaceholder title="US History Practice" icon={BookOpen} colorClass="bg-purple-500" />}
      {appState === 'GED_SS_ECON' && <GedPlaceholder title="Economics Practice" icon={LayoutList} colorClass="bg-purple-500" />}
    </div>
  );
}