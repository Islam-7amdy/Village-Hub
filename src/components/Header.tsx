import React from 'react';
import { UserRole } from '../types/medical';
import { Moon, Sun, ShieldAlert, Video } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenEmergencyCard?: () => void;
  onJoinTelehealth?: () => void;
  hasUpcomingCall?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
  onOpenEmergencyCard,
  onJoinTelehealth,
  hasUpcomingCall
}) => {
  const patientTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'vitals', label: 'Vitals' },
    { id: 'medications', label: 'Medications' },
    { id: 'labs', label: 'Lab Reports' },
    { id: 'triage', label: 'AI Triage' },
    { id: 'messages', label: 'Messages' },
  ];

  const doctorTabs = [
    { id: 'queue', label: 'Patient Queue' },
    { id: 'ehr', label: 'EHR Charting' },
    { id: 'rx-desk', label: 'Prescriptions' },
    { id: 'labs-review', label: 'Diagnostics' },
    { id: 'messages', label: 'Consultations' },
  ];

  const navLinks = currentRole === 'patient' ? patientTabs : doctorTabs;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange(currentRole === 'patient' ? 'overview' : 'queue')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  V
                </span>
                <span>Vitalis Health</span>
              </span>
            </button>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400">
              {currentRole === 'patient' ? 'Patient Portal' : 'Clinician Suite'}
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 overflow-x-auto py-1">
            {navLinks.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                    isActive
                      ? 'text-teal-700 dark:text-teal-400 font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentRole === 'patient' && onOpenEmergencyCard && (
              <button
                onClick={onOpenEmergencyCard}
                title="Emergency Medical ID"
                className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                aria-label="Emergency Medical Card"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            )}

            {hasUpcomingCall && onJoinTelehealth && (
              <button
                onClick={onJoinTelehealth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Join Telehealth</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Role Switcher */}
            <button
              onClick={() => onRoleChange(currentRole === 'patient' ? 'doctor' : 'patient')}
              className="px-3.5 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Switch to {currentRole === 'patient' ? 'Clinician' : 'Patient'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center gap-3 overflow-x-auto py-2.5 border-t border-slate-100 dark:border-slate-800 no-scrollbar">
          {navLinks.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`text-xs px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
