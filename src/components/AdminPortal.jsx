import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Database, 
  PlusCircle, 
  HelpCircle,
  Edit,
  X
} from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { ref, push, set, remove } from 'firebase/database';
import { db } from '../firebase';

// Helper function to group flat courses by all information fields except ID and course_name
const groupCourses = (flatCourses) => {
  const groups = [ ];

  flatCourses.forEach(course => {
    const matchingGroup = groups.find(g => {
      const gFirst = g.courses[0];

      const sameUni = (gFirst.university_name || '').trim().toLowerCase() === (course.university_name || '').trim().toLowerCase();
      const sameCountry = (gFirst.country || '').trim().toLowerCase() === (course.country || '').trim().toLowerCase();
      const sameLevel = (gFirst.course_level || '').trim().toLowerCase() === (course.course_level || '').trim().toLowerCase();
      const sameMinEdu = (gFirst.minimum_education_level || '').trim().toLowerCase() === (course.minimum_education_level || '').trim().toLowerCase();
      const sameGpa = parseFloat(gFirst.minimum_gpa || 0) === parseFloat(course.minimum_gpa || 0);
      const sameDuration = (gFirst.duration || '').trim().toLowerCase() === (course.duration || '').trim().toLowerCase();
      const sameFee = (gFirst.course_fee || '').trim().toLowerCase() === (course.course_fee || '').trim().toLowerCase();
      const sameIntake = (gFirst.intake_periods || '').trim().toLowerCase() === (course.intake_periods || '').trim().toLowerCase();

      const tests1 = gFirst.proficiency_tests || [ ];
      const tests2 = course.proficiency_tests || [ ];
      let sameTests = false;
      if (tests1.length === tests2.length) {
        const str1 = tests1.map(t => `${(t.test_name || '').trim().toUpperCase()}:${(t.minimum_score || '').trim().toUpperCase()}`).sort();
        const str2 = tests2.map(t => `${(t.test_name || '').trim().toUpperCase()}:${(t.minimum_score || '').trim().toUpperCase()}`).sort();
        sameTests = str1.every((val, i) => val === str2[i]);
      }

      return sameUni && sameCountry && sameLevel && sameMinEdu && sameGpa && sameDuration && sameFee && sameIntake && sameTests;
    });

    if (matchingGroup) {
      matchingGroup.courses.push(course);
    } else {
      groups.push({
        id: course.id,
        university_name: course.university_name,
        country: course.country,
        course_level: course.course_level,
        minimum_education_level: course.minimum_education_level,
        minimum_gpa: course.minimum_gpa,
        duration: course.duration,
        course_fee: course.course_fee,
        intake_periods: course.intake_periods,
        proficiency_tests: course.proficiency_tests,
        courses: [course]
      });
    }
  });

  return groups;
};

export default function AdminPortal({ courses }) {
  const [courseForm, setCourseForm] = useState({
    university_name: '',
    country: '',
    course_name: '',
    course_names: [ ],
    course_level: '',
    minimum_education_level: '',
    minimum_gpa: '',
    duration: '',
    course_fee: '',
    intake_periods: '',
    proficiency_tests: [ ]
  });

  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingGroupCourseIds, setEditingGroupCourseIds] = useState([ ]);
  const [mobileTab, setMobileTab] = useState('form'); // 'form' or 'database'
  const [testInput, setTestInput] = useState({ test_name: 'IELTS', minimum_score: '' });

    // Generate dynamic test name suggestions based on database + defaults
  const defaultTestNames = ['IELTS', 'PTE', 'TOEFL', 'DUOLINGO', 'MOI'];
  const existingTestNames = Array.from(
    new Set([
      ...defaultTestNames,
      ...courses.flatMap(c => c.proficiency_tests || [ ]).map(t => t && t.test_name).filter(Boolean)
    ])
  );

  // Group the flat courses for display
  const groupedCourses = groupCourses(courses);

  // Add Course Name to packet list
  const addCourseName = () => {
    if (!courseForm.course_name) return;
    const trimmed = courseForm.course_name.trim();
    if (!trimmed) return;

    // Check if it already exists in the packet list to avoid duplicates
    if ((courseForm.course_names || [ ]).includes(trimmed)) {
      alert("This course name is already in your packet list.");
      return;
    }

    setCourseForm(prev => ({
      ...prev,
      course_names: [...(prev.course_names || [ ]), trimmed],
      course_name: '' // Clear input so they can type another
    }));
  };

  // Remove Course Name from packet list
  const removeCourseName = (idx) => {
    setCourseForm(prev => ({
      ...prev,
      course_names: (prev.course_names || [ ]).filter((_, i) => i !== idx)
    }));
  };

  // Add Proficiency Test requirement to local form state
  const addTestRequirement = () => {
    if (!testInput.test_name) return;
    if (!testInput.minimum_score && testInput.test_name.trim().toUpperCase() !== 'MOI') return;
    setCourseForm(prev => ({
      ...prev,
      proficiency_tests: [...prev.proficiency_tests, { ...testInput }]
    }));
    setTestInput({ test_name: 'IELTS', minimum_score: '' });
  };

  // Remove test requirement
  const removeTestRequirement = (idx) => {
    setCourseForm(prev => ({
      ...prev,
      proficiency_tests: prev.proficiency_tests.filter((_, i) => i !== idx)
    }));
  };

    // Trigger editing state for a course group
  const handleEditCourse = (group) => {
    setEditingCourseId(group.id);
    setEditingGroupCourseIds(group.courses.map(c => c.id));
    setCourseForm({
      university_name: group.university_name || '',
      country: group.country || '',
      course_name: '',
      course_names: group.courses.map(c => c.course_name),
      course_level: group.course_level || '',
      minimum_education_level: group.minimum_education_level || '',
      minimum_gpa: group.minimum_gpa !== undefined ? String(group.minimum_gpa) : '',
      duration: group.duration || '',
      course_fee: group.course_fee || '',
      intake_periods: group.intake_periods || '',
      proficiency_tests: group.proficiency_tests || [ ]
    });
    setMobileTab('form'); // Auto-switch to form on mobile so user can see it
  };

  // Cancel edit state
  const handleCancelEdit = () => {
    setEditingCourseId(null);
    setEditingGroupCourseIds([ ]);
    setCourseForm({
      university_name: '',
      country: '',
      course_name: '',
      course_names: [ ],
      course_level: '',
      minimum_education_level: '',
      minimum_gpa: '',
      duration: '',
      course_fee: '',
      intake_periods: '',
      proficiency_tests: [ ]
    });
  };

  // Save or Update the complete course in Realtime Database
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    const { 
      university_name, 
      country, 
      course_name, 
      course_names,
      course_level, 
      minimum_education_level, 
      minimum_gpa, 
      duration, 
      course_fee, 
      intake_periods, 
      proficiency_tests 
    } = courseForm;

    // Collect all course names to save
    let namesToSave = [...(course_names || [ ])];
    if (course_name && course_name.trim()) {
      namesToSave.push(course_name.trim());
    }
    // Remove duplicates & empty entries
    namesToSave = Array.from(new Set(namesToSave.map(n => n.trim()).filter(Boolean)));

    if (!university_name || !country || namesToSave.length === 0 || !course_level || !minimum_education_level) {
      alert("Please complete all essential fields including Course Name, Course Level and Minimum Education Level.");
      return;
    }

    try {
      if (editingCourseId) {
        const payloadBase = {
          university_name: university_name.trim(),
          country: country.trim(),
          course_level: course_level.trim(),
          minimum_education_level: minimum_education_level.trim(),
          minimum_gpa: parseFloat(minimum_gpa) || 0,
          duration: duration.trim(),
          course_fee: course_fee.trim(),
          intake_periods: intake_periods.trim(),
          proficiency_tests: proficiency_tests || [ ]
        };

        const originalIds = editingGroupCourseIds.length > 0 ? editingGroupCourseIds : [editingCourseId];
        const N = originalIds.length;
        const M = namesToSave.length;

        // Overwrite existing ones
        const limit = Math.min(N, M);
        for (let i = 0; i < limit; i++) {
          const id = originalIds[i];
          const payload = {
            ...payloadBase,
            course_name: namesToSave[i]
          };
          await set(ref(db, `anisha/courses/${id}`), payload);
        }

        // Add new ones if M > N
        if (M > N) {
          const coursesRef = ref(db, 'anisha/courses');
          for (let i = N; i < M; i++) {
            const payload = {
              ...payloadBase,
              course_name: namesToSave[i]
            };
            const newCourseRef = push(coursesRef);
            await set(newCourseRef, payload);
          }
        }

        // Remove extra ones if N > M
        if (N > M) {
          for (let i = M; i < N; i++) {
            const id = originalIds[i];
            await remove(ref(db, `anisha/courses/${id}`));
          }
        }

        setEditingCourseId(null);
        setEditingGroupCourseIds([ ]);
        alert("Course(s) successfully updated!");
      } else {
        const coursesRef = ref(db, 'anisha/courses');
        for (const name of namesToSave) {
          const payload = {
            university_name: university_name.trim(),
            country: country.trim(),
            course_name: name,
            course_level: course_level.trim(),
            minimum_education_level: minimum_education_level.trim(),
            minimum_gpa: parseFloat(minimum_gpa) || 0,
            duration: duration.trim(),
            course_fee: course_fee.trim(),
            intake_periods: intake_periods.trim(),
            proficiency_tests: proficiency_tests || [ ]
          };
          const newCourseRef = push(coursesRef);
          await set(newCourseRef, payload);
        }
        alert(`Successfully saved ${namesToSave.length} course(s)!`);
      }

      // Reset form on success
      setCourseForm({
        university_name: '',
        country: '',
        course_name: '',
        course_names: [ ],
        course_level: '',
        minimum_education_level: '',
        minimum_gpa: '',
        duration: '',
        course_fee: '',
        intake_periods: '',
        proficiency_tests: [ ]
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save course: " + err.message);
    }
  };

  const handleDeleteGroup = async (group) => {
    const count = group.courses.length;
    const msg = count === 1 
      ? "Are you sure you want to permanently delete this course requirement?" 
      : `Are you sure you want to permanently delete all ${count} course requirements in this group?`;

    if (window.confirm(msg)) {
      try {
        for (const c of group.courses) {
          await remove(ref(db, `anisha/courses/${c.id}`));
        }
        if (group.courses.some(c => c.id === editingCourseId)) {
          handleCancelEdit();
        }
      } catch (err) {
        alert("Failed to delete course group: " + err.message);
      }
    }
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
          {editingCourseId ? 'Edit Course' : 'Add Course'}
        </button>
        
        <button
          type="button"
          onClick={() => setMobileTab('database')}
          className={`flex-1 py-2.5 text-center text-xs font-semibold rounded-lg transition-all duration-150 ${
            mobileTab === 'database' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-600'
          }`}
        >
          Courses List ({courses.length})
        </button>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Course Creation Form Panel */}
        <div className={`lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm ${mobileTab === 'form' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            {editingCourseId ? <Edit className="h-5 w-5 text-indigo-600" /> : <Plus className="h-5 w-5 text-indigo-600" />}
            <h2 className="text-lg font-bold text-slate-800">
              {editingCourseId ? 'Edit Course Requirement' : 'Add New Course Requirement'}
            </h2>
          </div>

          <form onSubmit={handleSaveCourse} className="space-y-4">
            <AutocompleteInput
              label="University Name"
              required
              placeholder="e.g. University of Copenhagen"
              value={courseForm.university_name}
              onChange={(val) => setCourseForm({ ...courseForm, university_name: val })}
              courses={courses}
              field="university_name"
            />

            
            <AutocompleteInput
              label="Country"
              required
              placeholder="e.g. Denmark"
              value={courseForm.country}
              onChange={(val) => setCourseForm({ ...courseForm, country: val })}
              courses={courses}
              field="country"
            />

            {/* Course Names Packet Sub-form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Course Name(s) in Packet
                </span>
                {courseForm.course_names && courseForm.course_names.length > 0 && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {courseForm.course_names.length} Course(s)
                  </span>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <AutocompleteInput
                    placeholder="e.g. Computer Science"
                    value={courseForm.course_name}
                    onChange={(val) => setCourseForm({ ...courseForm, course_name: val })}
                    courses={courses}
                    field="course_name"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCourseName}
                  className="px-3 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 flex items-center gap-1 transition shrink-0"
                >
                  <PlusCircle className="h-4 w-4" /> Add to Packet
                </button>
              </div>

              {(!courseForm.course_names || courseForm.course_names.length === 0) ? (
                <p className="text-[11px] text-slate-400 italic">No packet course names added yet. If you only have one course, just type it above; it will be saved automatically.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {courseForm.course_names.map((name, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 shadow-sm"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeCourseName(idx)}
                        className="text-slate-400 hover:text-red-500 font-bold ml-1 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <AutocompleteInput
                label="Course Level"

                required
                placeholder="e.g. Master Degree"
                value={courseForm.course_level}
                onChange={(val) => setCourseForm({ ...courseForm, course_level: val })}
                courses={courses}
                field="course_level"
              />
              <AutocompleteInput
                label="Minimum Edu Level"
                required
                placeholder="e.g. Bachelor Degree"
                value={courseForm.minimum_education_level}
                onChange={(val) => setCourseForm({ ...courseForm, minimum_education_level: val })}
                courses={courses}
                field="minimum_education_level"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Minimum GPA Required
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="e.g. 2.75"
                  required
                  value={courseForm.minimum_gpa}
                  onChange={(e) => setCourseForm({ ...courseForm, minimum_gpa: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Course Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Years"
                  required
                  value={courseForm.duration}
                  onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Course Fee
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15,000 EUR/Yr"
                  required
                  value={courseForm.course_fee}
                  onChange={(e) => setCourseForm({ ...courseForm, course_fee: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Course Intake periods
                </label>
                <input
                  type="text"
                  placeholder="e.g. September, February"
                  required
                  value={courseForm.intake_periods}
                  onChange={(e) => setCourseForm({ ...courseForm, intake_periods: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
            </div>

            {/* English Proficiency Sub-form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Proficiency Test Requirements
              </span>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  list="test-names-list-admin"
                  placeholder="e.g. Cobal, IELTS"
                  value={testInput.test_name}
                  onChange={(e) => setTestInput({ ...testInput, test_name: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500 w-1/2"
                />
                <datalist id="test-names-list-admin">
                  {existingTestNames.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>

                {testInput.test_name.trim().toUpperCase() !== 'MOI' && (
                  <input
                    type="text"
                    placeholder="Min Score"
                    value={testInput.minimum_score}
                    onChange={(e) => setTestInput({ ...testInput, minimum_score: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs flex-1 focus:outline-none focus:border-indigo-500"
                  />
                )}

                <button
                  type="button"
                  onClick={addTestRequirement}
                  className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 flex items-center gap-1 transition shrink-0"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              {courseForm.proficiency_tests.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No specific tests required (Assumed open/MOI/General admissions).</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {courseForm.proficiency_tests.map((test, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 shadow-sm"
                    >
                      {test.test_name} {test.test_name.trim().toUpperCase() !== 'MOI' ? `≥ ${test.minimum_score}` : ''}
                      <button
                        type="button"
                        onClick={() => removeTestRequirement(idx)}
                        className="text-slate-400 hover:text-red-500 font-bold ml-1 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-2"
              >
                {editingCourseId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingCourseId ? 'Update Course Requirements' : 'Save Course Requirements'}
              </button>

              {editingCourseId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Cancel Editing
                </button>
              )}
            </div>
          </form>
        </div>

        
                {/* Database Display Records Panel */}
        <div className={`lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[calc(100vh-220px)] min-h-[500px] ${mobileTab === 'database' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">
                Courses List ({groupedCourses.length} Groups, {courses.length} Total)
              </h2>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
              <HelpCircle className="h-12 w-12 text-slate-300 mb-3 animate-pulse" />
              <p className="font-semibold text-slate-500">No courses found</p>
              <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                Please add new course requirements using the form.
              </p>
            </div>

          ) : (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {groupedCourses.map((group) => (
                <div 
                  key={group.id} 
                  className={`p-4 rounded-xl border transition-all duration-200 relative ${
                    editingCourseId === group.id
                      ? 'border-indigo-300 bg-indigo-50/10 shadow-inner'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  {/* Action Buttons Container */}
                  <div className="absolute right-3 top-3 flex gap-1.5 z-10">
                    <button
                      onClick={() => handleEditCourse(group)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-100 rounded-lg shadow-sm transition"
                      title="Edit Course Requirement"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="p-1.5 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 border border-slate-100 rounded-lg shadow-sm transition"
                      title="Delete Course Requirement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-start pr-20">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {group.course_level}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-300" /> {group.country}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mt-1">
                        {group.courses.length === 1 ? (
                          group.courses[0].course_name
                        ) : (
                          <span className="text-slate-400 font-normal text-sm">Grouped Courses ({group.courses.length}):</span>
                        )}
                      </h3>
                      {group.courses.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {group.courses.map((c) => (
                            <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {c.course_name}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-500 font-medium mt-1">{group.university_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100/80 text-xs">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Min GPA</span>
                      <span className="font-bold text-slate-700">{group.minimum_gpa}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Min Edu</span>
                      <span className="font-semibold text-slate-700 truncate block" title={group.minimum_education_level}>
                        {group.minimum_education_level}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Duration</span>
                      <span className="font-semibold text-slate-700">{group.duration}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Fees</span>
                      <span className="font-bold text-emerald-600">{group.course_fee}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">English:</span>
                    {(!group.proficiency_tests || group.proficiency_tests.length === 0) ? (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        None Required
                      </span>
                    ) : (
                      group.proficiency_tests.map((pt, idx) => (
                        <span key={idx} className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          {pt.test_name} {pt.test_name.trim().toUpperCase() !== 'MOI' ? `≥ ${pt.minimum_score}` : ''}
                        </span>
                      ))
                    )}
                    <span className="ml-auto text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Intake: {group.intake_periods}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
