import { ArrowLeft, Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
export default function TeamPage() { return <main className="reserved-page"><Construction /><span>RESERVED SURFACE</span><h1>Team access is<br />not available yet.</h1><p>This route is held for the future staff RBAC experience.</p><Link className="button button-secondary" to="/"><ArrowLeft /> BACK HOME</Link></main> }
