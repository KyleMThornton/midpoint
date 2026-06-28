'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import LocationInput from './components/LocationInput';
import RestaurantCard from './components/RestaurantCard';
import BusinessModal from './components/BusinessModal';
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
  const [minRating, setMinRating] = useState(0);
  const [midWeather, setMidWeather] = useState<{ temp: number; weatherCode: number } | null>(null);
  const [midTimezone, setMidTimezone] = useState('');
  const [infoVisible, setInfoVisible] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modalId, setModalId] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [animPhase, setAnimPhase] = useState<'enter' | 'exit'>('enter');
  const pendingNavRef = useRef<Screen | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

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

  const navigateTo = useCallback((to: Screen) => {
    pendingNavRef.current = to;
    setAnimPhase('exit');
  }, []);

  const handleNavAnimEnd = useCallback((e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName !== 'mpExit') return;
    if (pendingNavRef.current) {
      setScreen(pendingNavRef.current);
      pendingNavRef.current = null;
      setAnimPhase('enter');
    }
  }, []);

  const fetchMidpointInfo = useCallback(async (mid: Coords) => {
    setInfoVisible(false);
    try {
      const [geoRes, weatherRes] = await Promise.all([
        fetch(`/api/reverse?lat=${mid.lat}&lon=${mid.lon}`),
        fetch(`/api/weather?lat=${mid.lat}&lon=${mid.lon}`),
      ]);
      const [geoData, weatherData] = await Promise.all([geoRes.json(), weatherRes.json()]);
      setNeighborhood(
        geoData.address?.suburb ||
        geoData.address?.city_district ||
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.display_name?.split(',')[0] ||
        'the midpoint'
      );
      if (weatherData.temp !== undefined) {
        setMidWeather({ temp: weatherData.temp, weatherCode: weatherData.weatherCode });
        setMidTimezone(weatherData.timezone ?? '');
      }
    } catch {
      // non-critical — title will stay blank
    } finally {
      setInfoVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!midpoint || screen !== 'results') return;
    fetchMidpointInfo(midpoint);
  }, [midpoint, screen, fetchMidpointInfo]);

  const fetchResults = useCallback(async (mid: Coords) => {
    setIsLoading(true);
    setBusinesses([]);
    setSelectedId(null);

    try {
      const res = await fetch(`/api/yelp?lat=${mid.lat}&lon=${mid.lon}`);
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
    } catch {
      showToast('Could not load results — check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleSubmit = async () => {
    if (!midpoint) return;
    setSort('mid');
    setOpenOnly(false);
    setPrices([1, 2, 3, 4]);
    setMinRating(0);
    navigateTo('results');
    await fetchResults(midpoint);
  };

  const handleExample = async (ex: typeof EXAMPLES[0]) => {
    const newLocA: LocationData = { input: ex.a.name, name: ex.a.name, coords: ex.a.coords };
    const newLocB: LocationData = { input: ex.b.name, name: ex.b.name, coords: ex.b.coords };
    setLocA(newLocA);
    setLocB(newLocB);
    setSort('mid');
    setOpenOnly(false);
    setPrices([1, 2, 3, 4]);
    setMinRating(0);
    const mid = midMode === 'geo'
      ? geographicMidpoint(ex.a.coords, ex.b.coords)
      : fairMidpoint(ex.a.coords, ex.b.coords);
    navigateTo('results');
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
        if (minRating > 0 && b.rating < minRating) return false;
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
  }, [businesses, locA.coords, locB.coords, midpoint, sort, openOnly, prices, minRating]);

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
  const distAMi = midpoint && locA.coords ? haversineMi(locA.coords, midpoint) : null;
  const distBMi = midpoint && locB.coords ? haversineMi(locB.coords, midpoint) : null;
  const localTimeStr = midTimezone
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: midTimezone }).format(now)
    : null;

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
  const canClear = !!(locA.input || locB.input);

  const handleClear = () => {
    setLocA(EMPTY_LOC);
    setLocB(EMPTY_LOC);
  };

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
        <div
          style={{
            maxWidth: 780,
            margin: '0 auto',
            padding: 'max(5vh, 36px) 22px 70px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            animation: animPhase === 'enter' ? 'mpUp .22s ease both' : 'mpExit .15s ease both',
          }}
          onAnimationEnd={handleNavAnimEnd}
        >
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
            <div className="mp-inputs-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
              <LocationInput
                value={locA.input}
                onChange={(v) => setLocA({ input: v, name: v, coords: null })}
                onSelect={(name, lat, lon) => setLocA({ input: name, name, coords: { lat, lon } })}
                placeholder="City, address, or ZIP"
                label="You"
                dotColor="#5a7a22"
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

            {/* Submit + Clear */}
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  flex: 1,
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
              <div style={{
                overflow: 'hidden',
                maxWidth: canClear ? 160 : 0,
                opacity: canClear ? 1 : 0,
                flexShrink: 0,
                transition: 'max-width .2s ease, opacity .18s ease',
              }}>
                <button
                  onClick={handleClear}
                  style={{
                    padding: '16px 20px',
                    background: '#fff',
                    color: '#6a5d50',
                    border: '1.5px solid #e7ddd2',
                    borderRadius: 'var(--r-md)',
                    fontWeight: 600,
                    fontSize: 15,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'border-color .15s, color .15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c0b4a8';
                    e.currentTarget.style.color = '#2b2018';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e7ddd2';
                    e.currentTarget.style.color = '#6a5d50';
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
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
      <div
        style={{ maxWidth: 1220, margin: '0 auto', padding: '18px 20px 70px', animation: animPhase === 'enter' ? 'mpUp .2s ease both' : 'mpExit .15s ease both' }}
        onAnimationEnd={handleNavAnimEnd}
      >

        {/* Header */}
        <div className="mp-results-header" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={() => navigateTo('input')}
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

          <div className="mp-breadcrumb" style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, flexWrap: 'wrap', fontSize: 13.5, color: '#6a5d50' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '30ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5a7a22', flexShrink: 0 }} />
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
            className="mp-new-search"
            onClick={() => navigateTo('input')}
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

        <div className="mp-results-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Left column: map ──────────────────────────────────────────── */}
          <div className="mp-map-col" style={{ flex: '1 1 380px', minWidth: 300, position: 'sticky', top: 16 }}>

            {/* Midpoint city title */}
            <div style={{ marginBottom: 16, opacity: infoVisible ? 1 : 0, transition: 'opacity 0.18s ease' }}>
              <div style={{
                fontFamily: "var(--font-bricolage, 'Bricolage Grotesque', sans-serif)",
                fontWeight: 800,
                fontSize: 'clamp(20px, 3.5vw, 26px)',
                letterSpacing: '-0.03em',
                color: '#2b2018',
                marginBottom: 10,
              }}>
                {neighborhood || '—'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {distAMi !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, background: '#fff', border: '1px solid #efe7dd', font: "600 12px var(--font-dm-sans, 'DM Sans', sans-serif)", color: '#4a4035' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5a7a22', flexShrink: 0 }} />
                    {distAMi.toFixed(1)} mi from you
                  </div>
                )}
                {distBMi !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, background: '#fff', border: '1px solid #efe7dd', font: "600 12px var(--font-dm-sans, 'DM Sans', sans-serif)", color: '#4a4035' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2f9c8e', flexShrink: 0 }} />
                    {distBMi.toFixed(1)} mi from them
                  </div>
                )}
                {midWeather && (
                  <div style={{ padding: '6px 11px', borderRadius: 999, background: '#fff', border: '1px solid #efe7dd', font: "600 12px var(--font-dm-sans, 'DM Sans', sans-serif)", color: '#4a4035' }}>
                    {weatherEmoji(midWeather.weatherCode)} {midWeather.temp}°F
                  </div>
                )}
                {localTimeStr && (
                  <div style={{ padding: '6px 11px', borderRadius: 999, background: '#fff', border: '1px solid #efe7dd', font: "600 12px var(--font-dm-sans, 'DM Sans', sans-serif)", color: '#4a4035' }}>
                    🕐 {localTimeStr}
                  </div>
                )}
              </div>
            </div>

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
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5a7a22' }} />
                You ~{youMin} min
              </div>
              <div style={{ padding: '8px 13px', borderRadius: 999, background: '#fff', border: '1px solid #efe7dd', color: '#4a4035', font: "600 12px var(--font-dm-sans, 'DM Sans', sans-serif)", display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2f9c8e' }} />
                Them ~{themMin} min
              </div>
            </div>
          </div>

          {/* ── Right column: restaurant list ─────────────────────────────── */}
          <div className="mp-list-col" style={{ flex: '2 1 460px', minWidth: 320 }}>

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
              <span style={{ width: 1, height: 18, background: '#e7ddd2' }} />
              {[3, 3.5, 4, 4.5].map((r) => (
                <FilterChip
                  key={r}
                  label={`${r}★+`}
                  active={minRating === r}
                  onClick={() => setMinRating((v) => (v === r ? 0 : r))}
                />
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#9a8c7e' }}>
                {enriched.length} place{enriched.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Loading */}
            {isLoading && (
              <div>
                {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
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
                No spots match those filters. Try widening your price, rating, or open-now filters.
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
                  onClick={() => { handleSelectRestaurant(biz.id); setModalId(biz.id); }}
                  onDirections={(e) => {
                    e.stopPropagation();
                    const q = encodeURIComponent(biz.location.display_address.join(', '));
                    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                    const url = isIOS
                      ? `https://maps.apple.com/?daddr=${q}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${q}`;
                    window.open(url, '_blank');
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

      {modalId && <BusinessModal bizId={modalId} onClose={() => setModalId(null)} />}
      <Footer />
      {toast && <Toast msg={toast} />}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function weatherEmoji(code: number): string {
  if (code === 0)          return '☀️';
  if (code <= 2)           return '⛅';
  if (code === 3)          return '☁️';
  if (code <= 48)          return '🌫️';
  if (code <= 57)          return '🌦️';
  if (code <= 67)          return '🌧️';
  if (code <= 77)          return '🌨️';
  if (code <= 82)          return '🌦️';
  if (code <= 86)          return '🌨️';
  return '⛈️';
}

function SkeletonCard() {
  const skel: React.CSSProperties = {
    background: 'linear-gradient(90deg, #f0e9e1 25%, #e6ddd4 50%, #f0e9e1 75%)',
    backgroundSize: '600px 100%',
    animation: 'mpShimmer 1.4s ease-in-out infinite',
    borderRadius: 6,
  };
  return (
    <div style={{ display: 'flex', gap: 14, padding: 14, background: '#fff', border: '1.5px solid #efe7dd', borderRadius: 'var(--r-md)', marginBottom: 12 }}>
      <div style={{ ...skel, flexShrink: 0, width: 100, height: 100, borderRadius: 'var(--r-sm)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ ...skel, height: 19, width: '52%' }} />
          <div style={{ ...skel, height: 22, width: 68, borderRadius: 999, flexShrink: 0 }} />
        </div>
        <div style={{ ...skel, height: 13, width: '38%', marginTop: 9 }} />
        <div style={{ ...skel, height: 13, width: '48%', marginTop: 9 }} />
        <div style={{ ...skel, height: 12, width: '62%', marginTop: 9 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ ...skel, height: 31, width: 88, borderRadius: 999 }} />
          <div style={{ ...skel, height: 31, width: 58, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

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
