import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";

export type Lang = "fr" | "en";

export interface Translations {
  brand: string;
  nav: { back: string; source: string; feedback: string; codingAgents: string; deepSwe: string; models: string };
  hero: {
    title: string;
    description: string;
    latestModels: string;
    previousModel: string;
    nextModel: string;
  };
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
      openrouter_popular: string;
      open_weights: string;
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
    categories: {
      all: string;
      new: string;
      text: string;
      image: string;
      embeddings: string;
      audio: string;
      video: string;
      rerank: string;
      speech: string;
      transcription: string;
    };
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
    openrouter: string;
    weeklyTokens: string;
    weeklyRequests: string;
    agentic: string;
    designArena: string;
    huggingface: string;
    openWeightsBadge: string;
    viewOnHuggingFace: string;
  };
  detail: {
    aaIndices: string;
    standardBenchmarks: string;
    mediaBenchmarks: string;
    noBenchmarks: string;
    noBenchmarksDescription: string;
    appearances: string;
    performance: string;
    pricing: string;
    outputSpeed: string;
    ttft: string;
    firstAnswer: string;
    openrouterWeeklyRank: string;
    openrouterWeeklyTokens: string;
    openrouterWeeklyRequests: string;
    openrouterWeeklyToolCalls: string;
    openrouterWeeklyImages: string;
    openrouterWeeklyAudioInputs: string;
    endToEnd: string;
    endToEndTooltip: string;
    inputTokens: string;
    outputTokens: string;
    cacheHit: string;
    cacheHitTooltip: string;
    blended: string;
    blendedTooltip: string;
    blended721: string;
    blended721Tooltip: string;
    intelligenceIndex: string;
    releaseDate: string;
    knowledgeCutoff: string;
    knowledgeCutoffTooltip: string;
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
    opennessIndex: string;
    opennessTooltip: string;
    totalParams: string;
    activeParams: string;
    intelligenceTokens: string;
    intelligenceTokensTooltip: string;
    intelligenceCost: string;
    intelligenceCostTooltip: string;
    metaInfo: string;
    modalityLabels: { text: string; image: string; speech: string; video: string };
  };
  compare: {
    title: string;
    select: string;
    maxReached: string;
    clear: string;
    compare: string;
    addMore: string;
    addModel: string;
    backToList: string;
    noModels: string;
    sections: {
      info: string;
      capabilities: string;
      aaIndices: string;
      benchmarks: string;
      performance: string;
      pricing: string;
      meta: string;
    };
    fields: {
      provider: string;
      releaseDate: string;
      knowledgeCutoff: string;
      outputSpeed: string;
      ttft: string;
      firstAnswer: string;
      endToEnd: string;
      inputPrice: string;
      outputPrice: string;
      cacheHitPrice: string;
      blendedPrice: string;
      blended721Price: string;
      opennessIndex: string;
      verbosity: string;
      evalCost: string;
      openrouterWeeklyRank: string;
      openrouterWeeklyTokens: string;
      openrouterWeeklyRequests: string;
      openrouterWeeklyToolCalls: string;
      openrouterWeeklyImages: string;
      openrouterWeeklyAudioInputs: string;
    };
    best: string;
    wins: (n: number) => string;
    model: string;
    remove: string;
  };
  footer: { via: string; cache: string };
  cookies: { message: string; accept: string; decline: string };
  error: { title: string; description: string; rateLimitDescription: (s: number) => string; retry: string };
  agents: {
    title: string;
    description: string;
    indexLabel: string;
    indexTooltip: string;
    benchmarks: {
      swe_bench_pro_hard_aa: string;
      terminal_bench_v2: string;
      swe_atlas_qna: string;
    };
    metrics: {
      costPerTask: string;
      timePerTask: string;
      inputTokens: string;
      cachedTokens: string;
      outputTokens: string;
    };
    headers: {
      harness: string;
      model: string;
      index: string;
      cost: string;
      time: string;
    };
    empty: string;
    sourceNote: string;
    navLink: string;
    pageTitle: string;
    knownHarnesses: string;
    previewNotice: string;
    viewOnAA: string;
  };
  deepSwe: {
    title: string;
    description: string;
    methodLabel: string;
    methodDescription: string;
    empty: string;
    sourceNote: string;
    viewOnDeepSwe: string;
    stats: {
      configs: string;
      tasks: string;
      best: string;
      updated: string;
    };
    headers: {
      model: string;
      effort: string;
      cost: string;
      time: string;
      outputTokens: string;
    };
  };
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
    apex_agents: string;
    omniscience_non_hallucination: string;
  };
}

const T: Record<Lang, Translations> = {
  fr: {
    brand: "BenchSift",
    nav: { back: "Retour", source: "Artificial Analysis", feedback: "Feedback", codingAgents: "Coding Agents", deepSwe: "DeepSWE", models: "Modèles" },
    hero: {
      title: "Modèles d'IA",
      description: "Benchmarks texte et média, performances, prix, liens Hugging Face officiels et popularité OpenRouter — données via Artificial Analysis, OpenRouter et Hugging Face.",
      latestModels: "Derniers modèles",
      previousModel: "Modèle précédent",
      nextModel: "Modèle suivant",
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
        openrouter_popular: "Plus populaires OpenRouter",
        open_weights: "Poids ouverts uniquement",
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
      categories: {
        all: "Tous",
        new: "Nouveaux",
        text: "Texte",
        image: "Image",
        embeddings: "Embeddings",
        audio: "Audio",
        video: "Vidéo",
        rerank: "Rerank",
        speech: "Speech",
        transcription: "Transcription",
      },
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
      openrouter: "OpenRouter",
      weeklyTokens: "tokens/sem.",
      weeklyRequests: "req./sem.",
      agentic: "Agentic",
      designArena: "Design Arena",
      huggingface: "Hugging Face",
      openWeightsBadge: "Poids ouverts",
      viewOnHuggingFace: "Voir sur Hugging Face",
    },
    detail: {
      aaIndices: "Indices Artificial Analysis",
      standardBenchmarks: "Benchmarks standard",
      mediaBenchmarks: "Benchmarks média Artificial Analysis",
      noBenchmarks: "Benchmarks indisponibles",
      noBenchmarksDescription: "Aucune donnée de benchmark n'est disponible pour cette catégorie de modèle via les API suivies. Les prix, modalités et liens officiels restent affichés quand ils existent.",
      appearances: "apparitions",
      performance: "Performance",
      pricing: "Tarification",
      outputSpeed: "Vitesse de sortie",
      ttft: "Temps 1er token (TTFT)",
      firstAnswer: "Temps 1ère réponse",
      openrouterWeeklyRank: "Rang OpenRouter hebdo",
      openrouterWeeklyTokens: "Tokens hebdo OpenRouter",
      openrouterWeeklyRequests: "Requêtes hebdo OpenRouter",
      openrouterWeeklyToolCalls: "Tool calls hebdo OpenRouter",
      openrouterWeeklyImages: "Images hebdo OpenRouter",
      openrouterWeeklyAudioInputs: "Audio inputs hebdo OpenRouter",
      endToEnd: "Temps de réponse total (500 t)",
      endToEndTooltip: "Temps total nécessaire pour générer une réponse de 500 tokens. Inclut le temps d'attente initial, le temps de raisonnement (pour les modèles à raisonnement) et le temps de génération.",
      inputTokens: "Tokens d'entrée",
      outputTokens: "Tokens de sortie",
      cacheHit: "Cache Hit",
      cacheHitTooltip: "Prix par token pour les prompts en cache (déjà traités), généralement très réduit par rapport au prix d'entrée standard.",
      blended: "Blended (3:1)",
      blendedTooltip: "Prix moyen pondéré basé sur un ratio typique d'utilisation : (3× prix entrée + 1× prix sortie) ÷ 4.",
      blended721: "Blended (7:2:1)",
      blended721Tooltip: "Prix moyen pondéré incluant le cache : ratio 7:2:1 (Cache Hit : Entrée : Sortie), reflétant les usages modernes avec caching.",
      intelligenceIndex: "Intelligence Index",
      releaseDate: "Date de sortie",
      knowledgeCutoff: "Coupure des connaissances",
      knowledgeCutoffTooltip: "Date jusqu'à laquelle les données d'entraînement du modèle ont été collectées.",
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
      opennessIndex: "Indice d'ouverture",
      opennessTooltip: "Évalue l'ouverture du modèle sur une échelle 0-100 (plus c'est élevé, plus le modèle est ouvert).",
      totalParams: "Paramètres totaux",
      activeParams: "Paramètres actifs",
      intelligenceTokens: "Tokens utilisés (verbosité)",
      intelligenceTokensTooltip: "Nombre total de tokens générés pour exécuter l'Artificial Analysis Intelligence Index. Indique la verbosité du modèle.",
      intelligenceCost: "Coût d'évaluation",
      intelligenceCostTooltip: "Coût total (USD) pour évaluer le modèle sur l'Artificial Analysis Intelligence Index, basé sur le prix par token et le nombre de tokens utilisés.",
      metaInfo: "Méta-informations",
      modalityLabels: { text: "texte", image: "image", speech: "audio", video: "vidéo" },
    },
    compare: {
      title: "Comparateur de modèles",
      select: "modèle(s) sélectionné(s)",
      maxReached: "Maximum 4 modèles",
      clear: "Effacer",
      compare: "Comparer",
      addMore: "Sélectionnez au moins 2 modèles pour comparer",
      addModel: "Ajouter un modèle",
      backToList: "Retour à la liste",
      noModels: "Aucun modèle sélectionné",
      sections: {
        info: "Informations",
        capabilities: "Capacités",
        aaIndices: "Indices AA",
        benchmarks: "Benchmarks",
        performance: "Performance",
        pricing: "Prix / 1M tokens",
        meta: "Méta-évaluation",
      },
      fields: {
        provider: "Fournisseur",
        releaseDate: "Date de sortie",
        knowledgeCutoff: "Coupure connaissances",
        outputSpeed: "Vitesse",
        ttft: "TTFT",
        firstAnswer: "Temps 1ère réponse",
        endToEnd: "Temps total (500 t)",
        inputPrice: "Entrée",
        outputPrice: "Sortie",
        cacheHitPrice: "Cache Hit",
        blendedPrice: "Blended (3:1)",
        blended721Price: "Blended (7:2:1)",
        opennessIndex: "Indice d'ouverture",
        verbosity: "Verbosité",
        evalCost: "Coût d'éval.",
        openrouterWeeklyRank: "Rang OpenRouter hebdo",
        openrouterWeeklyTokens: "Tokens hebdo OpenRouter",
        openrouterWeeklyRequests: "Requêtes hebdo OpenRouter",
        openrouterWeeklyToolCalls: "Tool calls hebdo OpenRouter",
        openrouterWeeklyImages: "Images hebdo OpenRouter",
        openrouterWeeklyAudioInputs: "Audio hebdo OpenRouter",
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
    agents: {
      title: "Agents de programmation",
      description: "Performance des harnais (Claude Code, Cursor CLI, OpenCode…) sur l'Artificial Analysis Coding Agent Index, composé de 3 benchmarks : SWE-Bench-Pro-Hard-AA, Terminal-Bench v2 et SWE-Atlas-QnA.",
      indexLabel: "Coding Agent Index",
      indexTooltip: "Moyenne pass@1 sur les 3 benchmarks (SWE-Bench-Pro-Hard-AA, Terminal-Bench v2, SWE-Atlas-QnA).",
      benchmarks: {
        swe_bench_pro_hard_aa: "SWE-Bench-Pro-Hard-AA",
        terminal_bench_v2: "Terminal-Bench v2",
        swe_atlas_qna: "SWE-Atlas-QnA",
      },
      metrics: {
        costPerTask: "Coût / tâche",
        timePerTask: "Temps / tâche",
        inputTokens: "Tokens entrée",
        cachedTokens: "Tokens cache",
        outputTokens: "Tokens sortie",
      },
      headers: {
        harness: "Harnais",
        model: "Modèle",
        index: "Index",
        cost: "Coût",
        time: "Temps",
      },
      empty: "Données coding agents indisponibles pour l'instant.",
      sourceNote: "Données via Artificial Analysis — mises à jour quotidiennement.",
      navLink: "Coding Agents",
      pageTitle: "Coding Agents — BenchSift",
      knownHarnesses: "Harnais suivis",
      previewNotice: "Artificial Analysis n'expose pas encore d'API publique pour les coding agents. Consultez le classement officiel pour les scores live.",
      viewOnAA: "Voir sur Artificial Analysis",
    },
    deepSwe: {
      title: "DeepSWE",
      description: "Classement Datacurve des agents de programmation sur des tâches de génie logiciel long-horizon, originales et vérifiées par tests.",
      methodLabel: "Méthodologie DeepSWE",
      methodDescription: "DeepSWE mesure des configurations modèle + harnais + effort de raisonnement. Les lignes ci-dessous conservent cette séparation au lieu de fusionner les résultats dans les indices de modèles.",
      empty: "Données DeepSWE indisponibles pour l'instant.",
      sourceNote: "Données via Datacurve DeepSWE.",
      viewOnDeepSwe: "Voir sur DeepSWE",
      stats: {
        configs: "Configurations",
        tasks: "Tâches",
        best: "Meilleur pass@1",
        updated: "Mis à jour",
      },
      headers: {
        model: "Modèle",
        effort: "Effort",
        cost: "Coût",
        time: "Temps",
        outputTokens: "Tokens sortie",
      },
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
      apex_agents: "APEX-Agents-AA",
      omniscience_non_hallucination: "AA-Omniscience Non-Hallucination",
    },
  },
  en: {
    brand: "BenchSift",
    nav: { back: "Back", source: "Artificial Analysis", feedback: "Feedback", codingAgents: "Coding Agents", deepSwe: "DeepSWE", models: "Models" },
    hero: {
      title: "AI Models",
      description: "Text and media benchmarks, performance, pricing, official Hugging Face links and OpenRouter popularity — data via Artificial Analysis, OpenRouter and Hugging Face.",
      latestModels: "Latest models",
      previousModel: "Previous model",
      nextModel: "Next model",
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
        openrouter_popular: "Most popular on OpenRouter",
        open_weights: "Open weights only",
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
      categories: {
        all: "All",
        new: "New",
        text: "Text",
        image: "Image",
        embeddings: "Embeddings",
        audio: "Audio",
        video: "Video",
        rerank: "Rerank",
        speech: "Speech",
        transcription: "Transcription",
      },
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
      openrouter: "OpenRouter",
      weeklyTokens: "tokens/wk",
      weeklyRequests: "req/wk",
      agentic: "Agentic",
      designArena: "Design Arena",
      huggingface: "Hugging Face",
      openWeightsBadge: "Open weights",
      viewOnHuggingFace: "View on Hugging Face",
    },
    detail: {
      aaIndices: "Artificial Analysis Indices",
      standardBenchmarks: "Standard Benchmarks",
      mediaBenchmarks: "Artificial Analysis media benchmarks",
      noBenchmarks: "Benchmarks unavailable",
      noBenchmarksDescription: "No benchmark data is available for this model category from the tracked APIs. Pricing, modalities and official links are still shown when available.",
      appearances: "appearances",
      performance: "Performance",
      pricing: "Pricing",
      outputSpeed: "Output speed",
      ttft: "Time to first token (TTFT)",
      firstAnswer: "Time to first answer",
      openrouterWeeklyRank: "OpenRouter weekly rank",
      openrouterWeeklyTokens: "OpenRouter weekly tokens",
      openrouterWeeklyRequests: "OpenRouter weekly requests",
      openrouterWeeklyToolCalls: "OpenRouter weekly tool calls",
      openrouterWeeklyImages: "OpenRouter weekly images",
      openrouterWeeklyAudioInputs: "OpenRouter weekly audio inputs",
      endToEnd: "End-to-end response (500 t)",
      endToEndTooltip: "Total time to generate a 500-token response. Includes the initial wait time, thinking time (for reasoning models), and generation time.",
      inputTokens: "Input tokens",
      outputTokens: "Output tokens",
      cacheHit: "Cache Hit",
      cacheHitTooltip: "Price per token for cached prompts (previously processed), typically offering a significant discount compared to regular input price.",
      blended: "Blended (3:1)",
      blendedTooltip: "Weighted average price based on a typical usage ratio: (3× input price + 1× output price) ÷ 4.",
      blended721: "Blended (7:2:1)",
      blended721Tooltip: "Weighted average price including cache: 7:2:1 ratio (Cache Hit : Input : Output), reflecting modern usage with caching.",
      intelligenceIndex: "Intelligence Index",
      releaseDate: "Release date",
      knowledgeCutoff: "Knowledge cutoff",
      knowledgeCutoffTooltip: "Date up to which the model's training data was collected.",
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
      opennessIndex: "Openness Index",
      opennessTooltip: "Assesses the model's openness on a 0-100 scale (higher is more open).",
      totalParams: "Total parameters",
      activeParams: "Active parameters",
      intelligenceTokens: "Tokens used (verbosity)",
      intelligenceTokensTooltip: "Total number of tokens generated to run the Artificial Analysis Intelligence Index. Indicates the verbosity of the model.",
      intelligenceCost: "Evaluation cost",
      intelligenceCostTooltip: "Total cost (USD) to evaluate the model on the Artificial Analysis Intelligence Index, based on the price per token and the number of tokens used.",
      metaInfo: "Meta-information",
      modalityLabels: { text: "text", image: "image", speech: "speech", video: "video" },
    },
    compare: {
      title: "Model Comparator",
      select: "model(s) selected",
      maxReached: "Maximum 4 models",
      clear: "Clear",
      compare: "Compare",
      addMore: "Select at least 2 models to compare",
      addModel: "Add a model",
      backToList: "Back to list",
      noModels: "No models selected",
      sections: {
        info: "Information",
        capabilities: "Capabilities",
        aaIndices: "AA Indices",
        benchmarks: "Benchmarks",
        performance: "Performance",
        pricing: "Price / 1M tokens",
        meta: "Meta-evaluation",
      },
      fields: {
        provider: "Provider",
        releaseDate: "Release date",
        knowledgeCutoff: "Knowledge cutoff",
        outputSpeed: "Speed",
        ttft: "TTFT",
        firstAnswer: "First answer",
        endToEnd: "End-to-end (500 t)",
        inputPrice: "Input",
        outputPrice: "Output",
        cacheHitPrice: "Cache Hit",
        blendedPrice: "Blended (3:1)",
        blended721Price: "Blended (7:2:1)",
        opennessIndex: "Openness",
        verbosity: "Verbosity",
        evalCost: "Eval cost",
        openrouterWeeklyRank: "OpenRouter weekly rank",
        openrouterWeeklyTokens: "OpenRouter weekly tokens",
        openrouterWeeklyRequests: "OpenRouter weekly requests",
        openrouterWeeklyToolCalls: "OpenRouter weekly tool calls",
        openrouterWeeklyImages: "OpenRouter weekly images",
        openrouterWeeklyAudioInputs: "OpenRouter weekly audio",
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
    agents: {
      title: "Coding Agents",
      description: "Harness performance (Claude Code, Cursor CLI, OpenCode…) on the Artificial Analysis Coding Agent Index, a composite of 3 benchmarks: SWE-Bench-Pro-Hard-AA, Terminal-Bench v2 and SWE-Atlas-QnA.",
      indexLabel: "Coding Agent Index",
      indexTooltip: "Average pass@1 across the 3 benchmarks (SWE-Bench-Pro-Hard-AA, Terminal-Bench v2, SWE-Atlas-QnA).",
      benchmarks: {
        swe_bench_pro_hard_aa: "SWE-Bench-Pro-Hard-AA",
        terminal_bench_v2: "Terminal-Bench v2",
        swe_atlas_qna: "SWE-Atlas-QnA",
      },
      metrics: {
        costPerTask: "Cost / task",
        timePerTask: "Time / task",
        inputTokens: "Input tokens",
        cachedTokens: "Cached tokens",
        outputTokens: "Output tokens",
      },
      headers: {
        harness: "Harness",
        model: "Model",
        index: "Index",
        cost: "Cost",
        time: "Time",
      },
      empty: "Coding agents data unavailable for now.",
      sourceNote: "Data via Artificial Analysis — updated daily.",
      navLink: "Coding Agents",
      pageTitle: "Coding Agents — BenchSift",
      knownHarnesses: "Tracked harnesses",
      previewNotice: "Artificial Analysis does not yet expose a public API for coding agents. Visit the official leaderboard for live scores.",
      viewOnAA: "View on Artificial Analysis",
    },
    deepSwe: {
      title: "DeepSWE",
      description: "Datacurve leaderboard for coding agents on original, long-horizon software engineering tasks with program-based verifiers.",
      methodLabel: "DeepSWE methodology",
      methodDescription: "DeepSWE measures model + harness + reasoning-effort configurations. This page keeps those rows separate instead of folding them into the model indices.",
      empty: "DeepSWE data unavailable for now.",
      sourceNote: "Data via Datacurve DeepSWE.",
      viewOnDeepSwe: "View on DeepSWE",
      stats: {
        configs: "Configurations",
        tasks: "Tasks",
        best: "Best pass@1",
        updated: "Updated",
      },
      headers: {
        model: "Model",
        effort: "Effort",
        cost: "Cost",
        time: "Time",
        outputTokens: "Output tokens",
      },
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
      apex_agents: "APEX-Agents-AA",
      omniscience_non_hallucination: "AA-Omniscience Non-Hallucination",
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
  const transitionTimerRef = useRef<number | null>(null);

  const setLang = useCallback((l: Lang) => {
    const html = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
      html.classList.remove("language-transitioning");
      void html.offsetWidth;
      html.classList.add("language-transitioning");
      transitionTimerRef.current = window.setTimeout(() => {
        html.classList.remove("language-transitioning");
        transitionTimerRef.current = null;
      }, 220);
    }

    setLangState(l);
    document.cookie = `benchsift_lang=${l};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
      document.documentElement.classList.remove("language-transitioning");
    };
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
