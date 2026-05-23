import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { Button } from '../components/ui';

const STEPS = ['Age', 'Study Type', 'Faculty', 'Major', 'Time Shift'];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, loadUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [age, setAge] = useState('');
  const [studyType, setStudyType] = useState('بكالوريوس');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [timeShift, setTimeShift] = useState('الكل');
  const [faculties, setFaculties] = useState<any>({});
  const [majors, setMajors] = useState<any>({});

  useEffect(() => {
    configService.getFaculties().then(setFaculties);
    configService.getMajors().then(setMajors);
  }, []);

  const goNext = useCallback(async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      await authService.saveOnboarding({
        age: age ? parseInt(age) : undefined,
        studyType,
        faculty,
        major,
        timeShift,
        step: 'complete',
      });
      if (user) {
        await loadUser();
        toast.success('Setup complete!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('onboarding saveOnboarding error:', err);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [step, age, studyType, faculty, major, timeShift, navigate, user, loadUser]);

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const saveStep = async (field: string, value: string) => {
    setSaving(true);
    try {
      await authService.saveOnboarding({ [field]: value, step: 'incomplete' });
    } catch (err) {
      console.error('onboarding saveStep error:', field, err);
    }
    setSaving(false);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">What is your age?</h2>
            <p className="text-zinc-400 text-sm">This is optional and helps us personalize your experience.</p>
            <input
              type="number"
              min={16}
              max={99}
              value={age}
              onChange={(e) => { setAge(e.target.value); saveStep('age', e.target.value); }}
              placeholder="Your age (optional)"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <Button fullWidth size="lg" onClick={goNext} icon={<ArrowRight className="w-5 h-5" />}>
              {age ? 'Next' : 'Skip'}
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">What is your study type?</h2>
            <div className="grid grid-cols-2 gap-3">
              {['بكالوريوس', 'دراسات عليا'].map((type) => (
                <button
                  key={type}
                  onClick={() => { setStudyType(type); setFaculty(''); setMajor(''); setTimeShift('الكل'); }}
                  className={`p-6 rounded-xl border-2 text-center transition-all duration-200 ${
                    studyType === type
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-lg font-medium">{type}</span>
                </button>
              ))}
            </div>
            <Button fullWidth size="lg" onClick={goNext} icon={<ArrowRight className="w-5 h-5" />}>
              Next
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              {studyType === 'بكالوريوس' ? 'Which faculty are you in?' : 'Which program are you enrolled in?'}
            </h2>
            {Object.keys(faculties).length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {(studyType === 'بكالوريوس'
                  ? (faculties.bachelor || [])
                  : (faculties.graduate || [])
                ).map((name: string) => (
                  <button
                    key={name}
                    onClick={() => setFaculty(name)}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-200 ${
                      faculty === name
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-zinc-700/50 bg-zinc-800/20 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <Button fullWidth size="lg" onClick={goNext} icon={<ArrowRight className="w-5 h-5" />}>
              {studyType === 'دراسات عليا' ? 'Skip' : 'Next'}
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">What is your major?</h2>
            {studyType === 'دراسات عليا' ? (
              <p className="text-zinc-400">Major is optional for postgraduate students.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {(majors[faculty] || []).map((name: string) => (
                  <button
                    key={name}
                    onClick={() => setMajor(name)}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-200 ${
                      major === name
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-zinc-700/50 bg-zinc-800/20 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {name}
                  </button>
                ))}
                {(!faculty || !majors[faculty]?.length) && <p className="text-zinc-500 text-center py-4">Select a faculty first</p>}
              </div>
            )}
            <Button fullWidth size="lg" onClick={goNext} icon={<ArrowRight className="w-5 h-5" />} disabled={studyType === 'بكالوريوس' && !major}>
              {major || studyType === 'دراسات عليا' ? 'Next' : 'Select a major'}
            </Button>
          </div>
        );

      case 4:
        if (studyType === 'دراسات عليا') {
          return (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">All set!</h2>
              <p className="text-zinc-400">You&apos;re ready to start using Course Notifier.</p>
              <Button fullWidth size="lg" loading={loading} onClick={goNext} icon={<Check className="w-5 h-5" />}>
                Finish Setup
              </Button>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">What is your time shift?</h2>
            <div className="grid grid-cols-3 gap-3">
              {['صباحي', 'مسائي', 'الكل'].map((shift) => (
                <button
                  key={shift}
                  onClick={() => setTimeShift(shift)}
                  className={`p-6 rounded-xl border-2 text-center transition-all duration-200 ${
                    timeShift === shift
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-lg font-medium">{shift}</span>
                </button>
              ))}
            </div>
            <Button fullWidth size="lg" loading={loading} onClick={goNext} icon={<Check className="w-5 h-5" />}>
              Finish Setup
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {step > 0 && (
              <button onClick={goBack} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {step === 0 && <div />}
            <span className="text-zinc-500 text-sm">{step + 1} / {STEPS.length}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-cyan-500' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((label, i) => (
              <span
                key={i}
                className={`text-xs transition-colors ${
                  i <= step ? 'text-cyan-400' : 'text-zinc-600'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6">
          {saving && (
            <div className="flex justify-end mb-2">
              <span className="text-xs text-zinc-500">Saving...</span>
            </div>
          )}
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
