/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CharityOrg,
  DoctorService,
  OtherService,
  TechnicianService,
  TutoringService,
  VillageRide,
  evaluateProviderAvailability,
  isOrderEligibleForReview,
  parsePriceEgp
} from './data/villageData';
import { TRANSLATIONS } from './data/translations';
import { VillageProvider, useVillage } from './context/VillageContext';
import { toAvailabilityConfig } from './hooks/useProviders';

import { VillageHeader } from './components/VillageHeader';
import { VillageHeroBanner } from './components/VillageHeroBanner';
import { DoctorsSection } from './components/ServiceSections/DoctorsSection';
import { TechniciansSection } from './components/ServiceSections/TechniciansSection';
import { FoodSection } from './components/ServiceSections/FoodSection';
import { PharmacySection } from './components/ServiceSections/PharmacySection';
import { VillageRidesSection } from './components/ServiceSections/VillageRidesSection';
import { GrocerySection } from './components/ServiceSections/GrocerySection';
import { TutoringSection } from './components/ServiceSections/TutoringSection';
import { CharitySection } from './components/ServiceSections/CharitySection';
import { OtherServicesSection } from './components/ServiceSections/OtherServicesSection';
import { AdsSection } from './components/ServiceSections/AdsSection';

import { UniversalBookingModal } from './components/Modals/UniversalBookingModal';
import { PrescriptionUploadModal } from './components/Modals/PrescriptionUploadModal';
import { CartModal } from './components/Modals/CartModal';
import { EmergencyDirectoryModal } from './components/Modals/EmergencyDirectoryModal';
import { VillageAssistantModal } from './components/Modals/VillageAssistantModal';
import { NotificationsModal } from './components/Modals/NotificationsModal';
import { ReviewModal } from './components/Modals/ReviewModal';
import { ProviderReviewsModal } from './components/Modals/ProviderReviewsModal';
import { AuthModal } from './components/Modals/AuthModal';
import { OrderStatusModal } from './components/Modals/OrderStatusModal';
import { ProviderOrdersModal } from './components/Modals/ProviderOrdersModal';
import { PaymentPage } from './components/PaymentPage';
import { ProviderWorkspace } from './components/ProviderWorkspace';
import { AdminWorkspace } from './components/AdminWorkspace';

import { Briefcase, AlertCircle, Ban, Phone } from 'lucide-react';

function AppShell() {
  const {
    lang,
    setLang,
    darkMode,
    setDarkMode,
    nowMs,
    firebaseUser,
    userProfile,
    profileLoaded,
    ownPhoneBan,
    isAdmin,
    adminUids,
    activeDemoAccount,
    effectiveUid,
    effectiveProfile,
    isSignedIn,
    isCurrentUserBanned,
    canUsePlatformServices,
    mergedUsers,
    mergedBannedPhones,
    handleLoginDemoAccount,
    handleLogoutDemoAccount,
    handleDemoUserAction,
    handleDemoProviderDecision,
    requireAuth,
    activeVillage,
    setActiveVillage,
    theme,
    activeVillageName,
    adPricing,
    handleCommissionRateChange,
    allAds,
    mergedSections,
    isSectionEnabled,
    analyticsEvents,
    trackAnalyticsEvent,
    handleSaveSection,
    handleDeleteSection,
    handleResetSections,
    handleAdminSaveAd,
    handleAdminDeleteAd,
    mergedProviders,
    approvedProviders,
    isProviderMode,
    activeProviderListing,
    reviews,
    providerReviews,
    allDoctors,
    allTechnicians,
    allFoods,
    allPharmacy,
    allGrocery,
    allTutors,
    allCharities,
    allRides,
    allOtherServices,
    handleUpdateProviderAvailability,
    handleAdminToggleProviderOpen,
    handleAdminDeleteProvider,
    handleAddReview,
    cart,
    bookings,
    seenNotificationIds,
    pendingPayment,
    setPendingPayment,
    recentlyCompletedOrderId,
    setRecentlyCompletedOrderId,
    bookingError,
    setBookingError,
    userOrders,
    activeOrdersCount,
    providerOrders,
    activeProviderOrdersCount,
    pendingAdminCount,
    userNotifications,
    unreadNotificationsCount,
    handleMarkAllNotificationsRead,
    handleUpdateOrderStatus,
    handleVerifyInstaPayPayment,
    handleAssignOrderProvider,
    handleSettleOrders,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveCartItem,
    handleProceedToPayment,
    handlePaymentCompleted,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    openAuthModal,
    isOrderStatusOpen,
    setIsOrderStatusOpen,
    activeReviewTarget,
    setActiveReviewTarget
  } = useVillage();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    type: 'doctor' | 'technician' | 'ride' | 'tutoring' | 'charity' | 'other';
    providerOwnerId?: string;
    providerName: string;
    title: string;
    feeEgp: number;
  }>({ type: 'doctor', providerOwnerId: undefined, providerName: '', title: '', feeEgp: 50 });

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isProviderOrdersOpen, setIsProviderOrdersOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isProviderReviewsModalOpen, setIsProviderReviewsModalOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  const eligibleOrdersForActiveTarget = activeReviewTarget.id
    ? userOrders.filter((b) =>
        isOrderEligibleForReview(b, activeReviewTarget.id, effectiveUid, reviews)
      )
    : [];

  // Review modal openers
  const handleOpenReviewsModal = (
    targetId: string,
    name: string,
    role: string,
    avatar: string,
    rating: number,
    reviewsCount: number
  ) => {
    trackAnalyticsEvent('provider_view', targetId, name);
    setActiveReviewTarget({ id: targetId, name, role, avatar, rating, reviewsCount });
    setIsProviderReviewsModalOpen(true);
  };

  const handleOpenAddReviewModal = (targetId: string, name: string, role: string) => {
    requireAuth(() => {
      const docItem = allDoctors.find((d) => d.id === targetId);
      const tech = allTechnicians.find((tItem) => tItem.id === targetId);
      setActiveReviewTarget({
        id: targetId,
        name,
        role,
        avatar: docItem?.avatar || tech?.avatar || '',
        rating: docItem?.rating || tech?.rating || 5,
        reviewsCount: docItem?.reviewsCount || tech?.reviewsCount || 0
      });
      setIsReviewModalOpen(true);
    });
  };

  // Service booking modal openers
  const handleOpenDoctorBooking = (docItem: DoctorService) => {
    if (!evaluateProviderAvailability(docItem.availability, nowMs).isOpen) return;
    trackAnalyticsEvent('provider_view', docItem.ownerId || docItem.id, docItem.name[lang]);
    requireAuth(() => {
      setBookingDetails({
        type: 'doctor',
        providerOwnerId: docItem.ownerId,
        providerName: docItem.name[lang],
        title: `${t.bookClinicVisit}: ${docItem.specialty[lang]}`,
        feeEgp: parsePriceEgp(docItem.fee[lang], 100)
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenTechnicianBooking = (tech: TechnicianService) => {
    if (!evaluateProviderAvailability(tech.availability, nowMs).isOpen) return;
    trackAnalyticsEvent('provider_view', tech.ownerId || tech.id, tech.name[lang]);
    requireAuth(() => {
      setBookingDetails({
        type: 'technician',
        providerOwnerId: tech.ownerId,
        providerName: tech.name[lang],
        title: `${t.requestRepair}: ${tech.craft[lang]}`,
        feeEgp: parsePriceEgp(tech.hourlyRate[lang], 70)
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenRideBooking = (ride: VillageRide) => {
    if (!evaluateProviderAvailability(ride.availability, nowMs).isOpen) return;
    trackAnalyticsEvent('provider_view', ride.ownerId || ride.id, ride.driverName[lang]);
    requireAuth(() => {
      setBookingDetails({
        type: 'ride',
        providerOwnerId: ride.ownerId,
        providerName: ride.driverName[lang],
        title: `${t.bookSeat} (${ride.from[lang]} -> ${ride.to[lang]})`,
        feeEgp: parsePriceEgp(ride.pricePerSeat[lang], 25)
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenTutorBooking = (tutor: TutoringService) => {
    if (!evaluateProviderAvailability(tutor.availability, nowMs).isOpen) return;
    trackAnalyticsEvent('provider_view', tutor.ownerId || tutor.id, tutor.teacherName[lang]);
    requireAuth(() => {
      setBookingDetails({
        type: 'tutoring',
        providerOwnerId: tutor.ownerId,
        providerName: tutor.teacherName[lang],
        title: `${t.bookLesson}: ${tutor.subject[lang]}`,
        feeEgp: parsePriceEgp(tutor.feePerSession[lang], 70)
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenCharityContact = (org: CharityOrg) => {
    if (!evaluateProviderAvailability(org.availability, nowMs).isOpen) return;
    trackAnalyticsEvent('provider_view', org.ownerId || org.id, org.name[lang]);
    requireAuth(() => {
      setBookingDetails({
        type: 'charity',
        providerOwnerId: org.ownerId,
        providerName: org.name[lang],
        title: `${t.charityAction}: ${org.activeCampaign[lang]}`,
        feeEgp: parsePriceEgp(org.donationExample[lang], 50)
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenOtherBooking = (svc: OtherService) => {
    if (!evaluateProviderAvailability(svc.availability, nowMs).isOpen) return;
    trackAnalyticsEvent('provider_view', svc.ownerId || svc.id, svc.name[lang]);
    requireAuth(() => {
      setBookingDetails({
        type: 'other',
        providerOwnerId: svc.ownerId,
        providerName: svc.name[lang],
        title: `${svc.activityType[lang]} - ${svc.name[lang]}`,
        feeEgp: parsePriceEgp(svc.priceLabel[lang], 50)
      });
      setIsBookingOpen(true);
    });
  };

  // Village Scoping & Search Filters
  const q = searchQuery.toLowerCase().trim();
  const byVillage = <T extends { villageId?: string }>(items: T[], fallbackToShared = false) => {
    const scoped = items.filter((item) => item.villageId === activeVillage.id);
    if (scoped.length > 0 || !fallbackToShared) return scoped;
    return items;
  };

  const filteredDoctors = byVillage(allDoctors).filter(
    (d) =>
      d.name[lang].toLowerCase().includes(q) ||
      d.specialty[lang].toLowerCase().includes(q) ||
      d.clinicName[lang].toLowerCase().includes(q)
  );

  const filteredTechnicians = byVillage(allTechnicians).filter(
    (tech) =>
      tech.name[lang].toLowerCase().includes(q) ||
      tech.craft[lang].toLowerCase().includes(q) ||
      tech.bio[lang].toLowerCase().includes(q)
  );

  const filteredFoods = byVillage(allFoods, true).filter(
    (f) =>
      f.name[lang].toLowerCase().includes(q) ||
      f.description[lang].toLowerCase().includes(q) ||
      f.restaurantName[lang].toLowerCase().includes(q)
  );

  const filteredPharmacy = byVillage(allPharmacy, true).filter(
    (p) =>
      p.name[lang].toLowerCase().includes(q) ||
      p.description[lang].toLowerCase().includes(q)
  );

  const filteredRides = byVillage(allRides, true).filter(
    (r) =>
      r.driverName[lang].toLowerCase().includes(q) ||
      r.to[lang].toLowerCase().includes(q)
  );

  const filteredGrocery = byVillage(allGrocery, true).filter(
    (g) =>
      g.name[lang].toLowerCase().includes(q) ||
      g.storeName[lang].toLowerCase().includes(q) ||
      g.description[lang].toLowerCase().includes(q)
  );

  const filteredTutors = byVillage(allTutors, true).filter(
    (tut) =>
      tut.teacherName[lang].toLowerCase().includes(q) ||
      tut.subject[lang].toLowerCase().includes(q) ||
      tut.grades[lang].toLowerCase().includes(q)
  );

  const filteredCharities = byVillage(allCharities, true).filter(
    (ch) =>
      ch.name[lang].toLowerCase().includes(q) ||
      ch.focus[lang].toLowerCase().includes(q) ||
      ch.activeCampaign[lang].toLowerCase().includes(q)
  );

  const filteredOtherServices = byVillage(allOtherServices, true).filter(
    (oth) =>
      oth.name[lang].toLowerCase().includes(q) ||
      oth.activityType[lang].toLowerCase().includes(q) ||
      oth.description[lang].toLowerCase().includes(q)
  );

  // Dedicated Payment Page Gate before Order Completion
  if (pendingPayment) {
    return (
      <PaymentPage
        lang={lang}
        activeVillage={activeVillage}
        order={pendingPayment}
        onBackToOrder={() => setPendingPayment(null)}
        onPaymentCompleted={handlePaymentCompleted}
      />
    );
  }

  // Dedicated Admin Portal
  if (isAdmin) {
    return (
      <>
        <AdminWorkspace
          lang={lang}
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          activeVillage={activeVillage}
          adminProfile={effectiveProfile}
          currentAdminUid={firebaseUser?.uid || null}
          adminUids={adminUids}
          providers={mergedProviders}
          ads={allAds}
          users={mergedUsers}
          bannedPhones={mergedBannedPhones}
          bookings={bookings}
          reviews={reviews}
          sections={mergedSections}
          analyticsEvents={analyticsEvents}
          adPricing={adPricing}
          nowMs={nowMs}
          notificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAuth={() => openAuthModal('login')}
          onVillageUpdated={(updated) => setActiveVillage(updated)}
          onDemoUserAction={handleDemoUserAction}
          onDemoProviderDecision={handleDemoProviderDecision}
          onAdminToggleProviderOpen={handleAdminToggleProviderOpen}
          onAdminDeleteProvider={handleAdminDeleteProvider}
          onSaveSection={handleSaveSection}
          onDeleteSection={handleDeleteSection}
          onResetSections={handleResetSections}
          onAdminSaveAd={handleAdminSaveAd}
          onAdminDeleteAd={handleAdminDeleteAd}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onVerifyInstaPayPayment={handleVerifyInstaPayPayment}
          onAssignOrderProvider={handleAssignOrderProvider}
          onSettleOrders={handleSettleOrders}
          onCommissionRateChange={handleCommissionRateChange}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          lang={lang}
          initialMode={authModalMode}
          firebaseUser={firebaseUser}
          userProfile={userProfile}
          activeDemoAccount={activeDemoAccount}
          onLoginDemoAccount={handleLoginDemoAccount}
          onLogoutDemoAccount={handleLogoutDemoAccount}
          isAdmin={isAdmin}
          isBanned={false}
          sections={mergedSections}
          onProfileSaved={() => {}}
          onOpenAdminPanel={() => setIsAuthModalOpen(false)}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={userNotifications}
          seenIds={seenNotificationIds}
          onMarkAllRead={handleMarkAllNotificationsRead}
          lang={lang}
        />
      </>
    );
  }

  // Dedicated Service Provider Portal
  if (isProviderMode && effectiveProfile) {
    return (
      <>
        <ProviderWorkspace
          lang={lang}
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          activeVillage={activeVillage}
          providerProfile={effectiveProfile}
          providerListing={activeProviderListing}
          orders={providerOrders}
          reviews={providerReviews}
          commissionRatePercent={adPricing.commissionRatePercent ?? 10}
          notificationsCount={unreadNotificationsCount}
          isBanned={isCurrentUserBanned}
          banReason={ownPhoneBan?.reason || effectiveProfile.banReason}
          banUntilMs={ownPhoneBan?.banUntilMs || effectiveProfile.banUntilMs}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateAvailability={handleUpdateProviderAvailability}
          nowMs={nowMs}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAuth={() => openAuthModal('login')}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          lang={lang}
          initialMode={authModalMode}
          firebaseUser={firebaseUser}
          userProfile={userProfile}
          activeDemoAccount={activeDemoAccount}
          onLoginDemoAccount={handleLoginDemoAccount}
          onLogoutDemoAccount={handleLogoutDemoAccount}
          isAdmin={isAdmin}
          isBanned={isCurrentUserBanned}
          banReason={ownPhoneBan?.reason || effectiveProfile.banReason}
          banUntilMs={ownPhoneBan?.banUntilMs || effectiveProfile.banUntilMs}
          sections={mergedSections}
          onProfileSaved={() => {}}
          onOpenAdminPanel={() => setIsAuthModalOpen(false)}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={userNotifications}
          seenIds={seenNotificationIds}
          onMarkAllRead={handleMarkAllNotificationsRead}
          lang={lang}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-500 selection:text-white transition-colors">
      <VillageHeader
        lang={lang}
        onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        activeTab={activeTab}
        sections={mergedSections}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          if (tab !== 'all') {
            const sec = mergedSections.find((s) => s.id === tab);
            trackAnalyticsEvent(
              'section_view',
              tab,
              sec ? (lang === 'ar' ? sec.nameAr : sec.nameEn) : tab
            );
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        activeOrdersCount={activeOrdersCount}
        providerOrdersCount={activeProviderOrdersCount}
        notificationsCount={unreadNotificationsCount}
        onOpenCart={() => requireAuth(() => setIsCartModalOpen(true))}
        onOpenOrders={() => {
          setRecentlyCompletedOrderId(null);
          setIsOrderStatusOpen(true);
        }}
        onOpenProviderOrders={() => setIsProviderOrdersOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        onOpenAssistant={() => requireAuth(() => setIsAssistantModalOpen(true))}
        activeVillage={activeVillage}
        isSignedIn={isSignedIn}
        isAdmin={isAdmin}
        userProfile={effectiveProfile}
        userPhotoUrl={effectiveProfile?.photoUrl || ''}
        pendingAdminCount={pendingAdminCount}
        onOpenAuth={() => openAuthModal('login')}
        onOpenAdminPanel={() => openAuthModal('login')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <VillageHeroBanner
          lang={lang}
          activeTab={activeTab}
          onSelectCategory={(cat) => {
            setActiveTab(cat);
            setSearchQuery('');
            if (cat !== 'all') {
              const sec = mergedSections.find((s) => s.id === cat);
              trackAnalyticsEvent(
                'section_view',
                cat,
                sec ? (lang === 'ar' ? sec.nameAr : sec.nameEn) : cat
              );
            }
          }}
          activeVillage={activeVillage}
          heroAdsSlot={
            <AdsSection
              ads={allAds}
              lang={lang}
              activeVillageId={activeVillage.id}
              activeVillageName={activeVillageName}
              activeVillage={activeVillage}
              currentUserId={effectiveUid}
              currentUserName={
                effectiveProfile?.displayName ||
                firebaseUser?.displayName ||
                (lang === 'ar' ? 'معلن من القرية' : 'Village Advertiser')
              }
              defaultPhone={effectiveProfile?.phone || ''}
              isAdmin={isAdmin}
              isBanned={isCurrentUserBanned}
              adPricing={adPricing}
              nowMs={nowMs}
              canUseServices={canUsePlatformServices}
              onRequireLogin={() => openAuthModal('login')}
              onTrackEvent={trackAnalyticsEvent}
            />
          }
        />

        {bookingError && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold">{bookingError}</span>
            </div>
            <button
              onClick={() => setBookingError('')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        )}

        {effectiveProfile?.role === 'provider' && effectiveProfile.providerStatus === 'pending' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
              <Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'حسابك كمقدم خدمة قيد المراجعة دلوقتي، وهينزل للناس أول ما الأدمن يوافق عليه.'
                  : 'Your service provider application is pending admin approval before appearing publicly.'}
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold cursor-pointer"
            >
              {t.account}
            </button>
          </div>
        )}

        {effectiveProfile?.role === 'provider' && effectiveProfile.providerStatus === 'rejected' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'طلب انضمامك كمقدم خدمة اترفض، تقدر تعدل بياناتك من حسابك وتبعته تاني.'
                  : 'Your provider request was declined. You can update your profile and resubmit.'}
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
            >
              {t.account}
            </button>
          </div>
        )}

        {isCurrentUserBanned && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
              <Ban className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="font-bold">
                  {lang === 'ar'
                    ? 'حسابك / رقم موبايلك محظور حالياً من استخدام خدمات المنصة'
                    : 'Your account / mobile phone is currently banned from platform actions'}
                </div>
                <div className="text-[11px] opacity-85">
                  {(ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs)
                    ? lang === 'ar'
                      ? `ينتهي الحظر: ${new Date((ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs)!).toLocaleString('ar-EG')}`
                      : `Expires: ${new Date((ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs)!).toLocaleString()}`
                    : lang === 'ar'
                    ? 'حظر دائم'
                    : 'Permanent ban'}
                  {(ownPhoneBan?.reason || effectiveProfile?.banReason)
                    ? ` · ${ownPhoneBan?.reason || effectiveProfile?.banReason}`
                    : ''}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
            >
              {t.account}
            </button>
          </div>
        )}

        {firebaseUser &&
          profileLoaded &&
          !isAdmin &&
          !isCurrentUserBanned &&
          (!userProfile || !userProfile.phone) && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">
                  {lang === 'ar'
                    ? 'لازم تكمل بيانات حسابك (الاسم ورقم الموبايل والعنوان) عشان تقدر تستفيد من خدمات المنصة.'
                    : 'Please complete your Name, Mobile Phone, and Address to activate platform services.'}
                </span>
              </div>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold cursor-pointer"
              >
                {lang === 'ar' ? 'إكمال بيانات الحساب' : 'Complete Account'}
              </button>
            </div>
          )}

        {(activeTab === 'all' || activeTab === 'doctors') && isSectionEnabled('doctors') && (
          filteredDoctors.length > 0 ? (
            <DoctorsSection
              doctors={filteredDoctors}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onBookDoctor={handleOpenDoctorBooking}
              onViewReviews={handleOpenReviewsModal}
              onAddReview={handleOpenAddReviewModal}
            />
          ) : activeTab === 'doctors' ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ar'
                  ? `لسه مفيش دكاترة معتمدين متضافين في ${activeVillage.nameAr}.`
                  : `No approved doctors registered yet in ${activeVillage.nameEn}.`}
              </p>
              <button
                onClick={() => openAuthModal('register')}
                className={`px-4 py-2 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold cursor-pointer`}
              >
                {lang === 'ar' ? 'سجل كدكتور أو مقدم خدمة في القرية' : 'Register as a Provider'}
              </button>
            </div>
          ) : null
        )}

        {(activeTab === 'all' || activeTab === 'pharmacy') &&
          isSectionEnabled('pharmacy') &&
          filteredPharmacy.length > 0 && (
            <PharmacySection
              items={filteredPharmacy}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onAddToCart={handleAddToCart}
              onOpenUploadPrescription={() => requireAuth(() => setIsPrescriptionModalOpen(true))}
            />
          )}

        {(activeTab === 'all' || activeTab === 'food') &&
          isSectionEnabled('food') &&
          filteredFoods.length > 0 && (
            <FoodSection
              foods={filteredFoods}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onAddToCart={handleAddToCart}
            />
          )}

        {(activeTab === 'all' || activeTab === 'technicians') &&
          isSectionEnabled('technicians') &&
          (filteredTechnicians.length > 0 ? (
            <TechniciansSection
              technicians={filteredTechnicians}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onRequestTechnician={handleOpenTechnicianBooking}
              onViewReviews={handleOpenReviewsModal}
              onAddReview={handleOpenAddReviewModal}
            />
          ) : activeTab === 'technicians' ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ar'
                  ? `لسه مفيش صنايعية معتمدين متسجلين في ${activeVillage.nameAr}.`
                  : `No approved technicians registered yet in ${activeVillage.nameEn}.`}
              </p>
              <button
                onClick={() => openAuthModal('register')}
                className={`px-4 py-2 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold cursor-pointer`}
              >
                {lang === 'ar' ? 'سجل كصنايعي في القرية دي' : 'Register as a Technician'}
              </button>
            </div>
          ) : null)}

        {(activeTab === 'all' || activeTab === 'rides') &&
          isSectionEnabled('rides') &&
          filteredRides.length > 0 && (
            <VillageRidesSection
              rides={filteredRides}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onBookRide={handleOpenRideBooking}
            />
          )}

        {(activeTab === 'all' || activeTab === 'grocery') &&
          isSectionEnabled('grocery') &&
          filteredGrocery.length > 0 && (
            <GrocerySection
              items={filteredGrocery}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onAddToCart={handleAddToCart}
            />
          )}

        {(activeTab === 'all' || activeTab === 'tutoring') &&
          isSectionEnabled('tutoring') &&
          filteredTutors.length > 0 && (
            <TutoringSection
              tutors={filteredTutors}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onBookTutor={handleOpenTutorBooking}
            />
          )}

        {(activeTab === 'all' || activeTab === 'charity') &&
          isSectionEnabled('charity') &&
          filteredCharities.length > 0 && (
            <CharitySection
              charities={filteredCharities}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onContactCharity={handleOpenCharityContact}
            />
          )}

        {(activeTab === 'all' || activeTab === 'other') &&
          isSectionEnabled('other') &&
          filteredOtherServices.length > 0 && (
            <OtherServicesSection
              items={filteredOtherServices}
              lang={lang}
              canUseServices={canUsePlatformServices}
              nowMs={nowMs}
              onRequireLogin={() => openAuthModal('login')}
              onRequestOther={handleOpenOtherBooking}
            />
          )}

        {mergedSections
          .filter((sec) => !sec.isBuiltIn && sec.isEnabled !== false)
          .filter((sec) => activeTab === 'all' || activeTab === sec.id)
          .map((sec) => {
            const customItems: OtherService[] = byVillage(
              approvedProviders
                .filter(
                  (p) => p.category === sec.providerCategoryId || p.category === sec.id
                )
                .map((p) => ({
                  id: `prov-sec-${sec.id}-${p.id}`,
                  ownerId: p.ownerId,
                  villageId: p.villageId,
                  name: { ar: p.nameAr, en: p.nameEn },
                  activityType: { ar: p.specialtyAr, en: p.specialtyEn },
                  description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
                  address: {
                    ar: p.neighborhoodAr || 'وسط البلد',
                    en: p.neighborhoodEn || 'Village Center'
                  },
                  priceLabel: {
                    ar: p.priceLabelAr || 'حسب الاتفاق',
                    en: p.priceLabelEn || 'By agreement'
                  },
                  hours: { ar: 'يومياً حسب الاتفاق', en: 'Daily by appointment' },
                  phone: p.phone,
                  availability: toAvailabilityConfig(p)
                })),
              true
            ).filter(
              (item) =>
                item.name[lang].toLowerCase().includes(q) ||
                item.activityType[lang].toLowerCase().includes(q) ||
                item.description[lang].toLowerCase().includes(q)
            );

            if (customItems.length > 0) {
              return (
                <OtherServicesSection
                  key={sec.id}
                  items={customItems}
                  lang={lang}
                  canUseServices={canUsePlatformServices}
                  nowMs={nowMs}
                  sectionTitle={lang === 'ar' ? sec.nameAr : sec.nameEn}
                  sectionDescription={
                    sec.descriptionAr || sec.descriptionEn
                      ? lang === 'ar'
                        ? sec.descriptionAr || sec.descriptionEn
                        : sec.descriptionEn || sec.descriptionAr
                      : undefined
                  }
                  onRequireLogin={() => openAuthModal('login')}
                  onRequestOther={handleOpenOtherBooking}
                />
              );
            }

            if (activeTab === sec.id) {
              return (
                <div
                  key={sec.id}
                  className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3"
                >
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? sec.nameAr : sec.nameEn}
                  </h3>
                  {(sec.descriptionAr || sec.descriptionEn) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === 'ar' ? sec.descriptionAr : sec.descriptionEn}
                    </p>
                  )}
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'ar'
                      ? `لا يوجد مقدمو خدمات مسجلون حالياً في قسم ${sec.nameAr}.`
                      : `No providers registered yet in ${sec.nameEn}.`}
                  </p>
                  <button
                    onClick={() => openAuthModal('register')}
                    className={`px-4 py-2 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold cursor-pointer`}
                  >
                    {lang === 'ar' ? 'سجل كمقدم خدمة في هذا القسم' : 'Register in This Section'}
                  </button>
                </div>
              );
            }

            return null;
          })}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        initialMode={authModalMode}
        firebaseUser={firebaseUser}
        userProfile={userProfile}
        activeDemoAccount={activeDemoAccount}
        onLoginDemoAccount={handleLoginDemoAccount}
        onLogoutDemoAccount={handleLogoutDemoAccount}
        isAdmin={isAdmin}
        isBanned={isCurrentUserBanned}
        banReason={ownPhoneBan?.reason || effectiveProfile?.banReason}
        banUntilMs={ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs}
        sections={mergedSections}
        onProfileSaved={() => {}}
        onOpenAdminPanel={() => openAuthModal('login')}
      />

      <UniversalBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType={bookingDetails.type}
        providerOwnerId={bookingDetails.providerOwnerId}
        providerName={bookingDetails.providerName}
        serviceTitle={bookingDetails.title}
        feeEgp={bookingDetails.feeEgp}
        lang={lang}
        defaultName={effectiveProfile?.displayName || firebaseUser?.displayName || ''}
        defaultPhone={effectiveProfile?.phone || ''}
        defaultAddress={effectiveProfile?.address || effectiveProfile?.neighborhood || ''}
        onProceedToPayment={handleProceedToPayment}
      />

      <ProviderOrdersModal
        isOpen={isProviderOrdersOpen}
        onClose={() => setIsProviderOrdersOpen(false)}
        lang={lang}
        activeVillage={activeVillage}
        providerProfile={effectiveProfile}
        orders={providerOrders}
        commissionRatePercent={adPricing.commissionRatePercent ?? 10}
        onUpdateOrderStatus={handleUpdateOrderStatus}
      />

      <PrescriptionUploadModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        lang={lang}
        activeVillage={activeVillage}
        defaultName={effectiveProfile?.displayName || firebaseUser?.displayName || ''}
        defaultPhone={effectiveProfile?.phone || ''}
        defaultAddress={effectiveProfile?.address || effectiveProfile?.neighborhood || ''}
        onProceedToPayment={handleProceedToPayment}
      />

      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        items={cart}
        lang={lang}
        activeVillage={activeVillage}
        defaultName={effectiveProfile?.displayName || firebaseUser?.displayName || ''}
        defaultPhone={effectiveProfile?.phone || ''}
        defaultAddress={effectiveProfile?.address || effectiveProfile?.neighborhood || ''}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToPayment={handleProceedToPayment}
      />

      <OrderStatusModal
        isOpen={isOrderStatusOpen}
        onClose={() => {
          setIsOrderStatusOpen(false);
          setRecentlyCompletedOrderId(null);
        }}
        lang={lang}
        orders={userOrders}
        activeVillage={activeVillage}
        highlightedOrderId={recentlyCompletedOrderId}
        onCancelOrder={(orderId) => handleUpdateOrderStatus(orderId, 'cancelled')}
      />

      <EmergencyDirectoryModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        lang={lang}
      />

      <VillageAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
        lang={lang}
        activeVillageName={activeVillageName}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={userNotifications}
        seenIds={seenNotificationIds}
        onMarkAllRead={handleMarkAllNotificationsRead}
        lang={lang}
      />

      <ProviderReviewsModal
        isOpen={isProviderReviewsModalOpen}
        onClose={() => setIsProviderReviewsModalOpen(false)}
        targetId={activeReviewTarget.id}
        targetName={activeReviewTarget.name}
        targetRole={activeReviewTarget.role}
        targetAvatar={activeReviewTarget.avatar}
        rating={activeReviewTarget.rating}
        reviewsCount={activeReviewTarget.reviewsCount}
        reviews={reviews}
        lang={lang}
        eligibleReviewsCount={eligibleOrdersForActiveTarget.length}
        onOpenAddReview={() => {
          setIsProviderReviewsModalOpen(false);
          requireAuth(() => setIsReviewModalOpen(true));
        }}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetId={activeReviewTarget.id}
        targetName={activeReviewTarget.name}
        targetRole={activeReviewTarget.role}
        lang={lang}
        defaultName={effectiveProfile?.displayName || firebaseUser?.displayName || ''}
        eligibleBookings={eligibleOrdersForActiveTarget}
        onSubmitReview={handleAddReview}
      />

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">{activeVillageName}</span>
            <span>·</span>
            <span>{t.appTagline}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => openAuthModal('login')}
              className="text-slate-700 dark:text-slate-300 font-semibold hover:underline cursor-pointer"
            >
              {isSignedIn ? t.account : t.login}
            </button>
            <span>·</span>
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
            >
              {t.emergency}
            </button>
            <span>·</span>
            <button
              onClick={() => requireAuth(() => setIsAssistantModalOpen(true))}
              className={`${theme.text} font-semibold hover:underline cursor-pointer`}
            >
              {t.aiAssistant}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <VillageProvider>
      <AppShell />
    </VillageProvider>
  );
}
