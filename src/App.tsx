/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthSession, Category, Reminder, TabRoute, Transaction } from './types';
import { clearSession, getStoredSession } from './services/auth';
import { useToast } from './components/common/Toast';
import { DashboardSkeleton, HistorySkeleton, RemindersSkeleton } from './components/common/Skeletons';
import {
  addCategory,
  addReminder,
  addTransaction,
  deleteReminder,
  deleteTransaction,
  getCategories,
  getReminders,
  getTransactions,
  initializeUserDatabase,
  syncUserDataWithServer,
  toggleReminderStatus,
} from './services/storage';
import { TopBar } from './components/navigation/TopBar';
import { BottomNav } from './components/navigation/BottomNav';
import { Sidebar } from './components/navigation/Sidebar';
import { OnlineDatabaseStatusBanner } from './components/common/OnlineDatabaseStatusBanner';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { InputView } from './views/InputView';
import { HistoryView } from './views/HistoryView';
import { RemindersView } from './views/RemindersView';
import { ProfileView } from './views/ProfileView';

export default function App() {
  const { showSuccess, showError } = useToast();
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [currentTab, setCurrentTab] = useState<TabRoute>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  // True only until the very first data sync (on login/session restore) resolves,
  // so Dashboard/History/Reminders can show a skeleton instead of an empty state.
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load user data whenever session changes
  const reloadUserData = useCallback(() => {
    if (!session?.user) return;
    initializeUserDatabase(session.user);
    const txs = getTransactions(session.user.id);
    const cats = getCategories(session.user.id);
    const rems = getReminders(session.user.id);
    setTransactions(txs);
    setCategories(cats);
    setReminders(rems);

    // Sync in background from Neon PostgreSQL if server is connected
    syncUserDataWithServer(session.user.id)
      .then((res) => {
        if (res.synced) {
          setTransactions(getTransactions(session.user.id));
          setCategories(getCategories(session.user.id));
          setReminders(getReminders(session.user.id));
        }
      })
      .finally(() => setIsInitialLoading(false));
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      reloadUserData();
    }
  }, [session?.user, reloadUserData]);

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
    setTransactions([]);
    setCategories([]);
    setReminders([]);
    setCurrentTab('dashboard');
  }, []);

  const handleLoginSuccess = () => {
    const active = getStoredSession();
    if (active) {
      setSession(active);
      setCurrentTab('dashboard');
    }
  };

  // Transaction Actions
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user) return { success: false, error: 'Sesi tidak ditemukan.' };
    const result = await addTransaction(session.user.id, txData);
    reloadUserData();
    // Note: InputView shows its own rich inline success banner (with a
    // "Riwayat" shortcut) on success, so we only toast the error case here
    // to avoid a redundant double confirmation for the same action.
    if (!result.synced && result.error) {
      showError(result.error);
    }
    return { success: result.success, error: result.synced ? undefined : result.error };
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!session?.user) return;
    const result = await deleteTransaction(session.user.id, id);
    reloadUserData();
    setSelectedTransaction(null);
    if (result.synced) {
      showSuccess('Transaksi berhasil dihapus.');
    } else if (result.error) {
      showError(result.error);
    }
  };

  const handleAddCategory = async (
    catData: Omit<Category, 'id' | 'user_id'>
  ): Promise<{ success: boolean; data?: Category; error?: string }> => {
    if (!session?.user) return { success: false, error: 'Sesi tidak ditemukan.' };
    const result = await addCategory(session.user.id, catData);
    reloadUserData();
    if (result.synced) {
      showSuccess('Kategori baru berhasil ditambahkan!');
    } else if (result.error) {
      showError(result.error);
    }
    return { success: result.success, data: result.data, error: result.synced ? undefined : result.error };
  };

  // Reminder Actions
  const handleToggleReminderStatus = async (id: string) => {
    if (!session?.user) return;
    const result = await toggleReminderStatus(session.user.id, id);
    reloadUserData();
    if (!result.synced && result.error) {
      showError(result.error);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!session?.user) return;
    const result = await deleteReminder(session.user.id, id);
    reloadUserData();
    if (result.synced) {
      showSuccess('Pengingat berhasil dihapus.');
    } else if (result.error) {
      showError(result.error);
    }
  };

  const handleAddReminder = async (
    data: Omit<Reminder, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user) return { success: false, error: 'Sesi tidak ditemukan.' };
    const result = await addReminder(session.user.id, data);
    reloadUserData();
    if (result.synced) {
      showSuccess('Pengingat baru berhasil disimpan!');
    } else if (result.error) {
      showError(result.error);
    }
    return { success: result.success, error: result.synced ? undefined : result.error };
  };

  const handleQuickPayReminder = async (reminder: Reminder) => {
    if (!session?.user || !reminder.amount) return;
    // 1. Find suitable tagihan/bill category or fallback
    const billCat =
      categories.find(c => c.name.toLowerCase().includes('tagihan')) ||
      categories.find(c => c.type === 'expense') ||
      categories[0];

    if (!billCat) return;

    // 2. Mark reminder paid
    await toggleReminderStatus(session.user.id, reminder.id);

    // 3. Create transaction
    const result = await addTransaction(session.user.id, {
      category_id: billCat.id,
      type: 'expense',
      amount: reminder.amount,
      transaction_date: new Date().toISOString(),
      details: {
        payment_method: 'Transfer Bank / Autodebit',
        notes: `Pembayaran tagihan: ${reminder.title}`,
        tags: ['tagihan', 'lunas'],
      },
    });

    reloadUserData();
    setCurrentTab('history');

    if (result.synced) {
      showSuccess(`Tagihan "${reminder.title}" berhasil dibayar & dicatat!`);
    } else if (result.error) {
      showError(result.error);
    }
  };

  // If user is not authenticated: Show Login View (Guest is prohibited)
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50">
        <OnlineDatabaseStatusBanner />
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const pendingRemindersCount = reminders.filter(r => r.status === 'pending').length;
  const selectedCat = selectedTransaction
    ? categories.find(c => c.id === selectedTransaction.category_id)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-emerald-500 selection:text-white md:flex">
      {/* Desktop-only navigation rail (hidden on mobile; BottomNav takes over there) */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={tab => setCurrentTab(tab)}
        pendingRemindersCount={pendingRemindersCount}
      />

      {/* Main column: full app on mobile, content column beside the sidebar on desktop */}
      <div className="flex-1 min-h-screen flex flex-col min-w-0">
        {/* Online Database Status Banner */}
        <OnlineDatabaseStatusBanner />

        {/* Top Bar with User Info & JWT Session Status */}
        <TopBar
          session={session}
          onLogout={handleLogout}
          onSessionUpdated={updated => setSession(updated)}
          onOpenProfile={() => setCurrentTab('profile')}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            isInitialLoading ? (
              <DashboardSkeleton />
            ) : (
              <DashboardView
                user={session.user}
                transactions={transactions}
                categories={categories}
                reminders={reminders}
                onNavigateTab={tab => setCurrentTab(tab)}
                onSelectTransaction={tx => setSelectedTransaction(tx)}
              />
            )
          )}

          {currentTab === 'input' && (
            <InputView
              user={session.user}
              categories={categories}
              onSaveTransaction={handleSaveTransaction}
              onAddCategory={handleAddCategory}
              onViewHistory={() => setCurrentTab('history')}
            />
          )}

          {currentTab === 'history' && (
            isInitialLoading ? (
              <HistorySkeleton />
            ) : (
              <HistoryView
                transactions={transactions}
                categories={categories}
                onSelectTransaction={tx => setSelectedTransaction(tx)}
              />
            )
          )}

          {currentTab === 'reminders' && (
            isInitialLoading ? (
              <RemindersSkeleton />
            ) : (
              <RemindersView
                user={session.user}
                reminders={reminders}
                onToggleStatus={handleToggleReminderStatus}
                onDeleteReminder={handleDeleteReminder}
                onAddReminder={handleAddReminder}
                onQuickPayAsTransaction={handleQuickPayReminder}
              />
            )
          )}

          {currentTab === 'profile' && (
            <ProfileView
              session={session}
              transactions={transactions}
              categories={categories}
              reminders={reminders}
              onLogout={handleLogout}
              onSessionUpdated={updated => setSession(updated)}
              onReloadData={reloadUserData}
            />
          )}
        </main>

        {/* Bottom Navigation Bar (mobile only — Sidebar takes over on desktop) */}
        <BottomNav
          currentTab={currentTab}
          onChangeTab={tab => setCurrentTab(tab)}
          pendingRemindersCount={pendingRemindersCount}
        />
      </div>

      {/* Transaction Detail Drawer / Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        category={selectedCat}
        onClose={() => setSelectedTransaction(null)}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
}
