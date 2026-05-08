import type { Faro } from '@grafana/faro-web-sdk';

// Singleton exposto para uso manual: faro.api.pushError(err)
let _faro: Faro | null = null;

export function setFaro(instance: Faro) {
  _faro = instance;
}

export function getFaro(): Faro | null {
  return _faro;
}
