import { Ionicons } from '@expo/vector-icons'
import { ThemedText } from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ActivityIndicator,
    useColorScheme
} from 'react-native'
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases'
import { Text } from 'react-native-paper'
import { useRouter } from 'expo-router'

const DEFAULT_FEATURES = [
    'App 100% sem anúncios',
    'Faça compras sem interrupções no mercado',
    'Calculadora livre de propagandas',
]

const Subscription = () => {
    const router = useRouter()
    const colorScheme = useColorScheme() ?? 'light'
    const isDark = colorScheme === 'dark'

    const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null)
    const [isPurchasing, setIsPurchasing] = useState(false)

    // Busca o pacote em background apenas para o botão de assinar funcionar
    useEffect(() => {
        const fetchOfferings = async () => {
            try {
                const offerings = await Purchases.getOfferings()

                if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
                    let monthly = offerings.current.availablePackages.find(
                        (p) => p.packageType === 'MONTHLY' || p.identifier === '$rc_monthly'
                    )

                    if (!monthly) {
                        monthly = offerings.current.availablePackages[0]
                    }

                    if (monthly) {
                        setMonthlyPackage(monthly)
                    }
                }
            } catch (e: any) {
                console.warn("Erro ao buscar ofertas:", e)
            }
        }

        fetchOfferings()
    }, [])

    const handleSubscribe = async () => {
        if (!monthlyPackage) {
            Alert.alert('Aguarde', 'Conectando com a loja de aplicativos. Tente novamente em alguns segundos.')
            return
        }

        setIsPurchasing(true)
        try {
            const result = await Purchases.purchasePackage(monthlyPackage)

            const actives = Object.values(result.customerInfo.entitlements.active);
            if (actives.length > 0) {
                Alert.alert(
                    'Assinatura Confirmada!',
                    'Você agora tem acesso Premium.',
                    [{ text: 'OK', onPress: () => router.back() }]
                )
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Erro na compra', e.message)
            }
        } finally {
            setIsPurchasing(false)
        }
    }

    const handleRestore = async () => {
        setIsPurchasing(true)
        try {
            const customerInfo = await Purchases.restorePurchases()

            const actives = Object.values(customerInfo.entitlements.active);
            if (actives.length > 0) {
                Alert.alert(
                    'Sucesso',
                    'Compras restauradas com sucesso!',
                    [{ text: 'OK', onPress: () => router.back() }]
                )
            } else {
                Alert.alert('Aviso', 'Nenhuma assinatura ativa encontrada.')
            }
        } catch (e: any) {
            Alert.alert('Erro ao restaurar', e.message)
        } finally {
            setIsPurchasing(false)
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8F8F8' }]}>
            <LinearGradient
                colors={isDark ? ['#1a1a2e', '#16213e', '#151718'] : ['#e0f2ff', '#f0f8ff', '#F8F8F8']}
                style={StyleSheet.absoluteFillObject}
            />

            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="close" size={22} color={isDark ? "#fff" : "#111"} />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <LinearGradient
                        colors={['rgba(37,211,102,0.15)', 'rgba(37,211,102,0.05)']}
                        style={styles.badge}
                    >
                        <Text style={styles.badgeText}>✦  PLANO PRO</Text>
                    </LinearGradient>

                    <View style={styles.titleRow}>
                        <Text style={[styles.titleWhite, { color: isDark ? '#fff' : '#111' }]}>DATA</Text>
                        <Text style={styles.titleAccent}>COMPRAS</Text>
                    </View>
                    <Text style={styles.titlePro}>Pro</Text>

                    <ThemedText style={[styles.subtitle, { color: isDark ? '#A0AAB5' : '#4A5568' }]}>
                        Desbloqueie todos os recursos{'\n'}sem anúncios ilimitado
                    </ThemedText>
                </View>

                {/* Preço Fixo Hardcoded */}
                <LinearGradient
                    colors={isDark ? ['rgba(37,211,102,0.12)', 'rgba(37,211,102,0.04)'] : ['rgba(37,211,102,0.08)', 'rgba(37,211,102,0.02)']}
                    style={styles.priceBox}
                >
                    <ThemedText type="subtitle" style={[styles.price, { color: isDark ? '#fff' : '#111' }]}>
                        R$ 5,90
                    </ThemedText>
                    <ThemedText style={[styles.period, { color: isDark ? '#94A3B8' : '#4A5568' }]}>
                        por mês · Cancele quando quiser
                    </ThemedText>
                </LinearGradient>

                <View style={styles.features}>
                    {DEFAULT_FEATURES.map((text, index) => (
                        <Feature key={index} text={text} isDark={isDark} />
                    ))}
                </View>

                <LinearGradient
                    colors={[Colors.light.primary, '#1DA851']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                >
                    <TouchableOpacity
                        style={styles.buttonInner}
                        onPress={handleSubscribe}
                        disabled={isPurchasing}
                    >
                        {isPurchasing
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.buttonText}>Assinar Agora</Text>
                        }
                    </TouchableOpacity>
                </LinearGradient>

                <LinearGradient
                    colors={['rgba(37,211,102,0.5)', 'rgba(29,168,81,0.5)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.secondaryGradientBorder}
                >
                    <TouchableOpacity
                        style={styles.secondaryInner}
                        onPress={handleRestore}
                        disabled={isPurchasing}
                    >
                        <Text style={[styles.secondaryText, { color: isDark ? '#FFFFFF' : '#111111' }]}>
                            Restaurar Compras
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>

                <View style={styles.footer}>
                    <ThemedText style={[styles.disclaimer, { color: isDark ? '#94A3B8' : '#475569' }]}>Ao continuar, você concorda com o </ThemedText>

                    <TouchableOpacity onPress={() => Linking.openURL('https://legal.mateusdata.com.br/snap-line/privacy-policy')}>
                        <ThemedText style={styles.footerLink}>Termos de Uso</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={[styles.disclaimer, { color: isDark ? '#94A3B8' : '#475569' }]}> e </ThemedText>
                    <TouchableOpacity onPress={() => Linking.openURL('https://legal.mateusdata.com.br/snap-line/privacy-policy')}>
                        <ThemedText style={styles.footerLink}>Política de Privacidade</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

const Feature = ({ text, isDark }: { text: string, isDark: boolean }) => (
    <View style={styles.feature}>
        <LinearGradient
            colors={isDark ? ['rgba(37,211,102,0.2)', 'rgba(37,211,102,0.08)'] : ['rgba(37,211,102,0.15)', 'rgba(37,211,102,0.05)']}
            style={styles.check}
        >
            <Ionicons name="checkmark" size={13} color={Colors.light.primary} />
        </LinearGradient>
        <ThemedText style={[styles.featureText, { color: isDark ? '#E2E8F0' : '#334155' }]}>{text}</ThemedText>
    </View>
)

export default Subscription

const styles = StyleSheet.create({
    container: { flex: 1 },
    closeButton: {
        position: 'absolute',
        top: 52,
        left: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(150,150,150,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(150,150,150,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingTop: 110,
        paddingBottom: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    badge: {
        borderRadius: 100,
        paddingVertical: 5,
        paddingHorizontal: 16,
        marginBottom: 18,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.light.primary,
        letterSpacing: 2,
    },
    titleRow: {
        flexDirection: 'row',
    },
    titleWhite: {
        fontSize: 38,
        fontWeight: '900',
        letterSpacing: 6,
    },
    titleAccent: {
        fontSize: 38,
        fontWeight: '900',
        color: Colors.light.primary,
        letterSpacing: 6,
    },
    titlePro: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.light.primary,
        letterSpacing: 6,
        marginTop: 2,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 4,
    },
    priceBox: {
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(37,211,102,0.18)',
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 28,
    },
    price: {
        fontSize: 40,
        fontWeight: '800',
        textAlign: 'center',
    },
    period: {
        fontSize: 13,
        marginTop: 4,
        textAlign: 'center',
    },
    features: {
        marginBottom: 32,
        width: '100%',
        gap: 14,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    check: {
        width: 26,
        height: 26,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        fontWeight: '500',
    },
    buttonGradient: {
        borderRadius: 100,
        width: '100%',
        marginBottom: 12,
    },
    buttonInner: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryGradientBorder: {
        borderRadius: 100,
        width: '100%',
        padding: 1.5,
        marginBottom: 0,
    },
    secondaryInner: {
        backgroundColor: 'transparent',
        borderRadius: 100,
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryText: {
        fontWeight: '600',
        fontSize: 15,
    },
    footer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    disclaimer: {
        fontSize: 12,
    },
    footerLink: {
        fontSize: 12,
        color: Colors.light.primary,
        fontWeight: '600',
    },
})