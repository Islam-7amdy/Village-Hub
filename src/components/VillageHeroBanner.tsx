import React from 'react';
import { Language, VillageConfig } from '../data/villageData';

interface VillageHeroBannerProps {
  lang?: Language;
  activeTab?: string;
  onSelectCategory?: (cat: string) => void;
  activeVillage?: VillageConfig;
  heroAdsSlot?: React.ReactNode;
  heroNewsSlot?: React.ReactNode;
}

export const VillageHeroBanner: React.FC<VillageHeroBannerProps> = ({
  heroAdsSlot,
  heroNewsSlot
}) => {
  if (!heroAdsSlot && !heroNewsSlot) return null;

  if (heroAdsSlot && heroNewsSlot) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <div>{heroAdsSlot}</div>
        <div>{heroNewsSlot}</div>
      </div>
    );
  }

  return <div>{heroAdsSlot || heroNewsSlot}</div>;
};
