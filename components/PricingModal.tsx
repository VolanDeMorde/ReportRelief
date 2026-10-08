import React, { useState } from 'react';
import { startCheckout } from '../services/checkoutService';
import { getErrorMessage } from '../utils/errors';

interface PricingModalProps {
  onClose?: () => void;
  onSelectPlan?: (plan: 'monthly' | 'yearly') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, onSelectPlan }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleSelectPlan = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    onSelectPlan?.(plan);
  };

  const PRICE_IDS = {
    monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
    yearly: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
  };

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setCheckoutError(null);
    setIsCheckingOut(true);
    try {
      const priceId = PRICE_IDS[plan];
      if (!priceId) {
        setCheckoutError(
          `Price ID for the ${plan} plan is not configured. Please contact support.`
        );
        return;
      }
      await startCheckout(priceId);
    } catch (e) {
      setCheckoutError(getErrorMessage(e, 'Subscription failed. Please try again.'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const features = {
    common: ['Up to 500 reports a month', 'Mobile & Desktop Access', 'Action Plan Generator'],
    yearlyExtra: ['Everything in Monthly', 'Lock in this price forever'],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-6xl w-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Simple, Transparent Pricing
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Choose the plan that works best for you
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            )}
          </div>
          {/* Inline checkout error banner */}
          {checkoutError && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
              <i className="fas fa-circle-exclamation text-red-500 mt-0.5 text-sm"></i>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium flex-1">
                {checkoutError}
              </p>
              <button
                onClick={() => setCheckoutError(null)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                <i className="fas fa-xmark"></i>
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Monthly Card - The Flexible Pass */}
            <div
              className={`relative rounded-lg border-2 p-8 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-gray-600 bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {/* Card Header */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  The Flexible Pass
                </h3>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    €15
                    <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                      {' '}
                      /month
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Cancel anytime.</p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8 space-y-3">
                {features.common.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="text-green-500 font-bold text-lg mr-3">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={() => {
                  handleSelectPlan('monthly');
                  void handleSubscribe('monthly');
                }}
                disabled={isCheckingOut}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  selectedPlan === 'monthly'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-400 dark:border-gray-600 hover:border-gray-600 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {isCheckingOut && selectedPlan === 'monthly'
                  ? 'Redirecting...'
                  : 'Subscribe Monthly'}
              </button>
            </div>

            {/* Yearly Card - The Teacher's Choice */}
            <div
              className={`relative rounded-lg border-2 p-8 transition-all ${
                selectedPlan === 'yearly'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-purple-400 dark:border-purple-600 hover:border-purple-500 dark:hover:border-purple-500'
              }`}
            >
              {/* Best Value Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Best Value
                </div>
              </div>

              {/* Card Header */}
              <div className="mb-6 mt-4">
                <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  The Teacher's Choice
                </h3>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    €60
                    <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                      {' '}
                      /year
                    </span>
                  </div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm mt-2 font-semibold">
                    Just €5/month. Billed yearly.
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8 space-y-3">
                {features.yearlyExtra.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="text-green-500 font-bold text-lg mr-3">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={() => {
                  handleSelectPlan('yearly');
                  void handleSubscribe('yearly');
                }}
                disabled={isCheckingOut}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  selectedPlan === 'yearly'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
                }`}
              >
                {isCheckingOut && selectedPlan === 'yearly' ? 'Redirecting...' : 'Subscribe Yearly'}
              </button>

              {/* Savings Badge */}
              <div className="mt-4 text-center">
                <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                  💰 Save €30 vs. monthly billing
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
