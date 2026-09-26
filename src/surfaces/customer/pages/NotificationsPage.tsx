import { Bell, Check, Clock3, Gift, PackageCheck, Sparkles } from 'lucide-react'
import { useCustomerExperienceActions, useCustomerProfile, useNotifications } from '../../../features/customer/hooks/useCustomerExperience'
import { ErrorState, Skeleton, Switch } from '../../../shared/components'
import { CustomerPageHeader, formatOrderDate } from '../components/Stage5Ui'

const iconMap = { ORDER: PackageCheck, ETA: Clock3, POINTS: Sparkles, REWARD: Gift, SYSTEM: Bell }

export default function NotificationsPage() {
  const notifications = useNotifications(); const profile = useCustomerProfile(); const actions = useCustomerExperienceActions()
  if (notifications.isError || profile.isError) return <div className="stage5-page"><ErrorState retry={() => { void notifications.refetch(); void profile.refetch() }} /></div>
  return <div className="stage5-page notifications-page"><CustomerPageHeader eyebrow="STAY IN THE LOOP" title="Notifications" back="/app/profile" />
    {!notifications.data || !profile.data ? <Skeleton className="notifications-skeleton" /> : <><section className="notification-feed"><div className="section-heading"><div><span>RECENT</span><h2>From The Pizza Wave</h2></div></div>{notifications.data.map((item) => { const Icon = iconMap[item.kind]; return <button className={item.read ? 'read' : ''} key={item.id} onClick={() => actions.markNotificationRead.mutate(item.id)}><i><Icon /></i><span><strong>{item.title}</strong><p>{item.message}</p><small>{formatOrderDate(item.createdAt)}</small></span>{!item.read && <b>NEW</b>}{item.read && <Check />}</button> })}</section>
      <section className="notification-settings"><span>WHAT YOU RECEIVE</span><h2>Notification preferences</h2><p>Prototype controls only—no real WhatsApp, SMS or push messages are sent.</p>{Object.entries(profile.data.notificationPreferences).map(([key, value]) => <Switch key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())} checked={value} onChange={(checked) => actions.saveNotificationPreferences.mutate({ [key]: checked })} />)}</section></>}
  </div>
}
