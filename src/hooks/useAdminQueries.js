import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { adminQueryKeys } from '../constants/queryKeys';

// Fetch Dashboard Analytics & Stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: adminQueryKeys.stats,
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard/stats');
      return res.data?.stats || res.data || {};
    },
    staleTime: 1000 * 60 * 2,
  });
};

// Fetch All Products
export const useAdminProducts = () => {
  return useQuery({
    queryKey: adminQueryKeys.products.all,
    queryFn: async () => {
      const res = await apiClient.get('/admin/products');
      return res.data?.products || [];
    },
    staleTime: 1000 * 60 * 3,
  });
};

// Fetch All Orders
export const useAdminOrders = () => {
  return useQuery({
    queryKey: adminQueryKeys.orders.all,
    queryFn: async () => {
      const res = await apiClient.get('/admin/orders');
      return res.data?.orders || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// Fetch All Registered Customers
export const useAdminCustomers = () => {
  return useQuery({
    queryKey: adminQueryKeys.customers.all,
    queryFn: async () => {
      const res = await apiClient.get('/admin/customers');
      return res.data?.customers || [];
    },
    staleTime: 1000 * 60 * 3,
  });
};

// Fetch All Categories
export const useAdminCategories = () => {
  return useQuery({
    queryKey: adminQueryKeys.categories,
    queryFn: async () => {
      const res = await apiClient.get('/admin/categories');
      return res.data?.categories || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch Active Database Sessions for Admin
export const useAdminSessions = () => {
  return useQuery({
    queryKey: adminQueryKeys.sessions,
    queryFn: async () => {
      const res = await apiClient.get('/admin/auth/sessions');
      return res.data?.sessions || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// Revoke Admin Session Mutation
export const useRevokeAdminSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId) => {
      const res = await apiClient.delete(`/admin/auth/sessions/${sessionId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.sessions });
    },
  });
};

