import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMenu } from '../../../features/catalog/hooks/useCatalog'
import { filterMenuProducts } from '../../../domain/catalog/filterMenuProducts'
import { useCart, useCartActions } from '../../../features/cart/hooks/useCart'
import { ProductCard } from '../../../features/product/components/ProductCard'
import { Chip, EmptyState, ErrorState, PageHeader, Skeleton } from '../../../shared/components'

export default function MenuPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const menu = useMenu()
  const cart = useCart()
  const { add, update } = useCartActions()
  const [category, setCategory] = useState(params.get('category') ?? 'all')
  const [collection, setCollection] = useState(params.get('collection') ?? '')
  const products = useMemo(() => filterMenuProducts(menu.data?.products ?? [], { category, collection, query: '' }), [menu.data, category, collection])

  if (menu.isError) return <ErrorState retry={() => void menu.refetch()} />

  const action = (productId: string) => {
    const rows = cart.data?.items.filter((row) => row.productId === productId) ?? []
    const item = rows[0]
    const product = menu.data?.products.find((row) => row.id === productId)
    return { cartItem: item, cartCount: rows.reduce((total, row) => total + row.quantity, 0), onAdd: () => product?.modifierGroups?.length ? navigate(`/app/build/${productId}`) : add.mutate(productId), onQuantity: (quantity: number) => { if (item) update.mutate({ id: item.id, quantity }) } }
  }
  const chooseCategory = (value: string) => { setCategory(value); setCollection('') }
  const chooseCollection = (value: string) => { setCollection(collection === value ? '' : value); setCategory('all') }
  const showGrouped = category === 'all' && !collection

  return <div className="menu-page stage-two-menu">
    <PageHeader eyebrow="FRESH FROM GRAND ROAD" title="What’s your wave?" />
    <Link className="menu-search" to="/app/search"><Search /><span>Search paneer, cheese, shake…</span></Link>

    <div className="sticky-categories" aria-label="Menu categories"><Chip active={category === 'all'} onClick={() => chooseCategory('all')}>All</Chip>{menu.data?.categories.map((item) => <Chip key={item.id} active={category === item.id} onClick={() => chooseCategory(item.id)}>{item.name}</Chip>)}</div>
    <div className="smart-collections" aria-label="Smart collections">{menu.data?.collections.map((item) => <Chip key={item.id} active={collection === item.id} onClick={() => chooseCollection(item.id)}>{item.name}</Chip>)}</div>

    {menu.isPending ? <div className="product-grid">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="product-skeleton" />)}</div> : showGrouped && !products.length ? <EmptyState title="No matches yet" message="Fresh picks will appear here shortly." /> : showGrouped ? <div className="menu-groups">{menu.data?.categories.map((item) => {
      const rows = (menu.data?.products ?? []).filter((product) => product.category === item.id)
      if (!rows.length) return null
      return <section className="menu-group" key={item.id}><div className="menu-group-head"><div><span>{String(rows.length).padStart(2, '0')} PICKS</span><h2>{item.name}</h2></div><button onClick={() => chooseCategory(item.id)}>View {item.name}</button></div><div className="menu-category-grid">{rows.map((product) => <ProductCard key={product.id} product={product} {...action(product.id)} />)}</div></section>
    })}</div> : <><div className="menu-count"><span>{products.length} curated picks</span><i /></div>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} {...action(product.id)} />)}</div> : <EmptyState title="No matches yet" message="Try a different category or collection." />}</>}
  </div>
}
