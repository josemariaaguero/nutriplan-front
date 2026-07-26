import { useEffect, useState } from 'react';
import { matchesWebShell, WEB_SHELL_MQ } from '../shell';

/** True when viewport uses the desktop web shell (≥900px). */
export function useWebShell(): boolean {
  const [isWeb, setIsWeb] = useState(matchesWebShell);

  useEffect(() => {
    const mq = window.matchMedia(WEB_SHELL_MQ);
    const onChange = () => setIsWeb(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isWeb;
}
