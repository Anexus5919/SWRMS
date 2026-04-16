'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { initFaceAPI, detectFaceFromVideo, type FaceDetectionResult } from '@/lib/face/client';

type RegistrationState = 'loading' | 'camera' | 'captured' | 'submitting' | 'success' | 'error';

interface FaceRegistrationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FaceRegistration({ onSuccess, onCancel }: FaceRegistrationProps) {
  const { videoRef, canvasRef, isStreaming, error: cameraError, startCamera, stopCamera, capturePhoto } = useCamera({
    facingMode: 'user',
    width: 640,
    height: 480,
    quality: 0.85,
  });

  const [state, setState] = useState<RegistrationState>('loading');
  const [modelsReady, setModelsReady] = useState(false);
  const [liveFaceDetected, setLiveFaceDetected] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceResult, setFaceResult] = useState<FaceDetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load face-api models and start camera
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initFaceAPI();
        if (!cancelled) {
          setModelsReady(true);
          setState('camera');
          await startCamera();
        }
      } catch {
        if (!cancelled) {
          setState('error');
          setErrorMsg('Failed to load face detection models. Please check your internet connection and try again.');
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Live face detection loop while camera is streaming
  useEffect(() => {
    if (!isStreaming || !modelsReady || state !== 'camera') {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const result = await detectFaceFromVideo(videoRef.current);
        setLiveFaceDetected(result.detected);
      } catch {
        // Silently continue -- detection will retry
      }
    }, 1000);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [isStreaming, modelsReady, state, videoRef]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;

    // Run face detection on current frame
    setDetecting(true);
    const result = await detectFaceFromVideo(videoRef.current);
    setFaceResult(result);

    if (!result.detected) {
      setDetecting(false);
      setErrorMsg('No face detected. Please position your face clearly in the frame and try again.');
      return;
    }

    if (!result.descriptor) {
      setDetecting(false);
      setErrorMsg('Could not extract face data. Please try again with better lighting.');
      return;
    }

    // Capture the photo
    const photo = capturePhoto();
    if (!photo) {
      setDetecting(false);
      setErrorMsg('Failed to capture photo. Please try again.');
      return;
    }

    setCapturedPhoto(photo);
    setDetecting(false);
    setErrorMsg('');
    setState('captured');
    stopCamera();
  }, [videoRef, capturePhoto, stopCamera]);

  const handleRetake = useCallback(async () => {
    setCapturedPhoto(null);
    setFaceResult(null);
    setErrorMsg('');
    setState('camera');
    await startCamera();
  }, [startCamera]);

  const handleSubmit = useCallback(async () => {
    if (!capturedPhoto || !faceResult?.descriptor) return;

    setState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/staff/face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profilePhoto: capturedPhoto,
          faceDescriptor: faceResult.descriptor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error?.message || 'Failed to register face. Please try again.');
        return;
      }

      setSuccessMsg(data.message || 'Face registered successfully.');
      setState('success');
    } catch {
      setState('error');
      setErrorMsg('No network connection. Please check your internet and try again.');
    }
  }, [capturedPhoto, faceResult]);

  // -- Render --

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg className="w-10 h-10 text-bmc-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-[var(--neutral-600)]">Loading face detection...</p>
        <p className="text-xs text-[var(--neutral-400)] mt-1">This may take a moment on first load</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-full bg-status-green-light border-4 border-status-green flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-status-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-status-green mb-1">Face Registered</p>
        <p className="text-sm text-[var(--neutral-600)] text-center max-w-xs">
          {successMsg}
        </p>
        {onSuccess && (
          <button
            onClick={onSuccess}
            className="mt-6 py-3 px-8 rounded-lg bg-bmc-600 text-white font-medium text-sm hover:bg-bmc-700 active:scale-[0.98] transition-all"
          >
            Continue
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-base font-semibold text-[var(--neutral-800)] mb-1">Face Registration</h3>
      <p className="text-xs text-[var(--neutral-500)] mb-4 text-center max-w-xs">
        Position your face in the center of the frame. Ensure good lighting and remove sunglasses or hats.
      </p>

      {/* Camera / Preview */}
      <div className="relative w-full max-w-sm rounded-lg overflow-hidden border-2 border-[var(--neutral-200)] bg-black">
        {(state === 'camera') && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-square object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Face detection overlay */}
            <div className={`absolute inset-0 border-4 rounded-lg transition-colors duration-300 pointer-events-none ${
              liveFaceDetected ? 'border-status-green' : 'border-transparent'
            }`} />

            {/* Face guide oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-48 h-60 rounded-full border-2 border-dashed transition-colors duration-300 ${
                liveFaceDetected ? 'border-status-green/60' : 'border-white/40'
              }`} />
            </div>

            {/* Live detection badge */}
            <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
              liveFaceDetected
                ? 'bg-status-green/90 text-white'
                : 'bg-black/50 text-white/80'
            }`}>
              {liveFaceDetected ? 'Face detected' : 'Position your face'}
            </div>

            {/* Camera loading overlay */}
            {!isStreaming && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </>
        )}

        {(state === 'captured' || state === 'submitting') && capturedPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedPhoto}
            alt="Captured face"
            className="w-full aspect-square object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}
      </div>

      {/* Camera error */}
      {cameraError && (
        <div className="w-full max-w-sm mt-3 p-3 rounded-lg bg-status-red-light border border-status-red/20">
          <p className="text-xs text-status-red">{cameraError}</p>
        </div>
      )}

      {/* Error message */}
      {errorMsg && state !== 'error' && (
        <div className="w-full max-w-sm mt-3 p-3 rounded-lg bg-status-amber-light border border-status-amber/20">
          <p className="text-xs text-status-amber">{errorMsg}</p>
        </div>
      )}

      {/* Error state (fatal) */}
      {state === 'error' && (
        <div className="w-full max-w-sm mt-3 p-3 rounded-lg bg-status-red-light border border-status-red/20">
          <p className="text-xs text-status-red">{errorMsg}</p>
          <button
            onClick={handleRetake}
            className="mt-2 text-xs font-medium text-status-red underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Face detection result for captured photo */}
      {state === 'captured' && faceResult?.detected && (
        <div className="w-full max-w-sm mt-3 p-3 rounded-lg bg-status-green-light border border-status-green/20">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-status-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-status-green font-medium">
              Face captured successfully -- ready to register
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full max-w-sm mt-4 flex gap-3">
        {state === 'camera' && (
          <>
            {onCancel && (
              <button
                onClick={() => { stopCamera(); onCancel(); }}
                className="flex-1 py-3 rounded-lg border-2 border-[var(--neutral-300)] text-[var(--neutral-600)] font-medium text-sm hover:bg-[var(--neutral-50)] active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleCapture}
              disabled={!isStreaming || detecting}
              className={`${onCancel ? 'flex-1' : 'w-full'} py-3 rounded-lg bg-bmc-600 text-white font-medium text-sm hover:bg-bmc-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {detecting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Detecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  Capture Face
                </>
              )}
            </button>
          </>
        )}

        {state === 'captured' && (
          <>
            <button
              onClick={handleRetake}
              className="flex-1 py-3 rounded-lg border-2 border-[var(--neutral-300)] text-[var(--neutral-600)] font-medium text-sm hover:bg-[var(--neutral-50)] active:scale-[0.98] transition-all"
            >
              Retake
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-lg bg-bmc-600 text-white font-medium text-sm hover:bg-bmc-700 active:scale-[0.98] transition-all"
            >
              Register Face
            </button>
          </>
        )}

        {state === 'submitting' && (
          <div className="w-full flex items-center justify-center py-3 gap-2">
            <svg className="w-5 h-5 text-bmc-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-bmc-600 font-medium">Registering face...</span>
          </div>
        )}
      </div>
    </div>
  );
}
