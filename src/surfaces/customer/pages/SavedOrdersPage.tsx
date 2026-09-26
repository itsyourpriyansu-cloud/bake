import { ChevronDown, Edit3, PackagePlus, ShoppingBag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SavedOrder } from '../../../domain/customer/customer-experience.types'
import { useCartActions } from '../../../features/cart/hooks/useCart'
import { useSavedOrders, useCustomerExperienceActions } from '../../../features/customer/hooks/useCustomerExperience'
import { useMenu } from '../../../features/catalog/hooks/useCatalog'
import { EmptyState, ErrorState, PrimaryButton, SecondaryButton, Skeleton } from '../../../shared/components'
import { CustomerPageHeader, MiniProductArt } from '../components/Stage5Ui'

export default function SavedOrdersPage() {
  const saved = useSavedOrders(); const menu = useMenu(); const actions = useCustomerExperienceActions(); const cart = useCartActions(); const navigate = useNavigate()
  const [open, setOpen] = useState<string>(); const [renaming, setRenaming] = useState<SavedOrder>(); const [name, setName] = useState('')
  const addBundle = async (bundle: SavedOrder) => { for (const item of bundle.items) await cart.add.mutateAsync(item); navigate('/app/cart') }
  if (saved.isError || menu.isError) return <div className="stage5-page"><ErrorState retry={() => { void saved.refetch(); void menu.refetch() }} /></div>
  const nameFor = (productId: string) => menu.data?.products.find((product) => product.id === productId)?.name ?? productId.replace(/-001$/, '').replaceAll('-', ' ')
  return <div className="stage5-page saved-orders-page"><CustomerPageHeader eyebrow="QUICK REORDER" title="Saved Orders" back="/app/profile" />
    <p className="stage5-lede">Your named Pizza Wave combinations—ready for the next movie night, family table or usual order.</p>
    {saved.isPending || menu.isPending ? <Skeleton className="saved-skeleton" /> : saved.data?.length ? <div className="saved-order-list">{saved.data.map((bundle, index) => <article className={`saved-bundle saved-color-${index % 3}`} key={bundle.id}><button className="saved-bundle-head" onClick={() => setOpen(open === bundle.id ? undefined : bundle.id)}><i><ShoppingBag /></i><span><small>{bundle.items.reduce((sum, item) => sum + item.quantity, 0)} ITEMS</small><strong>{bundle.name}</strong><em>{bundle.items.map((item) => nameFor(item.productId)).join(' · ')} · Tap to view</em></span><ChevronDown /></button>{open === bundle.id && <div className="saved-bundle-body"><div>{bundle.items.map((item) => <div key={item.productId}><MiniProductArt productId={item.productId} name={nameFor(item.productId)} /><span>{item.quantity}× {nameFor(item.productId)}</span></div>)}</div><div className="saved-actions"><button onClick={() => { setRenaming(bundle); setName(bundle.name) }}><Edit3 /> RENAME</button><button onClick={() => actions.deleteSavedOrder.mutate(bundle.id)}><Trash2 /> DELETE</button></div></div>}<PrimaryButton disabled={cart.add.isPending} onClick={() => void addBundle(bundle)}><PackagePlus /> ADD ORDER</PrimaryButton></article>)}</div> : <EmptyState title="No saved orders" message="Save a completed order to make next time one tap easier." />}
    {renaming && <div className="inline-edit-card"><label className="field"><span>Saved order name</span><input value={name} onChange={(event) => setName(event.target.value)} autoFocus /></label><div><PrimaryButton onClick={() => { actions.renameSavedOrder.mutate({ id: renaming.id, name }); setRenaming(undefined) }}>SAVE NAME</PrimaryButton><SecondaryButton onClick={() => setRenaming(undefined)}>CANCEL</SecondaryButton></div></div>}
  </div>
}
