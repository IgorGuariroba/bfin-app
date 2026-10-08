import { describe, expect, it } from 'vitest';
import { TransportItemType, LogLevel } from '@grafana/faro-web-sdk';
import { sanitizeFaro } from './faro-privacy';

describe('privacidade da telemetria do browser', () => {
  it('mantém tipo e contexto do erro sem mensagem, usuário, URL ou stack privado', () => {
    const item = sanitizeFaro({ type: TransportItemType.EXCEPTION,
      meta: { user: { email: 'PRIVATE_MARKER' }, page: { url: 'https://example.com?token=PRIVATE_MARKER' }, app: { name: 'bfin-app' } },
      payload: { timestamp: '2026-10-07', type: 'TypeError', value: 'PRIVATE_MARKER', context: { message: 'PRIVATE_MARKER' }, stacktrace: { frames: [] } },
    });
    expect(item).not.toBeNull();
    expect(JSON.stringify(item)).not.toContain('PRIVATE_MARKER');
    expect(item?.payload).toMatchObject({ type: 'TypeError', value: 'Browser error' });
  });
  it('descarta eventos e logs livres', () => {
    expect(sanitizeFaro({ type: TransportItemType.LOG, meta: {}, payload: { message: 'conversa privada', level: LogLevel.INFO, context: {}, timestamp: '2026-10-07' } })).toBeNull();
  });
});
