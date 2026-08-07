'use client';

import React, { createContext, useContext } from 'react';

export interface Permissions {
  [key: string]: boolean;
  can_view_revenue: boolean;
  can_manage_inventory: boolean;
  can_manage_orders: boolean;
  can_delete_items: boolean;
  can_manage_blog: boolean;
  can_manage_affiliates: boolean;
  can_manage_customer_care: boolean;
  can_manage_broadcast: boolean;
  can_manage_settings: boolean;
  can_manage_media: boolean;
}

interface AdminContextProps {
  role: string;
  email: string;
  permissions: Permissions;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export const AdminProvider = ({
    children,
    role = 'viewer',
    email = '',
    permissions = {
        can_view_revenue: false,
        can_manage_inventory: false,
        can_manage_orders: false,
        can_delete_items: false,
        can_manage_blog: false,
        can_manage_affiliates: false,
        can_manage_customer_care: false,
        can_manage_broadcast: false,
        can_manage_settings: false,
        can_manage_media: false
    }
}: {
    children: React.ReactNode,
    role?: string,
    email?: string,
    permissions?: Permissions
}) => {
  return (
    <AdminContext.Provider value={{ role, email, permissions: permissions as Permissions }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
