import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { BakeryLogo } from '../components/BakeryUi'

export default function BakeryRouteErrorPage({ notFound: forcedNotFound = false }: { notFound?: boolean }) {
  const error = useRouteError()
  const notFound = forcedNotFound || (isRouteErrorResponse(error) && error.status === 404)

  return <main className="bakery-route-error">
    <Link className="bakery-route-error-logo" to="/bakery"><BakeryLogo /></Link>
    <section>
      <AlertTriangle />
      <span className="bakery-kicker">{notFound ? 'PAGE NOT FOUND' : 'THE OVEN HIT A SNAG'}</span>
      <h1>{notFound ? 'THAT PAGE ISN’T ON THE MENU.' : 'LET’S WARM THAT PAGE AGAIN.'}</h1>
      <p>{notFound ? 'The link may have changed. Your bakery box and saved demo data are still safe.' : 'Nothing has been removed. Refresh the bakery experience or return to its home screen.'}</p>
      <div>
        {!notFound && <button className="bakery-button primary" type="button" onClick={() => window.location.reload()}><RefreshCw /> TRY AGAIN</button>}
        <Link className="bakery-button secondary" to="/bakery/app/"><ArrowLeft /> BAKERY HOME</Link>
      </div>
    </section>
  </main>
}
