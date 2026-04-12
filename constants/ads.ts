import { Platform } from "react-native"
import { TestIds } from "react-native-google-mobile-ads"

interface Ads {
    banner: string
    intersticial: string
    rewardedInterstitial: string
    rewarded: string
    nativeAvancado: string
    appOpen: string
}

export const ads: Ads = {
    banner: Platform.select({
        ios: __DEV__ ? TestIds.BANNER : 'ca-app-pub-6242824020711835/6894303333',
        android: __DEV__ ? TestIds.BANNER : 'ca-app-pub-6242824020711835/6894303333',
    })!,

    intersticial: Platform.select({
        ios: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-6242824020711835/9622194017',
        android: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-6242824020711835/9622194017',
    })!,

    rewardedInterstitial: Platform.select({
        ios: __DEV__ ? TestIds.REWARDED_INTERSTITIAL : 'ca-app-pub-6242824020711835/5331595214',
        android: __DEV__ ? TestIds.REWARDED_INTERSTITIAL : 'ca-app-pub-6242824020711835/5331595214',
    })!,

    rewarded: Platform.select({
        ios: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-6242824020711835/4704601763',
        android: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-6242824020711835/4704601763',
    })!,

    nativeAvancado: Platform.select({
        ios: __DEV__ ? TestIds.NATIVE : 'ca-app-pub-6242824020711835/4824021261',
        android: __DEV__ ? TestIds.NATIVE : 'ca-app-pub-6242824020711835/4824021261',
    })!,

    appOpen: Platform.select({
        ios: __DEV__ ? TestIds.APP_OPEN : 'ca-app-pub-6242824020711835/3391520095',
        android: __DEV__ ? TestIds.APP_OPEN : 'ca-app-pub-6242824020711835/3391520095',
    })!,
}