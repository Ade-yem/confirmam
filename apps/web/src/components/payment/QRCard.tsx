import { QRCodeSVG } from 'qrcode.react'
import { cn } from '../../utils/cn'

interface QRCardProps {
  data: string
  className?: string
}

export function QRCard({ data, className }: QRCardProps) {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-2xl border border-gray-100 shadow-soft flex flex-col items-center justify-center max-w-sm w-full select-none",
        className
      )}
    >
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/50">
        <QRCodeSVG
          value={data}
          size={180}
          bgColor="#FFFFFF"
          fgColor="#111827" // Midnight color
          level="M"
          includeMargin={false}
        />
      </div>
      
      <span className="text-xs font-semibold text-midnight-60 mt-4 tracking-wider uppercase">
        Scan to pay
      </span>
      <p className="text-[11px] font-semibold text-midnight-40 mt-1 text-center px-4">
        Hold device camera over the code to scan details instantly
      </p>
    </div>
  )
}
