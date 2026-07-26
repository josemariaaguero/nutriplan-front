import { AssistantChatBody } from './AssistantChatbox';
import { ScreenHeader, ScreenPage } from './ui';

/** Full-screen assistant — phone mockup / mobile nav. */
export default function AsistenteScreen({
  legalOk,
  onNeedLegal,
}: {
  legalOk: boolean;
  onNeedLegal: () => void;
}) {
  return (
    <ScreenPage style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div data-tutorial="asistente-entry">
        <ScreenHeader title="Asistente" subtitle="App y recetas" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
        <AssistantChatBody legalOk={legalOk} onNeedLegal={onNeedLegal} />
      </div>
    </ScreenPage>
  );
}
