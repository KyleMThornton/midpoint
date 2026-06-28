'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';

interface Review {
  id: string;
  rating: number;
  text: string;
  time_created: string;
  user: { name: string; image_url?: string };
}

interface BusinessDetail {
  id: string;
  name: string;
  url: string;
  phone: string;
  display_phone: string;
  rating: number;
  review_count: number;
  price?: string;
  categories: { alias: string; title: string }[];
  location: { display_address: string[] };
  photos?: string[];
  hours?: {
    open: { start: string; end: string; day: number }[];
    is_open_now: boolean;
  }[];
  reviews: Review[];
}

function fmtHour(raw: string) {
  const h = parseInt(raw.slice(0, 2), 10);
  const m = raw.slice(2);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === '00' ? `${h12}${suffix}` : `${h12}:${m}${suffix}`;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export default function BusinessModal({ bizId, onClose }: { bizId: string; onClose: () => void }) {
  const [data, setData] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setError(false);
    fetch(`/api/business?id=${encodeURIComponent(bizId)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [bizId]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  // Yelp day: 0=Mon … 6=Sun; JS getDay: 0=Sun, 1=Mon … 6=Sat
  const todaySlot = (() => {
    if (!data?.hours?.[0]) return null;
    const jsDay = new Date().getDay();
    const yelpDay = jsDay === 0 ? 6 : jsDay - 1;
    return data.hours[0].open.find(o => o.day === yelpDay) ?? null;
  })();

  const isOpenNow = data?.hours?.[0]?.is_open_now;
  const photos = data?.photos ?? [];
  const dirUrl = data
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.location.display_address.join(', '))}`
    : '#';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(30,18,8,.52)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          animation: 'mpFadeIn .18s ease both',
        }}
      />

      {/* Centering shell */}
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        zIndex: 201,
        pointerEvents: 'none',
      }}>
        {/* Panel */}
        <div style={{
          pointerEvents: 'auto',
          background: '#fff',
          borderRadius: 'var(--r-lg)',
          boxShadow: '0 36px 88px -24px rgba(40,20,0,.5)',
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'mpModalSlide .22s ease both',
        }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'sticky', top: 10, float: 'right',
              margin: '10px 10px -44px 0',
              zIndex: 10,
              width: 36, height: 36,
              borderRadius: '50%',
              border: '1.5px solid #e7ddd2',
              background: 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(4px)',
              color: '#6a5d50', fontSize: 20, lineHeight: 1,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,.12)',
            }}
          >
            ×
          </button>

          {/* Loading */}
          {loading && (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: '#9a8c7e', fontSize: 14 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>★</div>
              Loading details…
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: '#9a8c7e', fontSize: 14 }}>
              Could not load details. Try again.
            </div>
          )}

          {/* Content */}
          {data && !loading && (
            <>
              {/* Photos */}
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: 3, height: 186, borderRadius: 'var(--r-lg) var(--r-lg) 0 0', overflow: 'hidden' }}>
                  {photos.map((url, i) => (
                    <div key={i} style={{ flex: i === 0 ? 2 : 1, position: 'relative', background: '#f5efe8' }}>
                      <Image src={url} alt="" fill sizes="320px" style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '22px 24px 28px' }}>
                {/* Name + rating */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                  <a
                    href={data.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                      fontWeight: 800, fontSize: 22, lineHeight: 1.2,
                      color: '#2b2018', textDecoration: 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                  >
                    {data.name}
                  </a>
                  <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#2b2018' }}>★ {data.rating.toFixed(1)}</div>
                    <div style={{ fontSize: 11.5, color: '#9a8c7e' }}>{data.review_count.toLocaleString()} reviews</div>
                  </div>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', fontSize: 13, color: '#7a6d5f', marginBottom: 14 }}>
                  <span>{data.categories.map(c => c.title).join(', ')}</span>
                  {data.price && (
                    <><span style={{ color: '#c4b8a8' }}>·</span>
                    <span style={{ fontWeight: 700, color: '#4a4035' }}>{data.price}</span></>
                  )}
                  {data.hours && (
                    <><span style={{ color: '#c4b8a8' }}>·</span>
                    <span style={{ fontWeight: 700, color: isOpenNow ? 'oklch(0.42 0.11 150)' : '#b05040' }}>
                      {isOpenNow ? 'Open now' : 'Closed'}
                    </span>
                    {todaySlot && (
                      <span style={{ color: '#9a8c7e' }}>{fmtHour(todaySlot.start)}–{fmtHour(todaySlot.end)}</span>
                    )}</>
                  )}
                </div>

                {/* Address + phone */}
                <div style={{ fontSize: 13, color: '#6a5d50', lineHeight: 1.65, marginBottom: 18 }}>
                  <div>{data.location.display_address.join(', ')}</div>
                  {data.display_phone && <div>{data.display_phone}</div>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
                  {[
                    { label: 'Directions', href: dirUrl, primary: true },
                    ...(data.phone ? [{ label: 'Call', href: `tel:${data.phone}`, primary: false }] : []),
                    { label: 'View on Yelp', href: data.url, primary: false },
                  ].map(({ label, href, primary }) => (
                    <a
                      key={label}
                      href={href}
                      target={label !== 'Call' ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px', borderRadius: 999,
                        border: `1.5px solid ${primary ? 'var(--accent)' : '#e7ddd2'}`,
                        background: primary ? 'var(--accent-soft)' : '#fff',
                        color: primary ? 'var(--accent)' : '#6a5d50',
                        font: "700 13px var(--font-dm-sans,'DM Sans',sans-serif)",
                        textDecoration: 'none',
                        transition: 'filter .15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(0.95)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.filter = 'none'; }}
                    >
                      {label}
                    </a>
                  ))}
                </div>

                {/* Reviews */}
                {data.reviews.length > 0 && (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase', color: '#9a8c7e', marginBottom: 12 }}>
                      Reviews
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {data.reviews.map(r => (
                        <div key={r.id} style={{
                          padding: '13px 15px',
                          background: '#fdfbf9',
                          border: '1px solid #efe7dd',
                          borderRadius: 'var(--r-md)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                            <span style={{ color: '#f5a623', fontSize: 12, letterSpacing: 1.5 }}>
                              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#4a4035' }}>{r.user.name}</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#b3a89b' }}>{timeAgo(r.time_created)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13.5, color: '#5a4f44', lineHeight: 1.6 }}>{r.text}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, textAlign: 'center' }}>
                      <a
                        href={data.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                      >
                        See all {data.review_count.toLocaleString()} reviews on Yelp →
                      </a>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
