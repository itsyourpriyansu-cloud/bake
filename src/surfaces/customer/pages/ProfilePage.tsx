import { ArrowRight, Bell, CakeSlice, Heart, Home, LogOut, MessageCircle, Salad, ScanLine, ShoppingBag, UsersRound, Waves } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDemo } from '../../../app/providers/DemoProvider'
import { useCustomerProfile, useNotifications } from '../../../features/customer/hooks/useCustomerExperience'
import { api } from '../../../services/api'
import { ErrorState, Skeleton } from '../../../shared/components'
import { CustomerPageHeader } from '../components/Stage5Ui'

const links = [
  { to: '/app/wave-id', label: 'My Wave ID', detail: 'Link in-store orders', icon: ScanLine },
  { to: '/app/profile/preferences', label: 'Food Preferences', detail: 'Taste, diet and ingredients', icon: Salad },
  { to: '/app/profile/addresses', label: 'Addresses', detail: 'Home · CT Road', icon: Home },
  { to: '/app/family', label: 'Family', detail: '3 taste profiles', icon: UsersRound },
  { to: '/app/celebrations', label: 'Celebrations', detail: 'Never miss a pizza moment', icon: CakeSlice },
  { to: '/app/saved-orders', label: 'Saved Orders', detail: 'My Usual and more', icon: ShoppingBag },
  { to: '/app/favourites', label: 'Favourites', detail: 'Products and combinations', icon: Heart },
  { to: '/app/profile/notifications', label: 'Notifications', detail: 'Updates and preferences', icon: Bell },
  { to: '/app/support', label: 'Help & Support', detail: 'Guided help, no waiting', icon: MessageCircle },
]

export default function ProfilePage() {
  const profile = useCustomerProfile(); const notifications = useNotifications(); const demo = useDemo(); const navigate = useNavigate()
  if (profile.isError) return <div className="stage5-page"><ErrorState retry={() => void profile.refetch()} /></div>
  if (!profile.data) return <div className="stage5-page"><Skeleton className="profile-skeleton" /></div>
  const unread = notifications.data?.filter((item) => !item.read).length ?? 0
  const logout = async () => { await api.auth.logoutCustomer(); await demo.setCustomerLoggedIn(false); navigate('/app/') }
  return <div className="stage5-page profile-page"><CustomerPageHeader eyebrow="YOUR PIZZA WAVE" title="You" />
    <section className="profile-hero"><div className="profile-avatar">P</div><div><span>WELCOME BACK</span><h2>{profile.data.firstName}</h2><p>{profile.data.maskedPhone}</p></div><Waves /></section>
    <Link className="profile-gold-card" to="/app/rewards"><i><Waves /></i><span><small>GOLD WAVE</small><strong>{profile.data.pointsAvailable} points</strong><em>{profile.data.pointsPending} pending · 4% back</em></span><ArrowRight /></Link>
    <div className="profile-links">{links.map(({ to, label, detail, icon: Icon }) => <Link to={to} key={to}><i><Icon /></i><span><strong>{label}</strong><small>{detail}</small></span>{label === 'Notifications' && unread > 0 && <b>{unread}</b>}<ArrowRight /></Link>)}</div>
    <button className="logout-button" onClick={() => void logout()}><LogOut /> LOG OUT OF CUSTOMER WAVE</button>
    <p className="profile-demo-note">Prototype account · No real payment or messaging credentials are stored.</p>
  </div>
}
