import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  iconColor?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  dividerAfter?: boolean;
}

export interface TableContextMenuProps {
  x: number;
  y: number;
  title?: string;
  subtitle?: string;
  badge?: {
    label: string;
    color?: string;
    bg?: string;
  };
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function TableContextMenu({
  x,
  y,
  title,
  subtitle,
  badge,
  items,
  onClose,
}: TableContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ left: x, top: y });

  // Auto-clamp inside viewport so the menu never overflows off-screen
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const menuWidth = rect.width || 190;
    const menuHeight = rect.height || 260;

    let posX = x;
    let posY = y;

    if (posX + menuWidth > window.innerWidth - 8) {
      posX = window.innerWidth - menuWidth - 8;
    }
    if (posX < 8) {
      posX = 8;
    }

    if (posY + menuHeight > window.innerHeight - 8) {
      posY = window.innerHeight - menuHeight - 8;
    }
    if (posY < 8) {
      posY = 8;
    }

    setCoords({ left: posX, top: posY });
  }, [x, y, items]);

  // Close on outside click, window resize, or Escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = (e: Event) => {
      // If scroll happens outside the menu, close it
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="table-context-menu"
      style={{
        position: 'fixed',
        left: coords.left,
        top: coords.top,
        zIndex: 99999,
        minWidth: 170,
        maxWidth: 240,
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.08) !important',
        overflow: 'hidden',
        fontSize: '0.82rem',
        animation: 'contextMenuFadeIn 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header Info */}
      {(title || subtitle || badge) && (
        <div
          style={{
            padding: '7px 11px 6px 11px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {title && (
              <span
                style={{
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.84rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={title}
              >
                {title}
              </span>
            )}
            {badge && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: badge.bg || '#e2e8f0',
                  color: badge.color || '#334155',
                  flexShrink: 0,
                }}
              >
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-mono)',
              }}
              title={subtitle}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* Menu Actions */}
      <div style={{ padding: '4px 0' }}>
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx}>
              <button
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick();
                  onClose();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 11px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.45 : 1,
                  color: item.danger ? '#dc2626' : '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {Icon && (
                  <Icon
                    size={14}
                    style={{
                      color: item.danger ? '#dc2626' : item.iconColor || '#64748b',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </div>
                  {item.sublabel && (
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.sublabel}
                    </div>
                  )}
                </div>
              </button>
              {item.dividerAfter && (
                <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
