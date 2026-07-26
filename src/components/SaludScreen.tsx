import { useState } from 'react';
import { useAppState, useAppActions } from '../store';
import { n } from '../format';
import { formatSyncLabel } from '../healthProviders';
import { color, font, gradient, radius, shadow, cardStyle } from '../theme';
import {
  Eyebrow, IconActivity, IconApple, IconBolt, IconHeartPulse,
  IconRun, IconWatch, IconWave, ScreenPage, ScreenTitle, SectionTitle,
} from './ui';
import type { Provider } from '../types';

function ProviderIcon({ id }: { id: string }) {
  if (id === 'apple') return <IconApple />;
  if (id === 'garmin') return <IconWatch />;
  if (id === 'fitbit') return <IconWave />;
  if (id === 'samsung') return <IconHeartPulse />;
  if (id === 'strava') return <IconActivity />;
  return <IconRun />;
}

function statusLabel(pr: Provider): { text: string; tone: string } {
  switch (pr.status) {
    case 'connected':
      return { text: pr.lastSyncAt ? 'Conectado' : 'Conectado · sin sync', tone: color.success };
    case 'needs_native':
      return { text: 'Requiere app nativa', tone: color.textMuted };
    case 'coming_soon':
      return { text: 'Próximamente', tone: color.textMuted };
    case 'unconfigured':
      return { text: pr.message || 'Sin configurar', tone: color.textMuted };
    case 'error':
      return { text: pr.message || 'Error', tone: '#e0512c' };
    default:
      return { text: 'No conectado', tone: color.textMuted };
  }
}

function primaryActionLabel(pr: Provider): string {
  if (pr.on) return 'Desconectar';
  if (pr.status === 'coming_soon') return 'Pronto';
  if (pr.status === 'needs_native') return 'Info';
  if (pr.status === 'unconfigured') return 'Config';
  return 'Conectar';
}

export default function SaludScreen() {
  const { sports, providers, healthSummary, healthBanner } = useAppState();
  const { connectProvider, disconnectProvider, syncHealthProviders } = useAppActions();
  const [busy, setBusy] = useState<string | null>(null);
  const [localMsg, setLocalMsg] = useState('');

  const burnedFromSports = sports.filter(s => s.on).reduce((a, s) => a + s.kcal, 0);
  const burned = healthSummary.kcal > 0 ? healthSummary.kcal : burnedFromSports;
  const steps = healthSummary.steps;
  const minutes = healthSummary.minutes;
  const syncLabel = formatSyncLabel(healthSummary.lastSyncAt).toUpperCase();

  async function onPrimary(pr: Provider) {
    setLocalMsg('');
    setBusy(pr.id);
    try {
      if (pr.on) {
        await disconnectProvider(pr.id);
      } else {
        const result = await connectProvider(pr.id);
        if (result?.message && !result.authorizeUrl) {
          setLocalMsg(result.message);
        }
      }
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : 'No se pudo completar la acción');
    } finally {
      setBusy(null);
    }
  }

  async function onSync() {
    setLocalMsg('');
    setBusy('sync');
    try {
      await syncHealthProviders();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : 'Error al sincronizar');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScreenPage>
      <Eyebrow style={{ fontSize: 14, fontWeight: 600 }}>ACTIVIDAD</Eyebrow>
      <ScreenTitle>Salud</ScreenTitle>

      <div style={{
        background: gradient.health,
        borderRadius: radius['2xl'], padding: 22, color: color.white, marginTop: 18,
        boxShadow: shadow.health,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.8)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: color.white,
            boxShadow: '0 0 0 4px rgba(255,255,255,.25)',
            opacity: healthSummary.lastSyncAt ? 1 : 0.45,
          }} />
          {syncLabel}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 12 }}>
          <div style={{ fontFamily: font.display, fontSize: 46, fontWeight: 900, lineHeight: 1 }}>
            {n(burned)}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,.7)', paddingBottom: 8 }}>
            kcal quemadas hoy
          </div>
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 18 }}>
          {[
            { v: steps > 0 ? n(steps) : '—', l: 'pasos' },
            { v: minutes > 0 ? `${minutes}'` : '—', l: 'min activo' },
            { v: burnedFromSports > 0 ? n(burnedFromSports) : '—', l: 'kcal actividad' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 800 }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        ...cardStyle, borderRadius: radius.lg, padding: '13px 16px', marginTop: 14,
      }}>
        <span style={{ display: 'flex', color: color.secondary, flexShrink: 0 }}><IconBolt /></span>
        <div style={{ fontSize: 13, fontWeight: 600, color: color.textBody, lineHeight: 1.35, flex: 1 }}>
          {burned > 0
            ? <>Estas kcal ya suman a tu objetivo.</>
            : <>Conecta y sincroniza para sumar kcal.</>}
        </div>
      </div>

      {(healthBanner || localMsg) && (
        <div style={{
          marginTop: 12, fontSize: 13, fontWeight: 600, color: color.textBody,
          ...cardStyle, borderRadius: radius.lg, padding: '12px 14px',
        }}>
          {localMsg || healthBanner}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <SectionTitle>Apps de salud</SectionTitle>
        <button
          type="button"
          onClick={() => void onSync()}
          disabled={busy === 'sync' || !providers.some(p => p.on)}
          style={{
            fontSize: 12.5, fontWeight: 800, border: 'none', cursor: 'pointer',
            background: color.ink, color: color.white, borderRadius: radius.pill,
            padding: '8px 14px', opacity: providers.some(p => p.on) ? 1 : 0.45,
            marginBottom: 14,
          }}
        >
          {busy === 'sync' ? 'Sync…' : 'Sincronizar'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {providers.map(pr => {
          const st = statusLabel(pr);
          const isBlocked = pr.status === 'coming_soon' || pr.status === 'unconfigured';
          return (
            <div key={pr.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              ...cardStyle, borderRadius: 20, padding: '15px 16px',
              opacity: pr.status === 'coming_soon' ? 0.85 : 1,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: pr.on ? color.successBgAlt : color.surfaceMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: pr.on ? color.success : color.textMuted,
              }}>
                <ProviderIcon id={pr.id} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{pr.name}</div>
                <div style={{
                  fontSize: 12.5, fontWeight: 600, color: st.tone,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {st.text}
                </div>
              </div>
              <button
                type="button"
                disabled={busy === pr.id || (isBlocked && pr.status !== 'needs_native')}
                onClick={() => void onPrimary(pr)}
                style={{
                  fontSize: 13, fontWeight: 800, color: color.white,
                  background: pr.on ? color.success : color.ink,
                  padding: '9px 16px', borderRadius: radius.pill, cursor: 'pointer',
                  border: 'none', transition: 'background .2s ease',
                  opacity: isBlocked ? 0.55 : 1,
                }}
              >
                {busy === pr.id ? '…' : primaryActionLabel(pr)}
              </button>
            </div>
          );
        })}
      </div>
    </ScreenPage>
  );
}
