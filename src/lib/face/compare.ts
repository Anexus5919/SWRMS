/**
 * Server-side face descriptor comparison.
 * Uses Euclidean distance between 128-dimensional face-api.js descriptors.
 *
 * Thresholds (face-api.js standard):
 *   < 0.5  = HIGH confidence match
 *   0.5-0.65 = MEDIUM confidence (verified, flagged for spot-check)
 *   0.65-0.8 = LOW confidence (mandatory manual review)
 *   > 0.8  = NO MATCH (rejected)
 */

import { FACE_VERIFICATION } from '@/lib/utils/constants';

export type VerificationConfidence = 'high' | 'medium' | 'low' | 'no_match';

export interface FaceComparisonResult {
  distance: number;
  confidence: VerificationConfidence;
  verified: boolean;
  requiresManualReview: boolean;
  message: string;
}

/** Euclidean distance between two descriptor vectors */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Descriptor length mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

/** Compare a captured face descriptor against a registered reference */
export function compareFaceDescriptors(
  captured: number[],
  registered: number[]
): FaceComparisonResult {
  const distance = euclideanDistance(captured, registered);
  const rounded = Math.round(distance * 1000) / 1000;

  if (distance < FACE_VERIFICATION.HIGH_CONFIDENCE) {
    return {
      distance: rounded,
      confidence: 'high',
      verified: true,
      requiresManualReview: false,
      message: 'Identity verified with high confidence',
    };
  }

  if (distance < FACE_VERIFICATION.MEDIUM_CONFIDENCE) {
    return {
      distance: rounded,
      confidence: 'medium',
      verified: true,
      requiresManualReview: false,
      message: 'Identity verified (medium confidence, may be spot-checked)',
    };
  }

  if (distance < FACE_VERIFICATION.LOW_CONFIDENCE) {
    return {
      distance: rounded,
      confidence: 'low',
      verified: false,
      requiresManualReview: true,
      message: 'Low confidence - flagged for mandatory manual review',
    };
  }

  return {
    distance: rounded,
    confidence: 'no_match',
    verified: false,
    requiresManualReview: true,
    message: 'Face does not match registered profile',
  };
}

/**
 * Find best matching worker from a list of registered descriptors.
 * Returns the best match and its comparison result.
 */
export function findBestMatch(
  capturedDescriptor: number[],
  registeredWorkers: { userId: string; descriptor: number[] }[]
): { userId: string; result: FaceComparisonResult } | null {
  if (registeredWorkers.length === 0) return null;

  let bestMatch = {
    userId: registeredWorkers[0].userId,
    result: compareFaceDescriptors(capturedDescriptor, registeredWorkers[0].descriptor),
  };

  for (let i = 1; i < registeredWorkers.length; i++) {
    const result = compareFaceDescriptors(capturedDescriptor, registeredWorkers[i].descriptor);
    if (result.distance < bestMatch.result.distance) {
      bestMatch = { userId: registeredWorkers[i].userId, result };
    }
  }

  return bestMatch;
}
