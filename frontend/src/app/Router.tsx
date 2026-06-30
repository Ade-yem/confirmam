import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import DashboardScreen from '../screens/Dashboard'
import ReceivePaymentScreen from '../screens/ReceivePayment'
import SendMoneyScreen from '../screens/SendMoney'
import TransactionsScreen from '../screens/Transactions'
import ProfileScreen from '../screens/Profile'

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
