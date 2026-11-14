import React from 'react';
import { Language } from '../../data/villageData';
import {
  X,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Megaphone,
  Briefcase,
  Calendar,
  ShieldAlert,
  Ban
} from 'lucide-react';

export interface AppNotificationItem {
  id: string;
  type: 'booking' | 'ad' | 'provider' | 'admin' | 'ban' | 'account';
  tone: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  body: string;
  meta?: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotificationItem[];
  seenIds: string[];
  onMarkAllRead: () => void;
  lang: Language;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  seenIds,
  onMarkAllRead,
  lang
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !seenIds.includes(n.id)).length;

  const renderIcon = (item: AppNotificationItem) => {
    switch (item.type) {
      case 'ad':
        return <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'provider':
        return <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'ban':
        return <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'account':
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'booking':
      default:
        return <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const renderStatusIcon = (tone: AppNotificationItem['tone']) => {
    switch (tone) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'danger':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'warning':
      case 'info':
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[82vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {unreadCount > 0
                  ? lang === 'ar'
                    ? `عندك ${unreadCount} إشعار جديد`
                    : `${unreadCount} unread notification(s)`
                  : lang === 'ar'
                  ? 'كل الإشعارات مقروءة'
                  : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'ar' ? 'تمت القراءة' : 'Mark read'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'مفيش إشعارات جديدة دلوقتي.'
                  : 'No notifications yet.'}
              </div>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !seenIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-colors text-xs space-y-1.5 ${
                    isUnread
                      ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/60'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shrink-0">
                        {renderIcon(item)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </div>
                        {item.meta && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                            {item.meta}
                          </div>
                        )}
                      </div>
                    </div>
                    {renderStatusIcon(item.tone)}
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed ps-10">
                    {item.body}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
