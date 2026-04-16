'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FaceRegistration from '@/components/camera/FaceRegistration';

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<'welcome' | 'register' | 'done'>('welcome');

  const handleSuccess = () => {
    setStep('done');
    // Redirect to attendance after brief success message
    setTimeout(() => router.replace('/attendance'), 2000);
  };

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      {step === 'welcome' && (
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Welcome, {session?.user?.name}
          </h1>
          <p className="text-sm text-gray-500 mb-2">
            Employee ID: {(session?.user as any)?.employeeId}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">
              Face Registration Required
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              Before you can mark attendance or take geotagged photos, you need to register your face.
              This is a one-time process. Your photo will be used to verify your identity at job sites.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Instructions:</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Face the front camera directly — clear, well-lit photo</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Remove sunglasses, hats, or anything covering your face</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Wait for the green border — it means your face is detected</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Tap capture — your face embedding will be saved securely</span>
              </li>
            </ol>
          </div>

          <button
            onClick={() => setStep('register')}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors active:scale-[0.98]"
          >
            Register My Face
          </button>
        </div>
      )}

      {step === 'register' && (
        <div>
          <button
            onClick={() => setStep('welcome')}
            className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <FaceRegistration
            onSuccess={handleSuccess}
            onCancel={() => setStep('welcome')}
          />
        </div>
      )}

      {step === 'done' && (
        <div className="text-center pt-12">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Face Registered!</h2>
          <p className="text-sm text-gray-500">Redirecting you to mark attendance...</p>
        </div>
      )}
    </div>
  );
}
