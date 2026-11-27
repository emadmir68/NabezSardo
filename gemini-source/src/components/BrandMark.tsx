import type { Locale } from '../types/news';

interface BrandMarkProps {
  locale: Locale;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'auto' | 'light';
}

/**
 * Custom Nabz Sardo Monogram: Bahr-Aseman mountain ridgeline intersecting the live pulse wave.
 */
export function BrandMark({ locale, size = 'md', tone = 'auto' }: BrandMarkProps) {
  const iconDim = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8 sm:w-9 sm:h-9';
  const titleSize =
    size === 'sm'
      ? 'text-[19px]'
      : size === 'lg'
        ? 'text-[28px] sm:text-[32px]'
        : 'text-[21px] sm:text-[26px]';

  const inkClass =
    tone === 'light'
      ? 'text-[#F6F2EA] group-hover:text-[#ECC983]'
      : 'text-[#161310] dark:text-[#F6F2EA] group-hover:text-[#8F6321] dark:group-hover:text-[#ECC983]';

  return (
    <span className="inline-flex items-center gap-2.5 sm:gap-3">
      <span
        className={`${iconDim} relative rounded-xl flex items-center justify-center border border-[#8F6321]/30 dark:border-[#D4A85B]/35 bg-gradient-to-br from-[#F4ECE0] to-[#E5D7BF] dark:from-[#151C2D] dark:to-[#0C101B] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_0_rgba(236,201,131,0.16)] shrink-0`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 36 36" fill="none" className="w-[74%] h-[74%]">
          <path
            d="M4 25L12 13L18.5 20.5L24.5 11L32 25"
            stroke="currentColor"
            className="text-[#8F6321]/45 dark:text-[#ECC983]/40"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 19.5H10.5L13.5 13.5L17.5 24.5L21.5 11L25 21H33"
            stroke="#C69546"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="flex flex-col items-start">
        <span
          className={`font-editorial-display ${titleSize} font-bold tracking-tight transition-colors leading-none ${inkClass}`}
        >
          {locale === 'fa' ? 'نبض ساردو' : 'Nabz Sardo'}
        </span>
        <span className="text-[9.5px] sm:text-[10px] font-mono-tabular tracking-[0.14em] uppercase text-[#8F6321] dark:text-[#ECC983]/85 mt-1 leading-none">
          {locale === 'fa' ? 'ساردوئیه · جنوب کرمان' : 'SARDUIYEH · S. KERMAN'}
        </span>
      </span>
    </span>
  );
}
