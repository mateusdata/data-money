import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
  CustomerInfo,
  PurchasesConfiguration,
} from 'react-native-purchases';

export const API_KEYS = {
  ios: 'key_ios',
  android: 'key',
};

interface PaymentContextProps {
  payment: (pack: PurchasesPackage) => Promise<void>;
  restorePayments: () => Promise<void>;
  fetchOffers: () => Promise<void>;
  packages: PurchasesPackage[];
  user: CustomerInfo | null;
  isLoading: boolean;
  hasPlan: boolean;
  setUser: React.Dispatch<React.SetStateAction<CustomerInfo | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentPlan: CustomerInfo | null;
}

const PaymentContext = createContext<PaymentContextProps>({} as PaymentContextProps);

export default function PaymentProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [hasPlan, setHasPlan] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<CustomerInfo| null>(null);
  

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
        const config: PurchasesConfiguration = { apiKey };
        Purchases.configure(config);
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        Purchases.addCustomerInfoUpdateListener((customerInfo) => {
          updateCustomerInfo(customerInfo);
        });

        const customerInfo = await Purchases.getCustomerInfo();
        updateCustomerInfo(customerInfo);
        await fetchOffers();
      } catch (error) {
        console.error('Erro ao inicializar RevenueCat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const updateCustomerInfo = (customerInfo: CustomerInfo) => {
    setUser(customerInfo);
    console.log('👤 Informações do cliente:', customerInfo);
    console.log('/n/n');


    const activeEntitlements = customerInfo.entitlements.active;

    // Pega as keys dos entitlements ativos (que são verdadeiros)
    const activeEntitlementKeys = Object.keys(activeEntitlements).filter(
      (key) => activeEntitlements[key]?.isActive === true
    );

    if (activeEntitlementKeys.length > 0) {
      setHasPlan(true);
      // Aqui pega o productIdentifier do primeiro entitlement ativo
      const firstEntitlement = activeEntitlements[activeEntitlementKeys[0]];
      setCurrentPlan(customerInfo);
    } else {
      setHasPlan(false);
      setCurrentPlan(null);
    }

    console.log('📡 Entitlements ativos:', activeEntitlements.entitlements_basic);
    console.log('✅ Plano ativo:', activeEntitlementKeys.length > 0 ? activeEntitlementKeys[0] : 'nenhum');
  };


  const fetchOffers = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setPackages(offerings.current.availablePackages);
        console.log('📦 Ofertas disponíveis:', offerings.current.availablePackages);
      }
    } catch (error) {
      console.error('Erro ao buscar ofertas:', error);
    }
  };

  const payment = async (pack: PurchasesPackage) => {
    try {
      const purchaseResult = await Purchases.purchasePackage(pack);
      updateCustomerInfo(purchaseResult.customerInfo);
      alert('✅ Compra realizada com sucesso!');
    } catch (error: any) {
      if (error.userCancelled) {
        alert('❌ Compra cancelada pelo usuário');
      } else {
        console.error('Erro ao realizar compra:', error);
        alert('❌ Erro ao realizar a compra');
      }
    }
  };

  const restorePayments = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      updateCustomerInfo(customerInfo);
      alert('✅ Compras restauradas');
    } catch (error) {
      console.error('Erro ao restaurar compras:', error);
      alert('❌ Erro ao restaurar compras');
    }
  };

 

  return (
    <PaymentContext.Provider
      value={{
        payment,
        restorePayments,
        fetchOffers,
        packages,
        user,
        isLoading,
        hasPlan,
        currentPlan,
        setUser,
        setIsLoading,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export const usePayment = () => useContext(PaymentContext);
