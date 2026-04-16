'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useCamera } from '@/hooks/useCamera';
import { useGeolocation } from '@/hooks/useGeolocation';
import { initFaceAPI, detectFaceFromVideo, type FaceDetectionResult } from '@/lib/face/client';

type PhotoType = 'shift_start' | 'checkpoint' | 'shift_end';
type PageState = 'select' | 'camera' | 'preview' | 'submitting' | 'success' | 'error';

interface SubmissionResult {
  message: string;
  verified: boolean;
  photoId?: string;
}

const PHOTO_TYPES: { value: PhotoType; label: string; icon: React.ReactNode }[] = [
  {
    value: 'shift_start',
    label: 'Shift Start',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    value: 'checkpoint',
    label: 'Checkpoint',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    value: 'shift_end',
    label: 'Shift End',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    ),
  },
];

export default function PhotoCheckPage() {
  const { data: session } = useSession();
  const { videoRef, canvasRef, isStreaming, error: cameraError, startCamera, stopCamera, capturePhoto } = useCamera({
    facingMode: 'environment',
    width: 1280,
    height: 720,
    quality: 0.8,
  });
  const { position, loading: gpsLoading, error: gpsError, attempt, getPosition } = useGeolocation();

  const [pageState, setPageState] = useState<PageState>('select');
  const [photoType, setPhotoType] = useState<PhotoType>('shift_start');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceResult, setFaceResult] = useState<FaceDetectionResult | null>(null);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load face-api models on mount
  useEffect(() => {
    let cancelled = false;
    setModelsLoading(true);
    initFaceAPI()
      .then(() => {
        if (!cancelled) setModelsReady(true);
      })
      .catch(() => {
        // Non-blocking: face detection will be unavailable
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Clean up camera on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const handleOpenCamera = useCallback(async () => {
    setPageState('camera');
    setCapturedPhoto(null);
    setFaceResult(null);
    setGpsPosition(null);
    setErrorMsg('');
    await startCamera();
  }, [startCamera]);

  const handleCapture = useCallback(async () => {
    // Capture photo
    const photo = capturePhoto();
    if (!photo) {
      setErrorMsg('Failed to capture photo. Please try again.');
      return;
    }
    setCapturedPhoto(photo);
    setPageState('preview');

    // Get GPS in parallel with face detection
    const [pos] = await Promise.all([
      getPosition(),
      (async () => {
        if (!modelsReady || !videoRef.current) return;
        setDetecting(true);
        try {
          const result = await detectFaceFromVideo(videoRef.current);
          setFaceResult(result);
        } catch {
          setFaceResult({ detected: false, facesCount: 0, descriptor: null, error: 'Detection failed' });
        } finally {
          setDetecting(false);
        }
      })(),
    ]);

    if (pos) {
      setGpsPosition(pos);
    }

    // Stop camera after capture
    stopCamera();
  }, [capturePhoto, getPosition, modelsReady, videoRef, stopCamera]);

  const handleRetake = useCallback(async () => {
    setCapturedPhoto(null);
    setFaceResult(null);
    setGpsPosition(null);
    setErrorMsg('');
    setPageState('camera');
    await startCamera();
  }, [startCamera]);

  const handleSubmit = useCallback(async () => {
    if (!capturedPhoto) return;

    setPageState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoType,
          photo: capturedPhoto,
          coordinates: gpsPosition ? {
            lat: gpsPosition.lat,
            lng: gpsPosition.lng,
            accuracy: gpsPosition.accuracy,
          } : null,
          faceDetection: faceResult ? {
            detected: faceResult.detected,
            facesCount: faceResult.facesCount,
            descriptor: faceResult.descriptor,
          } : null,
          timestamp: new Date().toISOString(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPageState('error');
        setErrorMsg(data.error?.message || 'Failed to submit photo. Please try again.');
        return;
      }

      setSubmissionResult(data.data || { message: 'Photo submitted successfully', verified: true });
      setPageState('success');
    } catch {
      setPageState('error');
      setErrorMsg('No network connection. Please check your internet and try again.');
    }
  }, [capturedPhoto, photoType, gpsPosition, faceResult]);

  const handleReset = useCallback(() => {
    setCapturedPhoto(null);
    setFaceResult(null);
    setGpsPosition(null);
    setSubmissionResult(null);
    setErrorMsg('');
    setPageState('select');
  }, []);

  // -- Render helpers --

  const renderTypeSelector = () => (
    <div className="px-4 pt-6 flex flex-col items-center min-h-[calc(100vh-120px)]">
      <p className="text-xs text-[var(--neutral-500)] mb-1 uppercase tracking-wider">
        {session?.user?.employeeId}
      </p>
      <p className="text-sm font-medium text-[var(--neutral-700)] mb-6">
        {session?.user?.name}
      </p>

      <h2 className="text-lg font-semibold text-[var(--neutral-800)] mb-4">Photo Verification</h2>
      <p className="text-xs text-[var(--neutral-500)] mb-6 text-center max-w-xs">
        Select photo type, then capture a geotagged photo with face verification.
      </p>

      {/* Photo type selector */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {PHOTO_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setPhotoType(type.value)}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              photoType === type.value
                ? 'border-bmc-600 bg-bmc-50'
                : 'border-[var(--neutral-200)] bg-white hover:border-bmc-300'
            }`}
          >
            <div className={`${photoType === type.value ? 'text-bmc-600' : 'text-[var(--neutral-400)]'}`}>
              {type.icon}
            </div>
            <span className={`text-sm font-medium ${
              photoType === type.value ? 'text-bmc-700' : 'text-[var(--neutral-600)]'
            }`}>
              {type.label}
            </span>
            {photoType === type.value && (
              <svg className="w-5 h-5 text-bmc-600 ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Model loading status */}
      {modelsLoading && (
        <p className="text-[10px] text-[var(--neutral-400)] mb-4">Loading face detection models...</p>
      )}

      {/* Open camera button */}
      <button
        onClick={handleOpenCamera}
        className="w-full max-w-sm py-3 px-6 rounded-lg bg-bmc-600 text-white font-medium text-sm hover:bg-bmc-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
        Open Camera
      </button>

      <p className="mt-auto pb-4 text-[10px] text-[var(--neutral-400)] text-center max-w-xs leading-relaxed">
        Photos are geotagged with your GPS location and verified with face detection.
        Ensure GPS is enabled and your face is visible in the frame.
      </p>
    </div>
  );

  const renderCamera = () => (
    <div className="flex flex-col items-center min-h-[calc(100vh-120px)]">
      {/* Camera preview */}
      <div className="relative w-full max-w-lg bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[4/3] object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera overlay */}
        {!isStreaming && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* Photo type badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/50 text-white text-xs font-medium">
          {PHOTO_TYPES.find((t) => t.value === photoType)?.label}
        </div>

        {/* Face detection status */}
        {modelsReady && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/50 text-xs font-medium text-emerald-400">
            Face AI ready
          </div>
        )}
      </div>

      {/* Camera error */}
      {cameraError && (
        <div className="w-full max-w-sm mx-4 mt-4 p-4 rounded-lg bg-status-red-light border border-status-red/20">
          <p className="text-sm text-status-red">{cameraError}</p>
          <button onClick={handleOpenCamera} className="mt-2 text-xs font-medium text-status-red underline">
            Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-6">
        {isStreaming && (
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-bmc-600 bg-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-bmc-600" />
          </button>
        )}
        <p className="text-xs text-[var(--neutral-500)]">Tap to capture photo</p>

        <button
          onClick={() => { stopCamera(); setPageState('select'); }}
          className="text-xs font-medium text-[var(--neutral-500)] underline mt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="px-4 pt-4 flex flex-col items-center min-h-[calc(100vh-120px)]">
      {/* Captured photo */}
      <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-[var(--neutral-200)]">
        {capturedPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capturedPhoto} alt="Captured photo" className="w-full aspect-[4/3] object-cover" />
        )}

        {/* Photo type badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/50 text-white text-xs font-medium">
          {PHOTO_TYPES.find((t) => t.value === photoType)?.label}
        </div>
      </div>

      {/* Detection results */}
      <div className="w-full max-w-sm mt-4 space-y-3">
        {/* Face detection */}
        <div className={`p-3 rounded-lg border ${
          detecting
            ? 'bg-bmc-50 border-bmc-100'
            : faceResult?.detected
              ? 'bg-status-green-light border-status-green/20'
              : 'bg-status-amber-light border-status-amber/20'
        }`}>
          <div className="flex items-center gap-2">
            {detecting ? (
              <>
                <svg className="w-4 h-4 text-bmc-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-bmc-600">Detecting face...</span>
              </>
            ) : faceResult?.detected ? (
              <>
                <svg className="w-4 h-4 text-status-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-status-green font-medium">
                  Face detected ({faceResult.facesCount} face{faceResult.facesCount > 1 ? 's' : ''})
                </span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-status-amber" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-xs text-status-amber font-medium">
                  {faceResult?.error
                    ? `Face detection error: ${faceResult.error}`
                    : !modelsReady
                      ? 'Face detection unavailable (models not loaded)'
                      : 'No face detected -- ensure your face is visible'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* GPS status */}
        <div className={`p-3 rounded-lg border ${
          gpsLoading
            ? 'bg-bmc-50 border-bmc-100'
            : gpsPosition
              ? 'bg-status-green-light border-status-green/20'
              : 'bg-status-red-light border-status-red/20'
        }`}>
          <div className="flex items-center gap-2">
            {gpsLoading ? (
              <>
                <svg className="w-4 h-4 text-bmc-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-bmc-600">Getting GPS location... (attempt {attempt}/3)</span>
              </>
            ) : gpsPosition ? (
              <>
                <svg className="w-4 h-4 text-status-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-status-green font-medium">
                  GPS locked (accuracy: {'\u00B1'}{Math.round(gpsPosition.accuracy)}m)
                </span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-status-red" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-status-red font-medium">
                  {gpsError || 'GPS position unavailable'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="w-full max-w-sm mt-3 p-3 rounded-lg bg-status-red-light border border-status-red/20">
          <p className="text-xs text-status-red">{errorMsg}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full max-w-sm mt-6 flex gap-3">
        <button
          onClick={handleRetake}
          className="flex-1 py-3 rounded-lg border-2 border-[var(--neutral-300)] text-[var(--neutral-600)] font-medium text-sm hover:bg-[var(--neutral-50)] active:scale-[0.98] transition-all"
        >
          Retake
        </button>
        <button
          onClick={handleSubmit}
          disabled={gpsLoading || detecting}
          className="flex-1 py-3 rounded-lg bg-bmc-600 text-white font-medium text-sm hover:bg-bmc-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Photo
        </button>
      </div>
    </div>
  );

  const renderSubmitting = () => (
    <div className="px-4 pt-6 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
      <svg className="w-12 h-12 text-bmc-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm font-medium text-bmc-700">Uploading photo...</p>
      <p className="text-xs text-[var(--neutral-500)] mt-1">Verifying face and location</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="px-4 pt-6 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
      <div className="w-20 h-20 rounded-full bg-status-green-light border-4 border-status-green flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-status-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-status-green mb-1">Photo Submitted</p>
      <p className="text-sm text-[var(--neutral-600)] text-center max-w-xs">
        {submissionResult?.message || 'Your geotagged photo has been submitted successfully.'}
      </p>

      {submissionResult && (
        <div className="w-full max-w-sm mt-4 p-4 rounded-lg bg-status-green-light border border-status-green/20">
          <div className="space-y-1">
            <p className="text-xs text-[var(--neutral-600)]">
              Type: {PHOTO_TYPES.find((t) => t.value === photoType)?.label}
            </p>
            <p className="text-xs text-[var(--neutral-600)]">
              Verification: {submissionResult.verified ? 'Passed' : 'Pending review'}
            </p>
            {gpsPosition && (
              <p className="text-xs text-[var(--neutral-600)]">
                GPS: {gpsPosition.lat.toFixed(6)}, {gpsPosition.lng.toFixed(6)}
              </p>
            )}
            <p className="text-xs text-[var(--neutral-600)]">
              Time: {new Date().toLocaleTimeString('en-IN')}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleReset}
        className="mt-6 w-full max-w-sm py-3 rounded-lg bg-bmc-600 text-white font-medium text-sm hover:bg-bmc-700 active:scale-[0.98] transition-all"
      >
        Take Another Photo
      </button>
    </div>
  );

  const renderError = () => (
    <div className="px-4 pt-6 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
      <div className="w-20 h-20 rounded-full bg-status-red-light border-4 border-status-red flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-status-red" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-status-red mb-1">Submission Failed</p>
      <p className="text-sm text-[var(--neutral-600)] text-center max-w-xs">
        {errorMsg || 'Something went wrong. Please try again.'}
      </p>

      <div className="w-full max-w-sm mt-6 flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 py-3 rounded-lg border-2 border-[var(--neutral-300)] text-[var(--neutral-600)] font-medium text-sm hover:bg-[var(--neutral-50)] active:scale-[0.98] transition-all"
        >
          Start Over
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-3 rounded-lg bg-bmc-600 text-white font-medium text-sm hover:bg-bmc-700 active:scale-[0.98] transition-all"
        >
          Retry Submit
        </button>
      </div>
    </div>
  );

  switch (pageState) {
    case 'select':
      return renderTypeSelector();
    case 'camera':
      return renderCamera();
    case 'preview':
      return renderPreview();
    case 'submitting':
      return renderSubmitting();
    case 'success':
      return renderSuccess();
    case 'error':
      return renderError();
  }
}
