import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesConfiguration,
} from 'react-native-purchases';
import {
  InterstitialAd,
  RewardedAd,
  RewardedInterstitialAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { ads } from '@/constants/ads';

export const API_KEYS = {
  ios: 'goog_fLElaPsfhtpyzKSmMHJZgVMinPj',
  android: 'goog_fLElaPsfhtpyzKSmMHJZgVMinPj',
};

type RewardCallback = (reward: { type: string; amount: number }) => void;

interface AdsContextType {
  isPro: boolean;
  showInterstitial: (onClose?: () => void) => void | null;
  showRewarded: (onReward?: RewardCallback, onClose?: () => void) => void | null;
  showRewardedInterstitial: (onReward?: RewardCallback, onClose?: () => void) => void | null;
}

const AdsContext = createContext<AdsContextType>({
  isPro: false,
  showInterstitial: () => {},
  showRewarded: () => {},
  showRewardedInterstitial: () => {},
});

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);

  const interstitialReady = useRef(false);
  const rewardedReady = useRef(false);
  const rewardedInterstitialReady = useRef(false);

  const interstitial = useRef(InterstitialAd.createForAdRequest(ads.intersticial)).current;
  const rewarded = useRef(RewardedAd.createForAdRequest(ads.rewarded)).current;
  const rewardedInterstitial = useRef(RewardedInterstitialAd.createForAdRequest(ads.rewardedInterstitial)).current;

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
      } catch (err) {}
    };
    initRC();
  }, []);

  useEffect(() => {
    if (isPro) return;

    const onLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialReady.current = true;
    });
    const onClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialReady.current = false;
      interstitial.load();
    });

    interstitial.load();

    return () => {
      onLoaded();
      onClosed();
    };
  }, [isPro, interstitial]);

  useEffect(() => {
    if (isPro) return;

    const onLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedReady.current = true;
    });
    const onClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedReady.current = false;
      rewarded.load();
    });

    rewarded.load();

    return () => {
      onLoaded();
      onClosed();
    };
  }, [isPro, rewarded]);

  useEffect(() => {
    if (isPro) return;

    const onLoaded = rewardedInterstitial.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedInterstitialReady.current = true;
    });
    const onClosed = rewardedInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedInterstitialReady.current = false;
      rewardedInterstitial.load();
    });

    rewardedInterstitial.load();

    return () => {
      onLoaded();
      onClosed();
    };
  }, [isPro, rewardedInterstitial]);

  function showInterstitial(onClose?: () => void) {
    if (isPro) {
      onClose?.();
      return null;
    }

    if (!interstitialReady.current) {
      onClose?.();
      return null;
    }

    const unsub = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsub();
      onClose?.();
    });

    interstitial.show();
  }

  function showRewarded(onReward?: RewardCallback, onClose?: () => void) {
    if (isPro) {
      onReward?.({ type: 'pro_reward', amount: 1 });
      onClose?.();
      return null;
    }

    if (!rewardedReady.current) {
      onClose?.();
      return null;
    }

    const unsubReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      unsubReward();
      onReward?.(reward);
    });
    const unsubClose = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      unsubClose();
      onClose?.();
    });

    rewarded.show();
  }

  function showRewardedInterstitial(onReward?: RewardCallback, onClose?: () => void) {
    if (isPro) {
      onReward?.({ type: 'pro_reward', amount: 1 });
      onClose?.();
      return null;
    }

    if (!rewardedInterstitialReady.current) {
      onClose?.();
      return null;
    }

    const unsubReward = rewardedInterstitial.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      unsubReward();
      onReward?.(reward);
    });
    const unsubClose = rewardedInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubClose();
      onClose?.();
    });

    rewardedInterstitial.show();
  }

  return (
    <AdsContext.Provider value={{ isPro, showInterstitial, showRewarded, showRewardedInterstitial }}>
      {children}
    </AdsContext.Provider>
  );
}

export const useAds = () => useContext(AdsContext);