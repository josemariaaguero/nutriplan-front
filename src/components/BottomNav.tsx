import { useAppState, useAppActions } from '../store';
import { NAV_ICONS, NAV_TABS, isNavTabActive } from '../navTabs';
import { color } from '../theme';

export default function BottomNav() {
  const state = useAppState();
  const { go } = useAppActions();

  return (
    <nav style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 84,
      padding: '8px 8px 22px', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-around',
      background: 'rgba(255,246,236,.86)',
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      borderTop: `1px solid ${color.borderWarm}`, zIndex: 30,
    }}>
      {NAV_TABS.map(tab => {
        const active = isNavTabActive(tab.id, state);
        const tabColor = active ? color.primary : color.textSoft;
        return (
          <button
            key={tab.id}
            type="button"
            data-tutorial={tab.id === 'asistente' ? 'asistente-entry' : undefined}
            onClick={() => go(tab.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, padding: '6px 8px', cursor: 'pointer', flex: 1,
              background: 'none', border: 'none', minHeight: 44,
              transition: 'color .2s ease',
            }}
          >
            <div style={{ color: tabColor }} dangerouslySetInnerHTML={{ __html: NAV_ICONS[tab.id] }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: tabColor }}>{tab.label}</div>
          </button>
        );
      })}
    </nav>
  );
}
