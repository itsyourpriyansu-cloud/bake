import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getProductAssetById } from '../../../shared/utils/assets'

export function CustomerPageHeader({ eyebrow, title, back, action }: { eyebrow: string; title: string; back?: string; action?: ReactNode }) {
  return <header className="stage5-page-head">
    {back && <Link className="icon-button" to={back} aria-label="Go back"><ArrowLeft /></Link>}
    <div><span>{eyebrow}</span><h1>{title}</h1></div>{action && <div className="stage5-head-action">{action}</div>}
  </header>
}

export function MiniProductArt({ productId, name }: { productId: string; name: string }) {
  const asset = getProductAssetById(productId)
  return <div className="mini-product-art"><img src={asset.src} alt="" width="1024" height="1024" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true }} /><span>{name.charAt(0)}</span></div>
}

export const formatMoney = (value: number) => `₹${value.toLocaleString('en-IN')}`
export const formatOrderDate = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
