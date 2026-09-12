import React from 'react';

/** Base shimmer block — sizing/rounding is controlled by the className passed in. */
const Block: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-block ${className}`} />
);

/** Matches DashboardView's layout: filter tabs, hero balance card, two lower cards. */
export const DashboardSkeleton: React.FC = () => (
  <div className="app-page-wide space-y-4" aria-busy="true" aria-label="Memuat data dashboard...">
    {/* Filter tabs */}
    <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80">
      <Block className="h-8 flex-1" />
      <Block className="h-8 flex-1" />
      <Block className="h-8 flex-1" />
      <Block className="h-8 flex-1" />
    </div>

    {/* Hero balance card */}
    <div className="card p-5 space-y-3">
      <Block className="h-3 w-32" />
      <Block className="h-9 w-48" />
      <div className="flex gap-3 pt-2">
        <Block className="h-14 flex-1 rounded-2xl" />
        <Block className="h-14 flex-1 rounded-2xl" />
      </div>
    </div>

    {/* Lower two cards */}
    <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 md:items-start">
      <div className="card p-4 space-y-3">
        <Block className="h-4 w-40" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Block className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Block className="h-3 w-24" />
              <Block className="h-2 w-16" />
            </div>
            <Block className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="card p-4 space-y-3">
        <Block className="h-4 w-40" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Block className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Block className="h-3 w-28" />
              <Block className="h-2 w-20" />
            </div>
            <Block className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Matches HistoryView's layout: search bar, day-group cards of list rows. */
export const HistorySkeleton: React.FC = () => (
  <div className="app-page-wide space-y-4" aria-busy="true" aria-label="Memuat riwayat transaksi...">
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <Block className="h-4 w-36" />
        <Block className="h-3 w-52" />
      </div>
      <Block className="h-8 w-24 rounded-xl" />
    </div>

    <Block className="h-11 w-full rounded-2xl" />

    {[1, 2].map(group => (
      <div key={group} className="space-y-2">
        <Block className="h-3 w-28 ml-1" />
        <div className="card p-2 space-y-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Block className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Block className="h-3 w-32" />
                <Block className="h-2 w-20" />
              </div>
              <Block className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/** Matches RemindersView's layout: tabs, list of reminder cards. */
export const RemindersSkeleton: React.FC = () => (
  <div className="app-page space-y-4" aria-busy="true" aria-label="Memuat pengingat...">
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <Block className="h-4 w-40" />
        <Block className="h-3 w-56" />
      </div>
      <Block className="h-8 w-28 rounded-xl" />
    </div>

    <Block className="h-10 w-full rounded-2xl" />

    <div className="space-y-2.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="card p-3.5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Block className="h-5 w-5 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Block className="h-3 w-36" />
              <Block className="h-3 w-24" />
            </div>
            <Block className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
