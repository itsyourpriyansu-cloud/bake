import { ImageOff } from 'lucide-react'
import { useState } from 'react'

export function CustomerAsset({ src, alt, className = '', eager = false, fallbackLabel = 'Fresh from Pizza Wave' }: { src: string; alt: string; className?: string; eager?: boolean; fallbackLabel?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className={`customer-asset-fallback ${className}`} role="img" aria-label={`${alt} placeholder`}><ImageOff aria-hidden="true" /><span>{fallbackLabel}</span></div>
  return <img className={className} src={src} alt={alt} width="1024" height="1024" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" draggable="false" onError={() => setFailed(true)} />
}
