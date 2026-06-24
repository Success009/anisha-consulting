import React, { useState, useEffect } from 'react';
import { Database, Search, GraduationCap, RefreshCw } from 'lucide-react';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';
import AdminPortal from './components/AdminPortal';
import MatcherPortal from './components/MatcherPortal';

function App() {
  const [activeTab, setActiveTab] = useState('match'); // 'match' or 'admin'
  const [courses, setCourses] = useState([ ]);
  const [loading, setLoading] = useState(true);

  // Synchronize courses directory from live Realtime Database
  useEffect(() => {
    setLoading(true);
    const coursesRef = ref(db, 'anisha/courses');
    const unsubscribe = onValue(coursesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedCourses = Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
          proficiency_tests: val.proficiency_tests || [ ],
        }));
        setCourses(loadedCourses);
      } else {
        setCourses([ ]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error reading Firebase database: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ ]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-800 antialiased">
      {/* Top Navigation Bar Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/10 p-1.5 rounded-xl border border-indigo-400/20 backdrop-blur-sm flex items-center justify-center">
              <img src="https://success0.com.np/logo.png" className="h-10 w-10 object-contain rounded-lg" alt="Logo" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Course</h1>
            </div>
          </div>
          
          {/* Module Tab Toggle Controls */}
          <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('match')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'match'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <Search className="h-4 w-4" />
              Student Matcher
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <Database className="h-4 w-4" />
              Course Entry Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        ) : activeTab === 'admin' ? (
          <AdminPortal courses={courses} />
        ) : (
          <MatcherPortal courses={courses} />
        )}
      </main>

      {/* footer signature bar */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 Anisha Consulting
      </footer>

    </div>
  );
}

export default App;
