"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

export type Lang = "fr" | "en";

export interface Translations {
  brand: string;
  nav: { back: string; source: string; feedback: string };
  hero: { title: string; description: string; latestModels: string };
  grid: {
    search: string;
    sortBy: string;
    sorts: {
      intelligence: string;
      coding: string;
      math: string;
      gpqa: string;
      mmlu_pro: string;
      hle: string;
      livecodebench: string;
      math_500: string;
      aime_25: string;
      speed: string;
      ttft: string;
      price_asc: string;
      price_desc: string;
      newest: string;
      name: string;
    };
    results: (n: number, total: number) => string;
    noResults: string;
    models: string;
    allProviders: string;
    showAll: string;
    allModels: string;
    newModels: string;
  };
  card: {
    intelligence: string;
    coding: string;
    math: string;
    speed: string;
    ttft: string;
    price1m: string;
    iqLabel: string;
    addCompare: string;
    removeCompare: string;
    newBadge: string;
    thinkingBadge: string;
  };
  detail: {
    aaIndices: string;
    standardBenchmarks: string;
    performance: string;
    pricing: string;
    outputSpeed: string;
    ttft: string;
    firstAnswer: string;
    inputTokens: string;
    outputTokens: string;
    blended: string;
    blendedTooltip: string;
    intelligenceIndex: string;
    releaseDate: string;
    extraBenchmarks: string;
    capabilities: string;
    contextWindow: string;
    modalities: string;
    inputModality: string;
    outputModality: string;
    reasoning: string;
    openWeights: string;
    closedWeights: string;
    agenticIndex: string;
    totalParams: string;
    activeParams: string;
    modalityLabels: { text: string; image: string; speech: string; video: string };
  };
  compare: {
    title: string;
    select: string;
    maxReached: string;
    clear: string;
    compare: string;
    addMore: string;
    backToList: string;
    noModels: string;
    sections: {
      info: string;
      capabilities: string;
      aaIndices: string;
      benchmarks: string;
      performance: string;
      pricing: string;
    };
    fields: {
      provider: string;
      releaseDate: string;
      outputSpeed: string;
      ttft: string;
      firstAnswer: string;
      inputPrice: string;
      outputPrice: string;
      blendedPrice: string;
    };
    best: string;
    wins: (n: number) => string;
    model: string;
    remove: string;
  };
  footer: { via: string; cache: string };
  cookies: { message: string; accept: string; decline: string };
  error: { title: string; description: string; rateLimitDescription: (s: number) => string; retry: string };
  benchmarks: {
    intelligence: string;
    coding: string;
    math: string;
    agentic: string;
    mmlu_pro: string;
    gpqa: string;
    hle: string;
    livecodebench: string;
    scicode: string;
    math_500: string;
    aime: string;
    aime_25: string;
    ifbench: string;
    lcr: string;
    terminalbench_hard: string;
    tau2: string;
    humaneval: string;
    omniscience: string;
    multilingual: string;
    mmmu_pro: string;
    critpt: string;
    gdpval: string;
  };
}

const T: Record<Lang, Translations> = {
  fr: {
    brand: "Nxt AI Card",
    nav: { back: "Retour", source: "Artificial Analysis", feedback: "Feedback" },
    hero: {
      title: "Modèles d'IA",
      description: "Benchmarks, performances et prix — données via Artificial Analysis. Mis à jour toutes les heures.",
      latestModels: "Latest models",
    },
    grid: {
      search: "Rechercher un modèle ou un fournisseur…",
      sortBy: "Trier par",
      sorts: {
        intelligence: "Intelligence (meilleur)",
        coding: "Coding (meilleur)",
        math: "Math (meilleur)",
        gpqa: "GPQA (meilleur)",
        mmlu_pro: "MMLU Pro (meilleur)",
        hle: "HLE (meilleur)",
        livecodebench: "LiveCodeBench (meilleur)",
        math_500: "MATH-500 (meilleur)",
        aime_25: "AIME 2025 (meilleur)",
        speed: "Vitesse (plus rapide)",
        ttft: "TTFT (plus rapide)",
        price_asc: "Prix (moins cher)",
        price_desc: "Prix (plus cher)",
        newest: "Date (plus récent)",
        name: "Nom (A–Z)",
      },
      results: (n, total) =>
        n === total ? `${n} modèle${n !== 1 ? "s" : ""}` : `${n} résultat${n !== 1 ? "s" : ""} sur ${total}`,
      noResults: "Aucun modèle ne correspond à votre recherche.",
      models: "modèles",
      allProviders: "Tous les fournisseurs",
      showAll: "Tout afficher",
      allModels: "Tous les modèles",
      newModels: "Nouveaux (30 j)",
    },
    card: {
      intelligence: "Intelligence",
      coding: "Coding",
      math: "Math",
      speed: "Vitesse",
      ttft: "TTFT",
      price1m: "Prix/1M",
      iqLabel: "Intelligence",
      addCompare: "Ajouter à la comparaison",
      removeCompare: "Retirer de la comparaison",
      newBadge: "Nouveau",
      thinkingBadge: "Thinking",
    },
    detail: {
      aaIndices: "Indices Artificial Analysis",
      standardBenchmarks: "Benchmarks standard",
      performance: "Performance",
      pricing: "Tarification (par million de tokens)",
      outputSpeed: "Vitesse de sortie",
      ttft: "Temps 1er token (TTFT)",
      firstAnswer: "Temps 1ère réponse",
      inputTokens: "Tokens d'entrée",
      outputTokens: "Tokens de sortie",
      blended: "Blended (3:1)",
      blendedTooltip: "Prix moyen pondéré basé sur un ratio typique d'utilisation : (3× prix entrée + 1× prix sortie) ÷ 4.",
      intelligenceIndex: "Intelligence Index",
      releaseDate: "Date de sortie",
      extraBenchmarks: "Benchmarks supplémentaires",
      capabilities: "Capacités",
      contextWindow: "Fenêtre de contexte",
      modalities: "Modalités",
      inputModality: "Entrée",
      outputModality: "Sortie",
      reasoning: "Raisonnement",
      openWeights: "Poids ouverts",
      closedWeights: "Poids fermés",
      agenticIndex: "Agentic Index",
      totalParams: "Paramètres totaux",
      activeParams: "Paramètres actifs",
      modalityLabels: { text: "texte", image: "image", speech: "audio", video: "vidéo" },
    },
    compare: {
      title: "Comparateur de modèles",
      select: "modèle(s) sélectionné(s)",
      maxReached: "Maximum 4 modèles",
      clear: "Effacer",
      compare: "Comparer",
      addMore: "Sélectionnez au moins 2 modèles pour comparer",
      backToList: "Retour à la liste",
      noModels: "Aucun modèle sélectionné",
      sections: {
        info: "Informations",
        capabilities: "Capacités",
        aaIndices: "Indices AA",
        benchmarks: "Benchmarks",
        performance: "Performance",
        pricing: "Prix / 1M tokens",
      },
      fields: {
        provider: "Fournisseur",
        releaseDate: "Date de sortie",
        outputSpeed: "Vitesse",
        ttft: "TTFT",
        firstAnswer: "Temps 1ère réponse",
        inputPrice: "Entrée",
        outputPrice: "Sortie",
        blendedPrice: "Blended (3:1)",
      },
      best: "Meilleur",
      wins: (n) => `Meilleur dans ${n} catégorie${n > 1 ? "s" : ""}`,
      model: "Modèle",
      remove: "Retirer",
    },
    footer: { via: "Données via", cache: "Cache · 1h" },
    cookies: {
      message: "Ce site utilise des cookies pour mémoriser vos préférences de langue et de thème. Aucune donnée personnelle n'est collectée.",
      accept: "Accepter",
      decline: "Refuser",
    },
    error: {
      title: "Un problème est survenu",
      description: "Impossible de charger les données. Réessaie dans un instant.",
      rateLimitDescription: (_s) => "Impossible de charger les données. Réessaie dans un instant.",
      retry: "Réessayer",
    },
    benchmarks: {
      intelligence: "Intelligence",
      coding: "Coding",
      math: "Math",
      agentic: "Agentic",
      mmlu_pro: "MMLU Pro",
      gpqa: "GPQA Diamond",
      hle: "HLE",
      livecodebench: "LiveCodeBench",
      scicode: "SciCode",
      math_500: "MATH-500",
      aime: "AIME 2024",
      aime_25: "AIME 2025",
      ifbench: "IFBench",
      lcr: "AA-LCR",
      terminalbench_hard: "TerminalBench Hard",
      tau2: "τ²-Bench",
      humaneval: "HumanEval",
      omniscience: "AA-Omniscience",
      multilingual: "Multilingual AA",
      mmmu_pro: "MMMU Pro",
      critpt: "CritPt",
      gdpval: "GDPval-AA",
    },
  },
  en: {
    brand: "Nxt AI Card",
    nav: { back: "Back", source: "Artificial Analysis", feedback: "Feedback" },
    hero: {
      title: "AI Models",
      description: "Benchmarks, performance and pricing — data via Artificial Analysis. Updated every hour.",
      latestModels: "Latest models",
    },
    grid: {
      search: "Search a model or provider…",
      sortBy: "Sort by",
      sorts: {
        intelligence: "Intelligence (best)",
        coding: "Coding (best)",
        math: "Math (best)",
        gpqa: "GPQA (best)",
        mmlu_pro: "MMLU Pro (best)",
        hle: "HLE (best)",
        livecodebench: "LiveCodeBench (best)",
        math_500: "MATH-500 (best)",
        aime_25: "AIME 2025 (best)",
        speed: "Speed (fastest)",
        ttft: "TTFT (fastest)",
        price_asc: "Price (cheapest)",
        price_desc: "Price (most expensive)",
        newest: "Date (newest)",
        name: "Name (A–Z)",
      },
      results: (n, total) =>
        n === total ? `${n} model${n !== 1 ? "s" : ""}` : `${n} result${n !== 1 ? "s" : ""} of ${total}`,
      noResults: "No models match your search.",
      models: "models",
      allProviders: "All providers",
      showAll: "Show all",
      allModels: "All models",
      newModels: "New (30 days)",
    },
    card: {
      intelligence: "Intelligence",
      coding: "Coding",
      math: "Math",
      speed: "Speed",
      ttft: "TTFT",
      price1m: "Price/1M",
      iqLabel: "Intelligence",
      addCompare: "Add to comparison",
      removeCompare: "Remove from comparison",
      newBadge: "New",
      thinkingBadge: "Thinking",
    },
    detail: {
      aaIndices: "Artificial Analysis Indices",
      standardBenchmarks: "Standard Benchmarks",
      performance: "Performance",
      pricing: "Pricing (per million tokens)",
      outputSpeed: "Output speed",
      ttft: "Time to first token (TTFT)",
      firstAnswer: "Time to first answer",
      inputTokens: "Input tokens",
      outputTokens: "Output tokens",
      blended: "Blended (3:1)",
      blendedTooltip: "Weighted average price based on a typical usage ratio: (3× input price + 1× output price) ÷ 4.",
      intelligenceIndex: "Intelligence Index",
      releaseDate: "Release date",
      extraBenchmarks: "Additional benchmarks",
      capabilities: "Capabilities",
      contextWindow: "Context window",
      modalities: "Modalities",
      inputModality: "Input",
      outputModality: "Output",
      reasoning: "Reasoning",
      openWeights: "Open weights",
      closedWeights: "Closed weights",
      agenticIndex: "Agentic Index",
      totalParams: "Total parameters",
      activeParams: "Active parameters",
      modalityLabels: { text: "text", image: "image", speech: "speech", video: "video" },
    },
    compare: {
      title: "Model Comparator",
      select: "model(s) selected",
      maxReached: "Maximum 4 models",
      clear: "Clear",
      compare: "Compare",
      addMore: "Select at least 2 models to compare",
      backToList: "Back to list",
      noModels: "No models selected",
      sections: {
        info: "Information",
        capabilities: "Capabilities",
        aaIndices: "AA Indices",
        benchmarks: "Benchmarks",
        performance: "Performance",
        pricing: "Price / 1M tokens",
      },
      fields: {
        provider: "Provider",
        releaseDate: "Release date",
        outputSpeed: "Speed",
        ttft: "TTFT",
        firstAnswer: "First answer",
        inputPrice: "Input",
        outputPrice: "Output",
        blendedPrice: "Blended (3:1)",
      },
      best: "Best",
      wins: (n) => `Best in ${n} categor${n > 1 ? "ies" : "y"}`,
      model: "Model",
      remove: "Remove",
    },
    footer: { via: "Data via", cache: "Cache · 1h" },
    cookies: {
      message: "This site uses cookies to remember your language and theme preferences. No personal data is collected.",
      accept: "Accept",
      decline: "Decline",
    },
    error: {
      title: "Something went wrong",
      description: "Unable to load data. Please try again in a moment.",
      rateLimitDescription: (_s) => "Unable to load data. Please try again in a moment.",
      retry: "Try again",
    },
    benchmarks: {
      intelligence: "Intelligence",
      coding: "Coding",
      math: "Math",
      agentic: "Agentic",
      mmlu_pro: "MMLU Pro",
      gpqa: "GPQA Diamond",
      hle: "HLE",
      livecodebench: "LiveCodeBench",
      scicode: "SciCode",
      math_500: "MATH-500",
      aime: "AIME 2024",
      aime_25: "AIME 2025",
      ifbench: "IFBench",
      lcr: "AA-LCR",
      terminalbench_hard: "TerminalBench Hard",
      tau2: "τ²-Bench",
      humaneval: "HumanEval",
      omniscience: "AA-Omniscience",
      multilingual: "Multilingual AA",
      mmmu_pro: "MMMU Pro",
      critpt: "CritPt",
      gdpval: "GDPval-AA",
    },
  },
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextValue>({
  lang: "fr",
  setLang: () => {},
  t: T.fr,
});

export function LanguageProvider({
  children,
  initialLang = "fr",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `nxtaicard_lang=${l};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: T[lang] }), [lang, setLang]);

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
}

export function useI18n() {
  return useContext(LangContext);
}
