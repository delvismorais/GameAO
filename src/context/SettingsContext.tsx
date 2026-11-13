import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_EXCHANGE_RATE,
  STORAGE_KEYS,
  type ExchangeRateConfig,
} from '../config/store';
import { readStorage, writeStorage } from '../lib/storage';

interface SettingsContextValue {
  config: ExchangeRateConfig;
  rate: number;
  updateConfig: (patch: Partial<ExchangeRateConfig>) => void;
  setRate: (rate: number) => void;
  resetConfig: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitizeConfig(value: ExchangeRateConfig): ExchangeRateConfig {
  const rate = Number(value.usdToAoa);
  return {
    usdToAoa: Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_EXCHANGE_RATE.usdToAoa,
    source: value.source?.trim() || DEFAULT_EXCHANGE_RATE.source,
    updatedAt: value.updatedAt || DEFAULT_EXCHANGE_RATE.updatedAt,
    note: value.note ?? DEFAULT_EXCHANGE_RATE.note,
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ExchangeRateConfig>(() =>
    sanitizeConfig(readStorage(STORAGE_KEYS.settings, DEFAULT_EXCHANGE_RATE)),
  );

  useEffect(() => {
    writeStorage(STORAGE_KEYS.settings, config);
  }, [config]);

  const updateConfig = useCallback((patch: Partial<ExchangeRateConfig>) => {
    setConfig((current) => sanitizeConfig({ ...current, ...patch }));
  }, []);

  const setRate = useCallback((rate: number) => {
    setConfig((current) => sanitizeConfig({ ...current, usdToAoa: rate }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_EXCHANGE_RATE });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ config, rate: config.usdToAoa, updateConfig, setRate, resetConfig }),
    [config, updateConfig, setRate, resetConfig],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  return context;
}
