import { useState, useEffect } from 'react';

export interface ExchangeRates {
  usdToBrl: number;
  solToBrl: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60000; // 60 segundos

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates | null>(cachedRates);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedRates);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchRates() {
      if (cachedRates && Date.now() - lastFetchTime < CACHE_DURATION) {
        if (isMounted) {
          setRates(cachedRates);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setIsError(false);

        // 1. Fetch USD-BRL from AwesomeAPI
        const awesomeApiResponse = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        if (!awesomeApiResponse.ok) throw new Error('Failed to fetch USD-BRL from AwesomeAPI');
        const awesomeApiData = await awesomeApiResponse.json();
        const usdToBrl = parseFloat(awesomeApiData.USDBRL.bid);

        if (isNaN(usdToBrl) || usdToBrl <= 0) {
          throw new Error('Invalid USD-BRL rate received');
        }

        // 2. Fetch SOL-USD from our internal dual oracle API (Jupiter + Pyth)
        let solToUsd = 145.00; // Fallback temporário de segurança
        try {
          const solOracleResponse = await fetch('/api/oracle-test');
          if (solOracleResponse.ok) {
            const solOracleData = await solOracleResponse.json();
            if (solOracleData.prices?.finalResolvedPrice && solOracleData.prices.finalResolvedPrice > 0) {
              solToUsd = solOracleData.prices.finalResolvedPrice;
            }
          }
        } catch (oracleError) {
          console.warn('[useExchangeRates] Falha ao buscar oráculo, usando fallback para SOL:', oracleError);
        }

        // 3. Calculate derived rates
        const solToBrl = solToUsd * usdToBrl;

        if (isMounted) {
          cachedRates = { usdToBrl, solToBrl };
          lastFetchTime = Date.now();
          setRates(cachedRates);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erro no motor de câmbio: ", error);
        if (isMounted) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    }

    fetchRates();

    return () => {
      isMounted = false;
    };
  }, []);

  return { rates, isLoading, isError };
}
