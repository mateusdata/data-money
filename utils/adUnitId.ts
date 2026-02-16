import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

export const adUnitId = __DEV__ ?  TestIds.INTERSTITIAL : Platform.OS === 'android' ? 'ca-app-pub-6242824020711835/2624690184' : 'ca-app-pub-6242824020711835/4227622528';
export const bannerAdUnitId = __DEV__ ? TestIds.BANNER : Platform.OS === 'android' ?  'ca-app-pub-6242824020711835/7440535619' : 'ca-app-pub-6242824020711835/9490288579';
export const bannerAdUnitId2 = __DEV__ ? TestIds.BANNER : Platform.OS === 'android' ? 'ca-app-pub-6242824020711835/9356709134' : 'ca-app-pub-6242824020711835/9490288579';
export const rewardedInterstitialAdUnitId = __DEV__ ? TestIds.REWARDED_INTERSTITIAL : Platform.OS === 'android' ? 'ca-app-pub-6242824020711835/2562421488' : 'ca-app-pub-6242824020711835/4227622528';
export const rewardedInterstitialAdUnitIdTwo = __DEV__ ? TestIds.REWARDED_INTERSTITIAL : Platform.OS === 'android' ? 'ca-app-pub-6242824020711835/4637920480' : 'ca-app-pub-6242824020711835/4227622528';
