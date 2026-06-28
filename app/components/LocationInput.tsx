'use client';

import { useState, useEffect, useRef } from 'react';

interface Suggestion {
  place_id: string;
  display_name: string;
  short_name: string;
  lat: string;
  lon: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (shortName: string, lat: number, lon: number) => void;
  placeholder?: string;
  label: string;
  dotColor: string;
}

export default function LocationInput({ value, onChange, onSelect, placeholder, label, dotColor }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents re-fetching suggestions when value changes due to a selection (not user typing)
  const justSelectedRef = useRef(false);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim() || value.length < 2) {
      setSuggestions([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data: Suggestion[] = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 350);
  }, [value]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    border: `1.5px solid ${focused ? 'var(--accent)' : '#e7ddd2'}`,
    borderRadius: 'var(--r-md)',
    fontSize: 16,
    fontFamily: 'inherit',
    color: '#2b2018',
    background: '#fdfbf9',
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 4px var(--accent-soft)' : 'none',
  };

  return (
    <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: 13, color: '#6a5d50', marginBottom: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
        {label}
      </div>
      <input
        value={value}
        placeholder={placeholder}
        style={inputStyle}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true);
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 7,
          background: '#fff',
          border: '1px solid #ece2d6',
          borderRadius: 'var(--r-md)',
          boxShadow: '0 16px 40px -18px rgba(80,50,20,.4)',
          overflow: 'hidden',
          zIndex: 30,
        }}>
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onMouseDown={(e) => {
                e.preventDefault();
                justSelectedRef.current = true;
                onSelect(s.short_name, parseFloat(s.lat), parseFloat(s.lon));
                setSuggestions([]);
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 15px',
                border: 'none',
                background: 'transparent',
                font: "500 14px var(--font-dm-sans, 'DM Sans', sans-serif)",
                color: '#4a4035',
                cursor: 'pointer',
                transition: 'background .1s',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {s.display_name.split(',').slice(0, 3).join(',')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
