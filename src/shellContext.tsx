import { createContext, useContext } from 'react';

export type ShellMode = 'phone' | 'web';

export const ShellContext = createContext<ShellMode>('phone');

export function useShellMode(): ShellMode {
  return useContext(ShellContext);
}
