export const CONFIG = {
  likertWeight: 0.7,
  fcWeight: 0.3,
  softmaxTau: 8,
  sigmaFloor: 0.25,
  zScale: 20,
  balancedWingGap: 5,
  lowConfidence: 0.4,
  phase2CloseGap: 8,
  phase2TopN: 4,
  order: {
    maxSameTypeRun: 2,
    consistencyMinDistance: 40,
    attentionSlots: [
      [0.3, 0.4],
      [0.65, 0.75],
    ] as const,
    retries: 50,
  },
  validity: {
    consistencyMaxDiff: 1.5,
    attentionMaxWrong: 0,
    desirabilityMax: 4.25,
    straightLineMax: 15,
    minSd: 0.6,
    minMedianMs: 1200,
    cautionWarnings: 2,
  },
} as const;
