'use client';

import Image from 'next/image';

interface Props {
  name: string;
  imageUrl: string;
  yelpUrl: string;
  cuisine: string;
  price?: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  distAMi: number;
  distBMi: number;
  midDriveMin: number;
  isBalanced: boolean;
  isSelected: boolean;
  displayPhone: string;
  address: string[];
  onClick: () => void;
  onDirections: (e: React.MouseEvent) => void;
  onCall: (e: React.MouseEvent) => void;
}

function StarRating({ rating }: { rating: number }) {
  const pct = (rating / 5) * 100;
  return (
    <span style={{ position: 'relative', display: 'inline-block', fontSize: 14, letterSpacing: 2, lineHeight: 1 }}>
      <span style={{ color: '#e7ddd4' }}>★★★★★</span>
      <span style={{ position: 'absolute', left: 0, top: 0, width: `${pct}%`, overflow: 'hidden', color: '#f5a623', whiteSpace: 'nowrap' }}>
        ★★★★★
      </span>
    </span>
  );
}

export default function RestaurantCard({
  name, imageUrl, yelpUrl, cuisine, price, rating, reviewCount,
  isOpen, distAMi, distBMi, midDriveMin, isBalanced, isSelected,
  displayPhone, onClick, onDirections, onCall,
}: Props) {
  const priceLen = price?.length ?? 0;
  const priceFilled = price ?? '';
  const priceFaded = '$$$$'.slice(priceLen);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 14,
        padding: 14,
        background: '#fff',
        border: `1.5px solid ${isSelected ? 'var(--accent)' : '#efe7dd'}`,
        borderRadius: 'var(--r-md)',
        boxShadow: isSelected
          ? '0 12px 28px -12px rgba(120,60,20,.5)'
          : '0 1px 2px rgba(80,50,20,.05)',
        cursor: 'pointer',
        marginBottom: 12,
        transition: 'border-color .15s, box-shadow .15s, transform .15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
    >
      {/* Photo */}
      <div style={{
        flexShrink: 0,
        width: 100,
        height: 100,
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
        background: '#f1eae1',
        position: 'relative',
      }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="100px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(140deg, #e8ddd2, #d6c8b8)' }} />
        )}
        {isBalanced && (
          <span style={{
            position: 'absolute',
            top: 6,
            left: 7,
            font: "700 9.5px var(--font-dm-sans, 'DM Sans', sans-serif)",
            color: 'var(--accent)',
            background: '#fff',
            padding: '3px 7px',
            borderRadius: 999,
            boxShadow: '0 1px 4px rgba(0,0,0,.15)',
          }}>
            ⇄ even split
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <a
            href={yelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: "var(--font-bricolage, 'Bricolage Grotesque', sans-serif)",
              fontWeight: 700,
              fontSize: 18,
              color: '#2b2018',
              lineHeight: 1.15,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
          >
            {name}
          </a>
          <span style={{
            flexShrink: 0,
            font: "700 11px var(--font-dm-sans, 'DM Sans', sans-serif)",
            padding: '4px 9px',
            borderRadius: 999,
            background: isOpen ? 'oklch(0.93 0.06 150)' : '#f0eae3',
            color: isOpen ? 'oklch(0.42 0.11 150)' : '#9a8c7e',
          }}>
            {isOpen ? 'Open now' : 'Closed'}
          </span>
        </div>

        <div style={{ fontSize: 13, color: '#7a6d5f', marginTop: 3 }}>
          {cuisine}
          {price && (
            <>
              <span style={{ color: '#c4b8a8', margin: '0 4px' }}>·</span>
              <span style={{ fontWeight: 700, color: '#4a4035' }}>{priceFilled}</span>
              <span style={{ color: '#d3c8ba' }}>{priceFaded}</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 7px' }}>
          <StarRating rating={rating} />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#2b2018' }}>{rating.toFixed(1)}</span>
          <span style={{ fontSize: 12.5, color: '#9a8c7e' }}>({reviewCount.toLocaleString()})</span>
          <span style={{ fontSize: 10.5, color: '#b3a89b', letterSpacing: '.03em' }}>Yelp</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '7px 14px', fontSize: 12.5, color: '#6a5d50' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5a7a22' }} />
            You <b style={{ color: '#2b2018' }}>{distAMi.toFixed(1)} mi</b>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2f9c8e' }} />
            Them <b style={{ color: '#2b2018' }}>{distBMi.toFixed(1)} mi</b>
          </span>
          <span style={{ color: '#9a8c7e' }}>~{midDriveMin} min from midpoint</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
          <button
            onClick={onDirections}
            style={{
              padding: '7px 14px',
              borderRadius: 999,
              border: '1.5px solid var(--accent)',
              color: 'var(--accent)',
              background: 'var(--accent-soft)',
              font: "700 12.5px var(--font-dm-sans, 'DM Sans', sans-serif)",
              cursor: 'pointer',
              transition: 'filter .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.95)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            Directions
          </button>
          {displayPhone && (
            <button
              onClick={onCall}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1.5px solid #e7ddd2',
                color: '#6a5d50',
                background: '#fff',
                font: "700 12.5px var(--font-dm-sans, 'DM Sans', sans-serif)",
                cursor: 'pointer',
              }}
            >
              Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
