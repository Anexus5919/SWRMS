'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FaceRegistration from '@/components/camera/FaceRegistration';
import { useTranslation } from '@/lib/i18n/context';

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
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
            {t('onboarding.welcome')}
            {session?.user?.name ? `, ${session.user.name}` : ''}
          </h1>
          <p className="text-sm text-gray-500 mb-2">
            {t('onboarding.employeeId')}: {(session?.user as { employeeId?: string } | undefined)?.employeeId}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">
              {t('onboarding.faceRequiredTitle')}
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              {t('onboarding.faceRequiredBody')}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {t('onboarding.instructionsTitle')}
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              {[
                t('onboarding.instr1'),
                t('onboarding.instr2'),
                t('onboarding.instr3'),
                t('onboarding.instr4'),
              ].map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>

          <button
            onClick={() => setStep('register')}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors active:scale-[0.98]"
          >
            {t('onboarding.registerButton')}
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
            {t('onboarding.back')}
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('onboarding.doneTitle')}</h2>
          <p className="text-sm text-gray-500">{t('onboarding.redirecting')}</p>
        </div>
      )}
    </div>
  );
}
