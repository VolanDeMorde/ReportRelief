import React from 'react';
import { type AppState } from '../../hooks/useAppState';
import { FREE_TIER_LIMIT } from '../../constants';
import DeleteAccountSection from '../DeleteAccountSection';
import ClassStats from './ClassStats';

type ProfileTabProps = Pick<
  AppState,
  | 'currentUser'
  | 'userTier'
  | 'generationCount'
  | 'isOnline'
  | 'reports'
  | 'analytics'
  | 'setShowPricingModal'
  | 'handleLogin'
  | 'handleLogout'
  | 'handleManageSubscription'
  | 'handleDeleteAccount'
>;

/** Profile tab: account, plan and usage, subscription, account deletion. */
const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  userTier,
  generationCount,
  isOnline,
  reports,
  analytics,
  setShowPricingModal,
  handleLogin,
  handleLogout,
  handleManageSubscription,
  handleDeleteAccount,
}) => {
  return (
    <section className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10">
      <aside className="w-full shrink-0 print:hidden">
        <div className="lg:sticky lg:top-24 space-y-6">
          <ClassStats analytics={analytics} totalReports={reports.length} />
        </div>
      </aside>

      <div className="w-full min-w-0 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-6 sm:p-8 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Profile
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Your account and subscription details.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: 'Signed In As',
                value: currentUser ? currentUser.displayName || currentUser.email : 'Not signed in',
              },
              { label: 'Plan', value: userTier === 'paid' ? 'Pro ✨' : 'Free' },
              { label: 'Saved Reports', value: String(reports.length) },
              { label: 'Status', value: isOnline ? 'Online 🟢' : 'Offline 🔴' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
            {/* S4: Usage card in profile */}
            {currentUser && userTier === 'free' && generationCount !== null && (
              <div className="sm:col-span-2 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    Monthly Generations
                  </p>
                  <span className="text-[10px] font-black text-indigo-600">
                    {generationCount} / {FREE_TIER_LIMIT}
                  </span>
                </div>
                <div className="w-full bg-indigo-100 dark:bg-indigo-900/40 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${generationCount >= FREE_TIER_LIMIT ? 'bg-red-500' : generationCount >= FREE_TIER_LIMIT * 0.7 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{
                      width: `${Math.min(100, (generationCount / FREE_TIER_LIMIT) * 100)}%`,
                    }}
                  ></div>
                </div>
                {generationCount >= FREE_TIER_LIMIT && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-2">
                    Limit reached. Upgrade to Pro for up to 500 reports a month.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {userTier !== 'paid' && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest gradient-bg text-white shadow hover:scale-105 transition-transform"
              >
                Upgrade to Pro
              </button>
            )}
            {userTier === 'paid' && (
              <button
                onClick={handleManageSubscription}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Manage Subscription
              </button>
            )}
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Log out
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Log in with Google
              </button>
            )}
          </div>
        </div>

        {currentUser && (
          <DeleteAccountSection
            isPaid={userTier === 'paid'}
            onDelete={handleDeleteAccount}
            onManageSubscription={handleManageSubscription}
          />
        )}
      </div>
    </section>
  );
};

export default ProfileTab;
