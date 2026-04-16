'use client';

/**
 * Client-side face detection and descriptor extraction using face-api.js.
 * Models are loaded from CDN (jsdelivr) to avoid bundling ~7MB of model files.
 *
 * SECURITY NOTE: For production, face processing should be done server-side
 * to prevent client-side tampering. This client-side approach is suitable
 * for pilot/proof-of-concept deployments.
 */

let faceapi: typeof import('face-api.js') | null = null;
let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

/** Load face-api.js and its models (singleton, loads once) */
export async function initFaceAPI(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      faceapi = await import('face-api.js');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
    } catch (err) {
      loadingPromise = null;
      throw new Error('Failed to load face recognition models. Check your internet connection.');
    }
  })();

  return loadingPromise;
}

export function isModelLoaded(): boolean {
  return modelsLoaded;
}

export interface FaceDetectionResult {
  detected: boolean;
  facesCount: number;
  descriptor: number[] | null;
  error: string | null;
}

/**
 * Detect faces in a video element and extract the 128-d descriptor
 * of the most prominent (largest) face.
 */
export async function detectFaceFromVideo(
  videoElement: HTMLVideoElement
): Promise<FaceDetectionResult> {
  if (!faceapi || !modelsLoaded) {
    return { detected: false, facesCount: 0, descriptor: null, error: 'Models not loaded' };
  }

  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      return { detected: false, facesCount: 0, descriptor: null, error: null };
    }

    // Find the largest face (most prominent)
    const largest = detections.reduce((prev, curr) =>
      curr.detection.box.area > prev.detection.box.area ? curr : prev
    );

    return {
      detected: true,
      facesCount: detections.length,
      descriptor: Array.from(largest.descriptor),
      error: null,
    };
  } catch (err) {
    return {
      detected: false,
      facesCount: 0,
      descriptor: null,
      error: err instanceof Error ? err.message : 'Face detection failed',
    };
  }
}

/**
 * Detect face from a base64 image string.
 * Creates a temporary image element for detection.
 */
export async function detectFaceFromImage(
  base64Image: string
): Promise<FaceDetectionResult> {
  if (!faceapi || !modelsLoaded) {
    return { detected: false, facesCount: 0, descriptor: null, error: 'Models not loaded' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const detections = await faceapi!
          .detectAllFaces(img as any, new faceapi!.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length === 0) {
          resolve({ detected: false, facesCount: 0, descriptor: null, error: null });
          return;
        }

        const largest = detections.reduce((prev, curr) =>
          curr.detection.box.area > prev.detection.box.area ? curr : prev
        );

        resolve({
          detected: true,
          facesCount: detections.length,
          descriptor: Array.from(largest.descriptor),
          error: null,
        });
      } catch (err) {
        resolve({
          detected: false,
          facesCount: 0,
          descriptor: null,
          error: err instanceof Error ? err.message : 'Detection failed',
        });
      }
    };
    img.onerror = () => resolve({
      detected: false, facesCount: 0, descriptor: null, error: 'Failed to load image',
    });
    img.src = base64Image;
  });
}
