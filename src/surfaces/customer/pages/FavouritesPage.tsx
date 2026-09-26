import { Heart, PackagePlus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart, useCartActions } from '../../../features/cart/hooks/useCart'
import { useMenu } from '../../../features/catalog/hooks/useCatalog'
import { useCustomerExperienceActions, useFavourites } from '../../../features/customer/hooks/useCustomerExperience'
import { ProductCard } from '../../../features/product/components/ProductCard'
import { EmptyState, ErrorState, Skeleton } from '../../../shared/components'
import { CustomerPageHeader, MiniProductArt } from '../components/Stage5Ui'

export default function FavouritesPage() {
  const favourites = useFavourites(); const menu = useMenu(); const cart = useCart(); const cartActions = useCartActions(); const actions = useCustomerExperienceActions(); const navigate = useNavigate()
  if (favourites.isError || menu.isError) return <div className="stage5-page"><ErrorState retry={() => { void favourites.refetch(); void menu.refetch() }} /></div>
  const productFavourites = favourites.data?.filter((item) => item.kind === 'PRODUCT').flatMap((favourite) => { const product = menu.data?.products.find((item) => item.id === favourite.productId); return product ? [{ favourite, product }] : [] }) ?? []
  const combinations = favourites.data?.filter((item) => item.kind === 'COMBINATION') ?? []
  const nameFor = (productId: string) => menu.data?.products.find((product) => product.id === productId)?.name ?? productId.replace(/-001$/, '').replaceAll('-', ' ')
  const addCombination = async (items: typeof combinations[number]['items']) => { for (const item of items ?? []) await cartActions.add.mutateAsync(item); navigate('/app/cart') }
  return <div className="stage5-page favourites-page"><CustomerPageHeader eyebrow="LOVED BY YOU" title="Favourites" back="/app/profile" />
    {favourites.isPending || menu.isPending ? <Skeleton className="favourites-skeleton" /> : favourites.data?.length ? <><section><div className="section-heading"><div><span>PRODUCTS</span><h2>Your top picks</h2></div></div><div className="favourite-grid">{productFavourites.map(({ favourite, product }) => { const item = cart.data?.items.find((row) => row.productId === product.id); return <div className="favourite-product" key={favourite.id}><ProductCard product={product} cartItem={item} onAdd={() => cartActions.add.mutate(product.id)} onQuantity={(quantity) => item && cartActions.update.mutate({ id: item.id, quantity })} /><button className="favourite-remove" aria-label={`Remove ${favourite.name} from favourites`} onClick={() => actions.deleteFavourite.mutate(favourite.id)}><Heart fill="currentColor" /></button></div> })}</div></section>
      <section><div className="section-heading"><div><span>COMBINATIONS</span><h2>Saved your way</h2></div></div>{combinations.map((combo) => <article className="favourite-combo" key={combo.id}><i><Heart fill="currentColor" /></i><div><strong>{combo.name}</strong><span>{combo.items?.map((item) => `${item.quantity}× ${nameFor(item.productId)}`).join(' · ')}</span><div className="combo-art-row">{combo.items?.map((item) => <MiniProductArt key={item.productId} productId={item.productId} name={nameFor(item.productId)} />)}</div></div><button className="icon-button" aria-label={`Add ${combo.name}`} onClick={() => void addCombination(combo.items)}><PackagePlus /></button><button className="text-delete" onClick={() => actions.deleteFavourite.mutate(combo.id)}><Trash2 /> Remove</button></article>)}</section></> : <EmptyState title="No favourites yet" message="Tap the heart on food you love and it will wait for you here." />}
  </div>
}
