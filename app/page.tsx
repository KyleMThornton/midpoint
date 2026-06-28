'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback, useRef } from 'react';
import LocationInput from './components/LocationInput';
import RestaurantCard from './components/RestaurantCard';
import Footer from './components/Footer';
import {
  geographicMidpoint,
  fairMidpoint,
  haversineMi,
  estimateDriveMinutes,
  type Coords,
} from './lib/geo';

const MidpointMap = dynamic(() => import('./components/MidpointMap'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'input' | 'results';
type MidMode = 'fair' | 'geo';
type SortMode = 'mid' | 'rating' | 'fair' | 'price';

interface LocationData {
  input: string;
  name: string;
  coords: Coords | null;
}

interface YelpBusiness {
  id: string;
  name: string;
  image_url: string;
  url: string;
  rating: number;
  review_count: number;
  price?: string;
  categories: { alias: string; title: string }[];
  location: { display_address: string[] };
  coordinates: { latitude: number; longitude: number };
  is_closed: boolean;
  phone: string;
  display_phone: string;
}

const EMPTY_LOC: LocationData = { input: '', name: '', coords: null };

const EXAMPLES = [
  {
    label: 'Brooklyn ↔ Jersey City',
    a: { name: 'Brooklyn, NY', coords: { lat: 40.6782, lon: -73.9442 } },
    b: { name: 'Jersey City, NJ', coords: { lat: 40.7178, lon: -74.0431 } },
  },
  {
    label: 'Oakland ↔ San Francisco',
    a: { name: 'Oakland, CA', coords: { lat: 37.8044, lon: -122.2712 } },
    b: { name: 'San Francisco, CA', coords: { lat: 37.7749, lon: -122.4194 } },
  },
  {
    label: 'Cambridge ↔ Boston',
    a: { name: 'Cambridge, MA', coords: { lat: 42.3736, lon: -71.1097 } },
    b: { name: 'Boston, MA', coords: { lat: 42.3601, lon: -71.0589 } },
  },
];

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function ToggleGroup<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string; sub: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, background: '#f1eae1', borderRadius: 'var(--r-md)', padding: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              cursor: 'pointer',
              border: 'none',
              padding: '9px 8px',
              borderRadius: 'var(--r-sm)',
              background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,.14)' : 'none',
              transition: 'all .15s',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13.5, color: active ? '#2b2018' : '#8a7d70' }}>{o.label}</div>
            <div style={{ fontWeight: 500, fontSize: 11, color: active ? 'var(--accent)' : '#a89c8e', marginTop: 1 }}>{o.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [screen, setScreen] = useState<Screen>('input');
  const [locA, setLocA] = useState<LocationData>(EMPTY_LOC);
  const [locB, setLocB] = useState<LocationData>(EMPTY_LOC);
  const [midMode, setMidMode] = useState<MidMode>('fair');
  const [businesses, setBusinesses] = useState<YelpBusiness[]>([]);
  const [neighborhood, setNeighborhood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sort, setSort] = useState<SortMode>('mid');
  const [openOnly, setOpenOnly] = useState(false);
  const [prices, setPrices] = useState<number[]>([1, 2, 3, 4]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const midpoint = useMemo<Coords | null>(() => {
    if (!locA.coords || !locB.coords) return null;
    return midMode === 'geo'
      ? geographicMidpoint(locA.coords, locB.coords)
      : fairMidpoint(locA.coords, locB.coords);
  }, [locA.coords, locB.coords, midMode]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const fetchResults = useCallback(async (mid: Coords) => {
    setIsLoading(true);
    setBusinesses([]);
    setSelectedId(null);

    try {
      const [yelpRes, geoRes] = await Promise.all([
        fetch(`/api/yelp?lat=${mid.lat}&lon=${mid.lon}`),
        fetch(`/api/reverse?lat=${mid.lat}&lon=${mid.lon}`),
      ]);
      const [yelpData, geoData] = await Promise.all([yelpRes.json(), geoRes.json()]);
      setBusinesses(yelpData.businesses ?? []);
      setNeighborhood(
        geoData.address?.suburb ||
        geoData.address?.city_district ||
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.display_name?.split(',')[0] ||
        'the midpoint'
      );
    } catch {
      showToast('Could not load results — check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleSubmit = async () => {
    if (!midpoint) return;
    setScreen('results');
    setSort('mid');
    setOpenOnly(false);
    setPrices([1, 2, 3, 4]);
    await fetchResults(midpoint);
  };

  const handleExample = async (ex: typeof EXAMPLES[0]) => {
    const newLocA: LocationData = { input: ex.a.name, name: ex.a.name, coords: ex.a.coords };
    const newLocB: LocationData = { input: ex.b.name, name: ex.b.name, coords: ex.b.coords };
    setLocA(newLocA);
    setLocB(newLocB);
    setScreen('results');
    setSort('mid');
    setOpenOnly(false);
    setPrices([1, 2, 3, 4]);
    const mid = midMode === 'geo'
      ? geographicMidpoint(ex.a.coords, ex.b.coords)
      : fairMidpoint(ex.a.coords, ex.b.coords);
    await fetchResults(mid);
  };

  const handleSwap = () => {
    setLocA({ ...locB, input: locB.input });
    setLocB({ ...locA, input: locA.input });
  };

  const togglePrice = (level: number) => {
    setPrices((prev) => {
      const has = prev.includes(level);
      const next = has ? prev.filter((x) => x !== level) : [...prev, level];
      return next.length === 0 ? [1, 2, 3, 4] : next;
    });
  };

  const handleSelectRestaurant = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      const el = cardRefs.current.get(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  // ── Enriched + filtered + sorted restaurant list ───────────────────────────
  const enriched = useMemo(() => {
    if (!locA.coords || !locB.coords || !midpoint) return [];

    return businesses
      .filter((b) => {
        if (openOnly && b.is_closed) return false;
        const level = b.price?.length ?? 0;
        if (level > 0 && !prices.includes(level)) return false;
        return true;
      })
      .map((b) => {
        const bCoords: Coords = { lat: b.coordinates.latitude, lon: b.coordinates.longitude };
        const distA = haversineMi(locA.coords!, bCoords);
        const distB = haversineMi(locB.coords!, bCoords);
        const midDrive = estimateDriveMinutes(midpoint, bCoords);
        return { ...b, bCoords, distA, distB, midDrive, isBalanced: Math.abs(distA - distB) < 0.5 };
      })
      .sort((a, b) => {
        switch (sort) {
          case 'mid':    return a.midDrive - b.midDrive;
          case 'rating': return b.rating - a.rating;
          case 'fair':   return Math.abs(a.distA - a.distB) - Math.abs(b.distA - b.distB);
          case 'price':  return (a.price?.length ?? 0) - (b.price?.length ?? 0);
        }
      });
  }, [businesses, locA.coords, locB.coords, midpoint, sort, openOnly, prices]);

  const restaurantPins = useMemo(
    () =>
      enriched.map((r) => ({
        id: r.id,
        name: r.name,
        coords: r.bCoords,
        isOpen: !r.is_closed,
      })),
    [enriched]
  );

  const youMin  = midpoint && locA.coords ? estimateDriveMinutes(locA.coords, midpoint) : 0;
  const themMin = midpoint && locB.coords ? estimateDriveMinutes(locB.coords, midpoint) : 0;

  const midToggleOpts: { value: MidMode; label: string; sub: string }[] = [
    { value: 'fair', label: 'Fair drive-time', sub: 'Equal travel' },
    { value: 'geo',  label: 'Geographic',      sub: 'Halfway point' },
  ];
  const sortOpts: { value: SortMode; label: string; sub: string }[] = [
    { value: 'mid',    label: 'Near midpoint', sub: '' },
    { value: 'rating', label: 'Top rated',     sub: '' },
    { value: 'fair',   label: 'Most fair',     sub: '' },
    { value: 'price',  label: 'Price',         sub: '' },
  ];

  const canSubmit = !!(locA.coords && locB.coords);

  // ── Root wrapper styles ────────────────────────────────────────────────────
  const rootStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'radial-gradient(1100px 560px at 82% -12%, var(--accent-soft), transparent 58%), radial-gradient(900px 500px at 0% 110%, oklch(0.95 0.02 150 / .5), transparent 60%), oklch(0.985 0.012 78)',
    color: '#2b2018',
    fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Input screen
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'input') {
    return (
      <div style={rootStyle}>
        <div style={{
          maxWidth: 780,
          margin: '0 auto',
          padding: 'max(5vh, 36px) 22px 70px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          animation: 'mpUp .45s ease both',
        }}>
          {/* Logo + tagline */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{
              fontFamily: "var(--font-bricolage, 'Bricolage Grotesque', sans-serif)",
              fontWeight: 800,
              fontSize: 'clamp(46px, 9vw, 86px)',
              letterSpacing: '-0.045em',
              lineHeight: 1,
              color: '#2b2018',
            }}>
              mid<span style={{ color: 'var(--accent)' }}>point</span>
            </div>
            <p style={{ fontSize: 'clamp(16px, 2.4vw, 20px)', color: '#7a6d5f', margin: '16px auto 0', maxWidth: '32ch' }}>
              Find a place that&apos;s fair for both of you.
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: '#fff',
            border: '1px solid #efe7dd',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 22px 60px -34px rgba(80,50,20,.4)',
            padding: 'clamp(18px, 3vw, 28px)',
          }}>
            {/* Location inputs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
              <LocationInput
                value={locA.input}
                onChange={(v) => setLocA({ input: v, name: v, coords: null })}
                onSelect={(name, lat, lon) => setLocA({ input: name, name, coords: { lat, lon } })}
                placeholder="City, address, or ZIP"
                label="You"
                dotColor="#e0654a"
              />

              <button
                onClick={handleSwap}
                title="Swap locations"
                style={{
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  marginBottom: 3,
                  borderRadius: '50%',
                  border: '1.5px solid #e7ddd2',
                  background: '#fff',
                  color: '#8a7d70',
                  fontSize: 17,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.transform = 'rotate(180deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e7ddd2';
                  e.currentTarget.style.color = '#8a7d70';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                ⇅
              </button>

              <LocationInput
                value={locB.input}
                onChange={(v) => setLocB({ input: v, name: v, coords: null })}
                onSelect={(name, lat, lon) => setLocB({ input: name, name, coords: { lat, lon } })}
                placeholder="City, address, or ZIP"
                label="Them"
                dotColor="#2f9c8e"
              />
            </div>

            {/* Midpoint type toggle */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase', color: '#9a8c7e', marginBottom: 9 }}>
                Midpoint type
              </div>
              <ToggleGroup options={midToggleOpts} value={midMode} onChange={setMidMode} />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                marginTop: 20,
                width: '100%',
                padding: 16,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--r-md)',
                fontWeight: 700,
                fontSize: 17,
                fontFamily: 'inherit',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                opacity: canSubmit ? 1 : 0.45,
                transition: 'filter .15s, transform .1s',
              }}
              onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.filter = 'brightness(1.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
              onMouseDown={(e) => { if (canSubmit) e.currentTarget.style.transform = 'scale(.99)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; }}
            >
              Find the midpoint →
            </button>
          </div>

          {/* Examples */}
          <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#9a8c7e' }}>Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleExample(ex)}
                style={{
                  padding: '7px 13px',
                  borderRadius: 999,
                  border: '1px solid #e7ddd2',
                  background: '#fff',
                  color: '#6a5d50',
                  font: "600 12.5px var(--font-dm-sans, 'DM Sans', sans-serif)",
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e7ddd2';
                  e.currentTarget.style.color = '#6a5d50';
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
        <Footer />
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Results screen
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={rootStyle}>
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '18px 20px 70px', animation: 'mpUp .4s ease both' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={() => setScreen('input')}
            style={{
              fontFamily: "var(--font-bricolage, 'Bricolage Grotesque', sans-serif)",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: '-0.04em',
              color: '#2b2018',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            mid<span style={{ color: 'var(--accent)' }}>point</span>
          </button>

          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, flexWrap: 'wrap', fontSize: 13.5, color: '#6a5d50' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '30ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e0654a', flexShrink: 0 }} />
              {locA.name}
            </span>
            <span style={{ color: '#c4b8a8' }}>→</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#2b2018' }}>
              <span style={{ color: 'var(--accent)' }}>★</span>
              {neighborhood}
            </span>
            <span style={{ color: '#c4b8a8' }}>←</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '30ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2f9c8e', flexShrink: 0 }} />
              {locB.name}
            </span>
          </div>

          <button
            onClick={() => setScreen('input')}
            style={{
              padding: '9px 16px',
              borderRadius: 999,
              border: '1.5px solid #e7ddd2',
              background: '#fff',
              color: '#4a4035',
              font: "700 13px var(--font-dm-sans, 'DM Sans', sans-serif)",
              cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e7ddd2';
              e.currentTarget.style.color = '#4a4035';
            }}
          >
            New search
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Left column: map ──────────────────────────────────────────── */}
          <div style={{ flex: '1 1 380px', minWidth: 300, position: 'sticky', top: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <ToggleGroup options={midToggleOpts} value={midMode} onChange={setMidMode} />
            </div>

            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              border: '1px solid #ece2d6',
              boxShadow: '0 18px 44px -28px rgba(80,50,20,.5)',
              background: '#f5efe8',
            }}>
              {midpoint && locA.coords && locB.coords ? (
                <MidpointMap
                  key={midMode}
                  locationA={{ coords: locA.coords, name: locA.name }}
                  locationB={{ coords: locB.coords, name: locB.name }}
                  midpoint={midpoint}
                  restaurants={restaurantPins}
                  selectedId={selectedId}
                  onSelect={handleSelectRestaurant}
                />
              ) : null}
            </div>

            {/* Stat chips */}
            <div style={{ marginTop: 13, display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              <div style={{ padding: '8px 13px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)', font: "700 12px var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
                {midMode === 'geo' ? 'Geographic halfway point' : 'Balanced for travel time'}
              </div>
              <div style={{ padding: '8px 13px', borderRadius: 999, background: '#fff', border: '1px solid #efe7dd', color: '#4a4035', font: "600 12px var(--font-dm-sans, 'DM Sans', sans-serif)", display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e0654a' }} />
                You ~{youMin} min
              </div>
              <div style={{ padding: '8px 13px', borderRadius: 999, background: '#fff', border: '1px solid #efe7dd', color: '#4a4035', font: "600 12px var(--font-dm-sans, 'DM Sans', sans-serif)", display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2f9c8e' }} />
                Them ~{themMin} min
              </div>
            </div>
          </div>

          {/* ── Right column: restaurant list ─────────────────────────────── */}
          <div style={{ flex: '2 1 460px', minWidth: 320 }}>

            {/* Sort tabs */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 4, background: '#f1eae1', borderRadius: 'var(--r-md)', padding: 4 }}>
                {sortOpts.map((o) => {
                  const active = sort === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setSort(o.value)}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '9px 6px',
                        fontWeight: 600,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        border: 'none',
                        borderRadius: 'var(--r-sm)',
                        background: active ? '#fff' : 'transparent',
                        color: active ? '#2b2018' : '#8a7d70',
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,.14)' : 'none',
                        transition: 'all .15s',
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              <FilterChip
                label="Open now"
                active={openOnly}
                onClick={() => setOpenOnly((v) => !v)}
              />
              <span style={{ width: 1, height: 18, background: '#e7ddd2' }} />
              {[1, 2, 3, 4].map((l) => (
                <FilterChip
                  key={l}
                  label={'$'.repeat(l)}
                  active={prices.includes(l)}
                  onClick={() => togglePrice(l)}
                />
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#9a8c7e' }}>
                {enriched.length} place{enriched.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loading */}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9a8c7e', fontSize: 14 }}>
                <div style={{ marginBottom: 12, fontSize: 28 }}>★</div>
                Finding restaurants near the midpoint…
              </div>
            )}

            {/* Empty state */}
            {!isLoading && enriched.length === 0 && businesses.length > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: '#fff',
                border: '1px dashed #e0d6c8',
                borderRadius: 'var(--r-lg)',
                color: '#9a8c7e',
              }}>
                No spots match those filters. Try widening your price or open-now filters.
              </div>
            )}

            {/* No results at all */}
            {!isLoading && businesses.length === 0 && !isLoading && (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: '#fff',
                border: '1px dashed #e0d6c8',
                borderRadius: 'var(--r-lg)',
                color: '#9a8c7e',
              }}>
                No restaurants found near this midpoint. Try different locations.
              </div>
            )}

            {/* Cards */}
            {enriched.map((biz) => (
              <div
                key={biz.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(biz.id, el);
                  else cardRefs.current.delete(biz.id);
                }}
              >
                <RestaurantCard
                  name={biz.name}
                  imageUrl={biz.image_url}
                  yelpUrl={biz.url}
                  cuisine={biz.categories.map((c) => c.title).join(', ')}
                  price={biz.price}
                  rating={biz.rating}
                  reviewCount={biz.review_count}
                  isOpen={!biz.is_closed}
                  distAMi={biz.distA}
                  distBMi={biz.distB}
                  midDriveMin={biz.midDrive}
                  isBalanced={biz.isBalanced}
                  isSelected={selectedId === biz.id}
                  displayPhone={biz.display_phone}
                  address={biz.location.display_address}
                  onClick={() => handleSelectRestaurant(selectedId === biz.id ? null : biz.id)}
                  onDirections={(e) => {
                    e.stopPropagation();
                    const q = encodeURIComponent(biz.location.display_address.join(', '));
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, '_blank');
                  }}
                  onCall={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${biz.phone}`, '_self');
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
      {toast && <Toast msg={toast} />}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 999,
        font: "700 12.5px var(--font-dm-sans, 'DM Sans', sans-serif)",
        cursor: 'pointer',
        border: `1.5px solid ${active ? 'var(--accent)' : '#e7ddd2'}`,
        background: active ? 'var(--accent-soft)' : '#fff',
        color: active ? 'var(--accent)' : '#6a5d50',
        transition: 'all .15s',
      }}
    >
      {label}
    </button>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      bottom: 26,
      transform: 'translateX(-50%)',
      background: '#2b2018',
      color: '#fff',
      padding: '12px 22px',
      borderRadius: 999,
      fontSize: 13.5,
      fontWeight: 600,
      zIndex: 60,
      boxShadow: '0 12px 32px rgba(0,0,0,.3)',
      animation: 'mpToast .25s ease both',
      whiteSpace: 'nowrap',
    }}>
      {msg}
    </div>
  );
}
