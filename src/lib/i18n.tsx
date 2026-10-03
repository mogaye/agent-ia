import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'fr' | 'en';
export type AppCurrency = 'XOF' | 'EUR' | 'USD';

interface LocaleContextType {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  currency: AppCurrency;
  setCurrency: (currency: AppCurrency) => void;
  formatPlanPrice: (priceFCFA: number, priceEUR: number, priceUSD?: number) => string;
}

const LocaleContext = createContext<LocaleContextType>({
  lang: 'fr',
  setLang: () => {},
  currency: 'XOF',
  setCurrency: () => {},
  formatPlanPrice: (fcfa) => `${fcfa.toLocaleString()} FCFA`
});

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('smgflow_lang');
      if (saved === 'en' || saved === 'fr') return saved;
    } catch {
      // ignore storage errors
    }
    return 'fr';
  });

  const [currency, setCurrencyState] = useState<AppCurrency>(() => {
    try {
      const saved = localStorage.getItem('smgflow_currency');
      if (saved === 'XOF' || saved === 'EUR' || saved === 'USD') return saved;
    } catch {
      // ignore storage errors
    }
    return 'XOF';
  });

  useEffect(() => {
    try {
      localStorage.setItem('smgflow_lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('smgflow_currency', currency);
    } catch {
      // ignore
    }
  }, [currency]);

  const setLang = (newLang: AppLanguage) => setLangState(newLang);
  const setCurrency = (newCurr: AppCurrency) => setCurrencyState(newCurr);

  const formatPlanPrice = (priceFCFA: number, priceEUR: number, priceUSD?: number): string => {
    const usd = priceUSD ?? Math.round(priceEUR * 1.08);
    if (currency === 'EUR') {
      return `${priceEUR} €`;
    }
    if (currency === 'USD') {
      return `$${usd}`;
    }
    return `${priceFCFA.toLocaleString()} FCFA`;
  };

  return (
    <LocaleContext.Provider
      value={{
        lang,
        setLang,
        currency,
        setCurrency,
        formatPlanPrice
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
