"use client";
import dynamic from "next/dynamic";

interface ClientStepProps {
  step: string;
}

// Map step parameter to actual component paths
const stepComponents: Record<string, any> = {
  'welcome': dynamic(() => import('../welcome/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  'step-1': dynamic(() => import('../step-1/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  'step-2': dynamic(() => import('../step-2/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  'step-3': dynamic(() => import('../step-3/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  'step-4': dynamic(() => import('../step-4/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  'step-5': dynamic(() => import('../step-5/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  'step-6': dynamic(() => import('../step-6/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  'step-7': dynamic(() => import('../step-7/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '2': dynamic(() => import('../step/2/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '3': dynamic(() => import('../step/3/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '4': dynamic(() => import('../step/4/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '5': dynamic(() => import('../step/5/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '6': dynamic(() => import('../step/6/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '7': dynamic(() => import('../step/7/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '8': dynamic(() => import('../step/8/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '9': dynamic(() => import('../step/9/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '10': dynamic(() => import('../step/10/page'), { ssr: false, loading: () => <div>Loading...</div> }),
  '11': dynamic(() => import('../step/11/page'), { ssr: false, loading: () => <div>Loading...</div> }),
};

export default function ClientStep({ step }: ClientStepProps) {
  const StepComponent = stepComponents[step];
  
  if (!StepComponent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Step not found: {step}</h1>
          <p className="mt-2 text-gray-600">Please return to the onboarding start.</p>
          <a href="/onboarding" className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white">
            Go to Onboarding
          </a>
        </div>
      </div>
    );
  }
  
  return <StepComponent />;
}
