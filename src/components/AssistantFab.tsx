import { useAssistantUi } from '../assistantUi';
import { NAV_ICONS } from '../navTabs';
import { color } from '../theme';

/** Desktop FAB — opens assistant chatbox (bottom-right). */
export default function AssistantFab() {
  const { open, toggleAssistant } = useAssistantUi();

  if (open) return null;

  return (
    <button
      type="button"
      className="np-assistant-fab"
      data-tutorial="asistente-fab"
      aria-label="Abrir asistente"
      onClick={toggleAssistant}
    >
      <span
        style={{ color: color.white, display: 'flex' }}
        dangerouslySetInnerHTML={{ __html: NAV_ICONS.asistente }}
      />
    </button>
  );
}
