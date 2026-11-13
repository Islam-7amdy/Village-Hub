import React from 'react';
import { VillageRide, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Car, Clock, MapPin, Users, Phone, CheckCircle2 } from 'lucide-react';

interface VillageRidesSectionProps {
  rides: VillageRide[];
  lang: Language;
  canUseServices: boolean;
  onRequireLogin: () => void;
  onBookRide: (ride: VillageRide) => void;
}

export const VillageRidesSection: React.FC<VillageRidesSectionProps> = ({
  rides,
  lang,
  canUseServices,
  onRequireLogin,
  onBookRide
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.rides}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'مشاوير وتوصيلة يومية مع ولاد البلد للبندر والجامعة والمستشفى' : 'Shared daily carpools from village to the city, hospitals, and university'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rides.map((ride) => (
          <div
            key={ride.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {ride.driverName[lang]}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {ride.carModel}
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-sm font-black font-mono tabular-nums text-blue-600 dark:text-blue-400">
                    {ride.pricePerSeat[lang]}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 justify-end mt-0.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="font-mono tabular-nums">{ride.availableSeats} {t.availableSeats}</span>
                  </div>
                </div>
              </div>

              {/* Route box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>{lang === 'ar' ? 'هيتحرك من:' : 'From:'}</strong> {ride.from[lang]}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span><strong>{lang === 'ar' ? 'رايح على:' : 'Destination:'}</strong> {ride.to[lang]}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span><strong>{t.departureTime}:</strong> {ride.departureTime}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <a
                href={`tel:${ride.phone}`}
                onClick={(e) => {
                  if (!canUseServices) {
                    e.preventDefault();
                    onRequireLogin();
                  }
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.callNow}</span>
              </a>

              <button
                onClick={() => onBookRide(ride)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Car className="w-3.5 h-3.5" />
                <span>{t.bookSeat}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
