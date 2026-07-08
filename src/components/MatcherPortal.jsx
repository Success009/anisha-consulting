import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  MapPin, 
  Sparkles, 
  Filter, 
  X, 
  Plus, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { evaluateAndRankCourses } from '../utils/matchingAlgorithm';

// Helper functions for safe rendering of legacy data structures
const displayFee = (fee) => {
  if (fee === undefined || fee === null) return 'N/A';
  if (typeof fee === 'object') {
    if (fee.amount !== undefined && fee.currency !== undefined) {
      return `${fee.amount} ${fee.currency}`;
    }
    return JSON.stringify(fee);
  }
  return String(fee);
};

const displayIntake = (intake) => {
  if (intake === undefined || intake === null) return 'N/A';
  if (Array.isArray(intake)) {
    return intake.join(', ');
  }
  return String(intake);
};

export default function MatcherPortal({ courses }) {
  const [studentProfile, setStudentProfile] = useState({
    gpa: '',
    completed_education_level: '',
    desired_apply_level: '',
    test_results: [ ],
    interested_countries: [''], // Init with one empty choice
    gap_years: '0'
  });

  const [studentTestInput, setStudentTestInput] = useState({ test_name: 'IELTS', score: '' });
  const [searchResults, setSearchResults] = useState([ ]);
  const [showResults, setShowResults] = useState(false);
  const [mobileTab, setMobileTab] = useState('form'); // 'form' or 'results'

  // Generate dynamic suggestions of test names based on what already exists in the database
  const defaultTestNames = ['IELTS', 'PTE', 'TOEFL', 'DUOLINGO', 'MOI'];
  const existingTestNames = Array.from(
    new Set([
      ...defaultTestNames,
      ...courses.flatMap(c => c.proficiency_tests || [ ]).map(t => t && t.test_name).filter(Boolean)
    ])
  );

  // Add proficiency test taken by student
  const addStudentTestResult = () => {
    if (!studentTestInput.test_name) return;
    if (!studentTestInput.score && studentTestInput.test_name.trim().toUpperCase() !== 'MOI') return;
    setStudentProfile(prev => ({
      ...prev,
      test_results: [...prev.test_results, { ...studentTestInput }]
    }));
    setStudentTestInput({ test_name: 'IELTS', score: '' });
  };

  // Remove test score
  const removeStudentTestResult = (idx) => {
    setStudentProfile(prev => ({
      ...prev,
      test_results: prev.test_results.filter((_, i) => i !== idx)
    }));
  };

  // Add a ranked country preference field
  const addCountryChoice = () => {
    if (studentProfile.interested_countries.length >= 5) return;
    setStudentProfile(prev => ({
      ...prev,
      interested_countries: [...prev.interested_countries, '']
    }));
  };

  // Update a country preference
  const updateCountryChoice = (idx, val) => {
    const updated = [...studentProfile.interested_countries];
    updated[idx] = val;
    setStudentProfile(prev => ({
      ...prev,
      interested_countries: updated
    }));
  };

  // Remove a country preference
  const removeCountryChoice = (idx) => {
    setStudentProfile(prev => ({
      ...prev,
      interested_countries: prev.interested_countries.filter((_, i) => i !== idx)
    }));
  };

  // Execute matching algorithm
  const handleEvaluate = () => {
    const { gpa, completed_education_level, desired_apply_level } = studentProfile;
    if (!gpa || !completed_education_level || !desired_apply_level) {
      alert("Please fill in the student's GPA, Completed Education Level, and Desired Apply Level.");
      return;
    }

    const results = evaluateAndRankCourses(courses, studentProfile);
    setSearchResults(results);
    setShowResults(true);
    setMobileTab('results'); // Auto-switch to results tab on mobile screen
  };

  return (
    <div className="flex flex-col">
      {/* Mobile-Only Tab Switcher */}
      <div className="flex lg:hidden bg-slate-200/60 p-1 rounded-xl mb-4 border border-slate-300/40">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold rounded-lg transition-all duration-150 ${
            mobileTab === 'form' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-600'
          }`}
        >
          Student Details
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('results')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold rounded-lg transition-all duration-150 relative ${
            mobileTab === 'results' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-600'
          }`}
        >
          Recommendations
          {showResults && searchResults.length > 0 && (
            <span className="absolute top-1.5 right-4 h-2 w-2 bg-white rounded-full animate-pulse" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student Academic profile Form */}
        <div className={`lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 ${mobileTab === 'form' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-800">Student Consultation Details</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column: Education Path */}
              <div className="space-y-4">
                <AutocompleteInput
                  label="Completed Education"
                  required
                  placeholder="e.g. Plus 2 / Bachelor"
                  value={studentProfile.completed_education_level}
                  onChange={(val) => setStudentProfile({ ...studentProfile, completed_education_level: val })}
                  courses={courses}
                  field="minimum_education_level"
                />
                <AutocompleteInput
                  label="Desired Study Level"
                  required
                  placeholder="e.g. Master Degree"
                  value={studentProfile.desired_apply_level}
                  onChange={(val) => setStudentProfile({ ...studentProfile, desired_apply_level: val })}
                  courses={courses}
                  field="course_level"
                />
              </div>

              {/* Right Column: Grades & Gap Years */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Student's GPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    required
                    placeholder="e.g. 3.25"
                    value={studentProfile.gpa}
                    onChange={(e) => setStudentProfile({ ...studentProfile, gpa: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Gap Year (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 0"
                    value={studentProfile.gap_years}
                    onChange={(e) => setStudentProfile({ ...studentProfile, gap_years: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Language Skills sub form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Student's English Proficiency
              </span>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  list="test-names-list-student"
                  placeholder="e.g. Cobal, IELTS"
                  value={studentTestInput.test_name}
                  onChange={(e) => setStudentTestInput({ ...studentTestInput, test_name: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none w-1/2"
                />
                <datalist id="test-names-list-student">
                  {existingTestNames.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>

                {studentTestInput.test_name.trim().toUpperCase() !== 'MOI' && (
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Score"
                    value={studentTestInput.score}
                    onChange={(e) => setStudentTestInput({ ...studentTestInput, score: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex-1 focus:outline-none focus:border-indigo-500"
                  />
                )}

                <button
                  type="button"
                  onClick={addStudentTestResult}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 flex items-center gap-1 transition shrink-0"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              {studentProfile.test_results.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No exams added (assumes student has not sat any test yet).</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {studentProfile.test_results.map((test, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 shadow-sm"
                    >
                      {test.test_name} {test.test_name.trim().toUpperCase() !== 'MOI' ? `: ${test.score}` : ''}
                      <button
                        type="button"
                        onClick={() => removeStudentTestResult(idx)}
                        className="text-slate-400 hover:text-red-500 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Country Preferences list */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Country Preferences (Ranked)
                </label>
                <button
                  type="button"
                  onClick={addCountryChoice}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="h-3 w-3" /> Add Choice
                </button>
              </div>

              <div className="space-y-2">
                {studentProfile.interested_countries.map((country, idx) => (
                  <div key={idx} className="flex items-center gap-2 relative">
                    <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                    <AutocompleteInput
                      placeholder="e.g. Denmark, Australia"
                      value={country}
                      onChange={(val) => updateCountryChoice(idx, val)}
                      courses={courses}
                      field="country"
                      className="flex-1"
                    />
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeCountryChoice(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleEvaluate}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" /> Evaluate and Recommend Courses
            </button>
          </div>
        </div>

        {/* Right Column: Scored Matching Results */}
        <div className={`lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[calc(100vh-220px)] min-h-[500px] ${mobileTab === 'results' ? 'flex' : 'hidden lg:flex'}`}>
          {!showResults ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
              <Filter className="h-12 w-12 text-slate-300 mb-3 animate-pulse" />
              <p className="font-semibold text-slate-500">Awaiting Search Evaluation</p>
              <p className="text-xs text-slate-400 text-center max-w-sm mt-1">
                Enter student qualification grades and desired study paths to perform calculations and rank the university options.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Matching Recommendations</h3>
                  <p className="text-xs text-slate-400">Total stored options evaluated: {searchResults.length}</p>
                </div>
                <button 
                  onClick={() => setShowResults(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 border border-slate-100 rounded-lg px-2.5 py-1 transition"
                >
                  Reset Evaluation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {searchResults.filter(r => !r.isEliminated).length === 0 && (
                  <div className="p-5 border border-amber-100 rounded-xl bg-amber-50 text-amber-800 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">No qualified recommendations found</p>
                      <p className="text-xs mt-1 text-amber-700">
                        All available records were filtered out. The student did not satisfy either the minimum GPA, target application level, or education requirements.
                      </p>
                    </div>
                  </div>
                )}

                {searchResults.map((result) => (
                  <div 
                    key={result.id}
                    className={`p-4 rounded-xl border transition-all duration-200 relative ${
                      result.isEliminated 
                        ? 'border-red-100 bg-red-50/20 opacity-60' 
                         : 'border-slate-100 hover:border-slate-200 bg-white shadow-sm'
                    }`}
                  >
                    {/* Score Indicator Badge */}
                    <div className="absolute right-4 top-4">
                      {result.isEliminated ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                          <X className="h-3 w-3" /> Excluded
                        </span>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Score</span>
                          <span className="text-xl font-black text-indigo-600">{result.score} pts</span>
                        </div>
                      )}
                    </div>

                    {/* Header metadata */}
                    <div className="pr-20">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {result.course_level}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-300" /> {result.country}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mt-1">{result.course_name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{result.university_name}</p>
                    </div>

                    {/* Failure descriptions if eliminated */}
                    {result.isEliminated && (
                      <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-800 border border-red-100/50 text-xs">
                        <span className="font-bold block uppercase tracking-wider text-[9px] text-red-500 mb-1">
                          Unsatisfied Requirements:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {result.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Criteria and scores breakdown if qualified */}
                    {!result.isEliminated && (
                      <>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100/80 text-xs">
                          <div>
                            
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Req. GPA</span>
                            <span className="font-bold text-slate-700">
                              {result.minimum_gpa === '' || result.minimum_gpa === undefined || result.minimum_gpa === null ? 0 : result.minimum_gpa}
                            </span>
                            {result.gpa_by_gap && result.gpa_by_gap.length > 0 && (
                              <div className="text-[9px] text-indigo-600 font-semibold mt-0.5 space-y-0.5">
                                {result.gpa_by_gap.map((rule, ri) => (
                                  <div key={ri}>
                                    {rule.gap_years === '' || rule.gap_years === undefined || rule.gap_years === null ? 'No Limit Gap' : `${rule.gap_years}+ Yr Gap`}: ≥{rule.minimum_gpa === '' || rule.minimum_gpa === undefined || rule.minimum_gpa === null ? 0 : rule.minimum_gpa}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Req. Edu</span>

                            <span className="font-semibold text-slate-700 truncate block" title={result.minimum_education_level}>
                              {result.minimum_education_level}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Fee</span>
                            <span className="font-bold text-emerald-600">{displayFee(result.course_fee)}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Intakes</span>
                            <span className="font-semibold text-slate-700">{displayIntake(result.intake_periods)}</span>
                          </div>
                        </div>

                        {/* Points composition breakdown panel */}
                        <div className="mt-4 pt-3 border-t border-slate-100/50 bg-indigo-50/20 p-3 rounded-lg">
                          <span className="block text-[9px] uppercase font-bold tracking-wider text-indigo-500 mb-1.5">
                            Score Allocation Detail
                          </span>
                          <div className="space-y-1">
                            {result.scoreBreakdown.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-slate-600">
                                <span className="flex items-center gap-1.5 truncate pr-2">
                                  <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${item.points >= 0 ? 'text-indigo-500' : 'text-amber-500'}`} />
                                  <span className="truncate">{item.label}</span>
                                </span>
                                <span className={`font-bold shrink-0 ${item.points >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                                  {item.points >= 0 ? `+${item.points}` : item.points}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
