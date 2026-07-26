import { createContext, useContext } from 'react';

type AssistantUi = {
  open: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
};

const noopUi: AssistantUi = {
  open: false,
  openAssistant: () => {},
  closeAssistant: () => {},
  toggleAssistant: () => {},
};

export const AssistantUiContext = createContext<AssistantUi>(noopUi);

export function useAssistantUi(): AssistantUi {
  return useContext(AssistantUiContext);
}
