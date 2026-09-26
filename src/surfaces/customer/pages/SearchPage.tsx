import { ArrowLeft, Search, Sparkles, X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useProductSearch } from '../../../features/catalog/hooks/useCatalog'
import { useCart, useCartActions } from '../../../features/cart/hooks/useCart'
import { ProductCard } from '../../../features/product/components/ProductCard'
import { Chip, EmptyState, ErrorState, IconButton, Skeleton } from '../../../shared/components'

const popularSearches = ['paneer', 'chicken', 'veg', 'spicy', 'cheese', 'shake', 'combo', 'under 200']
const recentKey = 'pizza-wave:recent-searches'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(recentKey) ?? '[]') as string[] } catch { return [] }
  })
  const results = useProductSearch(debouncedQuery)
  const cart = useCart()
  const { add, update } = useCartActions()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = query.trim()
      setDebouncedQuery(next)
      setParams(next ? { q: next } : {}, { replace: true })
    }, 180)
    return () => window.clearTimeout(timeout)
  }, [query, setParams])

  const saveRecent = (value: string) => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) return
    const next = [normalized, ...recent.filter((item) => item !== normalized)].slice(0, 5)
    setRecent(next)
    localStorage.setItem(recentKey, JSON.stringify(next))
  }
  const searchFor = (value: string) => { setQuery(value); setDebouncedQuery(value); saveRecent(value) }
  const submit = (event: FormEvent) => { event.preventDefault(); saveRecent(query); setDebouncedQuery(query.trim()) }
  const action = (productId: string) => {
    const rows = cart.data?.items.filter((row) => row.productId === productId) ?? []
    const item = rows[0]
    const product = results.data?.find((row) => row.id === productId)
    return { cartItem: item, cartCount: rows.reduce((total, row) => total + row.quantity, 0), onAdd: () => product?.modifierGroups?.length ? navigate(`/app/build/${productId}`) : add.mutate(productId), onQuantity: (quantity: number) => { if (item) update.mutate({ id: item.id, quantity }) } }
  }

  return <div className="search-page">
    <header className="search-header"><Link to="/app/" className="icon-button" aria-label="Back to home"><ArrowLeft /></Link><div><span>FIND YOUR CRAVING</span><h1>Search</h1></div></header>
    <form className="search-box" onSubmit={submit}><Search aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try paneer, spicy or under 200" aria-label="Search products" />{query && <IconButton aria-label="Clear search" type="button" onClick={() => setQuery('')}><X /></IconButton>}</form>

    {!debouncedQuery ? <div className="search-discovery">
      {recent.length > 0 && <section><div className="search-section-title"><h2>Recent searches</h2><button onClick={() => { setRecent([]); localStorage.removeItem(recentKey) }}>Clear</button></div><div className="search-chips">{recent.map((item) => <Chip key={item} onClick={() => searchFor(item)}>{item}</Chip>)}</div></section>}
      <section><div className="search-section-title"><h2>Popular searches</h2><Sparkles /></div><div className="search-chips popular">{popularSearches.map((item) => <Chip key={item} onClick={() => searchFor(item)}>{item}</Chip>)}</div></section>
    </div> : <section className="search-results">
      <div className="menu-count"><span>{results.data?.length ?? 0} matches for “{debouncedQuery}”</span><i /></div>
      {results.isPending ? <div className="product-grid">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="product-skeleton" />)}</div> : results.isError ? <ErrorState retry={() => void results.refetch()} /> : results.data?.length ? <div className="product-grid">{results.data.map((product) => <ProductCard key={product.id} product={product} {...action(product.id)} />)}</div> : <EmptyState title="No tasty matches" message="Try paneer, cheese, veg, spicy, shake, combo or under 200." />}
    </section>}
  </div>
}
