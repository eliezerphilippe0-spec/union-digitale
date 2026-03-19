import { useState, useEffect } from 'react';
import { collection, collectionGroup, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface VendorOrder {
  orderId: string;
  vendorId: string;
  items: any[];
  subtotal: number;
  platformFee: number;
  vendorAmount: number;
  buyerCity: string | null;
  buyerCountry: string | null;
  status: string;
  paymentStatus: string;
  createdAt: any;
  updatedAt: any;
}

interface UseVendorOrdersOptions {
  status?: string;
  limitCount?: number;
  realtime?: boolean;
}

export const useVendorOrders = (options: UseVendorOrdersOptions = {}) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { status, limitCount = 50, realtime = false } = options;

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Use collectionGroup to query vendor_orders across all orders
    let q = query(
      collectionGroup(db as any, 'vendor_orders'),
      where('vendorId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // Add status filter if provided
    if (status) {
      q = query(
        collectionGroup(db as any, 'vendor_orders'),
        where('vendorId', '==', currentUser.uid),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any as VendorOrder[];
        setOrders(ordersData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching vendor orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (realtime) {
      // Real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any as VendorOrder[];
          setOrders(ordersData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error in realtime listener:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // One-time fetch
      fetchOrders();
    }
  }, [currentUser, status, limitCount, realtime]);

  return { orders, loading, error };
};

/**
 * Get vendor order stats
 */
export const useVendorOrderStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    pendingBalance: 0,
    availableBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const q = query(
          collectionGroup(db as any, 'vendor_orders'),
          where('vendorId', '==', currentUser.uid)
        );

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => doc.data());

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.vendorAmount || 0), 0);
        
        // Priority 2: Escrow logic computations
        // Funds are pending if order is NOT delivered. Funds are available if order IS delivered.
        const pendingOrders = orders.filter(o => o.status !== 'delivered').length;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        
        const pendingBalance = orders.filter(o => o.status !== 'delivered').reduce((sum, order) => sum + (order.vendorAmount || 0), 0);
        const availableBalance = orders.filter(o => o.status === 'delivered').reduce((sum, order) => sum + (order.vendorAmount || 0), 0);

        setStats({
          totalOrders,
          totalRevenue,
          pendingOrders,
          completedOrders,
          pendingBalance,
          availableBalance
        });
      } catch (err) {
        console.error('Error fetching vendor stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentUser]);

  return { stats, loading };
};
