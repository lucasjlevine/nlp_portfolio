export type SiteMeta = {
  siteTitle: string;
  student: string;
  course: string;
  curator: string;
  chapters: { id: string; num: number; title: string; tag: string }[];
};

export type Hw1Data = {
  title: string;
  sampleWords: number;
  nPassages: number;
  themes: string[];
  /** Short plain-language definitions from the homework codebook */
  themeDefinitions?: Record<string, string>;
  primaryCounts: Record<string, number>;
  anyCounts: Record<string, number>;
  multiLabelCount: number;
  cooccurrence: { a: string; b: string; n: number }[];
  passages: {
    excerpt: string;
    location: string;
    themes: string[];
    speaker: string;
    hero?: boolean;
  }[];
  keyFinding: string;
  whatChanged: string;
};

export type Hw2Data = {
  title: string;
  personas: { name: string; line: string }[];
  passages: {
    id: number;
    text: string;
    gt: string;
    panel: string;
    minusExamples: string;
    disputed?: boolean;
  }[];
  agreement: Record<string, number>;
  keyFinding: string;
  whatChanged: string;
};

export type Hw3Data = {
  title: string;
  document: string;
  pages: Record<
    string,
    { label: string; gtWords: number; gtChars?: number; image?: string }
  >;
  // legacy shape
  engines?: {
    engine: string;
    page_07: { CER: number; WER: number };
    page_29: { CER: number; WER: number };
  }[];
  // new extract shape
  scores?: {
    page: string;
    tesseract: { CER: number; WER: number };
    tesseract_repaired: { CER: number; WER: number };
    trocr: { CER: number; WER: number };
  }[];
  snippets?: Record<
    string,
    { gt: string; tesseract: string; repaired: string }
  >;
  lineErrors?: Record<
    string,
    { i: number; ref: string; hyp: string; cer: number }[]
  >;
  worstLines?: {
    engine: string;
    page: string;
    cer?: number;
    gt?: string;
    ocr?: string;
    example?: { ref: string; hyp: string; cer: number } | null;
  }[];
  regex?: {
    beforeAfter: {
      page: string;
      CER_before: number;
      CER_after: number;
      WER_before: number;
      WER_after: number;
    }[];
    helpful: string[];
    hurtful: string[];
  };
  artistMentions: { name: string; count: number }[];
  dictionaryHitRate: { page: string; rate: number; tokens?: number; test?: boolean }[];
  trocrNote?: string;
  keyFinding: string;
  whatChanged: string;
};

export type Hw4Data = {
  title: string;
  nSongs: number;
  nLines: number;
  nPairs: number;
  threshold: number;
  zeroShare: number;
  vocab?: { raw: number; lemma: number; hapaxShare: number };
  histogram?: {
    bins: number[];
    all: number[];
    within: number[];
    cross: number[];
  };
  topPairs?: {
    lemma: number;
    raw: number;
    a: string;
    b: string;
    song_a: string;
    song_b: string;
    within: boolean;
  }[];
  network?:
    | {
        nodes: { id: number; line: string; song: string; x?: number; y?: number }[];
        edges: {
          source: number;
          target: number;
          score: number;
          kind: string;
          within: boolean;
        }[];
      }
    | {
        nodes: number;
        solidEdges: number;
        dashedEdges?: number;
        crossSongSolid?: number;
      };
  withinSongRepeatLinks?: number;
  imageSlots?: string[];
  flips?: { lemma: number; raw: number; a: string; b: string }[];
  zipf?: { token: string; count: number; rank: number }[];
  scatter?: { lemma: number; raw: number }[];
  stats?: Record<string, number>;
  // legacy
  pairs?: {
    a: string;
    b: string;
    score: number;
    group: string;
    verdict: string;
    note: string;
    song_a: string;
    song_b: string;
  }[];
  falsePositive?: { a: string; b: string; score: number };
  keyFinding: string;
  whatChanged: string;
};

export type Hw5Point = {
  id: string;
  label: string;
  text: string;
  song: string;
  album?: string;
  pca_x?: number;
  pca_y?: number;
  t_sne_x?: number;
  t_sne_y?: number;
  neighborhood?: string | null;
};

export type Hw5Data = {
  title: string;
  nPoints: number;
  nAL: number;
  nBT: number;
  model: string;
  dims: number;
  neighborhoods: {
    name: string;
    point_ids: string[];
    size: number;
    label_counts: Record<string, number>;
    mean_full_space_cosine: number;
    random_set_mean: number;
    random_set_2_5_percentile: number;
    random_set_97_5_percentile: number;
    difference_from_random_mean: number;
  }[];
  anchorMismatch: {
    anchor: string;
    neighbor: string;
    fullSpaceCosine: number;
    note: string;
  };
  anchorNeighbors?: Record<
    string,
    { id: string; label: string; song: string; text: string; cosine: number }[]
  >;
  nearestNeighbors?: Record<string, string | number>[];
  reportNeighbors?: Record<string, string | number>[];
  mapNeighborComparison?: Record<string, string | number | boolean>[];
  points: Hw5Point[];
  keyFinding: string;
  whatChanged: string;
};

export type Hw6Data = {
  title: string;
  corpusTokens: number;
  nUnits?: number;
  voice: string;
  copiedRunAverages: { n: number; avg: number; runs?: number[] }[];
  samples: {
    n: number;
    text: string;
    copy: number;
    featured?: boolean;
    seed?: number;
    k?: number;
  }[];
  prompts: {
    prompt: string;
    continuation: string;
    featured?: boolean;
    nextTokenDist?: { token: string; p: number }[];
    usedContext?: string;
  }[];
  explorer?: {
    context: string;
    byN: Record<string, { token: string; p: number }[]>;
  }[];
  mashup: {
    note: string;
    core?: { text: string; copy: number }[];
    mash?: { text: string; copy: number }[];
    samples?: { text: string; copy: number }[];
  };
  keyFinding: string;
  whatChanged: string;
};
