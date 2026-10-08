import React, { useState } from 'react';
import { DeletionCancelledError } from '../services/accountService';
import { getErrorMessage } from '../utils/errors';

interface DeleteAccountSectionProps {
  isPaid: boolean;
  onDelete: () => Promise<void>;
  onManageSubscription: () => void;
}

const CONFIRM_WORD = 'DELETE';

/** "Danger zone" card on the Profile tab: permanently deletes the account. */
const DeleteAccountSection: React.FC<DeleteAccountSectionProps> = ({
  isPaid,
  onDelete,
  onManageSubscription,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setIsConfirming(false);
    setTyped('');
    setError(null);
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      if (!(err instanceof DeletionCancelledError)) {
        setError(getErrorMessage(err, 'Account deletion failed. Please try again.'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-[40px] p-6 sm:p-8 shadow-sm">
      <h3 className="text-lg font-black text-red-700 dark:text-red-400 tracking-tight">
        Delete account
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed">
        Permanently deletes your account, every report (including those in Trash) and your profile.
        This can't be undone. Export your reports to CSV first if you want to keep them.
      </p>
      {isPaid && (
        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mt-3 leading-relaxed">
          You have a Pro subscription. Cancel it first in{' '}
          <button onClick={onManageSubscription} className="underline font-bold">
            Manage Subscription
          </button>
          , then come back here. Stripe keeps payment records as required by law.
        </p>
      )}

      {!isConfirming ? (
        <button
          onClick={() => setIsConfirming(true)}
          className="mt-5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <label
            htmlFor="delete-confirm"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Type <strong>{CONFIRM_WORD}</strong> to confirm. You'll be asked to sign in with Google
            once more.
          </label>
          <input
            id="delete-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="w-full sm:w-64 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
          />
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDelete}
              disabled={typed.trim() !== CONFIRM_WORD || isDeleting}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              onClick={reset}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteAccountSection;
