import {
  BarChart3,
  Bell,
  ClipboardList,
  Globe,
  MessageCircle,
  Menu,
  Phone,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AgronomistView } from './components/AgronomistView';
import { AlertsView } from './components/AlertsView';
import { CaseResultView } from './components/CaseResultView';
import { FarmerChatHome } from './components/FarmerChatHome';
import { InsightsDashboard } from './components/InsightsDashboard';
import { MyCasesView } from './components/MyCasesView';
import { NewCaseView } from './components/NewCaseView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PhoneCallOverlay } from './components/PhoneCallOverlay';
import { PWAInstallButton } from './components/PWAInstallButton';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useVoicePlayback } from './hooks/useVoicePlayback';
import { TRANSLATIONS } from './i18n/translations';
import type { AppScreen, CropCase, Language } from './types';
import {
  loadCases,
  loadSavedDistrict,
  loadSavedLanguage,
  restoreSampleCases,
  saveCases,
  saveDistrict,
  saveLanguage,
} from './utils/storage';

export default function App() {
  const savedLang = loadSavedLanguage();
  const [language, setLanguage] = useState<Language>(savedLang || 'bn');
  const [screen, setScreen] = useState<AppScreen>(savedLang ? 'home' : 'welcome');
  const [district, setDistrict] = useState<string>(() => loadSavedDistrict());
  const [cases, setCases] = useState<CropCase[]>(() => loadCases());

  const [newCaseMode, setNewCaseMode] = useState<'camera' | 'voice'>('camera');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [agronomistFocusId, setAgronomistFocusId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [phoneCallOpen, setPhoneCallOpen] = useState(false);

  const voice = useVoicePlayback();
  const t = TRANSLATIONS[language];

  useEffect(() => {
    saveCases(cases);
  }, [cases]);

  const handleSelectLanguage = (lang: Language, enterHome = false) => {
    setLanguage(lang);
    saveLanguage(lang);
    if (enterHome) {
      setScreen('home');
    }
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    saveDistrict(nextDistrict);
  };

  const handleNavigate = (target: AppScreen) => {
    voice.stop();
    setMenuOpen(false);
    setScreen(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewCase = (mode: 'camera' | 'voice' = 'camera') => {
    voice.stop();
    setMenuOpen(false);
    setNewCaseMode(mode);
    setScreen('new_case');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCaseCreatedFromChat = (created: CropCase) => {
    setCases((prev) => [created, ...prev]);
    setActiveCaseId(created.id);
  };

  const handleCaseCreatedFromForm = (created: CropCase) => {
    setCases((prev) => [created, ...prev]);
    setActiveCaseId(created.id);
    setScreen('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCase = (cropCase: CropCase) => {
    voice.stop();
    setActiveCaseId(cropCase.id);
    setScreen('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestEscalation = (caseId: string, priorityConsult: boolean) => {
    setCases((prev) =>
      prev.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status: 'with_expert',
              needs_expert: true,
              priorityConsultRequested: priorityConsult || item.priorityConsultRequested,
              escalation_reason:
                item.escalation_reason ||
                'Farmer requested a human agronomist to double-check this diagnosis.',
            }
          : item
      )
    );
  };

  const handleApproveCase = (updatedCase: CropCase) => {
    setCases((prev) =>
      prev.map((item) => (item.id === updatedCase.id ? updatedCase : item))
    );
  };

  const handleDeleteCase = (caseId: string) => {
    voice.stop();
    setCases((prev) => prev.filter((item) => item.id !== caseId));
    if (activeCaseId === caseId) {
      setActiveCaseId(null);
    }
  };

  const handleClearAllCases = () => {
    voice.stop();
    setCases([]);
    setActiveCaseId(null);
  };

  const handleRestoreSampleCases = () => {
    voice.stop();
    const restored = restoreSampleCases();
    setCases(restored);
    setActiveCaseId(restored[0]?.id || null);
  };

  const handleOpenAgronomistQueue = (caseId?: string) => {
    voice.stop();
    setMenuOpen(false);
    setPhoneCallOpen(false);
    setAgronomistFocusId(caseId || null);
    setScreen('agronomist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0] || null;
  const pendingExpertCount = cases.filter((c) => c.status === 'with_expert').length;

  const farmerMobileTabs: Array<{
    key: AppScreen;
    label: string;
    icon: typeof MessageCircle;
  }> = [
    { key: 'home', label: t.navHome, icon: MessageCircle },
    { key: 'my_cases', label: t.navCases, icon: ClipboardList },
    { key: 'alerts', label: t.navAlerts, icon: Bell },
  ];

  const desktopNavItems: Array<{
    key: AppScreen;
    label: string;
    badgeCount?: number;
  }> = [
    { key: 'home', label: t.navHome },
    { key: 'my_cases', label: t.navCases },
    { key: 'alerts', label: t.navAlerts },
    { key: 'agronomist', label: t.navAgronomist, badgeCount: pendingExpertCount },
    { key: 'insights', label: t.navInsights },
  ];

  const isNavActive = (key: AppScreen) => {
    if (key === 'home' && (screen === 'home' || screen === 'welcome' || screen === 'new_case')) {
      return true;
    }
    if (key === 'my_cases' && (screen === 'my_cases' || screen === 'result')) return true;
    return screen === key;
  };

  const callButtonLabel =
    language === 'bn' ? 'কল করুন' : language === 'hi' ? 'कॉल करें' : 'Call Advisor';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#14231A]">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-[#E4E8E1]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="font-display text-xl font-bold tracking-tight text-[#1B7F3B] whitespace-nowrap shrink-0 cursor-pointer"
          >
            KrishiSetu
          </button>

          {/* Zone 2: Clean Desktop Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A5D52]"
          >
            {desktopNavItems.map((item) => {
              const active = isNavActive(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.key)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    active
                      ? 'text-[#14231A] font-semibold border-[#1B7F3B]'
                      : 'border-transparent hover:text-[#14231A]'
                  }`}
                >
                  {item.label}
                  {item.badgeCount ? ` (${item.badgeCount})` : ''}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Phone Call CTA on Desktop, Menu Toggle on Mobile */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                voice.stop();
                setPhoneCallOpen(true);
              }}
              className="hidden md:flex min-h-[40px] px-4 py-2 rounded-xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white text-sm font-semibold items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>{callButtonLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Open menu"
              className="md:hidden min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#DCE2D9] bg-white text-[#14231A] flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Down Role & Settings Drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 z-40 bg-white border-b border-[#DCE2D9] shadow-lg p-4 space-y-3">
          <PWAInstallButton language={language} variant="menu" voice={voice} />
          <p className="text-xs font-bold text-[#4A5D52] px-2 pt-1">
            Expert & Partner Views
          </p>
          <button
            type="button"
            onClick={() => handleOpenAgronomistQueue()}
            className="w-full min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#FAFBF9] border border-[#E2E6DF] flex items-center justify-between text-sm font-bold text-[#14231A] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-[#1B7F3B]" />
              <span>{t.navAgronomist}</span>
            </span>
            {pendingExpertCount > 0 && (
              <span className="font-mono text-xs font-bold text-[#B45309] tabular-nums">
                {pendingExpertCount} waiting
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('insights')}
            className="w-full min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#FAFBF9] border border-[#E2E6DF] flex items-center gap-3 text-sm font-bold text-[#14231A] cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-[#1B7F3B]" />
            <span>{t.navInsights} (NGO)</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('welcome')}
            className="w-full min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#FAFBF9] border border-[#E2E6DF] flex items-center gap-3 text-sm font-bold text-[#14231A] cursor-pointer"
          >
            <Globe className="w-5 h-5 text-[#1B7F3B]" />
            <span>{t.changeLanguage}</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {screen === 'welcome' && (
          <WelcomeScreen
            selectedLanguage={language}
            onSelectLanguage={handleSelectLanguage}
            voice={voice}
          />
        )}

        {screen === 'home' && (
          <FarmerChatHome
            language={language}
            district={district}
            cases={cases}
            voice={voice}
            onChangeLanguage={(lang) => handleSelectLanguage(lang, false)}
            onDistrictChange={handleDistrictChange}
            onCaseCreated={handleCaseCreatedFromChat}
            onOpenCase={handleOpenCase}
            onStartPhoneCall={() => {
              voice.stop();
              setPhoneCallOpen(true);
            }}
            onNavigate={handleNavigate}
            onOpenAgronomistQueue={handleOpenAgronomistQueue}
            onDeleteCase={handleDeleteCase}
            onClearAllCases={handleClearAllCases}
          />
        )}

        {screen === 'new_case' && (
          <NewCaseView
            language={language}
            defaultDistrict={district}
            initialMode={newCaseMode}
            onBack={() => handleNavigate('home')}
            onCaseCreated={handleCaseCreatedFromForm}
            onDistrictChange={handleDistrictChange}
          />
        )}

        {screen === 'result' && activeCase && (
          <CaseResultView
            cropCase={activeCase}
            language={language}
            voice={voice}
            onBack={() => handleNavigate('home')}
            onCheckAnother={() => handleNavigate('home')}
            onRequestEscalation={handleRequestEscalation}
            onOpenAgronomistQueue={handleOpenAgronomistQueue}
          />
        )}

        {screen === 'my_cases' && (
          <MyCasesView
            cases={cases}
            language={language}
            onOpenCase={handleOpenCase}
            onStartNewCase={() => handleNavigate('home')}
            onDeleteCase={handleDeleteCase}
            onClearAllCases={handleClearAllCases}
            onRestoreSampleCases={handleRestoreSampleCases}
          />
        )}

        {screen === 'alerts' && (
          <AlertsView
            language={language}
            selectedDistrict={district}
            onSelectDistrict={handleDistrictChange}
            voice={voice}
          />
        )}

        {screen === 'agronomist' && (
          <AgronomistView
            cases={cases}
            initialCaseId={agronomistFocusId}
            onApproveCase={handleApproveCase}
            onViewAsFarmer={handleOpenCase}
          />
        )}

        {screen === 'insights' && <InsightsDashboard cases={cases} />}
      </main>

      {/* Full-Screen Zero-Reading Phone Call Overlay */}
      {phoneCallOpen && (
        <PhoneCallOverlay
          language={language}
          district={district}
          voice={voice}
          onChangeLanguage={(lang) => handleSelectLanguage(lang, false)}
          onCaseCreated={handleCaseCreatedFromChat}
          onClose={() => setPhoneCallOpen(false)}
          onOpenAgronomistQueue={handleOpenAgronomistQueue}
        />
      )}

      {/* Quiet Desktop Footer */}
      <footer className="hidden md:block border-t border-[#E6EAE3] bg-white/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between gap-4 text-xs text-[#4A5D52]">
          <span>KrishiSetu · Talk. Snap. Save your crop.</span>
          <div className="flex items-center gap-4">
            <PWAInstallButton language={language} variant="subtle" voice={voice} />
            <button
              type="button"
              onClick={() => handleNavigate('welcome')}
              className="hover:text-[#1B7F3B] font-medium cursor-pointer"
            >
              Language & Welcome ({language.toUpperCase()})
            </button>
          </div>
        </div>
      </footer>

      <OfflineIndicator language={language} />

      {/* Simple 3-Tab Farmer Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2E6DF] pb-safe"
      >
        <div className="grid grid-cols-3 h-14 items-center">
          {farmerMobileTabs.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.key)}
                className={`h-full flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  active ? 'text-[#1B7F3B] font-bold' : 'text-[#5A6D61] font-medium'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
