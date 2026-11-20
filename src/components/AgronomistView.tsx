import {
  BadgeCheck,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  UserCheck,
  AlertTriangle,
  Volume2,
  FileText,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CropCase } from '../types';
import { formatRelativeTime } from '../utils/storage';
import { CropImage } from './CropImage';

interface AgronomistViewProps {
  cases: CropCase[];
  initialCaseId?: string | null;
  onApproveCase: (updatedCase: CropCase) => void;
  onViewAsFarmer: (cropCase: CropCase) => void;
}

export function AgronomistView({
  cases,
  initialCaseId,
  onApproveCase,
  onViewAsFarmer,
}: AgronomistViewProps) {
  const [queueFilter, setQueueFilter] = useState<'pending' | 'verified' | 'all'>('pending');

  const pendingCases = cases.filter((c) => c.status === 'with_expert');
  const verifiedCases = cases.filter((c) => c.status === 'verified');
  const displayedCases =
    queueFilter === 'pending'
      ? pendingCases
      : queueFilter === 'verified'
      ? verifiedCases
      : cases;

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (initialCaseId && cases.some((c) => c.id === initialCaseId)) return initialCaseId;
    return pendingCases[0]?.id || cases[0]?.id || null;
  });

  useEffect(() => {
    if (initialCaseId && cases.some((c) => c.id === initialCaseId)) {
      setSelectedId(initialCaseId);
      const target = cases.find((c) => c.id === initialCaseId);
      if (target && target.status !== 'with_expert') {
        setQueueFilter('all');
      }
    }
  }, [initialCaseId, cases]);

  const activeCase =
    cases.find((c) => c.id === selectedId) || displayedCases[0] || null;

  // Editable form state synced to activeCase
  const [crop, setCrop] = useState('');
  const [likelyProblem, setLikelyProblem] = useState('');
  const [actionSteps, setActionSteps] = useState<string[]>([]);
  const [warningSigns, setWarningSigns] = useState<string[]>([]);
  const [spokenSummary, setSpokenSummary] = useState('');
  const [agronomistName, setAgronomistName] = useState(
    'Dr. Mahmudul Hasan, Senior Agronomist (DAE)'
  );
  const [agronomistNote, setAgronomistNote] = useState('');
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCase) return;
    setCrop(activeCase.crop);
    setLikelyProblem(activeCase.likely_problem);
    setActionSteps(
      activeCase.action_plan.length > 0
        ? [...activeCase.action_plan]
        : ['Inspect affected leaves closely in daylight and isolate severely damaged plants.']
    );
    setWarningSigns([...activeCase.warning_signs]);
    setSpokenSummary(activeCase.spoken_summary || '');
    setAgronomistName(
      activeCase.agronomistName || 'Dr. Mahmudul Hasan, Senior Agronomist (DAE)'
    );
    setAgronomistNote(activeCase.agronomistNote || '');
  }, [activeCase?.id]);

  const handleStepChange = (index: number, value: string) => {
    setActionSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const handleAddStep = () => {
    setActionSteps((prev) => [...prev, '']);
  };

  const handleRemoveStep = (index: number) => {
    setActionSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;

    const cleanSteps = actionSteps.map((s) => s.trim()).filter(Boolean);
    const cleanWarnings = warningSigns.map((w) => w.trim()).filter(Boolean);

    const updated: CropCase = {
      ...activeCase,
      crop: crop.trim() || activeCase.crop,
      likely_problem: likelyProblem.trim() || activeCase.likely_problem,
      confidence: Math.max(activeCase.confidence, 95),
      needs_expert: false,
      action_plan: cleanSteps.length > 0 ? cleanSteps : activeCase.action_plan,
      warning_signs: cleanWarnings,
      spoken_summary:
        spokenSummary.trim() ||
        `Verified by agronomist: ${likelyProblem.trim()}. ${cleanSteps.slice(0, 2).join('. ')}`,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      agronomistName: agronomistName.trim() || 'KrishiSetu Agronomist',
      agronomistNote: agronomistNote.trim() || 'Reviewed and verified by human agronomist.',
    };

    onApproveCase(updated);
    setJustApprovedId(updated.id);
    setQueueFilter('all');
    setSelectedId(updated.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 mb-6 border-b border-[#E5E8E2]">
        <div>
          <p className="text-xs font-semibold text-[#1B7F3B]">
            Human-in-the-loop safety desk
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#14231A]">
            Agronomist Review Queue
          </h1>
          <p className="mt-1 text-sm text-[#4A5D52]">
            Inspect low-confidence or high-risk cases, refine the treatment plan, and send a verified answer back to the farmer.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#ECEFE9] rounded-xl">
          <button
            type="button"
            onClick={() => setQueueFilter('pending')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              queueFilter === 'pending'
                ? 'bg-white text-[#14231A] shadow-xs'
                : 'text-[#4A5D52] hover:text-[#14231A]'
            }`}
          >
            <span>Needs review</span>
            <span className="font-mono tabular-nums text-[#B45309]">
              {pendingCases.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setQueueFilter('verified')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              queueFilter === 'verified'
                ? 'bg-white text-[#14231A] shadow-xs'
                : 'text-[#4A5D52] hover:text-[#14231A]'
            }`}
          >
            <span>Verified</span>
            <span className="font-mono tabular-nums text-[#0F766E]">
              {verifiedCases.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setQueueFilter('all')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              queueFilter === 'all'
                ? 'bg-white text-[#14231A] shadow-xs'
                : 'text-[#4A5D52] hover:text-[#14231A]'
            }`}
          >
            <span>All</span>
            <span className="font-mono tabular-nums">{cases.length}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Queue + Review Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Queue List */}
        <aside className="lg:col-span-4 bg-white rounded-3xl border border-[#E2E6DF] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#EEF1EC] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14231A]">Escalation Queue</h2>
            <span className="font-mono text-xs text-[#4A5D52] tabular-nums">
              {displayedCases.length} cases
            </span>
          </div>

          {displayedCases.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#1B7F3B] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#14231A]">Queue is clear</p>
              <p className="mt-1 text-xs text-[#4A5D52]">
                All escalated farmer cases have been verified. Switch to Verified or All to inspect past reviews.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF1EC] max-h-[680px] overflow-y-auto">
              {displayedCases.map((item) => {
                const isSelected = activeCase?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setJustApprovedId(null);
                    }}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#EFF8F1]' : 'hover:bg-[#FAFBF9]'
                    }`}
                  >
                    <CropImage
                      src={item.photoDataUrl}
                      alt={item.crop}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E2E6DF]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#4A5D52]">
                        <span className="font-mono tabular-nums font-semibold text-[#14231A]">
                          {item.id}
                        </span>
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-[#14231A] truncate">
                        {item.likely_problem}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[#4A5D52] flex-wrap">
                        <span>{item.district.split(',')[0]}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          AI {item.aiOriginalConfidence ?? item.confidence}%
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs font-semibold flex items-center gap-1.5">
                        {item.status === 'with_expert' ? (
                          <span className="text-[#B45309] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting review
                            {item.priorityConsultRequested ? ' · Priority (BDT 20–50)' : ''}
                          </span>
                        ) : item.status === 'verified' ? (
                          <span className="text-[#0F766E] flex items-center gap-1">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[#1B7F3B] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            AI answered
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Review Editor Workspace */}
        <section className="lg:col-span-8">
          {!activeCase ? (
            <div className="bg-white rounded-3xl border border-[#E2E6DF] p-10 text-center text-[#4A5D52]">
              Select a case from the queue to inspect photo, voice transcript, and AI draft.
            </div>
          ) : (
            <form
              onSubmit={handleApproveSubmit}
              className="bg-white rounded-3xl border border-[#E2E6DF] p-5 sm:p-7 space-y-6"
            >
              {/* Approval Confirmation Banner */}
              {justApprovedId === activeCase.id && (
                <div className="rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-[#065F46]">
                    <BadgeCheck className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-bold">
                      Approved and sent back to the farmer with a Verified by Agronomist badge.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewAsFarmer(activeCase)}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5D56] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    Preview Farmer View →
                  </button>
                </div>
              )}

              {/* Evidence Inspection Split: Photo + Farmer Voice/Transcript + AI Draft */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pb-6 border-b border-[#EEF1EC]">
                <div className="md:col-span-5">
                  <CropImage
                    src={activeCase.photoDataUrl}
                    alt={activeCase.crop}
                    className="w-full h-56 object-cover rounded-2xl border border-[#DCE2D9]"
                  />
                  <div className="mt-2.5 flex items-center justify-between text-xs text-[#4A5D52]">
                    <span>{activeCase.district}</span>
                    <span className="font-mono uppercase">{activeCase.language}</span>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#4A5D52]">
                      CASE {activeCase.id}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#B45309] tabular-nums">
                      AI Confidence: {activeCase.aiOriginalConfidence ?? activeCase.confidence}%
                    </span>
                  </div>

                  {/* AI Initial Guess & Escalation Reason */}
                  <div className="rounded-2xl bg-[#FFFBEB] border border-[#F5D07E] p-3.5 space-y-1.5">
                    <p className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      AI initial guess: {activeCase.aiOriginalGuess || activeCase.likely_problem}
                    </p>
                    {activeCase.escalation_reason && (
                      <p className="text-xs text-[#78350F] leading-relaxed">
                        {activeCase.escalation_reason}
                      </p>
                    )}
                  </div>

                  {/* Farmer Voice Note & Transcript */}
                  <div className="rounded-2xl bg-[#F8FAF7] border border-[#E4EAE2] p-3.5 space-y-2">
                    <p className="text-xs font-bold text-[#314438] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#1B7F3B]" />
                      Farmer voice transcript / note
                    </p>
                    {activeCase.audioDataUrl && (
                      <audio controls src={activeCase.audioDataUrl} className="w-full h-9" />
                    )}
                    <p className="text-sm text-[#14231A]">
                      {activeCase.transcript ||
                        activeCase.noteText ||
                        'No voice note or text attached — visual photo inspection only.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Verification Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#314438] mb-1.5">
                      Verified Crop
                    </label>
                    <input
                      type="text"
                      value={crop}
                      onChange={(e) => setCrop(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D8DFD5] text-sm font-medium text-[#14231A] focus:outline-none focus:border-[#1B7F3B]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#314438] mb-1.5">
                      Verified Diagnosis / Problem
                    </label>
                    <input
                      type="text"
                      value={likelyProblem}
                      onChange={(e) => setLikelyProblem(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D8DFD5] text-sm font-medium text-[#14231A] focus:outline-none focus:border-[#1B7F3B]"
                      required
                    />
                  </div>
                </div>

                {/* Editable Action Plan Steps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#314438]">
                      Verified Action Plan (short, low-cost first steps)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="text-xs font-semibold text-[#1B7F3B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add step
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {actionSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-7 h-10 rounded-lg bg-[#E9F5EC] text-[#135E2B] font-mono text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => handleStepChange(idx, e.target.value)}
                          placeholder={`Step ${idx + 1}...`}
                          className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D8DFD5] text-sm text-[#14231A] focus:outline-none focus:border-[#1B7F3B]"
                        />
                        {actionSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            aria-label="Remove step"
                            className="min-h-[40px] min-w-[40px] rounded-xl text-[#7A8C80] hover:text-[#B91C1C] hover:bg-[#FEF2F2] flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spoken Voice Summary */}
                <div>
                  <label className="text-xs font-semibold text-[#314438] flex items-center gap-1.5 mb-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#1B7F3B]" />
                    Spoken summary sent to farmer (read aloud in farmer's language)
                  </label>
                  <textarea
                    rows={2}
                    value={spokenSummary}
                    onChange={(e) => setSpokenSummary(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8DFD5] text-sm text-[#14231A] focus:outline-none focus:border-[#1B7F3B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#314438] mb-1.5">
                      Agronomist Name & Affiliation
                    </label>
                    <input
                      type="text"
                      value={agronomistName}
                      onChange={(e) => setAgronomistName(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D8DFD5] text-sm text-[#14231A] focus:outline-none focus:border-[#1B7F3B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#314438] mb-1.5">
                      Agronomist Safety / Dosage Note
                    </label>
                    <input
                      type="text"
                      value={agronomistNote}
                      onChange={(e) => setAgronomistNote(e.target.value)}
                      placeholder="E.g. Confirm leafhopper count before spraying; 7-day harvest wait."
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D8DFD5] text-sm text-[#14231A] focus:outline-none focus:border-[#1B7F3B]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Approve Row */}
              <div className="pt-4 border-t border-[#EEF1EC] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onViewAsFarmer(activeCase)}
                  className="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F2F6F3] hover:bg-[#E4EFE7] text-[#135E2B] text-sm font-semibold cursor-pointer"
                >
                  View Farmer Screen
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[52px] px-6 py-3 rounded-2xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white font-display text-base font-bold flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Approve & Send Verified Plan</span>
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
