import {
  Bug,
  CloudRain,
  CloudSun,
  Droplets,
  Info,
  Loader2,
  MapPin,
  Square,
  TrendingDown,
  TrendingUp,
  Minus,
  Volume2,
} from 'lucide-react';
import { DISTRICT_ALERTS } from '../data/sampleData';
import type { VoicePlaybackState } from '../hooks/useVoicePlayback';
import { TRANSLATIONS } from '../i18n/translations';
import type { Language } from '../types';

interface AlertsViewProps {
  language: Language;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  voice: VoicePlaybackState;
}

export function AlertsView({
  language,
  selectedDistrict,
  onSelectDistrict,
  voice,
}: AlertsViewProps) {
  const t = TRANSLATIONS[language];
  const bundle =
    DISTRICT_ALERTS.find((item) => item.district === selectedDistrict) ||
    DISTRICT_ALERTS[0];

  const alertVoiceId = `alerts-${bundle.district}-${language}`;
  const isPlaying = voice.isPlaying && voice.activeId === alertVoiceId;
  const isLoading = voice.isLoading && voice.activeId === alertVoiceId;

  const spokenAlertSummary = [
    `${bundle.district.split(',')[0]}: ${bundle.weather.condition[language]}.`,
    `${bundle.weather.advice[language]}.`,
    `${bundle.pest.crop[language]}: ${bundle.pest.title[language]}. ${bundle.pest.advice[language]}.`,
    `${bundle.prices[0].crop[language]} ${bundle.prices[0].priceText} ${bundle.prices[0].unit[language]}.`,
  ].join(' ');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-12">
      {/* Header + Voice Readout */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 mb-6 border-b border-[#E5E8E2]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14231A]">
            {t.alertsTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#4A5D52] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#1B7F3B] shrink-0" />
            <span>{t.alertsSampleLabel}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void voice.speak(spokenAlertSummary, language, alertVoiceId)}
          className={`min-h-[50px] px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            isPlaying
              ? 'bg-[#14231A] text-white'
              : 'bg-[#1B7F3B] hover:bg-[#135E2B] text-white'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
          <span>
            {isLoading ? t.loadingVoice : isPlaying ? t.stopAudio : t.listenAlerts}
          </span>
        </button>
      </div>

      {/* District Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {DISTRICT_ALERTS.map((item) => {
          const active = item.district === bundle.district;
          return (
            <button
              key={item.district}
              type="button"
              onClick={() => onSelectDistrict(item.district)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#14231A] text-white'
                  : 'bg-white border border-[#DCE2D9] text-[#314438] hover:border-[#1B7F3B]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{item.district}</span>
            </button>
          );
        })}
      </div>

      {/* 3-Column Responsive Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Weather Card */}
        <article className="lg:col-span-4 bg-white rounded-3xl border border-[#E2E6DF] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E9F5EC] text-[#1B7F3B] flex items-center justify-center">
                  <CloudSun className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[#14231A]">
                    {t.weatherTitle}
                  </h2>
                  <p className="text-xs text-[#4A5D52]">{bundle.region} · Sample data</p>
                </div>
              </div>
              <span className="font-mono text-3xl font-bold text-[#14231A] tabular-nums">
                {bundle.weather.tempC}°C
              </span>
            </div>

            <p className="mt-5 text-base font-semibold text-[#14231A] leading-snug">
              {bundle.weather.condition[language]}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-[#EEF1EC] text-sm">
              <div className="flex items-center gap-2 text-[#314438]">
                <Droplets className="w-4 h-4 text-[#1B7F3B]" />
                <span>
                  {t.humidityLabel}:{' '}
                  <strong className="font-mono tabular-nums">
                    {bundle.weather.humidity}%
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#314438]">
                <CloudRain className="w-4 h-4 text-[#1B7F3B]" />
                <span>
                  {t.rainChanceLabel}:{' '}
                  <strong className="font-mono tabular-nums">
                    {bundle.weather.rainChance}%
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-[#F4FAF5] border border-[#D8ECDD] p-4 text-sm text-[#135E2B] leading-relaxed">
            {bundle.weather.advice[language]}
          </div>
        </article>

        {/* Pest & Disease Outbreak Card */}
        <article className="lg:col-span-4 bg-white rounded-3xl border border-[#E2E6DF] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-[#FEF7E0] text-[#B45309] flex items-center justify-center">
                  <Bug className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[#14231A]">
                    {t.pestAlertTitle}
                  </h2>
                  <p className="text-xs text-[#4A5D52]">
                    {bundle.pest.crop[language]} · Sample data
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#B45309]">
                {bundle.pest.severity === 'high' ? 'High risk' : 'Moderate'}
              </span>
            </div>

            <h3 className="mt-5 font-display text-xl font-bold text-[#14231A] leading-snug">
              {bundle.pest.title[language]}
            </h3>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFFBEB] border border-[#F5D07E] p-4 text-sm text-[#78350F] leading-relaxed">
            {bundle.pest.advice[language]}
          </div>
        </article>

        {/* Local Market Prices Card */}
        <article className="lg:col-span-4 bg-white rounded-3xl border border-[#E2E6DF] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#E9F5EC] text-[#1B7F3B] flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#14231A]">
                  {t.marketPricesTitle}
                </h2>
                <p className="text-xs text-[#4A5D52]">
                  {bundle.district.split(',')[0]} Mandi · Sample data
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#EEF1EC]">
              {bundle.prices.map((row, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#14231A]">
                      {row.crop[language]}
                    </p>
                    <p className="text-xs text-[#4A5D52]">{row.unit[language]}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-bold text-[#14231A] tabular-nums">
                      {row.priceText}
                    </p>
                    <p
                      className={`font-mono text-xs font-semibold tabular-nums flex items-center justify-end gap-1 ${
                        row.trend === 'up'
                          ? 'text-[#1B7F3B]'
                          : row.trend === 'down'
                          ? 'text-[#B91C1C]'
                          : 'text-[#4A5D52]'
                      }`}
                    >
                      {row.trend === 'up' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : row.trend === 'down' ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      <span>{row.changeText}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-5 pt-3 border-t border-[#EEF1EC] text-xs text-[#4A5D52]">
            Designed to swap seamlessly to live DAM / Agmarknet price feeds.
          </p>
        </article>
      </div>
    </div>
  );
}
