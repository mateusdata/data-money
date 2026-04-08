import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesConfiguration,
} from 'react-native-purchases';
import {
  InterstitialAd,
  RewardedInterstitialAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

// Chaves do RevenueCat
export const API_KEYS = {
  ios: 'goog_fLElaPsfhtpyzKSmMHJZgVMinPj',
  android: 'goog_fLElaPsfhtpyzKSmMHJZgVMinPj',
};

// Chaves do AdMob (Testes no __DEV__ e Produção no build final)
export const ads = {
  intersticial: Platform.select({
    ios: __DEV__ ? 'ca-app-pub-3940256099942544/4411468910' : '',
    android: __DEV__ ? 'ca-app-pub-3940256099942544/1033173712' : 'ca-app-pub-6242824020711835/2624690184',
  })!,
  rewardedInterstitial: Platform.select({
    ios: __DEV__ ? 'ca-app-pub-3940256099942544/5354046379' : '',
    android: __DEV__ ? 'ca-app-pub-3940256099942544/5354046379' : 'ca-app-pub-6242824020711835/2562421488',
  })!,
  rewardedInterstitial2: Platform.select({
    ios: __DEV__ ? 'ca-app-pub-3940256099942544/5354046379' : '',
    android: __DEV__ ? 'ca-app-pub-3940256099942544/5354046379' : 'ca-app-pub-6242824020711835/4637920480',
  })!,
  banner: Platform.select({
    ios: __DEV__ ? 'ca-app-pub-3940256099942544/2934735716' : '',
    // Se você tiver a chave do banner de produção, troque a string abaixo!
    android: __DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'ca-app-pub-3940256099942544/6300978111',
  })!,
};

type RewardCallback = (reward: { type: string; amount: number }) => void;

interface AdsContextType {
  isPro: boolean;
  showInterstitial: (onClose?: () => void) => void;
  showRewardedInterstitial: (onReward?: RewardCallback, onClose?: () => void) => void;
}

const AdsContext = createContext<AdsContextType>({
  isPro: false,
  showInterstitial: () => { },
  showRewardedInterstitial: () => { },
});

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);

  // Inicializa o RevenueCat e verifica se o usuário é PRO
  useEffect(() => {
    const initRC = async () => {
      try {
        const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
        const config: PurchasesConfiguration = { apiKey };
        Purchases.configure(config);
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        const checkPro = (info: CustomerInfo) => {
          const actives = Object.values(info.entitlements.active);
          setIsPro(actives.length > 0);
        };

        const info = await Purchases.getCustomerInfo();
        checkPro(info);

        Purchases.addCustomerInfoUpdateListener(checkPro);
      } catch (err) {
        console.warn('Erro RevenueCat:', err);
      }
    };
    initRC();
  }, []);

  // Referências dos anúncios
  const interstitial = useRef(InterstitialAd.createForAdRequest(ads.intersticial)).current;
  const rewardedInterstitial = useRef(RewardedInterstitialAd.createForAdRequest(ads.rewardedInterstitial)).current;
  const interstitialReady = useRef(false);
  const rewardedReady = useRef(false);

  // Carrega Intersticial em background (se não for PRO)
  useEffect(() => {
    if (isPro) return;
    const lLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialReady.current = true;
    });
    const lClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialReady.current = false;
      interstitial.load(); // Recarrega para a próxima vez
    });

    interstitial.load();

    return () => {
      lLoaded();
      lClosed();
    };
  }, [isPro, interstitial]);

  // Carrega Intersticial Premiado em background (se não for PRO)
  useEffect(() => {
    if (isPro) return;
    const lLoaded = rewardedInterstitial.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedReady.current = true;
    });
    const lClosed = rewardedInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedReady.current = false;
      rewardedInterstitial.load(); // Recarrega para a próxima vez
    });

    rewardedInterstitial.load();

    return () => {
      lLoaded();
      lClosed();
    };
  }, [isPro, rewardedInterstitial]);

  // Função para chamar Intersticial comum
  function showInterstitial(onClose?: () => void) {
    if (isPro || !interstitialReady.current) {
      onClose?.();
      return;
    }
    const unsub = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsub();
      onClose?.();
    });
    interstitial.show();
  }

  // Função para chamar Intersticial Premiado
  function showRewardedInterstitial(onReward?: RewardCallback, onClose?: () => void) {
    if (isPro) {
      onReward?.({ type: 'pro_reward', amount: 1 });
      onClose?.();
      return;
    }
    if (!rewardedReady.current) {
      onClose?.();
      return;
    }
    const unsubR = rewardedInterstitial.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (rew) => {
      unsubR();
      onReward?.(rew);
    });
    const unsubC = rewardedInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubC();
      onClose?.();
    });
    rewardedInterstitial.show();
  }

  return (
    <AdsContext.Provider value={{ isPro, showInterstitial, showRewardedInterstitial }}>
      {children}
    </AdsContext.Provider>
  );
}

export const useAds = () => useContext(AdsContext);