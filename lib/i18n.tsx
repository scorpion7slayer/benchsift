import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";

import { animateContent } from "./content-motion";

export type Lang = "fr" | "en";

export interface Translations {
  benchmarkUi: {
    search: string;
    sort: string;
    byScore: string;
    byCost: string;
    byTime: string;
    configurations: string;
    bestOnly: string;
    allEfforts: string;
    costBasis: string;
    methodology: string;
    runs: string;
  };
  compareWorkspace: {
    lead: string;
    search: string;
    configurations: string;
    start: string;
    startHint: string;
    essential: string;
    pricing: string;
    all: string;
    metrics: string;
    differences: string;
    share: string;
    copied: string;
    failed: string;
    addSecond: string;
    legend: string;
    scrollHint: string;
    noMetrics: string;
    yes: string;
    no: string;
  };
  analytics: {
    title: string;
    bannerTitle: string;
    bannerDescription: string;
    description: string;
    duration: string;
    accept: string;
    reject: string;
    manage: string;
    accepted: string;
    rejected: string;
    undecided: string;
    close: string;
    saveFailed: string;
  };
  trust: {
    privacy: string;
    legal: string;
    accessibility: string;
    skip: string;
    privacyLead: string;
    privacySections: Array<{ title: string; body: string }>;
    legalLead: string;
    legalSections: Array<{ title: string; body: string }>;
    accessibilityLead: string;
    accessibilitySections: Array<{ title: string; body: string }>;
    regulator: string;
    licenses: string;
    resetFilters: string;
    catalogNote: string;
    modelsDevSource: string;
    contact: string;
    privacyContact: string;
    legalContact: string;
  };
  brand: string;
  nav: {
    back: string;
    source: string;
    feedback: string;
    codingAgents: string;
    deepSwe: string;
    models: string;
    about: string;
    otherBenchmarks: string;
    dataSources: string;
    huggingFace: string;
    buyMeACoffee: string;
  };
  hero: {
    title: string;
    description: string;
    latestModels: string;
    previousModel: string;
    nextModel: string;
  };
  about: {
    title: string;
    lead: string;
    browseModels: string;
    compareModels: string;
    definitionTitle: string;
    definitionBody: string;
    whyTitle: string;
    whyBody: string;
    differences: Array<{ title: string; description: string }>;
    sourcesTitle: string;
    sourcesLead: string;
    sources: {
      artificialAnalysis: string;
      openRouter: string;
      huggingFace: string;
      modelsDev: string;
    };
    visitSource: string;
    limitsTitle: string;
    limitsBody: string;
    openWeightsBody: string;
    relationshipTitle: string;
    relationshipBody: string;
    gratitudeBody: string;
    alternativeToLead: string;
    alternativeToCta: string;
  };
  grid: {
    showMore: string;
    search: string;
    sortBy: string;
    viewModes: {
      label: string;
      normal: string;
      normalDescription: string;
      advanced: string;
      advancedDescription: string;
    };
    ranking: {
      label: string;
      description: string;
      general: string;
      coding: string;
      math: string;
      speed: string;
      price: string;
      rank: (position: number) => string;
    };
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
      price_asc: string;
      price_desc: string;
      newest: string;
      name: string;
    };
    sortGroups: {
      indices: string;
      benchmarks: string;
      performance: string;
      openrouter: string;
      pricing: string;
      general: string;
    };
    weightAccess: {
      label: string;
      all: string;
      open: string;
      closed: string;
    };
    results: (n: number, total: number) => string;
    noResults: string;
    noOptions: string;
    loadingDetails: string;
    unavailableTitle: string;
    unavailableDescription: string;
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
  catalog: {
    title: string;
    description: string;
    sortedBy: string;
    explore: string;
    directoryLabel: string;
    model: string;
    page: (page: number, totalPages: number) => string;
    pagination: string;
    previous: string;
    next: string;
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
    unavailableBadge: string;
  };
  detail: {
    reasoningConfiguration: string;
    reasoningConfigurationDescription: string;
    reasoningLevels: {
      default: string;
      nonReasoning: string;
      reasoning: string;
      adaptiveReasoning: string;
      thinking: string;
      minimal: string;
      low: string;
      medium: string;
      high: string;
      xhigh: string;
      max: string;
    };
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
    cacheWrite: string;
    reasoningTokens: string;
    webSearch: string;
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
    maxOutputTokens: string;
    supportedParameters: string;
    deprecationDate: string;
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
    unavailableTitle: string;
    unavailableDescription: string;
    fableUnavailableDescription: string;
    unavailableSource: string;
    modalityLabels: { text: string; image: string; speech: string; video: string };
  };
  compare: {
    title: string;
    description: string;
    selectedCount: (n: number) => string;
    select: string;
    maxReached: string;
    clear: string;
    compare: string;
    addMore: string;
    addModel: string;
    loading: string;
    backToList: string;
    noModels: string;
    emptyTitle: string;
    emptyDescription: string;
    emptySearchLabel: string;
    emptySearchHint: string;
    emptyGuideTitle: string;
    emptySteps: Array<{ title: string; description: string }>;
    legend: {
      label: string;
      best: string;
      close: string;
      intermediate: string;
      behind: string;
    };
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
  error: { title: string; description: string; rateLimitDescription: (s: number) => string; retry: string };
  notFound: {
    title: string;
    description: string;
    home: string;
    browse: string;
    status: string;
    scanLabel: string;
    zeroMatches: string;
  };
  agents: {
    title: string;
    description: string;
    indexLabel: string;
    indexTooltip: string;
    benchmarks: {
      deep_swe: string;
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
    versions: string;
    comparison: string;
    scoringNodeId: string;
    scoringExitCode: string;
    sharedConfigs: string;
    delta: string;
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
      confidence: string;
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
    terminalbench_v2_1: string;
    tau2: string;
    tau_banking: string;
    humaneval: string;
    omniscience: string;
    multilingual: string;
    mmmu_pro: string;
    critpt: string;
    gdpval: string;
    gdpval_normalized: string;
    apex_agents: string;
    itbench_aa: string;
    omniscience_non_hallucination: string;
  };
}

const T: Record<Lang, Translations> = {
  fr: {
    benchmarkUi: {
      "search": "Rechercher un modèle ou un harnais…",
      "sort": "Trier le classement",
      "byScore": "Score le plus élevé",
      "byCost": "Coût le plus bas",
      "byTime": "Exécution la plus rapide",
      "configurations": "configurations",
      "bestOnly": "Meilleure configuration",
      "allEfforts": "Tous les efforts",
      "costBasis": "Base du coût",
      "methodology": "Méthode et versions",
      "runs": "passes"
},
    compareWorkspace: {
      "lead": "Jusqu’à quatre modèles, les mêmes critères, côte à côte.",
      "search": "Rechercher un modèle ou un fournisseur…",
      "configurations": "Chaque niveau de réflexion reste une configuration distincte.",
      "start": "Un point de départ",
      "startHint": "Choisissez un modèle du catalogue ou utilisez la recherche.",
      "essential": "Essentiel",
      "pricing": "Prix",
      "all": "Tout",
      "metrics": "Mesures",
      "differences": "Différences uniquement",
      "share": "Copier le lien",
      "copied": "Lien copié",
      "failed": "La sélection n’a pas pu être mise à jour. Réessayez.",
      "addSecond": "Ajoutez un deuxième modèle pour lire les écarts.",
      "legend": "✓ Meilleure valeur publiée parmi les modèles mesurés. — Donnée indisponible. Les métriques ne constituent pas un classement global.",
      "scrollHint": "Faites défiler le tableau horizontalement pour voir tous les modèles.",
      "noMetrics": "Aucune mesure disponible pour cette vue.",
      "yes": "Oui",
      "no": "Non"
},
    analytics: {
      title: "Autoriser l’analyse de navigation ?",
      bannerTitle: "Préférences et audience",
      bannerDescription: "Rybbit : visites, performances, clics, copies, formulaires et relecture de sessions (saisies masquées), avec votre accord. Refuser ne limite pas le site.",
      description: "Avec votre accord, Rybbit mesure les visites, les performances et les interactions (clics, copies, formulaires) et permet la relecture de sessions pour améliorer BenchSift. Les saisies sont masquées dans les relectures. Refuser ne limite pas le site.",
      duration: "Votre choix est conservé 180 jours. Modifiez-le à tout moment via « Préférences de confidentialité » en bas de page. Le retrait recharge la page.",
      accept: "Accepter",
      reject: "Refuser",
      manage: "Préférences de confidentialité",
      accepted: "Choix actuel : analyse autorisée. Refuser retire votre accord.",
      rejected: "Choix actuel : analyse refusée.",
      undecided: "Aucun choix enregistré : Rybbit est désactivé.",
      close: "Fermer",
      saveFailed: "Le choix n’a pas pu être enregistré. Vérifiez que votre navigateur autorise les cookies fonctionnels du site.",
    },
    trust: {
      "contact": "Contact",
      "privacyContact": "Pour une question sur vos données personnelles ou pour exercer vos droits, vous pouvez contacter Théo Darville à l’adresse suivante :",
      "legalContact": "Pour contacter Théo Darville au sujet de BenchSift :",
      "privacy": "Confidentialité",
      "legal": "Mentions légales",
      "accessibility": "Accessibilité",
      "skip": "Aller au contenu",
      "privacyLead": "Vos préférences restent locales. Rybbit ne se charge qu’avec votre accord.",
      "privacySections": [
            {
                  "title": "Responsable du traitement",
                  "body": "Théo Darville est responsable des traitements de données liés à BenchSift, un site gratuit développé à titre personnel en Belgique."
            },
            {
                  "title": "Ce que le site conserve",
                  "body": "La langue et le thème choisis sont mémorisés pendant un an dans des cookies fonctionnels. Le thème, le mode du catalogue et la sélection de comparaison peuvent aussi rester dans le stockage local du navigateur jusqu’à leur suppression. Ces données servent à retrouver vos choix ; elles ne servent pas à la publicité."
            },
            {
                  "title": "Statistiques et services tiers",
                  "body": "Avec votre consentement, le site charge Rybbit depuis rybbit.nxtaigen.com pour comprendre les visites et améliorer le service : pages et paramètres d’URL, navigation, liens sortants, clics, copies, interactions avec les formulaires, erreurs et performances. La relecture de sessions est activée ; les valeurs saisies y sont masquées. Le serveur de statistiques reçoit aussi des informations techniques de connexion. Aucun script Rybbit ne se charge avant votre accord ou après un refus. Cette instance est hébergée sur le même VPS OVHcloud à Gravelines (GRA), en France. Les relectures de sessions utilisent la conservation par défaut de Rybbit, annoncée à 30 jours. La durée de conservation des statistiques de visite reste à vérifier. Les polices et logos sont hébergés avec le site ; les données du catalogue sont récupérées par le serveur auprès des sources citées. Les services ouverts via des liens externes appliquent leurs propres règles."
            },
            {
                  "title": "Hébergement et journaux techniques",
                  "body": "Le site fonctionne sur un VPS OVHcloud à Gravelines (GRA), en France, administré avec Dokploy. L’hébergement et le serveur peuvent traiter l’adresse IP, l’heure, l’URL demandée et des informations techniques pour délivrer les pages et assurer la sécurité. Les journaux techniques et les sauvegardes sont conservés pendant 30 jours."
            },
            {
                  "title": "Vos choix et vos droits",
                  "body": "Votre accord ou refus pour Rybbit est conservé 180 jours dans le cookie fonctionnel benchsift_analytics_v1. Le stockage local transmet ce choix aux autres onglets, sans prolonger sa validité. Le bouton « Préférences de confidentialité » en bas de chaque page permet de refuser ou de retirer votre accord. Le retrait recharge la page pour arrêter le suivi ; il n’efface pas les données déjà collectées. Vous pouvez supprimer les cookies et le stockage du site dans les paramètres de votre navigateur pour réinitialiser vos préférences. Le RGPD prévoit notamment des droits d’accès, de rectification, d’effacement, de limitation et, selon le traitement, d’opposition ou de portabilité. Une réclamation peut être adressée à l’Autorité de protection des données belge."
            }
      ],
      "legalLead": "BenchSift est un site gratuit et indépendant, développé par Théo Darville à titre personnel en Belgique.",
      "legalSections": [
            {
                  "title": "Édition et hébergement",
                  "body": "Théo Darville édite et développe BenchSift en solo, sans société, depuis la Belgique. Le site est hébergé sur un VPS OVHcloud à Gravelines (GRA), en France. Dokploy est l’outil de déploiement. L’entité contractuelle précise de l’hébergeur reste à confirmer."
            },
            {
                  "title": "Données, sources et limites",
                  "body": "Artificial Analysis fournit les benchmarks et mesures principales. OpenRouter complète les capacités et les informations commerciales ; Hugging Face fournit les métadonnées des dépôts. Models.dev complète les modèles et certaines spécifications manquantes. Une donnée absente reste absente. Les prix, disponibilités et résultats peuvent évoluer : vérifiez la source avant une décision."
            },
            {
                  "title": "Indépendance et droits",
                  "body": "BenchSift n’est ni affilié ni approuvé par les fournisseurs cités. Les marques et logos appartiennent à leurs titulaires. Le code du projet est sous licence MIT ; cela ne transfère pas les droits sur les données ou les marques tierces. Les icônes Rune normal sont utilisées sous licence Apache 2.0. Les mentions de licence sont disponibles avec le site."
            }
      ],
      "accessibilityLead": "Le site vise WCAG 2.2 AA. Cette page ne constitue pas une certification de conformité.",
      "accessibilitySections": [
            {
                  "title": "Fonctions disponibles",
                  "body": "Navigation au clavier, lien d’accès direct au contenu, contrastes des thèmes clair et sombre, boutons nommés et prise en compte de la réduction des animations. Les filtres, la comparaison et les informations sur les modèles restent accessibles sur mobile."
            },
            {
                  "title": "État de la vérification",
                  "body": "Des contrôles techniques et des vérifications dans le navigateur accompagnent les modifications. Un audit indépendant complet et des tests avec plusieurs lecteurs d’écran restent nécessaires avant de déclarer une conformité totale."
            }
      ],
      "regulator": "Autorité de protection des données belge",
      "licenses": "Licences des ressources",
      "resetFilters": "Réinitialiser les filtres",
      "catalogNote": "Les modèles sans score restent consultables en mode Avancé.",
      "modelsDevSource": "Spécifications complémentaires et modèles absents des autres sources, sans remplacer les benchmarks d’Artificial Analysis."
},
    brand: "BenchSift",
    nav: {
      back: "Retour",
      source: "Artificial Analysis",
      feedback: "Feedback",
      codingAgents: "Coding Agents",
      deepSwe: "DeepSWE",
      models: "Modèles",
      about: "À propos",
      otherBenchmarks: "Autres benchmarks",
      dataSources: "Sources de données",
      huggingFace: "Hugging Face",
      buyMeACoffee: "Offrir un café",
    },
    hero: {
      title: "Modèles d'IA",
      description: "Comparez les performances, les prix et les capacités des modèles, avec leurs sources.",
      latestModels: "Derniers modèles",
      previousModel: "Modèle précédent",
      nextModel: "Modèle suivant",
    },
    about: {
      title: "À propos de BenchSift",
      lead: "BenchSift est un projet indépendant qui rassemble des données dispersées sur les modèles d’IA dans une interface plus simple à parcourir, en français comme en anglais.",
      browseModels: "Parcourir les modèles",
      compareModels: "Comparer des modèles",
      definitionTitle: "Ce qu’est BenchSift",
      definitionBody: "BenchSift réunit des scores de benchmarks, des mesures de performance, des prix, des capacités, des tendances d’usage et des liens vers les modèles. Le but est de faciliter une première comparaison sans devoir recouper plusieurs sites et tableaux.",
      whyTitle: "Pourquoi une autre interface",
      whyBody: "BenchSift ne cherche pas à inventer un nouvel indice. Il organise des données existantes pour répondre plus vite à une question concrète : quels modèles méritent d’être examinés selon mon usage ?",
      differences: [
        {
          title: "Une première lecture plus simple",
          description: "Le mode Normal privilégie le classement et les informations essentielles, sans imposer tous les scores.",
        },
        {
          title: "Le détail reste disponible",
          description: "Le mode Advanced conserve les benchmarks, prix, vitesses et capacités pour celles et ceux qui veulent vérifier plus loin.",
        },
        {
          title: "Plusieurs sources, une seule fiche",
          description: "Les informations complémentaires sont réunies sans effacer leur provenance.",
        },
        {
          title: "Des absences visibles",
          description: "Quand une donnée n’existe pas, BenchSift préfère l’indiquer plutôt que de fabriquer une estimation.",
        },
      ],
      sourcesTitle: "D’où viennent les données",
      sourcesLead: "BenchSift agrège et présente des données produites ou publiées par d’autres services. Il ne prétend pas avoir exécuté les benchmarks affichés.",
      sources: {
        modelsDev: "Spécifications complémentaires et modèles absents des autres sources, sans remplacer les benchmarks d’Artificial Analysis.",
        artificialAnalysis: "Source essentielle pour les indices, benchmarks et nombreuses mesures de performance. BenchSift réorganise ces données sans se les attribuer.",
        openRouter: "Complète les fiches avec des informations comme les prix, le contexte, les modalités et les tendances d’usage disponibles.",
        huggingFace: "Aide à relier les modèles open weight à leurs dépôts officiels et à présenter des informations utiles sur leur disponibilité.",
      },
      visitSource: "Visiter la source",
      limitsTitle: "Pourquoi BenchSift n’exécute pas ses propres benchmarks",
      limitsBody: "Je développe BenchSift comme un projet indépendant. Un benchmark sérieux entraîne des coûts d’API, de calcul, de stockage et de maintenance que je ne peux pas financer aujourd’hui.",
      openWeightsBody: "Pour les modèles open weight, il faut en plus posséder ou louer le matériel adapté — notamment des GPU et suffisamment de mémoire — parfois à très grande échelle. Je ne dispose pas de cette infrastructure.",
      relationshipTitle: "Une alternative, pas un concurrent",
      relationshipBody: "BenchSift ne se présente pas comme un concurrent d’Artificial Analysis. J’admire leur travail et leur site ; j’ai simplement voulu proposer une porte d’entrée plus simplifiée pour un autre niveau de lecture.",
      gratitudeBody: "Sans le travail d’Artificial Analysis, BenchSift n’aurait pas pu exister sous cette forme. Pour la méthodologie détaillée et les données à leur source, leur site reste la référence à consulter.",
      alternativeToLead: "BenchSift est également référencé comme alternative sur AlternativeTo, où le projet et ses principales caractéristiques sont présentés.",
      alternativeToCta: "Voir la fiche BenchSift sur AlternativeTo",
    },
    grid: {
      showMore: "Afficher plus de modèles",
      search: "Rechercher un modèle ou un fournisseur…",
      sortBy: "Trier par",
      viewModes: {
        label: "Niveau de détail",
        normal: "Normal",
        normalDescription: "Un classement simple, sans scores ni benchmarks.",
        advanced: "Advanced",
        advancedDescription: "Tous les benchmarks, performances, prix et détails.",
      },
      ranking: {
        label: "Classer par",
        description: "Les modèles sans donnée pour le critère choisi sont exclus.",
        general: "Général",
        coding: "Code",
        math: "Maths",
        speed: "Vitesse",
        price: "Prix",
        rank: (position) => `Rang ${position}`,
      },
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
        price_asc: "Prix (moins cher)",
        price_desc: "Prix (plus cher)",
        newest: "Date (plus récent)",
        name: "Nom (A–Z)",
      },
      sortGroups: {
        indices: "Indices AA",
        benchmarks: "Benchmarks",
        performance: "Performance",
        openrouter: "OpenRouter",
        pricing: "Prix",
        general: "Général",
      },
      weightAccess: {
        label: "Accès aux poids",
        all: "Poids : tous",
        open: "Poids ouverts",
        closed: "Poids fermés",
      },
      results: (n, total) =>
        n === total ? `${n} modèle${n !== 1 ? "s" : ""}` : `${n} résultat${n !== 1 ? "s" : ""} sur ${total}`,
      noResults: "Aucun modèle ne correspond à votre recherche.",
      noOptions: "Aucune option ne correspond à votre recherche.",
      loadingDetails: "Chargement des benchmarks et détails avancés…",
      unavailableTitle: "Catalogue temporairement indisponible",
      unavailableDescription: "Les données réelles des modèles n'ont pas pu être chargées. Réessayez dans un instant.",
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
    catalog: {
      title: "Répertoire des modèles",
      description: "Retrouvez toutes les fiches BenchSift dans un répertoire léger et complet, puis ouvrez chaque modèle pour explorer ses benchmarks, prix et capacités.",
      sortedBy: "classé par fournisseur et par nom",
      explore: "Explorer avec les filtres",
      directoryLabel: "Répertoire alphabétique des modèles",
      model: "Modèle",
      page: (page, totalPages) => `Page ${page} sur ${totalPages}`,
      pagination: "Pagination du catalogue de modèles",
      previous: "Précédent",
      next: "Suivant",
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
      unavailableBadge: "Indisponible actuellement",
    },
    detail: {
      reasoningConfiguration: "Niveau de réflexion",
      reasoningConfigurationDescription: "Les scores, performances et prix affichés correspondent à la configuration sélectionnée.",
      reasoningLevels: {
        default: "Par défaut",
        nonReasoning: "Sans réflexion",
        reasoning: "Raisonnement",
        adaptiveReasoning: "Raisonnement adaptatif",
        thinking: "Thinking",
        minimal: "Minimal",
        low: "Faible",
        medium: "Moyen",
        high: "Élevé",
        xhigh: "Très élevé",
        max: "Maximum",
      },
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
      cacheWrite: "Écriture cache",
      reasoningTokens: "Tokens de raisonnement",
      webSearch: "Recherche web",
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
      maxOutputTokens: "Sortie maximale",
      supportedParameters: "Paramètres OpenRouter",
      deprecationDate: "Fin OpenRouter",
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
      unavailableTitle: "Indisponible actuellement",
      unavailableDescription: "Artificial Analysis marque actuellement ce modèle comme indisponible.",
      fableUnavailableDescription: "Une directive du gouvernement américain oblige Anthropic à suspendre l'accès à Fable 5 et Mythos 5 pour tous les utilisateurs. Anthropic travaille à rétablir l'accès dès que possible, sans annoncer de date.",
      unavailableSource: "Lire l'annonce Anthropic",
      modalityLabels: { text: "texte", image: "image", speech: "audio", video: "vidéo" },
    },
    compare: {
      title: "Comparateur de modèles",
      description: "Comparez les écarts utiles entre benchmarks, vitesse, prix et capacités, configuration par configuration.",
      selectedCount: (n) => `${n} modèle${n > 1 ? "s" : ""} comparé${n > 1 ? "s" : ""}`,
      select: "modèle(s) sélectionné(s)",
      maxReached: "Maximum 4 modèles",
      clear: "Effacer",
      compare: "Comparer",
      addMore: "Ajoutez jusqu'à 4 modèles pour commencer la comparaison",
      addModel: "Ajouter un modèle",
      loading: "Chargement de la comparaison…",
      backToList: "Retour à la liste",
      noModels: "Aucun modèle sélectionné",
      emptyTitle: "Construisez votre comparaison",
      emptyDescription: "Commencez par un modèle, puis ajoutez-en jusqu'à quatre pour voir où chaque configuration prend l'avantage.",
      emptySearchLabel: "Rechercher le premier modèle",
      emptySearchHint: "Essayez GPT, Claude, Gemini, Qwen ou le nom d'un fournisseur.",
      emptyGuideTitle: "Du premier choix au verdict",
      emptySteps: [
        { title: "Choisissez une configuration", description: "Les niveaux de réflexion restent distincts pour comparer les bons scores." },
        { title: "Lisez les écarts utiles", description: "Benchmarks, vitesse, prix et capacités sont réunis dans une seule vue." },
        { title: "Partagez le résultat", description: "Votre sélection reste dans l'URL pour être retrouvée ou envoyée." },
      ],
      legend: {
        label: "Position relative",
        best: "Meilleur",
        close: "Proche",
        intermediate: "Intermédiaire",
        behind: "En retrait",
      },
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
    error: {
      title: "Un problème est survenu",
      description: "Impossible de charger les données. Réessaie dans un instant.",
      rateLimitDescription: (_s) => "Impossible de charger les données. Réessaie dans un instant.",
      retry: "Réessayer",
    },
    notFound: {
      title: "Cette page est introuvable",
      description: "Cette adresse ne correspond à aucune page ni à aucun modèle du catalogue. Le contenu a peut-être été déplacé ou supprimé.",
      home: "Retour à l’accueil",
      browse: "Parcourir les modèles",
      status: "Page introuvable",
      scanLabel: "Index BenchSift",
      zeroMatches: "Aucun résultat",
    },
    agents: {
      title: "Agents de programmation",
      description: "Comparez les configurations modèle + harnais mesurées par Artificial Analysis : score, coût et temps par tâche.",
      indexLabel: "Coding Agent Index",
      indexTooltip: "Indice publié par Artificial Analysis. Les composantes et leurs versions ci-dessous proviennent de la source ; elles restent distinctes des résultats DeepSWE de Datacurve.",
      benchmarks: {
        deep_swe: "DeepSWE",
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
      sourceNote: "Données via Artificial Analysis · vérification toutes les 6 heures. Le rang reste celui de l’index après filtrage.",
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
      versions: "Version du benchmark",
      comparison: "Différences v1.1 vs v1",
      scoringNodeId: "v1.1 — notation par identifiant de test (node-id), version stable de juin 2026.",
      scoringExitCode: "v1 — notation historique par code de sortie, version figée de mai 2026.",
      sharedConfigs: "Configs communes",
      delta: "Écart",
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
        confidence: "IC 95 %",
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
      terminalbench_v2_1: "Terminal-Bench 2.1",
      tau2: "τ²-Bench",
      tau_banking: "τ-Bench Banking",
      humaneval: "HumanEval",
      omniscience: "AA-Omniscience",
      multilingual: "Multilingual AA",
      mmmu_pro: "MMMU Pro",
      critpt: "CritPt",
      gdpval: "GDPval-AA",
      gdpval_normalized: "GDPval-AA normalisé",
      apex_agents: "APEX-Agents-AA",
      itbench_aa: "ITBench-AA",
      omniscience_non_hallucination: "AA-Omniscience Non-Hallucination",
    },
  },
  en: {
    benchmarkUi: {
      "search": "Search for a model or harness…",
      "sort": "Sort leaderboard",
      "byScore": "Highest score",
      "byCost": "Lowest cost",
      "byTime": "Fastest execution",
      "configurations": "configurations",
      "bestOnly": "Best configuration",
      "allEfforts": "All effort levels",
      "costBasis": "Cost basis",
      "methodology": "Method and versions",
      "runs": "runs"
},
    compareWorkspace: {
      "lead": "Up to four models, the same criteria, side by side.",
      "search": "Search for a model or provider…",
      "configurations": "Each reasoning level remains a separate configuration.",
      "start": "A starting point",
      "startHint": "Choose a catalogue model or use the search.",
      "essential": "Essentials",
      "pricing": "Pricing",
      "all": "All",
      "metrics": "Metrics",
      "differences": "Differences only",
      "share": "Copy link",
      "copied": "Link copied",
      "failed": "The selection could not be updated. Please try again.",
      "addSecond": "Add a second model to see the differences.",
      "legend": "✓ Best published value among measured models. — Data unavailable. These metrics do not establish an overall ranking.",
      "scrollHint": "Scroll the table horizontally to see all models.",
      "noMetrics": "No measurements available for this view.",
      "yes": "Yes",
      "no": "No"
},
    analytics: {
      title: "Allow navigation analytics?",
      bannerTitle: "Preferences and analytics",
      bannerDescription: "Rybbit: visits, performance, clicks, copies, forms and session replay (masked inputs), with your permission. Refusing does not limit the site.",
      description: "With your permission, Rybbit measures visits, performance and interactions (clicks, copies, forms), including session replay, to improve BenchSift. Input values are masked in replays. Refusing does not limit the site.",
      duration: "Your choice is stored for 180 days. Change it at any time using “Privacy preferences” in the footer. Withdrawal reloads the page.",
      accept: "Accept",
      reject: "Reject",
      manage: "Privacy preferences",
      accepted: "Current choice: analytics allowed. Reject to withdraw your consent.",
      rejected: "Current choice: analytics rejected.",
      undecided: "No choice stored: Rybbit is disabled.",
      close: "Close",
      saveFailed: "Your choice could not be saved. Check that your browser allows the site’s functional cookies.",
    },
    trust: {
      "contact": "Contact",
      "privacyContact": "For questions about your personal data or to exercise your rights, you can contact Théo Darville at the following address:",
      "legalContact": "To contact Théo Darville about BenchSift:",
      "privacy": "Privacy",
      "legal": "Legal notice",
      "accessibility": "Accessibility",
      "skip": "Skip to content",
      "privacyLead": "Your preferences stay local. Rybbit only loads with your permission.",
      "privacySections": [
            {
                  "title": "Data controller",
                  "body": "Théo Darville is responsible for data processing associated with BenchSift, a free website developed as a personal project in Belgium."
            },
            {
                  "title": "What the site stores",
                  "body": "Your chosen language and theme are remembered for one year in functional cookies. The theme, catalogue mode and comparison selection may also remain in browser local storage until you delete them. These values restore your choices; they are not used for advertising."
            },
            {
                  "title": "Analytics and external services",
                  "body": "With your consent, the site loads Rybbit from rybbit.nxtaigen.com to understand visits and improve the service: pages and URL parameters, navigation, outbound links, clicks, copies, form interactions, errors and performance. Session replay is enabled; input values are masked in replays. The analytics server also receives technical connection information. No Rybbit script loads before acceptance or after refusal. This instance is hosted on the same OVHcloud VPS in Gravelines (GRA), France. Session replays use Rybbit’s default retention, documented as 30 days. Retention of visit statistics still needs verification. Fonts and logos are hosted with the site; catalogue data is fetched by the server from the attributed sources. Services opened through external links apply their own rules."
            },
            {
                  "title": "Hosting and technical logs",
                  "body": "The site runs on an OVHcloud VPS in Gravelines (GRA), France, administered with Dokploy. Hosting and server software may process IP addresses, timestamps, requested URLs and technical information to deliver pages and maintain security. Technical logs and backups are retained for 30 days."
            },
            {
                  "title": "Your choices and rights",
                  "body": "Your acceptance or refusal of Rybbit is stored for 180 days in the functional benchsift_analytics_v1 cookie. Local storage signals this choice to other tabs without extending its validity. “Privacy preferences” in the footer lets you refuse or withdraw consent. Withdrawal reloads the page to stop tracking; it does not delete data already collected. You can delete site cookies and local storage in your browser settings to reset your preferences. The GDPR provides rights including access, rectification, erasure, restriction and, depending on the processing, objection or portability. You may lodge a complaint with the Belgian Data Protection Authority."
            }
      ],
      "legalLead": "BenchSift is a free, independent website developed by Théo Darville as a personal project in Belgium.",
      "legalSections": [
            {
                  "title": "Publisher and hosting",
                  "body": "Théo Darville publishes and develops BenchSift independently from Belgium, without a company. The site is hosted on an OVHcloud VPS in Gravelines (GRA), France. Dokploy is the deployment tool. The precise contractual hosting entity still needs confirmation."
            },
            {
                  "title": "Data, sources and limitations",
                  "body": "Artificial Analysis provides the primary benchmarks and measurements. OpenRouter adds capabilities and commercial information; Hugging Face provides repository metadata. Models.dev adds models and selected missing specifications. Missing data stays missing. Prices, availability and results can change: check the source before making a decision."
            },
            {
                  "title": "Independence and rights",
                  "body": "BenchSift is not affiliated with or endorsed by the listed providers. Trademarks and logos belong to their owners. The project code is MIT licensed; this does not transfer rights to third-party data or brands. Rune normal icons are used under Apache 2.0. Asset licence notices are available with the site."
            }
      ],
      "accessibilityLead": "The site targets WCAG 2.2 AA. This page is not a certification of compliance.",
      "accessibilitySections": [
            {
                  "title": "Available features",
                  "body": "Keyboard navigation, a skip-to-content link, light and dark theme contrast, named controls and support for reduced motion. Filters, comparison and model information remain available on mobile."
            },
            {
                  "title": "Verification status",
                  "body": "Technical checks and browser verification accompany changes. A complete independent audit and testing with several screen readers are still needed before claiming full conformance."
            }
      ],
      "regulator": "Belgian Data Protection Authority",
      "licenses": "Asset licences",
      "resetFilters": "Reset filters",
      "catalogNote": "Models without scores remain available in Advanced mode.",
      "modelsDevSource": "Additional specifications and models missing from other sources, without replacing Artificial Analysis benchmarks."
},
    brand: "BenchSift",
    nav: {
      back: "Back",
      source: "Artificial Analysis",
      feedback: "Feedback",
      codingAgents: "Coding Agents",
      deepSwe: "DeepSWE",
      models: "Models",
      about: "About",
      otherBenchmarks: "Other benchmarks",
      dataSources: "Data sources",
      huggingFace: "Hugging Face",
      buyMeACoffee: "Buy me a coffee",
    },
    hero: {
      title: "AI Models",
      description: "Compare model performance, pricing and capabilities, with sources you can check.",
      latestModels: "Latest models",
      previousModel: "Previous model",
      nextModel: "Next model",
    },
    about: {
      title: "About BenchSift",
      lead: "BenchSift is an independent project that brings scattered AI model data into an interface that is easier to browse, in both English and French.",
      browseModels: "Browse models",
      compareModels: "Compare models",
      definitionTitle: "What BenchSift is",
      definitionBody: "BenchSift brings together benchmark scores, performance measurements, pricing, capabilities, usage trends, and model links. Its purpose is to make an initial comparison easier without requiring you to cross-reference several websites and tables.",
      whyTitle: "Why another interface",
      whyBody: "BenchSift does not try to invent a new index. It organizes existing data to answer a practical question more quickly: which models are worth examining for my use case?",
      differences: [
        {
          title: "A simpler first read",
          description: "Normal mode prioritizes rankings and essential information without forcing every score into view.",
        },
        {
          title: "The detail remains available",
          description: "Advanced mode keeps benchmarks, pricing, speed, and capabilities for people who want to investigate further.",
        },
        {
          title: "Several sources, one profile",
          description: "Complementary information is brought together without hiding where it came from.",
        },
        {
          title: "Missing data stays visible",
          description: "When a value does not exist, BenchSift would rather say so than manufacture an estimate.",
        },
      ],
      sourcesTitle: "Where the data comes from",
      sourcesLead: "BenchSift aggregates and presents data produced or published by other services. It does not claim to have run the benchmarks it displays.",
      sources: {
        modelsDev: "Additional specifications and models missing from other sources, without replacing Artificial Analysis benchmarks.",
        artificialAnalysis: "An essential source for indices, benchmarks, and many performance measurements. BenchSift reorganizes this data without claiming it as its own.",
        openRouter: "Complements model profiles with available information such as pricing, context, modalities, and usage trends.",
        huggingFace: "Helps connect open-weight models to their official repositories and surface useful information about their availability.",
      },
      visitSource: "Visit source",
      limitsTitle: "Why BenchSift does not run its own benchmarks",
      limitsBody: "I build BenchSift as an independent project. Serious benchmarking carries API, compute, storage, and maintenance costs that I cannot fund today.",
      openWeightsBody: "Open-weight models also require owning or renting suitable hardware — especially GPUs with enough memory — sometimes at a very large scale. I do not have that infrastructure.",
      relationshipTitle: "An alternative, not a competitor",
      relationshipBody: "BenchSift does not position itself as a competitor to Artificial Analysis. I admire their work and their website; I simply wanted to offer a more streamlined entry point for a different level of reading.",
      gratitudeBody: "Without the work of Artificial Analysis, BenchSift could not have existed in this form. For detailed methodology and data at its source, their website remains the reference to consult.",
      alternativeToLead: "BenchSift is also listed as an alternative on AlternativeTo, where the project and its main characteristics are presented.",
      alternativeToCta: "View the BenchSift listing on AlternativeTo",
    },
    grid: {
      showMore: "Show more models",
      search: "Search a model or provider…",
      sortBy: "Sort by",
      viewModes: {
        label: "Level of detail",
        normal: "Normal",
        normalDescription: "A simple ranking without scores or benchmarks.",
        advanced: "Advanced",
        advancedDescription: "Every benchmark, performance metric, price and detail.",
      },
      ranking: {
        label: "Rank by",
        description: "Models without data for the selected criterion are excluded.",
        general: "Overall",
        coding: "Coding",
        math: "Math",
        speed: "Speed",
        price: "Price",
        rank: (position) => `Rank ${position}`,
      },
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
        price_asc: "Price (cheapest)",
        price_desc: "Price (most expensive)",
        newest: "Date (newest)",
        name: "Name (A–Z)",
      },
      sortGroups: {
        indices: "AA indices",
        benchmarks: "Benchmarks",
        performance: "Performance",
        openrouter: "OpenRouter",
        pricing: "Pricing",
        general: "General",
      },
      weightAccess: {
        label: "Weight access",
        all: "Weights: all",
        open: "Open weights",
        closed: "Closed weights",
      },
      results: (n, total) =>
        n === total ? `${n} model${n !== 1 ? "s" : ""}` : `${n} result${n !== 1 ? "s" : ""} of ${total}`,
      noResults: "No models match your search.",
      noOptions: "No options match your search.",
      loadingDetails: "Loading benchmarks and advanced details…",
      unavailableTitle: "Catalog temporarily unavailable",
      unavailableDescription: "The live model data could not be loaded. Please try again in a moment.",
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
    catalog: {
      title: "Model directory",
      description: "Find every BenchSift model page in one lightweight directory, then open a model to explore its benchmarks, pricing, and capabilities.",
      sortedBy: "sorted by provider and name",
      explore: "Explore with filters",
      directoryLabel: "Alphabetical model directory",
      model: "Model",
      page: (page, totalPages) => `Page ${page} of ${totalPages}`,
      pagination: "Model catalog pagination",
      previous: "Previous",
      next: "Next",
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
      unavailableBadge: "Not currently available",
    },
    detail: {
      reasoningConfiguration: "Reasoning level",
      reasoningConfigurationDescription: "Scores, performance, and pricing reflect the selected configuration.",
      reasoningLevels: {
        default: "Default",
        nonReasoning: "Non-reasoning",
        reasoning: "Reasoning",
        adaptiveReasoning: "Adaptive reasoning",
        thinking: "Thinking",
        minimal: "Minimal",
        low: "Low",
        medium: "Medium",
        high: "High",
        xhigh: "Extra high",
        max: "Maximum",
      },
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
      cacheWrite: "Cache write",
      reasoningTokens: "Reasoning tokens",
      webSearch: "Web search",
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
      maxOutputTokens: "Maximum output",
      supportedParameters: "OpenRouter parameters",
      deprecationDate: "OpenRouter sunset",
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
      unavailableTitle: "Not currently available",
      unavailableDescription: "Artificial Analysis currently marks this model as unavailable.",
      fableUnavailableDescription: "A US government directive requires Anthropic to suspend access to Fable 5 and Mythos 5 for all users. Anthropic is working to restore access as soon as possible, with no return date announced.",
      unavailableSource: "Read Anthropic's announcement",
      modalityLabels: { text: "text", image: "image", speech: "speech", video: "video" },
    },
    compare: {
      title: "Model Comparator",
      description: "Compare meaningful differences across benchmarks, speed, pricing, and capabilities, configuration by configuration.",
      selectedCount: (n) => `${n} model${n === 1 ? "" : "s"} compared`,
      select: "model(s) selected",
      maxReached: "Maximum 4 models",
      clear: "Clear",
      compare: "Compare",
      addMore: "Add up to 4 models to start comparing",
      addModel: "Add a model",
      loading: "Loading comparison…",
      backToList: "Back to list",
      noModels: "No models selected",
      emptyTitle: "Build your comparison",
      emptyDescription: "Start with one model, then add up to four to see where each configuration has an advantage.",
      emptySearchLabel: "Find the first model",
      emptySearchHint: "Try GPT, Claude, Gemini, Qwen, or a provider name.",
      emptyGuideTitle: "From first choice to verdict",
      emptySteps: [
        { title: "Choose a configuration", description: "Reasoning levels stay separate so you compare the right scores." },
        { title: "Read meaningful gaps", description: "Benchmarks, speed, pricing, and capabilities share one view." },
        { title: "Share the result", description: "Your selection stays in the URL so it can be revisited or sent." },
      ],
      legend: {
        label: "Relative position",
        best: "Best",
        close: "Close",
        intermediate: "Intermediate",
        behind: "Behind",
      },
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
    error: {
      title: "Something went wrong",
      description: "Unable to load data. Please try again in a moment.",
      rateLimitDescription: (_s) => "Unable to load data. Please try again in a moment.",
      retry: "Try again",
    },
    notFound: {
      title: "This page could not be found",
      description: "This address does not match any page or model in the catalogue. The content may have been moved or removed.",
      home: "Back to home",
      browse: "Browse models",
      status: "Page not found",
      scanLabel: "BenchSift index",
      zeroMatches: "No matches",
    },
    agents: {
      title: "Coding Agents",
      description: "Compare model + harness configurations measured by Artificial Analysis: score, cost and time per task.",
      indexLabel: "Coding Agent Index",
      indexTooltip: "Index published by Artificial Analysis. Components and versions below come from the source; they remain distinct from Datacurve’s DeepSWE results.",
      benchmarks: {
        deep_swe: "DeepSWE",
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
      sourceNote: "Data from Artificial Analysis · checked every 6 hours. Filtering preserves the index rank.",
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
      versions: "Benchmark version",
      comparison: "v1.1 vs v1 differences",
      scoringNodeId: "v1.1 — node-id test scoring, stable June 2026 release.",
      scoringExitCode: "v1 — historical exit-code scoring, frozen May 2026 release.",
      sharedConfigs: "Shared configs",
      delta: "Delta",
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
        confidence: "95% CI",
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
      terminalbench_v2_1: "Terminal-Bench 2.1",
      tau2: "τ²-Bench",
      tau_banking: "τ-Bench Banking",
      humaneval: "HumanEval",
      omniscience: "AA-Omniscience",
      multilingual: "Multilingual AA",
      mmmu_pro: "MMMU Pro",
      critpt: "CritPt",
      gdpval: "GDPval-AA",
      gdpval_normalized: "Normalized GDPval-AA",
      apex_agents: "APEX-Agents-AA",
      itbench_aa: "ITBench-AA",
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
  const motion = useRef<Animation | null>(null);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `benchsift_lang=${l};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = l;
    motion.current = animateContent(document.querySelector('main'), motion.current);
  }, []);
  useEffect(() => () => motion.current?.cancel(), []);

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
