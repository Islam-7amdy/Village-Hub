import React from 'react';
import {
  Language,
  VillageConfig,
  VillageLogoIconId,
  getVillageTheme
} from '../data/villageData';
import {
  Wheat,
  Trees,
  Landmark,
  Waves,
  Sun,
  Building2,
  Sprout,
  Compass
} from 'lucide-react';

export const renderVillageLogoGlyph = (iconId: VillageLogoIconId = 'wheat', className = 'w-4 h-4') => {
  switch (iconId) {
    case 'trees':
      return <Trees className={className} />;
    case 'landmark':
      return <Landmark className={className} />;
    case 'waves':
      return <Waves className={className} />;
    case 'sun':
      return <Sun className={className} />;
    case 'building':
      return <Building2 className={className} />;
    case 'sprout':
      return <Sprout className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'wheat':
    default:
      return <Wheat className={className} />;
  }
};

interface VillageLogoProps {
  village: Pick<VillageConfig, 'nameAr' | 'nameEn' | 'colorCode' | 'logoIcon' | 'logoUrl'>;
  lang: Language;
  size?: 'sm' | 'md' | 'lg';
}

export const VillageLogo: React.FC<VillageLogoProps> = ({
  village,
  lang,
  size = 'md'
}) => {
  const theme = getVillageTheme(village.colorCode);
  const altText = lang === 'ar' ? village.nameAr : village.nameEn;

  const boxSize =
    size === 'sm' ? 'w-7 h-7 rounded-lg' : size === 'lg' ? 'w-10 h-10 rounded-2xl' : 'w-8 h-8 rounded-xl';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  if (village.logoUrl) {
    return (
      <span
        className={`${boxSize} overflow-hidden border ${theme.border} bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs`}
      >
        <img
          src={village.logoUrl}
          alt={altText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`${boxSize} ${theme.solidBg} text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs`}
    >
      {renderVillageLogoGlyph(village.logoIcon || 'wheat', iconSize)}
    </span>
  );
};
