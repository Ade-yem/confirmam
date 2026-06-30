import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import DashboardScreen from '../pages/Dashboard'
import ReceivePaymentScreen from '../pages/ReceivePayment'
import SendMoneyScreen from '../pages/SendMoney'
import TransactionsScreen from '../pages/Transactions'
import ProfileScreen from '../pages/Profile'

export function AppRouter() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/receive" element={<ReceivePaymentScreen />} />
        <Route path="/send" element={<SendMoneyScreen />} />
        <Route path="/transactions" element={<TransactionsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        {/* Fallback to Dashboard */}
        <Route path="*" element={<DashboardScreen />} />
      </Routes>
    </AppLayout>
  )
}
