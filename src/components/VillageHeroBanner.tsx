import React from 'react';
import { Language, VillageConfig } from '../data/villageData';

interface VillageHeroBannerProps {
  lang?: Language;
  activeTab?: string;
  onSelectCategory?: (cat: string) => void;
  activeVillage?: VillageConfig;
  heroAdsSlot?: React.ReactNode;
}

export const VillageHeroBanner: React.FC<VillageHeroBannerProps> = ({
  heroAdsSlot
}) => {
  if (!heroAdsSlot) return null;

  return (
    <div>
      {heroAdsSlot}
    </div>
  );
};
