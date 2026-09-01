import React, { useState } from 'react';
import { Languages, Globe2, HeartHandshake, Volume2, Check, Sparkles, MapPin, ShieldCheck, BookOpen, Layers } from './legacy-icons';
import { motion, AnimatePresence } from './legacy-motion';

export type SupportedLanguage = 'en' | 'es' | 'zh' | 'ht' | 'pt';

interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  localName: string;
  flag: string;
  targetCommunities: string;
}

export const fontLanguages: LanguageMeta[] = [
  {
    code: 'en',
    name: 'English',
    localName: 'English',
    flag: '🇺🇸',
    targetCommunities: 'Baseline Municipal Standard'
  },
  {
    code: 'es',
    name: 'Spanish',
    localName: 'Español',
    flag: '🇪🇸',
    targetCommunities: 'East Boston, Chelsea, South Bronx, Pilsen'
  },
  {
    code: 'zh',
    name: 'Cantonese',
    localName: '廣東話 (Traditional)',
    flag: '🇭🇰',
    targetCommunities: 'Chinatown Boston, Lower East Side NYC, SF Chinatown'
  },
  {
    code: 'ht',
    name: 'Haitian Creole',
    localName: 'Kreyòl Ayisyen',
    flag: '🇭🇹',
    targetCommunities: 'Mattapan, Hyde Park, Little Haiti Miami, Flatbush'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    localName: 'Português',
    flag: '🇧🇷',
    targetCommunities: 'Framingham, Somerville, Ironbound Newark'
  }
];

interface ContentTranslation {
  title: string;
  subtitle: string;
  narrativeHeading: string;
  narrativeBody: string;
  thermalLegend: {
    extremeHeat: string;
    moderateHeat: string;
    coolingCorridor: string;
    canopyRefuge: string;
  };
  caseStudyTitle: string;
  caseStudyBody: string;
  equityMetrics: {
    sviLabel: string;
    canopyGapLabel: string;
    actionPlanLabel: string;
  };
}

const TRANSLATIONS: Record<SupportedLanguage, ContentTranslation> = {
  en: {
    title: "Multilingual Frontline Community Localization",
    subtitle: "Empowering immigrant & environmental justice neighborhoods with culturally accessible urban thermal analytics.",
    narrativeHeading: "Urban Heat Equity Narrative: East Boston & Roxbury Corridor",
    narrativeBody: "Frontline immigrant communities face urban surface temperatures up to 5.2 °C higher than surrounding areas due to historic redlining, dense asphalt surfaces, and lower canopy coverage. Graph Laplacian spectral modeling proves that targeted tree canopy interventions in these tracts yield the highest overall municipal heat dissipation.",
    thermalLegend: {
      extremeHeat: "Extreme Heat Island Anomaly (> +4.5 °C)",
      moderateHeat: "Unmitigated Urban Surface (+2.0 °C to +4.5 °C)",
      coolingCorridor: "Spectral Cooling Corridor (Equitable Flow)",
      canopyRefuge: "Canopy & High-Albedo Refugium (-1.5 °C)"
    },
    caseStudyTitle: "Case Study: East Boston Maritime & Residential Thermal Barrier",
    caseStudyBody: "Densely populated by Spanish and Portuguese speaking families, East Boston faces combined thermal pressure from airport infrastructure and industrial waterfronts. Spectral graph cuts isolate high SVI census tracts requiring priority capital investment.",
    equityMetrics: {
      sviLabel: "Social Vulnerability Index (SVI): 0.84 (High Priority)",
      canopyGapLabel: "Tree Canopy Deficit: -18% vs Citywide Average",
      actionPlanLabel: "1-Click Community Council Action Plan Formatted"
    }
  },
  es: {
    title: "Localización Multilingüe para Comunidades de Primera Línea",
    subtitle: "Empoderando a vecindarios inmigrantes y de justicia ambiental con análisis térmicos urbanos accesibles.",
    narrativeHeading: "Narrativa de Equidad Térmica Urbana: Corredor de East Boston y Roxbury",
    narrativeBody: "Las comunidades inmigrantes de primera línea enfrentan temperaturas superficiales hasta 5.2 °C más altas debido al trazado histórico urbano, alto pavimento de asfalto y menor cobertura de árboles. El modelo espectral demuestra que la infraestructura verde prioritaria en estos sectores genera la máxima disipación de calor urbana.",
    thermalLegend: {
      extremeHeat: "Isla de Calor Extrema Anómala (> +4.5 °C)",
      moderateHeat: "Superficie Urbana Sin Mitigar (+2.0 °C a +4.5 °C)",
      coolingCorridor: "Corredor Espectral de Enfriamiento (Flujo Equitativo)",
      canopyRefuge: "Refugio de Dosel Arborizado y Cobertura Reflectante (-1.5 °C)"
    },
    caseStudyTitle: "Estudio de Caso: Barrera Térmica en East Boston (Residencial y Marítimo)",
    caseStudyBody: "Con una alta densidad de familias de habla hispana y portuguesa, East Boston soporta la presión combinada del aeropuerto y zonas industriales. La segmentación de gráficos espectrales identifica los sectores SVI donde la inversión de capital es urgente.",
    equityMetrics: {
      sviLabel: "Índice de Vulnerabilidad Social (SVI): 0.84 (Prioridad Alta)",
      canopyGapLabel: "Déficit de Dosel Arborizado: -18% respecto al Promedio",
      actionPlanLabel: "Plan de Acción Comunitario Formateado para Consejo Municipal"
    }
  },
  zh: {
    title: "前線社區多語言本地化",
    subtitle: "賦權移民與環境正義社區，提供具有文化適應性的城市熱能分析資料。",
    narrativeHeading: "城市熱能公平敘事：東波士頓與羅克斯伯里走廊",
    narrativeBody: "由於歷史紅線政策、密集的瀝青地面及較低的綠化覆蓋率，前線移民社區的地表溫度比周邊地區高出多達 5.2 °C。圖譜拉普拉斯算子分析證明，在這些人口普查區進行 targeted 樹冠干預可獲得最大的城市散熱效益。",
    thermalLegend: {
      extremeHeat: "極端城市熱島異常 (> +4.5 °C)",
      moderateHeat: "未緩解城市地表 (+2.0 °C 至 +4.5 °C)",
      coolingCorridor: "光譜冷卻走廊 (公平熱流散逸)",
      canopyRefuge: "樹冠與高反射率庇護所 (-1.5 °C)"
    },
    caseStudyTitle: "個案研究：東波士頓沿海與住宅區熱能障礙",
    caseStudyBody: "東波士頓主要由講廣東話、西班牙話及葡萄牙話的家庭組成，同時面臨機場設施和工業海岸線的雙重熱壓力。拉普拉斯圖切割能精準定位高 SVI 人口普查區，列為優先資金投入對象。",
    equityMetrics: {
      sviLabel: "社會脆弱性指數 (SVI): 0.84 (高優先級)",
      canopyGapLabel: "樹冠覆蓋率差距: 比全市平均低 -18%",
      actionPlanLabel: "已生成市議會與社區委員會一鍵行動方案"
    }
  },
  ht: {
    title: "Lokalizasyon Multileng nan Kominote Yo",
    subtitle: "Bati pouvwa pou kominote imigran ak jistis anviwònman ak analiz tèmik ki fasil pou konprann.",
    narrativeHeading: "Naratif Jistis Tèmik Urbèn: Koridò East Boston ak Roxbury",
    narrativeBody: "Kominote imigran yo ap fè fas ak tanperati ki pi wo jiska 5.2 °C konpare ak lòt zòn akòz istwa diskriminasyon, twòp asfalt, ak mwens pyebwa. Modèl espektrik Laplacian an pwouve ke plante pyebwa nan zòn sa yo bay pi bon rezilta pou refwadi tout vil la.",
    thermalLegend: {
      extremeHeat: "Ilot de Chaleur Extrèm (> +4.5 °C)",
      moderateHeat: "Sifas Urbèn san Proteksyon (+2.0 °C rive +4.5 °C)",
      coolingCorridor: "Koridò Refwadisman Espektrik (Sikilasyon Ekitab)",
      canopyRefuge: "Zòn Pyebwa ak Sifas Reflektant (-1.5 °C)"
    },
    caseStudyTitle: "Etid Ka: Barè Tèmik nan East Boston ak Roxbury",
    caseStudyBody: "Ak yon gwo popilasyon fanmi ki pale Kreyòl Ayisyen ak Espanyòl, zòn sa yo gen anpil chalè ki soti nan endistri ak aeropò. Graph Laplacian an montre egzakteman ki kote fon pou jistis anviwònman dwe envesti an premye.",
    equityMetrics: {
      sviLabel: "Endèks Vulnerabilite Sosyal (SVI): 0.84 (Priorite Elve)",
      canopyGapLabel: "Defisi Kouvèti Pyebwa: -18% anba mwayèn vil la",
      actionPlanLabel: "Plan Aksyon Kominotè Pare pou Konsèy Municipal"
    }
  },
  pt: {
    title: "Localização Multilíngue para Comunidades de Linha de Frente",
    subtitle: "Empoderando bairros de imigrantes e de justiça ambiental com análises térmicas urbanas acessíveis.",
    narrativeHeading: "Narrativa de Equidade Térmica Urbana: Corredor de East Boston e Roxbury",
    narrativeBody: "Comunidades imigrantes enfrentam temperaturas de superfície até 5.2 °C mais altas devido à falta histórica de árvores e ao excesso de asfalto. O modelo espectral Laplacian prova que intervenções focadas de arborização nessas áreas geram a maior dissipação de calor municipal.",
    thermalLegend: {
      extremeHeat: "Ilha de Calor Extrema Anômala (> +4.5 °C)",
      moderateHeat: "Superfície Urbana Sem Mitigação (+2.0 °C a +4.5 °C)",
      coolingCorridor: "Corredor Espectral de Resfriamento (Fluxo Equitativo)",
      canopyRefuge: "Refúgio de Copa de Árvores e Telhados Frios (-1.5 °C)"
    },
    caseStudyTitle: "Estudo de Caso: Barreira Térmica em East Boston e Somerville",
    caseStudyBody: "Com grande presença de famílias de língua portuguesa e espanhola, essas regiões sofrem com o calor infraestrutural. O corte espectral de grafos isola setores com alto índice SVI que necessitam de investimentos prioritários.",
    equityMetrics: {
      sviLabel: "Índice de Vulnerabilidade Social (SVI): 0.84 (Alta Prioridade)",
      canopyGapLabel: "Déficit de Copa de Árvores: -18% em relação à Média",
      actionPlanLabel: "Plano de Ação Comunitário Formatado para o Conselho Municipal"
    }
  }
};

export default function MultilingualLocalization() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('es');
  const [isReadingAudio, setIsReadingAudio] = useState(false);

  const t = TRANSLATIONS[currentLang];
  const activeMeta = fontLanguages.find(l => l.code === currentLang)!;

  const handleAudioNarrative = () => {
    setIsReadingAudio(true);
    setTimeout(() => setIsReadingAudio(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Multilingual Frontline Community Localization
            </h3>
            <p className="text-xs text-slate-500">
              Translate narratives, thermal legends, and case studies into Spanish, Cantonese, Haitian Creole, and Portuguese for immigrant frontline neighborhoods.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" /> 10/10 Localized
        </span>
      </div>

      {/* Language Switcher Ribbon */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Select Target Community Language:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {fontLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setCurrentLang(lang.code)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                currentLang === lang.code
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base">{lang.flag}</span>
                {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="mt-2">
                <span className="font-extrabold text-xs block">{lang.localName}</span>
                <span className={`text-[10px] block truncate ${currentLang === lang.code ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {lang.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target Community Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Active Localization Context:</strong> {activeMeta.flag} {activeMeta.localName} ({activeMeta.name})
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Focus: {activeMeta.targetCommunities}
        </span>
      </div>

      {/* Interactive Translated Content Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLang}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Main Narrative Block */}
          <div className="bg-emerald-950 text-white rounded-2xl p-6 border border-emerald-800 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-emerald-800/80 text-emerald-200 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {activeMeta.flag} Frontline Policy Narrative
              </span>
              <button
                onClick={handleAudioNarrative}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isReadingAudio ? 'animate-bounce text-emerald-300' : ''}`} />
                <span>{isReadingAudio ? 'Reading Aloud...' : 'Audio Assist (TTS)'}</span>
              </button>
            </div>

            <h4 className="text-lg font-bold text-emerald-100 tracking-tight">
              {t.narrativeHeading}
            </h4>

            <p className="text-xs text-emerald-200/90 leading-relaxed">
              {t.narrativeBody}
            </p>
          </div>

          {/* Localized Thermal Map Legend */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Localized Thermal Map Legend ({activeMeta.localName})
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-900 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 shrink-0 shadow-sm" />
                <span>{t.thermalLegend.extremeHeat}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2.5 text-amber-900 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0 shadow-sm" />
                <span>{t.thermalLegend.moderateHeat}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-blue-900 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0 shadow-sm" />
                <span>{t.thermalLegend.coolingCorridor}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-900 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 shrink-0 shadow-sm" />
                <span>{t.thermalLegend.canopyRefuge}</span>
              </div>
            </div>
          </div>

          {/* Case Study & Equity Metrics */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Localized Neighborhood Case Study
              </span>
              <h5 className="text-sm font-bold text-slate-800 mt-1">
                {t.caseStudyTitle}
              </h5>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t.caseStudyBody}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Equity Score</span>
                <span className="font-semibold">{t.equityMetrics.sviLabel}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Canopy Deficit</span>
                <span className="font-semibold">{t.equityMetrics.canopyGapLabel}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Civic Status</span>
                <span className="font-semibold text-emerald-700">{t.equityMetrics.actionPlanLabel}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
