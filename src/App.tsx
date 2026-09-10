/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthSession, Category, Reminder, TabRoute, Transaction } from './types';
import { clearSession, getStoredSession } from './services/auth';
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
import { OnlineDatabaseStatusBanner } from './components/common/OnlineDatabaseStatusBanner';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { InputView } from './views/InputView';
import { HistoryView } from './views/HistoryView';
import { RemindersView } from './views/RemindersView';
import { ProfileView } from './views/ProfileView';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [currentTab, setCurrentTab] = useState<TabRoute>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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
    syncUserDataWithServer(session.user.id).then((res) => {
      if (res.synced) {
        setTransactions(getTransactions(session.user.id));
        setCategories(getCategories(session.user.id));
        setReminders(getReminders(session.user.id));
      }
    });
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
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>
  ) => {
    if (!session?.user) return;
    addTransaction(session.user.id, txData);
    reloadUserData();
  };

  const handleDeleteTransaction = (id: string) => {
    if (!session?.user) return;
    deleteTransaction(session.user.id, id);
    reloadUserData();
    setSelectedTransaction(null);
  };

  const handleAddCategory = (catData: Omit<Category, 'id' | 'user_id'>) => {
    if (!session?.user) throw new Error('No user session');
    const created = addCategory(session.user.id, catData);
    reloadUserData();
    return created;
  };

  // Reminder Actions
  const handleToggleReminderStatus = (id: string) => {
    if (!session?.user) return;
    toggleReminderStatus(session.user.id, id);
    reloadUserData();
  };

  const handleDeleteReminder = (id: string) => {
    if (!session?.user) return;
    deleteReminder(session.user.id, id);
    reloadUserData();
  };

  const handleAddReminder = (data: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => {
    if (!session?.user) return;
    addReminder(session.user.id, data);
    reloadUserData();
  };

  const handleQuickPayReminder = (reminder: Reminder) => {
    if (!session?.user || !reminder.amount) return;
    // 1. Find suitable tagihan/bill category or fallback
    const billCat =
      categories.find(c => c.name.toLowerCase().includes('tagihan')) ||
      categories.find(c => c.type === 'expense') ||
      categories[0];

    if (!billCat) return;

    // 2. Mark reminder paid
    toggleReminderStatus(session.user.id, reminder.id);

    // 3. Create transaction
    addTransaction(session.user.id, {
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
  };

  // If user is not authenticated: Show Login View (Guest is prohibited)
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900">
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
    <div className="min-h-screen bg-slate-900 text-slate-800 flex justify-center selection:bg-emerald-500 selection:text-white">
      {/* Mobile-First Shell Container */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col shadow-2xl relative">
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
            <DashboardView
              user={session.user}
              transactions={transactions}
              categories={categories}
              reminders={reminders}
              onNavigateTab={tab => setCurrentTab(tab)}
              onSelectTransaction={tx => setSelectedTransaction(tx)}
            />
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
            <HistoryView
              transactions={transactions}
              categories={categories}
              onSelectTransaction={tx => setSelectedTransaction(tx)}
            />
          )}

          {currentTab === 'reminders' && (
            <RemindersView
              user={session.user}
              reminders={reminders}
              onToggleStatus={handleToggleReminderStatus}
              onDeleteReminder={handleDeleteReminder}
              onAddReminder={handleAddReminder}
              onQuickPayAsTransaction={handleQuickPayReminder}
            />
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

        {/* Bottom Navigation Bar */}
        <BottomNav
          currentTab={currentTab}
          onChangeTab={tab => setCurrentTab(tab)}
          pendingRemindersCount={pendingRemindersCount}
        />

        {/* Transaction Detail Drawer / Modal */}
        <TransactionDetailModal
          transaction={selectedTransaction}
          category={selectedCat}
          onClose={() => setSelectedTransaction(null)}
          onDelete={handleDeleteTransaction}
        />
      </div>
    </div>
  );
}
