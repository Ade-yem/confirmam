import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import DashboardScreen from '@/pages/Dashboard'
import ReceivePaymentScreen from '@/pages/ReceivePayment'
import SendMoneyScreen from '@/pages/SendMoney'
import TransactionsScreen from '@/pages/Transactions'
import ProfileScreen from '@/pages/Profile'
import LoginScreen from '@/pages/Login'

export function AppRouter() {
  return (
    <Routes>
      {/* Public standalone login route */}
      <Route path="/login" element={<LoginScreen />} />

      {/* Protected Routes wrapped in AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardScreen />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/receive"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReceivePaymentScreen />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/send"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SendMoneyScreen />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TransactionsScreen />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfileScreen />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback redirection */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
