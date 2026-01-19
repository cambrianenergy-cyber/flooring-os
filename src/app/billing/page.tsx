"use client";
import { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const plans = [
  {
    id: 'foundation',
    name: 'Foundation',
    price: '$499/mo',
    features: [
      '4 team members included',
      '2 AI agents included',
      'Basic AI assistance',
      'Core project management',
      'Unlock more agents as needed',
    ],
  },
  {
    id: 'momentum',
    name: 'Momentum',
    price: '$799/mo',
    features: [
      '10 team members included',
      '3 AI agents included',
      'Advanced AI workflows',
      'Priority support',
      'All Foundation features',
      'Unlock more agents as needed',
    ],
  },
  {
    id: 'command',
    name: 'Command',
    price: '$999/mo',
    features: [
      '15 team members included',
      '4 AI agents included',
      'Full AI automation',
      'Custom integrations',
      'All Momentum features',
      'Unlock more agents as needed',
    ],
  },
  {
    id: 'dominion',
    name: 'Dominion',
    price: '$1499-$1999/mo',
    features: [
      '30 team members included',
      '5 AI agents included',
      'Enterprise SSO',
      'Dedicated support',
      'Custom SLAs',
      'All Command features',
      'Unlock more agents as needed',
    ],
  },
];

export default function BillingPage() {
  const [status, setStatus] = useState<string>('loading');
  const [plan, setPlan] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  // Removed unused uid state

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const db = getFirestore();
        const subRef = doc(db, 'subscriptions', user.uid);
        const unsubscribeSub = onSnapshot(subRef, (docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            setStatus(docSnap.data().status);
            setPlan(docSnap.data().plan);
            if (docSnap.data().workspaceId) {
              setWorkspaceId(docSnap.data().workspaceId);
            }
          } else {
            setStatus('none');
            setPlan(null);
            setWorkspaceId(null);
          }
        });
        return () => unsubscribeSub();
      } else {
        setStatus('none');
        setPlan(null);
        setWorkspaceId(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      if (!workspaceId) {
        alert("Workspace ID not loaded. Please try again later.");
        return;
      }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, planKey: planId }),
      });
      const data = await res.json();
      if (data && typeof data === 'object' && 'url' in data && data.url) {
        window.location.assign(data.url);
      } else {
        const errorMsg = (data && typeof data === 'object' && 'error' in data && data.error)
          ? data.error
          : "Could not start checkout.";
        alert(errorMsg);
      }
    } catch {
      alert("Error starting checkout.");
    }
  };

  const handleManageBilling = async () => {
    try {
      if (!workspaceId) {
        alert("Workspace ID not loaded. Please try again later.");
        return;
      }
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert("Could not open billing portal.");
      }
    } catch {
      alert("Error opening billing portal.");
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Billing Settings</h1>
      <div className="mb-8">
        <div className="text-lg">Subscription Status: <span className="font-semibold">{status}</span></div>
        {plan && <div className="text-lg">Current Plan: <span className="font-semibold">{plan}</span></div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map(p => (
          <div key={p.id} className="border rounded-lg p-6 flex flex-col items-center">
            <div className="text-xl font-bold mb-2">{p.name}</div>
            <div className="text-2xl mb-4">{p.price}</div>
            <ul className="mb-4">
              {p.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => handleSubscribe(p.id)}
              disabled={plan === p.id}
            >
              {plan === p.id ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
      <button
        className="bg-gray-800 text-white px-6 py-2 rounded"
        onClick={handleManageBilling}
      >
        Manage Billing
      </button>
    </main>
  );
}
