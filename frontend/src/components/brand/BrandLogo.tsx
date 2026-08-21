import { cn } from '../../lib/utils';

/** Couleurs charte EATNEXT2 — Crafti Studio. */
export const BRAND = {
  forest: '#08341F',
  red: '#D41414',
  mint: '#0FFFA1',
} as const;

const MARK_D =
  'M392.226 725.946C417.253 797.81 485.66 849.294 565.985 849.294C662.755 849.294 742.127 774.57 749.396 679.587C739.743 768.016 629.267 832.013 549.896 791.851C543.46 788.633 537.621 785.892 534.403 779.099C529.278 768.492 527.491 748.709 540.123 728.688C570.156 681.136 641.304 661.711 692.907 659.327C709.592 658.493 728.422 658.731 749.992 660.161C747.132 560.888 665.854 481.278 565.985 481.278C464.447 481.278 381.977 563.629 381.977 665.286C382.096 686.499 385.671 706.878 392.226 725.946ZM447.285 652.057C454.317 590.682 506.516 542.892 569.798 542.892C612.344 542.892 649.885 564.463 672.051 597.236C615.8 587.345 516.05 594.734 447.285 652.057Z';

type Tone = 'light' | 'dark';
type Layout = 'mark' | 'wordmark' | 'lockup';

interface BrandLogoProps {
  tone?: Tone;
  layout?: Layout;
  className?: string;
  markClassName?: string;
}

/** Picto e + manche, tracés issus de EATNEXT2.pdf. */
export function BrandMark({ tone = 'light', className }: { tone?: Tone; className?: string }) {
  const disc = tone === 'light' ? BRAND.red : BRAND.mint;
  const handle = tone === 'light' ? BRAND.forest : BRAND.red;

  return (
    <svg
      viewBox="267 481 483 533"
      className={className}
      aria-hidden
      focusable="false"
    >
      <line
        x1="435.6"
        y1="817.46"
        x2="373.42"
        y2="907.21"
        stroke={handle}
        strokeWidth="152.8"
        strokeLinecap="round"
      />
      <path fill={disc} fillRule="evenodd" d={MARK_D} />
    </svg>
  );
}

/**
 * Logo EatNext — picto + mot, option tagline BY CRAFTI STUDIO.
 * `light` = fond clair (e rouge, manche forêt). `dark` = fond forêt (e menthe).
 */
export function BrandLogo({
  tone = 'light',
  layout = 'wordmark',
  className,
  markClassName,
}: BrandLogoProps) {
  const stacked = layout === 'lockup';
  const titleColor = tone === 'dark' ? 'text-white' : 'text-brand-800';
  const craftiColor = tone === 'dark' ? 'text-white' : 'text-brand-800';

  return (
    <span className={cn('inline-flex items-center gap-2', stacked && 'items-end gap-2.5', className)}>
      <BrandMark tone={tone} className={cn(stacked ? 'h-12 w-11' : 'h-9 w-8', markClassName)} />
      {layout !== 'mark' && (
        <span className={cn('flex min-w-0 flex-col', stacked ? 'leading-none' : 'leading-tight')}>
          {stacked ? (
            <>
              <span className={cn('text-[1.65rem] font-extrabold tracking-tight', titleColor)}>Eat</span>
              <span className={cn('text-[1.65rem] font-extrabold tracking-tight', titleColor)}>Next</span>
              <span className="mt-1.5 text-[0.62rem] font-medium uppercase tracking-[0.14em]">
                <span className={craftiColor}>By Crafti </span>
                <span className="text-accent-600">Studio</span>
              </span>
            </>
          ) : (
            <>
              <span className={cn('text-xl font-extrabold tracking-tight', titleColor)}>EatNext</span>
              <span className="-mt-0.5 text-[0.58rem] font-medium uppercase tracking-[0.16em]">
                <span className={craftiColor}>By Crafti </span>
                <span className="text-accent-600">Studio</span>
              </span>
            </>
          )}
        </span>
      )}
    </span>
  );
}
