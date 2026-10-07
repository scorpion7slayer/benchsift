import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";

import { flushSync } from "react-dom";
import { animateContent } from "./content-motion";
import { runViewTransition } from "./view-transition";

export type Lang = "fr" | "en";

export interface Translations {
  mobile: { filters: string; showResults: string; close: string; catalog: string; ranking: string; category: string; overview: string; specifications: string; selection: string; };
  stealth: { active: string; former: string; title: string; listed: string; firstSeen: string; description: string; source: string; revealed: string; unranked: string; unknownCreator: string; };
  benchmarkUi: {
    search: string;
    configurations: string;
    bestOnly: string;
    allEfforts: string;
    costBasis: string;
    methodology: string;
    passAt1Tooltip: string;
    chartTitle: string;
    chartHint: string;
    axisCost: string;
    axisTime: string;
    xAxis: string;
    byPass4: string;
    byTokens: string;
    cheapestTop: string;
  };
  compareWorkspace: {
    lead: string;
    search: string;
    searchShort: string;
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
    noMetrics: string;
    yes: string;
    no: string;
    ratioHint: string;
    suggestions: string;
  };
  tradeoff: {
    efficient: string;
    xAxis: string;
    yAxis: string;
    scale: string;
    linear: string;
    log: string;
    axes: { cost_per_task: string; index_cost: string; price: string; speed: string };
    scores: { intelligence: string; coding: string; agentic: string };
    compareTitle: string;
    compareHint: string;
    selectVariant: string;
    missing: (names: string) => string;
    familyTitle: string;
    familyHint: string;
    openVariant: string;
    empty: string;
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
    contact: string;
    privacyContact: string;
    legalContact: string;
  };
  brand: string;
  nav: {
    allModels: string;
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
      advanced: string;
    };
    modelColumn: string;
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
      price: string;
      input_price: string;
      output_price: string;
      agentic: string;
      cost_per_task: string;
      context: string;
      newest: string;
      name: string;
    };
    direction: {
      asc: string;
      desc: string;
      az: string;
      za: string;
      newest: string;
      oldest: string;
      toggle: (current: string) => string;
    };
    missingLast: (n: number) => string;
    thresholds: {
      title: string;
      hint: string;
      any: string;
      minScore: string;
      maxPrice: string;
      minContext: string;
      minSpeed: string;
      reasoning: string;
      reasoningYes: string;
      reasoningNo: string;
      chipScore: (value: string) => string;
      chipPrice: (value: string) => string;
      chipContext: (value: string) => string;
      chipSpeed: (value: string) => string;
    };
    columns: { label: string; limit: (n: number) => string; reset: string };
    exportCsv: string;
    contextShort: string;
    activeFilters: string;
    removeFilter: (label: string) => string;
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
    categories: {
      all: string;
      new: string;
      stealth: string;
      text: string;
      image: string;
      embeddings: string;
      audio: string;
      video: string;
      rerank: string;
      speech: string;
      transcription: string;
      decisions: string;
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
  glossary: {
    intelligence: string;
    coding: string;
    math: string;
    agentic: string;
    outputSpeed: string;
    ttft: string;
    firstAnswer: string;
    endToEnd: string;
    contextWindow: string;
    openWeights: string;
    openrouterRank: string;
    infoLabel: string;
  };
  card: {
    intelligence: string;
    coding: string;
    math: string;
    speed: string;
    ttft: string;
    price1m: string;
    addCompare: string;
    removeCompare: string;
    newBadge: string;
    agentic: string;
    huggingface: string;
    openWeightsBadge: string;
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
    pricePerMillion: string;
    outputSpeed: string;
    ttft: string;
    firstAnswer: string;
    openrouterWeeklyRank: string;
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
    opennessIndex: string;
    opennessTooltip: string;
    totalParams: string;
    activeParams: string;
    intelligenceTokens: string;
    intelligenceTokensTooltip: string;
    intelligenceCost: string;
    intelligenceCostTooltip: string;
    costPerTask: string;
    costPerTaskTooltip: string;
    viewAllBenchmarks: string;
    showFewerBenchmarks: string;
    metaInfo: string;
    unavailableTitle: string;
    unavailableDescription: string;
    fableUnavailableDescription: string;
    unavailableSource: string;
    modalityLabels: { text: string; image: string; speech: string; video: string; decisions: string };
    rankOf: (rank: number, total: number) => string;
    rankLabel: (rank: number, total: number) => string;
    rankHint: string;
    similarTitle: string;
    similarHint: string;
    compareWith: (name: string) => string;
  };
  compare: {
    title: string;
    description: string;
    selectedCount: (n: number) => string;
    select: string;
    maxReached: string;
    clear: string;
    compare: string;
    addModel: string;
    loading: string;
    backToList: string;
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
      costPerTask: string;
      openrouterWeeklyRank: string;
    };
    best: string;
    model: string;
    remove: string;
  };
  footer: { via: string; cache: string; description: string; explore: string; sources: string };
  catalogUi: { filters: string; viewModel: string; noBenchmarks: string };
  errors: {
    actions: { home: string; browse: string; retry: string; reload: string; report: string };
  } & Record<"notFound" | "forbidden" | "rateLimited" | "server" | "unavailable" | "network", { status: string; title: string; description: string }>;
  agents: {
    title: string;
    description: string;
    indexLabel: string;
    indexTooltip: string;
    metrics: {
      outputTokens: string;
    };
    stats: { configs: string; harnesses: string; best: string };
    headers: {
      harness: string;
      model: string;
      index: string;
      cost: string;
      time: string;
    };
    empty: string;
    sourceNote: string;
    viewOnAA: string;
  };
  deepSwe: {
    title: string;
    description: string;
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
    mobile: { filters: "Filtres et tri", showResults: "Voir les résultats", close: "Fermer", catalog: "Catalogue", ranking: "Classement", category: "Type de modèle", overview: "Benchmarks", specifications: "Prix et capacités", selection: "Votre sélection" },
    stealth: { active: "Modèle furtif", former: "Ancien modèle furtif", title: "Historique du modèle furtif", listed: "Publié sur OpenRouter", firstSeen: "Détecté par BenchSift", description: "Le fournisseur était anonyme pendant cet aperçu. Les correspondances ci-dessous sont confirmées par OpenRouter. La date de détection indique notre première observation, pas la sortie du modèle.", source: "Source OpenRouter", revealed: "Identité révélée", unranked: "Sans classement", unknownCreator: "Créateur non révélé" },
    benchmarkUi: {
      "search": "Rechercher un modèle ou un harnais…",
      "configurations": "configurations",
      "bestOnly": "Meilleure configuration",
      "allEfforts": "Tous les efforts",
      "costBasis": "Base du coût",
      "methodology": "Méthode et versions",
      passAt1Tooltip: "Pourcentage de tâches résolues dès la première exécution sur la version sélectionnée de DeepSWE.",
      chartTitle: "Score et coût",
      chartHint: "Chaque courbe relie les niveaux d'effort d'une même configuration ; le gros point marque la meilleure. En haut à droite : meilleur score pour le moindre coût. Survolez ou parcourez les points au clavier pour lire leurs valeurs.",
      axisCost: "Coût moyen par tâche",
      axisTime: "Durée moyenne par tâche",
      xAxis: "Axe horizontal",
      byPass4: "pass@4",
      byTokens: "Tokens de sortie",
      cheapestTop: "Le moins cher du top 10"
},
    compareWorkspace: {
      "lead": "Comparez jusqu’à quatre modèles avec les mêmes critères.",
      "search": "Rechercher un modèle ou un fournisseur…",
      searchShort: "Rechercher…",
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
      "noMetrics": "Aucune mesure disponible pour cette vue.",
      "yes": "Oui",
      "no": "Non",
      ratioHint: "par rapport au prix le plus bas parmi les modèles comparés",
      suggestions: "Modèles les mieux classés"
},
    tradeoff: {
      efficient: "plus efficace ↗",
      xAxis: "Axe horizontal",
      yAxis: "Axe vertical",
      scale: "Échelle",
      linear: "Linéaire",
      log: "Log",
      axes: {
        cost_per_task: "Coût par tâche",
        index_cost: "Coût de l'Intelligence Index",
        price: "Prix / 1M tokens",
        speed: "Vitesse de sortie",
      },
      scores: { intelligence: "Intelligence Index", coding: "Coding Index", agentic: "Agentic Index" },
      compareTitle: "Score et coût",
      compareHint: "Chaque courbe relie les niveaux de raisonnement d'un modèle comparé ; le gros point marque la configuration du tableau. Le coin en haut à droite réunit le meilleur score pour le moindre coût. Sélectionnez un autre point pour comparer ce niveau.",
      selectVariant: "Sélectionner pour comparer ce niveau",
      missing: (names) => `Absent du graphique faute de données pour ces axes : ${names}.`,
      familyTitle: "Niveaux de raisonnement",
      familyHint: "Chaque point est un niveau de raisonnement de ce modèle : plus de réflexion améliore souvent le score, mais coûte plus cher. Sélectionnez un point pour ouvrir ce niveau.",
      openVariant: "Ouvrir ce niveau",
      empty: "Pas assez de données communes pour tracer ce graphique.",
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
      "catalogNote": "La recherche inclut aussi les modèles sans score, affichés sans rang. Le catalogue complet est disponible en mode Avancé.",
},
    brand: "BenchSift",
    nav: {
      back: "Retour",
      source: "Artificial Analysis",
      feedback: "Feedback",
      codingAgents: "Coding Agents",
      deepSwe: "DeepSWE",
      models: "Modèles",
      allModels: "Tous les modèles",
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
      modelColumn: "Modèle",
      showMore: "Afficher plus de modèles",
      search: "Rechercher un modèle ou un fournisseur…",
      sortBy: "Trier par",
      viewModes: {
        label: "Niveau de détail",
        normal: "Normal",
        advanced: "Avancé",
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
        intelligence: "Intelligence",
        coding: "Coding",
        math: "Math",
        agentic: "Agentique",
        gpqa: "GPQA",
        mmlu_pro: "MMLU Pro",
        hle: "HLE",
        livecodebench: "LiveCodeBench",
        math_500: "MATH-500",
        aime_25: "AIME 2025",
        speed: "Vitesse de sortie",
        ttft: "TTFT",
        openrouter_popular: "Rang OpenRouter",
        price: "Prix / 1M tokens",
        input_price: "Prix d'entrée / 1M",
        output_price: "Prix de sortie / 1M",
        cost_per_task: "Coût par tâche",
        context: "Fenêtre de contexte",
        newest: "Date de sortie",
        name: "Nom",
      },
      direction: {
        asc: "Croissant",
        desc: "Décroissant",
        az: "A → Z",
        za: "Z → A",
        newest: "Plus récents",
        oldest: "Plus anciens",
        toggle: (current) => `Ordre : ${current}. Inverser l'ordre`,
      },
      missingLast: (n) => `${n} modèle${n > 1 ? "s" : ""} sans cette mesure ${n > 1 ? "sont listés" : "est listé"} à la fin.`,
      contextShort: "Contexte",
      thresholds: {
        title: "Seuils",
        hint: "Un modèle sans la mesure concernée est masqué tant que le seuil est actif.",
        any: "Tous",
        minScore: "Intelligence minimale",
        maxPrice: "Prix maximal / 1M tokens",
        minContext: "Contexte minimal",
        minSpeed: "Vitesse minimale",
        reasoning: "Raisonnement",
        reasoningYes: "Avec raisonnement",
        reasoningNo: "Sans raisonnement",
        chipScore: (value) => `Intelligence ≥ ${value}`,
        chipPrice: (value) => `Prix ≤ ${value}`,
        chipContext: (value) => `Contexte ≥ ${value}`,
        chipSpeed: (value) => `Vitesse ≥ ${value}`,
      },
      columns: { label: "Colonnes", limit: (n) => `${n} colonnes au maximum`, reset: "Colonnes par défaut" },
      exportCsv: "Exporter en CSV",
      activeFilters: "Filtres actifs",
      removeFilter: (label) => `Retirer le filtre ${label}`,
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
      categories: {
        all: "Tous",
        new: "Nouveaux",
        stealth: "Furtifs",
        text: "Texte",
        image: "Image",
        embeddings: "Embeddings",
        audio: "Audio",
        video: "Vidéo",
        rerank: "Rerank",
        speech: "Speech",
        transcription: "Transcription",
        decisions: "Décisions",
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
    glossary: {
      intelligence: "Indice composite d'Artificial Analysis (0–100) qui agrège ses évaluations indépendantes de raisonnement, connaissances, code et agents.",
      coding: "Indice d'Artificial Analysis consacré à la programmation, calculé à partir de ses benchmarks de code.",
      math: "Indice d'Artificial Analysis consacré aux mathématiques, calculé à partir de problèmes de niveau compétition.",
      agentic: "Indice d'Artificial Analysis pour les tâches agentiques : usage d'outils, de terminal et workflows en plusieurs étapes.",
      outputSpeed: "Tokens reçus par seconde pendant la génération, après le premier fragment. Médiane mesurée par Artificial Analysis.",
      ttft: "Délai avant le premier token reçu après l'envoi de la requête. Pour un modèle de raisonnement, il peut s'agir d'un token de réflexion.",
      firstAnswer: "Délai avant le premier token de la réponse finale, réflexion comprise pour les modèles de raisonnement.",
      endToEnd: "Durée totale pour recevoir une réponse de 500 tokens, en incluant le traitement de l'entrée et la réflexion.",
      contextWindow: "Nombre maximal de tokens que le modèle peut traiter dans une seule requête.",
      openWeights: "Poids publiés et téléchargeables, sous une licence propre à chaque modèle. Fermés : accès uniquement via API ou produit.",
      openrouterRank: "Position du modèle dans le classement de popularité d'OpenRouter.",
      infoLabel: "Définition",
    },
    card: {
      intelligence: "Intelligence",
      coding: "Coding",
      math: "Math",
      speed: "Vitesse",
      ttft: "TTFT",
      price1m: "Prix/1M",
      addCompare: "Ajouter à la comparaison",
      removeCompare: "Retirer de la comparaison",
      newBadge: "Nouveau",
      agentic: "Agentic",
      huggingface: "Hugging Face",
      openWeightsBadge: "Poids ouverts",
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
      pricePerMillion: "USD par million de tokens",
      outputSpeed: "Vitesse de sortie",
      ttft: "Temps 1er token (TTFT)",
      firstAnswer: "Temps 1ère réponse",
      openrouterWeeklyRank: "Rang OpenRouter hebdo",
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
      opennessIndex: "Indice d'ouverture",
      opennessTooltip: "Évalue l'ouverture du modèle sur une échelle 0-100 (plus c'est élevé, plus le modèle est ouvert).",
      totalParams: "Paramètres totaux",
      activeParams: "Paramètres actifs",
      intelligenceTokens: "Tokens utilisés (verbosité)",
      intelligenceTokensTooltip: "Nombre total de tokens générés pour exécuter l'Artificial Analysis Intelligence Index. Indique la verbosité du modèle.",
      intelligenceCost: "Coût d'évaluation",
      intelligenceCostTooltip: "Coût total (USD) pour évaluer le modèle sur l'Artificial Analysis Intelligence Index, basé sur le prix par token et le nombre de tokens utilisés.",
      costPerTask: "Coût par tâche",
      costPerTaskTooltip: "Coût moyen pondéré en USD par tâche de l'Intelligence Index, publié par Artificial Analysis. Plus bas est préférable.",
      viewAllBenchmarks: "Voir tous les benchmarks",
      showFewerBenchmarks: "Réduire les benchmarks",
      metaInfo: "Méta-informations",
      unavailableTitle: "Indisponible actuellement",
      unavailableDescription: "Artificial Analysis marque actuellement ce modèle comme indisponible.",
      fableUnavailableDescription: "Une directive du gouvernement américain oblige Anthropic à suspendre l'accès à Fable 5 et Mythos 5 pour tous les utilisateurs. Anthropic travaille à rétablir l'accès dès que possible, sans annoncer de date.",
      unavailableSource: "Lire l'annonce Anthropic",
      modalityLabels: { text: "texte", image: "image", speech: "audio", video: "vidéo", decisions: "décisions" },
      rankOf: (rank, total) => `n° ${rank} sur ${total}`,
      rankLabel: (rank, total) => `Rang ${rank} sur ${total} modèles mesurés`,
      rankHint: "Rang parmi les modèles mesurés du catalogue, toutes configurations comprises. Le n° 1 est le meilleur : le plus haut score, le plus rapide ou le moins cher. Barre verte : 10 % les mieux classés ; bleue : premier tiers.",
      similarTitle: "Modèles de niveau proche",
      similarHint: "Les modèles les plus proches sur l'Intelligence Index, une configuration par famille.",
      compareWith: (name) => `Comparer avec ${name}`,
    },
    compare: {
      title: "Comparateur de modèles",
      description: "Comparez les écarts utiles entre benchmarks, vitesse, prix et capacités, configuration par configuration.",
      selectedCount: (n) => `${n} modèle${n > 1 ? "s" : ""} comparé${n > 1 ? "s" : ""}`,
      select: "modèle(s) sélectionné(s)",
      maxReached: "Maximum 4 modèles",
      clear: "Effacer",
      compare: "Comparer",
      addModel: "Ajouter un modèle",
      loading: "Chargement de la comparaison…",
      backToList: "Retour à la liste",
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
        costPerTask: "Coût / tâche",
        openrouterWeeklyRank: "Rang OpenRouter hebdo",
      },
      best: "Meilleur",
      model: "Modèle",
      remove: "Retirer",
    },
    footer: { via: "Données via", cache: "Cache · 1h", description: "Trouvez le bon modèle. Comparez ses capacités, ses performances et son prix, sources à l’appui.", explore: "Explorer", sources: "Sources des données" },
    catalogUi: { filters: "Filtres", viewModel: "Voir le modèle", noBenchmarks: "Pas encore de benchmark disponible." },
    errors: {
      actions: {
        home: "Retour à l’accueil",
        browse: "Parcourir les modèles",
        retry: "Réessayer",
        reload: "Recharger la page",
        report: "Signaler le problème",
      },
      notFound: {
        status: "Page introuvable",
        title: "Cette page est introuvable",
        description: "Cette adresse ne correspond à aucune page ni à aucun modèle du catalogue. Le contenu a peut-être été déplacé ou supprimé.",
      },
      forbidden: {
        status: "Accès refusé",
        title: "Cette page n’est pas accessible",
        description: "Tu n’as pas l’autorisation d’ouvrir cette adresse. Le reste du catalogue reste ouvert à tous.",
      },
      rateLimited: {
        status: "Trop de requêtes",
        title: "Doucement, le chat a besoin d’une pause",
        description: "Trop de requêtes sont arrivées en peu de temps. Patiente quelques secondes, puis réessaie.",
      },
      server: {
        status: "Erreur serveur",
        title: "Quelque chose s’est cassé de notre côté",
        description: "Le serveur n’a pas pu afficher cette page. Réessaie dans un instant ; si l’erreur revient, signale-la.",
      },
      unavailable: {
        status: "Service indisponible",
        title: "Le service fait une sieste",
        description: "Le serveur ne répond pas pour le moment. Reviens dans quelques minutes.",
      },
      network: {
        status: "Hors ligne",
        title: "La connexion a été coupée",
        description: "La page n’a pas pu se charger. Vérifie ta connexion, puis recharge la page. Si le site vient d’être mis à jour, recharger suffit aussi.",
      },
    },
    agents: {
      title: "Agents de programmation",
      description: "Comparez les configurations modèle + harnais mesurées par Artificial Analysis : score, coût et temps par tâche.",
      indexLabel: "Coding Agent Index",
      indexTooltip: "Indice publié par Artificial Analysis. Les composantes et leurs versions ci-dessous proviennent de la source ; elles restent distinctes des résultats DeepSWE de Datacurve.",
      metrics: {
        outputTokens: "Tokens sortie",
      },
      stats: { configs: "Configurations", harnesses: "Harnais", best: "Meilleur index" },
      headers: {
        harness: "Harnais",
        model: "Modèle",
        index: "Index",
        cost: "Coût",
        time: "Temps",
      },
      empty: "Données coding agents indisponibles pour l'instant.",
      sourceNote: "Données via Artificial Analysis · vérification toutes les 6 heures. Le rang reste celui de l’index après filtrage.",
      viewOnAA: "Voir sur Artificial Analysis",
    },
    deepSwe: {
      title: "DeepSWE",
      description: "Classement Datacurve des agents de programmation sur des tâches de génie logiciel long-horizon, originales et vérifiées par tests.",
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
    mobile: { filters: "Filter and sort", showResults: "Show results", close: "Close", catalog: "Catalog", ranking: "Ranking", category: "Model type", overview: "Benchmarks", specifications: "Price and capabilities", selection: "Your selection" },
    stealth: { active: "Stealth model", former: "Former stealth model", title: "Stealth model history", listed: "Listed on OpenRouter", firstSeen: "First seen by BenchSift", description: "The provider was anonymous during this preview. The identities below are confirmed by OpenRouter. First seen is our first observation, not the model release date.", source: "OpenRouter source", revealed: "Identity revealed", unranked: "Unranked", unknownCreator: "Undisclosed creator" },
    benchmarkUi: {
      "search": "Search for a model or harness…",
      "configurations": "configurations",
      "bestOnly": "Best configuration",
      "allEfforts": "All effort levels",
      "costBasis": "Cost basis",
      "methodology": "Method and versions",
      passAt1Tooltip: "Percentage of tasks solved on the first run in the selected DeepSWE version.",
      chartTitle: "Score and cost",
      chartHint: "Each line joins the effort levels of one configuration; the large point marks the best one. Top right: the best score for the lowest cost. Hover or move through the points with the keyboard to read their values.",
      axisCost: "Average cost per task",
      axisTime: "Average time per task",
      xAxis: "Horizontal axis",
      byPass4: "pass@4",
      byTokens: "Output tokens",
      cheapestTop: "Cheapest in the top 10"
},
    compareWorkspace: {
      "lead": "Compare up to four models using the same criteria.",
      "search": "Search for a model or provider…",
      searchShort: "Search…",
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
      "noMetrics": "No measurements available for this view.",
      "yes": "Yes",
      "no": "No",
      ratioHint: "relative to the lowest price among the compared models",
      suggestions: "Top-ranked models"
},
    tradeoff: {
      efficient: "most efficient ↗",
      xAxis: "Horizontal axis",
      yAxis: "Vertical axis",
      scale: "Scale",
      linear: "Linear",
      log: "Log",
      axes: {
        cost_per_task: "Cost per task",
        index_cost: "Intelligence Index cost",
        price: "Price / 1M tokens",
        speed: "Output speed",
      },
      scores: { intelligence: "Intelligence Index", coding: "Coding Index", agentic: "Agentic Index" },
      compareTitle: "Score and cost",
      compareHint: "Each line joins the reasoning levels of a compared model; the large point marks the configuration in the table. The top-right corner holds the best score for the lowest cost. Select another point to compare that level.",
      selectVariant: "Select to compare this level",
      missing: (names) => `Not plotted for lack of data on these axes: ${names}.`,
      familyTitle: "Reasoning levels",
      familyHint: "Each point is a reasoning level of this model: more reasoning often raises the score but costs more. Select a point to open that level.",
      openVariant: "Open this level",
      empty: "Not enough shared data to draw this chart.",
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
      "catalogNote": "Search also includes models without scores, shown without a rank. The full catalogue is available in Advanced mode.",
},
    brand: "BenchSift",
    nav: {
      back: "Back",
      source: "Artificial Analysis",
      feedback: "Feedback",
      codingAgents: "Coding Agents",
      deepSwe: "DeepSWE",
      models: "Models",
      allModels: "All models",
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
      modelColumn: "Model",
      showMore: "Show more models",
      search: "Search a model or provider…",
      sortBy: "Sort by",
      viewModes: {
        label: "Level of detail",
        normal: "Normal",
        advanced: "Advanced",
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
        intelligence: "Intelligence",
        coding: "Coding",
        math: "Math",
        agentic: "Agentic",
        gpqa: "GPQA",
        mmlu_pro: "MMLU Pro",
        hle: "HLE",
        livecodebench: "LiveCodeBench",
        math_500: "MATH-500",
        aime_25: "AIME 2025",
        speed: "Output speed",
        ttft: "TTFT",
        openrouter_popular: "OpenRouter rank",
        price: "Price / 1M tokens",
        input_price: "Input price / 1M",
        output_price: "Output price / 1M",
        cost_per_task: "Cost per task",
        context: "Context window",
        newest: "Release date",
        name: "Name",
      },
      direction: {
        asc: "Ascending",
        desc: "Descending",
        az: "A → Z",
        za: "Z → A",
        newest: "Newest first",
        oldest: "Oldest first",
        toggle: (current) => `Order: ${current}. Reverse the order`,
      },
      missingLast: (n) => `${n} model${n === 1 ? "" : "s"} without this measurement ${n === 1 ? "is" : "are"} listed last.`,
      contextShort: "Context",
      thresholds: {
        title: "Thresholds",
        hint: "A model without the measurement is hidden while the threshold is on.",
        any: "Any",
        minScore: "Minimum intelligence",
        maxPrice: "Maximum price / 1M tokens",
        minContext: "Minimum context",
        minSpeed: "Minimum speed",
        reasoning: "Reasoning",
        reasoningYes: "With reasoning",
        reasoningNo: "Without reasoning",
        chipScore: (value) => `Intelligence ≥ ${value}`,
        chipPrice: (value) => `Price ≤ ${value}`,
        chipContext: (value) => `Context ≥ ${value}`,
        chipSpeed: (value) => `Speed ≥ ${value}`,
      },
      columns: { label: "Columns", limit: (n) => `${n} columns at most`, reset: "Default columns" },
      exportCsv: "Export as CSV",
      activeFilters: "Active filters",
      removeFilter: (label) => `Remove the ${label} filter`,
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
      categories: {
        all: "All",
        new: "New",
        stealth: "Stealth",
        text: "Text",
        image: "Image",
        embeddings: "Embeddings",
        audio: "Audio",
        video: "Video",
        rerank: "Rerank",
        speech: "Speech",
        transcription: "Transcription",
        decisions: "Decisions",
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
    glossary: {
      intelligence: "Artificial Analysis composite index (0–100) combining its independent reasoning, knowledge, coding and agentic evaluations.",
      coding: "Artificial Analysis index for programming, computed from its coding benchmarks.",
      math: "Artificial Analysis index for mathematics, computed from competition-level problems.",
      agentic: "Artificial Analysis index for agentic work: tool use, terminal tasks and multi-step workflows.",
      outputSpeed: "Tokens received per second while the model generates, after the first chunk. Median measured by Artificial Analysis.",
      ttft: "Time until the first token arrives after the request is sent. For reasoning models this can be a thinking token.",
      firstAnswer: "Time until the first token of the final answer, including thinking time for reasoning models.",
      endToEnd: "Total time to receive a 500-token response, including input processing and thinking.",
      contextWindow: "Maximum number of tokens the model can process in a single request.",
      openWeights: "Weights are published and downloadable under a model-specific licence. Closed: available only through an API or product.",
      openrouterRank: "The model's position in OpenRouter's popularity ranking.",
      infoLabel: "Definition",
    },
    card: {
      intelligence: "Intelligence",
      coding: "Coding",
      math: "Math",
      speed: "Speed",
      ttft: "TTFT",
      price1m: "Price/1M",
      addCompare: "Add to comparison",
      removeCompare: "Remove from comparison",
      newBadge: "New",
      agentic: "Agentic",
      huggingface: "Hugging Face",
      openWeightsBadge: "Open weights",
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
      pricePerMillion: "USD per million tokens",
      outputSpeed: "Output speed",
      ttft: "Time to first token (TTFT)",
      firstAnswer: "Time to first answer",
      openrouterWeeklyRank: "OpenRouter weekly rank",
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
      opennessIndex: "Openness Index",
      opennessTooltip: "Assesses the model's openness on a 0-100 scale (higher is more open).",
      totalParams: "Total parameters",
      activeParams: "Active parameters",
      intelligenceTokens: "Tokens used (verbosity)",
      intelligenceTokensTooltip: "Total number of tokens generated to run the Artificial Analysis Intelligence Index. Indicates the verbosity of the model.",
      intelligenceCost: "Evaluation cost",
      intelligenceCostTooltip: "Total cost (USD) to evaluate the model on the Artificial Analysis Intelligence Index, based on the price per token and the number of tokens used.",
      costPerTask: "Cost per task",
      costPerTaskTooltip: "Weighted average USD cost per Intelligence Index task, published by Artificial Analysis. Lower is better.",
      viewAllBenchmarks: "Show all benchmarks",
      showFewerBenchmarks: "Show fewer benchmarks",
      metaInfo: "Meta-information",
      unavailableTitle: "Not currently available",
      unavailableDescription: "Artificial Analysis currently marks this model as unavailable.",
      fableUnavailableDescription: "A US government directive requires Anthropic to suspend access to Fable 5 and Mythos 5 for all users. Anthropic is working to restore access as soon as possible, with no return date announced.",
      unavailableSource: "Read Anthropic's announcement",
      modalityLabels: { text: "text", image: "image", speech: "speech", video: "video", decisions: "decisions" },
      rankOf: (rank, total) => `#${rank} of ${total}`,
      rankLabel: (rank, total) => `Rank ${rank} of ${total} measured models`,
      rankHint: "Rank among the measured models in the catalog, every configuration included. #1 is the best: the highest score, the fastest or the cheapest. Green bar: top tenth; blue: top third.",
      similarTitle: "Models at a similar level",
      similarHint: "The closest models on the Intelligence Index, one configuration per family.",
      compareWith: (name) => `Compare with ${name}`,
    },
    compare: {
      title: "Model Comparator",
      description: "Compare meaningful differences across benchmarks, speed, pricing, and capabilities, configuration by configuration.",
      selectedCount: (n) => `${n} model${n === 1 ? "" : "s"} compared`,
      select: "model(s) selected",
      maxReached: "Maximum 4 models",
      clear: "Clear",
      compare: "Compare",
      addModel: "Add a model",
      loading: "Loading comparison…",
      backToList: "Back to list",
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
        costPerTask: "Cost / task",
        openrouterWeeklyRank: "OpenRouter weekly rank",
      },
      best: "Best",
      model: "Model",
      remove: "Remove",
    },
    footer: { via: "Data via", cache: "Cache · 1h", description: "Find the right model. Compare capabilities, performance and pricing, backed by sources.", explore: "Explore", sources: "Data sources" },
    catalogUi: { filters: "Filters", viewModel: "View model", noBenchmarks: "No benchmark available yet." },
    errors: {
      actions: {
        home: "Back to home",
        browse: "Browse models",
        retry: "Try again",
        reload: "Reload the page",
        report: "Report the problem",
      },
      notFound: {
        status: "Page not found",
        title: "This page could not be found",
        description: "This address does not match any page or model in the catalogue. The content may have been moved or removed.",
      },
      forbidden: {
        status: "Access denied",
        title: "This page is not available to you",
        description: "You don’t have permission to open this address. The rest of the catalogue stays open to everyone.",
      },
      rateLimited: {
        status: "Too many requests",
        title: "Easy there, the cat needs a break",
        description: "Too many requests arrived in a short time. Wait a few seconds, then try again.",
      },
      server: {
        status: "Server error",
        title: "Something broke on our side",
        description: "The server couldn’t render this page. Try again in a moment; if the error comes back, please report it.",
      },
      unavailable: {
        status: "Service unavailable",
        title: "The service is taking a nap",
        description: "The server isn’t responding right now. Check back in a few minutes.",
      },
      network: {
        status: "Offline",
        title: "The connection dropped",
        description: "The page couldn’t load. Check your connection, then reload the page. If the site was just updated, reloading fixes it too.",
      },
    },
    agents: {
      title: "Coding Agents",
      description: "Compare model + harness configurations measured by Artificial Analysis: score, cost and time per task.",
      indexLabel: "Coding Agent Index",
      indexTooltip: "Index published by Artificial Analysis. Components and versions below come from the source; they remain distinct from Datacurve’s DeepSWE results.",
      metrics: {
        outputTokens: "Output tokens",
      },
      stats: { configs: "Configurations", harnesses: "Harnesses", best: "Best index" },
      headers: {
        harness: "Harness",
        model: "Model",
        index: "Index",
        cost: "Cost",
        time: "Time",
      },
      empty: "Coding agents data unavailable for now.",
      sourceNote: "Data from Artificial Analysis · checked every 6 hours. Filtering preserves the index rank.",
      viewOnAA: "View on Artificial Analysis",
    },
    deepSwe: {
      title: "DeepSWE",
      description: "Datacurve leaderboard for coding agents on original, long-horizon software engineering tasks with program-based verifiers.",
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
    document.cookie = `benchsift_lang=${l};path=/;max-age=31536000;SameSite=Lax`;
    // flushSync lets the view transition capture the page in the new language.
    const apply = () => {
      flushSync(() => setLangState(l));
      document.documentElement.lang = l;
    };
    const transition = runViewTransition("language", apply);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!transition && !reduceMotion) {
      motion.current = animateContent(document.querySelector("main"), motion.current);
    }
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
