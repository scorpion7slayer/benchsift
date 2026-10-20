import type { RoboticsClip, RoboticsTask } from "./aa-robotics-data";

/*
 * French versions of the AA-Robotics texts Artificial Analysis publishes in
 * English only: task names and criteria, mistake-clip captions and the reasons
 * a run ended. Keyed by AA id or clip path; a text AA adds or rewords later
 * keeps its English source until it is translated here.
 */

type TaskText = Pick<RoboticsTask, "name" | "short_name" | "instruction" | "success">;

const TASKS: Record<string, TaskText> = {
  "press-red-button": {
    name: "Appuyer sur le bouton rouge",
    short_name: "Bouton rouge",
    instruction: "Appuyer sur le bouton avec la pince.",
    success: "Le bouton clignote.",
  },
  "place-crocodile-in-rectangle": {
    name: "Placer le crocodile en jouet dans le rectangle",
    short_name: "Crocodile",
    instruction: "Placer le crocodile à l'intérieur du rectangle.",
    success: "Le crocodile est entièrement dans le rectangle.",
  },
  "pour-drink-into-cup": {
    name: "Verser la boisson dans le gobelet",
    short_name: "Verser",
    instruction: "Verser la boisson de la bouteille dans le gobelet.",
    success: "La boisson est dans le gobelet, rien n'est renversé ni cassé.",
  },
  "tidy-objects-into-box": {
    name: "Ranger les blocs dans la boîte",
    short_name: "Ranger",
    instruction: "Mettre les quatre blocs dans la boîte, puis remettre le couvercle.",
    success: "Tous les blocs sont dans la boîte et le couvercle est à plat.",
  },
  "shape-matching-challenge": {
    name: "Relever le défi des formes",
    short_name: "Formes",
    instruction: "Placer les blocs dans le plateau pour qu'il corresponde à l'image.",
    success: "Les blocs du plateau correspondent à l'image.",
  },
  "write-hello-world": {
    name: "Écrire hello world",
    short_name: "Hello world",
    instruction: "Écrire « hello world » au feutre sur la feuille, dans le cadre noir.",
    success: "« hello world » est lisible et dans le cadre noir.",
  },
  "build-tallest-foam-tower": {
    name: "Construire la plus haute tour",
    short_name: "Tour",
    instruction: "Construire la tour la plus haute possible avec les blocs en mousse.",
    success: "La tour tient seule et atteint la hauteur maximale possible.",
  },
  "measure-object-dimensions": {
    name: "Mesurer la boîte",
    short_name: "Mesurer",
    instruction: "Mesurer la longueur, la largeur et la hauteur de la boîte.",
    success: "Chaque dimension est juste à 2 mm près.",
  },
};

/** Captions by clip path under the article's asset folder. */
const CAPTIONS: Record<string, string> = {
  "mistake-wall/physical-opus-hello-world-page-tests.mp4": "Teste le contact du feutre sur la feuille elle-même et laisse des marques dans le cadre d'écriture",
  "insight-opus-tidy-box-pushed-away.mp4": "Chaque tentative pour ramener la boîte la pousse un peu plus vers le coin de la table",
  "mistake-wall/physical-opus-crocodile-pushed-away.mp4": "Fait glisser la pince sur la table jusqu'au crocodile et le pousse d'environ 10 cm, hors de portée",
  "mistake-wall/insight-fable-hello-world-ink-dashes.mp4": "Repère la feuille en traçant des tirets d'encre dans le cadre d'écriture",
  "mistake-wall/pr-opus-crocodile-35m30.mp4": "Deux nouvelles approches repoussent au-delà du bord opposé un crocodile qui était entièrement dans le rectangle",
  "mistake-wall/pr-opus-pour-combined.mp4": "Le poignet appuie sur le plateau et le pousse entièrement vers l'avant, ce qui complique chaque prise de la bouteille",
  "mistake-wall/pr-opus-shape-matching-20m57.mp4": "Des sondages au contact de la table regroupent quatre blocs libres en un seul tas",
  "mistake-wall/insight-opus-tidy-objects-before-lid.mp4": "Manipule les blocs pendant 13 minutes avant d'enlever le couvercle",
  "failure-examples/insight-fable-tidy-drops-from-height.mp4": "Lâche le coin bien au-dessus du bord, et il retombe sur un cube",
  "failure-examples/insight-fable-pour-cup-shift.mp4": "Le jet pousse le gobelet d'environ 4 cm vers la gauche",
  "mistake-wall/pr-fable-crocodile-26m10.mp4": "Tire le crocodile par la queue, ce qui fait passer tout le jouet par-dessus deux bords",
  "failure-examples/insight-astra-tidy-lid-on-upright-blocks.mp4": "Pose le couvercle sur deux blocs debout, puis appuie dessus",
  "failure-examples/astra-tidy-box-out-of-reach.mp4": "Pousse la boîte avec le couvercle, et elle glisse jusqu'à la limite de portée du bras",
  "failure-examples/insight-sol-shape-triangle-upright.mp4": "Approche le triangle vert debout sous le mauvais angle : ses prises ne peuvent pas le sortir de l'ouverture carrée",
  "mistake-wall/pr-astra-tower-build-16m14.mp4": "En allant chercher le cône à côté de la base, l'avant-bras fait tomber les deux blocs du haut d'une tour de quatre",
  "failure-examples/pr-astra-measure-box-13m54.mp4": "Se referme trois fois sur le crochet du mètre ruban et, au troisième relâchement, le ruban se rétracte dans son boîtier",
  "mistake-wall/ki-opus-pour-20m57__crop-lower.mp4": "Le versement ne tient pas compte du jet qui se rapproche de la bouteille en ralentissant : la fin tombe à côté du gobelet",
  "mistake-wall/physical-gemini-tower-corner-grasp-topples.mp4": "Se trompe sur la position du bord du bloc penché et le soulève par le coin, sans prévoir que la tour va tomber",
  "mistake-wall/fable-pour-regrab-attempts.mp4": "Continue d'essayer de saisir la bouteille après qu'elle s'est renversée",
  "insight-astra-shape-claims-success.mp4": "Affirme que le plateau correspond à l'image alors que l'hexagone rouge n'est pas en place",
  "mistake-wall/insight-fable-tidy-claims-lid-level.mp4": "Déclare le couvercle à plat et aligné alors qu'il repose sur un coin empilé sur un cube",
  "failure-examples/opus-shape-claims-hexagon-in.mp4": "Compte comme placé un hexagone jaune incliné, dans un rapport qui n'en reconnaît que six sur huit",
  "insight-opus-croc-keeps-adjusting.mp4": "A placé le crocodile dans le rectangle à 23:22, continue d'ajuster pendant 22 minutes et le repousse trois fois au-delà du bord opposé",
  "failure-examples/fable-croc-keeps-adjusting.mp4": "A placé le crocodile dans le rectangle à 24:34, puis passe encore sept minutes à le repositionner par précaution",
  "insight-fable-hello-world-rewrites.mp4": "Après un premier essai illisible, réécrit la phrase au moins six fois au même endroit de la feuille",
  "mistake-wall/success-gemini-tidy-lid-off-center.mp4": "Juge à plat le couvercle décentré et déclare la tâche terminée",
  "mistake-wall/pr-fable-crocodile-23m34.mp4": "Tourne le poignet dans le mauvais sens et pose le crocodile en travers du rectangle, les deux bouts dépassant",
  "mistake-wall/pr-sol-shape-matching-20m30.mp4": "Un déplacement en arc balaie l'hexagone jaune non placé jusqu'à la base du bras",
  "mistake-wall/grasp-astra-shape-hexagon-stays-in-gripper.mp4": "Ouvre la pince au-dessus de l'encoche, mais l'hexagone reste coincé entre les doigts et tombe sur la table quand le bras s'éloigne",
  "mistake-wall/insight-fable-pour-slip.mp4": "La bouteille, saisie haut par l'épaulement, glisse alors que le bras est immobile",
  "insight-sol-pour-bottle-drop.mp4": "Soulève la bouteille du bout des doigts : elle glisse et se renverse",
  "mistake-wall/insight-opus-shape-block-lost.mp4": "Une prise à vide tombe sur l'hexagone rouge et le fait tomber de la table",
  "mistake-wall/ge-sol-shape-matching-11m40.mp4": "Fait jaillir l'hexagone rouge des mâchoires, qui atterrit 5 à 8 cm plus loin",
  "mistake-wall/ge-sol-shape-17m20.mp4": "Une fermeture fait basculer le carré bleu sur la tranche",
  "mistake-wall/ge-sol-shape-matching-44m35.mp4": "Sept prises sur le triangle debout ne parviennent pas à le sortir de la mauvaise encoche",
  "failure-examples/ge-sol-shape-matching-75m10.mp4": "En lâchant le triangle jaune, fait sortir le carré bleu de l'encoche où il était placé",
  "failure-examples/insight-sol-shape-yellow-triangle-empty-grasps.mp4": "Prises à vide sur le triangle jaune",
  "mistake-wall/ge-fable-shape-matching-19m08.mp4": "Une descente pince vide entraîne le cercle bleu sur le bord du plateau, d'où il tombe",
  "mistake-wall/ge-fable-shape-30m18.mp4": "Une prise manquée pousse le carré bleu hors de l'avant du plateau, jusqu'à la base du bras",
  "mistake-wall/ge-opus-crocodile-4m46.mp4": "Cinq prises manquées avant la première qui tient",
  "mistake-wall/ge-opus-shape-matching-23m45.mp4": "Le cercle bleu glisse pendant deux transports et tombe dans l'encoche hexagonale",
  "failure-examples/insight-opus-tidy-cylinder-missed-grasps.mp4": "Prises manquées sur le cylindre",
  "failure-examples/insight-astra-tidy-lifts-box.mp4": "Se referme sur le bord de la boîte en visant un bloc et soulève toute la boîte",
  "mistake-wall/pr-sol-tower-build-48m30.mp4": "Revient sur sa seule pile debout pour la déplacer sur une base plus large et fait tomber les deux blocs",
  "mistake-wall/pr-opus-tower-build-25m00.mp4": "Pose le cylindre sur la tour avec la pince à l'horizontale, et il tombe quand elle s'ouvre",
  "mistake-wall/pr-opus-tower-32m30.mp4": "Ouvre la pince avec le prisme triangulaire décentré au-dessus du cube : il tombe de la tour sur la table",
  "mistake-wall/pr-fable-tower-35m16.mp4": "Le bout des doigts arrive derrière le cube et le repousse un peu plus à chacune des trois dernières tentatives",
  "mistake-wall/ge-sol-tower-build-45m20.mp4": "Tient le bloc long par un coin, et il glisse du cube avant que la pince s'ouvre",
  "failure-examples/ge-sol-tower-build-6m08.mp4": "Trois fermetures de suite tombent à côté ou au-dessus du bloc bleu",
  "mistake-wall/ge-sol-tower-56m18.mp4": "Le cube, pris par un coin, bascule entre les doigts et retombe sur la table",
  "mistake-wall/ge-opus-tower-build-45m28.mp4": "Lâche le prisme à plusieurs centimètres de hauteur, et il tombe à côté du bloc",
  "mistake-wall/ge-opus-tower-build-16m56.mp4": "Lâche le bloc long à côté du cube, pas dessous",
  "mistake-wall/ge-fable-tower-30m18.mp4": "Quatre fermetures en 80 secondes, toutes dans le vide, le cube juste à côté des doigts",
  "mistake-wall/ki-fable-shape-matching-23m20.mp4": "Le geste vers le plateau manque sa cible et le cercle rouge reste incliné à côté de son trou",
  "mistake-wall/pe-fable-shape-matching-34m19.mp4": "Se referme à côté du triangle jaune et transporte une pince vide jusqu'au plateau",
  "mistake-wall/ki-sol-shape-matching-64m28.mp4": "Une correction du poignet laisse le carré bleu incliné, et il est lâché à côté du plateau",
  "mistake-wall/pe-sol-shape-matching-83m10.mp4": "Tend le bras vers un bloc rond contre sa propre base, qu'il a pris pour l'hexagone jaune",
  "mistake-wall/pe-fable-tower-build-22m29.mp4": "Se referme dans le vide, bien au-dessus du cône rouge qu'il croit avoir atteint",
  "mistake-wall/kinematics-gemini-shape-jaws-above-circle.mp4": "Se referme environ 1,3 cm au-dessus du cercle rouge et ne saisit rien",
  "mistake-wall/kinematics-gemini-tower-cube-falls-off.mp4": "Lâche le cube environ 2 cm trop loin, et il tombe du cylindre",
  "mistake-wall/grasp-gemini-shape-hexagon-slips.mp4": "L'hexagone, tenu par un bord incliné, glisse en plein mouvement et quitte la table",
};

const FAIL_REASONS: Record<string, string> = {
  "gave up": "a abandonné",
  "falsely claimed success": "a annoncé à tort une réussite",
  "timed out": "temps écoulé",
  "stopped by judge": "arrêté par le juge",
  "submitted a wrong answer": "a soumis une mauvaise réponse",
};

const ASSET_FOLDER = "/aa-robotics/";

/** A task's texts in the reader's language, falling back to AA's English. */
export function roboticsTaskText(task: RoboticsTask, lang: "fr" | "en"): TaskText {
  const french = lang === "fr" ? TASKS[task.id] : undefined;
  return french ?? task;
}

export function roboticsClipCaption(clip: Pick<RoboticsClip, "url" | "caption">, lang: "fr" | "en"): string {
  if (lang !== "fr") return clip.caption;
  const index = clip.url.indexOf(ASSET_FOLDER);
  return (index >= 0 ? CAPTIONS[clip.url.slice(index + ASSET_FOLDER.length)] : undefined) ?? clip.caption;
}

export function roboticsFailReason(reason: string, lang: "fr" | "en"): string {
  return lang === "fr" ? FAIL_REASONS[reason] ?? reason : reason;
}
