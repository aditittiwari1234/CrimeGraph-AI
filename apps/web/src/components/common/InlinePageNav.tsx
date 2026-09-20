import React, { useState, useEffect, useRef } from 'react';

interface InlinePageNavProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

/**
 * InlinePageNav displays "{page} / {totalPages}".
 * Clicking on the current page number allows the user to directly type the page number
 * seamlessly without any clunky input box (zero borders, zero outline, zero background).
 */
export default function InlinePageNav({ page, totalPages, onPageChange }: InlinePageNavProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(String(page));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state if external page changes
  useEffect(() => {
    setVal(String(page));
  }, [page]);

  // Focus and select input on open
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      const clamped = Math.max(1, Math.min(totalPages, num));
      if (clamped !== page) {
        onPageChange(clamped);
      } else {
        setVal(String(page));
      }
    } else {
      setVal(String(page));
    }
  };

  const charCount = Math.max(1, (val || String(page)).length, String(totalPages).length);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.78rem',
        color: '#334155',
        padding: '0 4px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        userSelect: 'none',
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={val}
          onChange={e => {
            const clean = e.target.value.replace(/[^0-9]/g, '');
            setVal(clean);
          }}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              commit();
            } else if (e.key === 'Escape') {
              setVal(String(page));
              setIsEditing(false);
            }
          }}
          style={{
            width: `${charCount * 8.5 + 4}px`,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            margin: 0,
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            textAlign: 'center',
            boxShadow: 'none',
            cursor: 'text',
          }}
          title="Type page number and press Enter"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          title="Click to type page number"
          style={{
            cursor: 'pointer',
            padding: '1px 3px',
            borderRadius: 3,
            transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#e2e8f0';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {page}
        </span>
      )}
      <span style={{ color: '#94a3b8', margin: '0 3px', fontWeight: 400 }}>/</span>
      <span>{totalPages}</span>
    </span>
  );
}
