import { TransferForm } from '../../components/transfer/TransferForm'

export default function SendMoneyScreen() {
  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col justify-center min-h-[80vh]">
      <TransferForm />
    </div>
  )
}
