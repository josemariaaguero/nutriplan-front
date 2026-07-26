import { useAppState, useAppActions } from '../store';
import { useAssistantUi } from '../assistantUi';
import { NAV_ICONS, WEB_NAV_TABS, isNavTabActive } from '../navTabs';
import { color, font, gradient } from '../theme';
import type { Screen } from '../types';

export default function SideNav() {
  const state = useAppState();
  const { go } = useAppActions();
  const assistant = useAssistantUi();

  function onNav(id: Screen) {
    if (assistant.open) assistant.closeAssistant();
    go(id);
  }

  return (
    <aside className="app-sidebar" aria-label="Navegación">
      <div className="app-sidebar-brand">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: gradient.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color.white,
            fontFamily: font.display,
            fontWeight: 900,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          N
        </div>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>
          NutriPlan
        </div>
      </div>

      <nav className="app-sidebar-nav">
        {WEB_NAV_TABS.map(tab => {
          const active = isNavTabActive(tab.id, state);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNav(tab.id)}
              className={`app-sidebar-item${active ? ' is-active' : ''}`}
            >
              <span
                className="app-sidebar-icon"
                dangerouslySetInnerHTML={{ __html: NAV_ICONS[tab.id] }}
              />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
