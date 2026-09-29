import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/lilita-one/400.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/geist/400.css'
import '@fontsource/geist/500.css'
import '@fontsource/geist/600.css'
import '@fontsource/geist/700.css'
import './styles/globals.css'
import './styles/bakery.css'
import './styles/bakery-operations.css'
import './styles/bakery-home.css'
import { AppProviders } from './app/providers/AppProviders'
import { AppRouter } from './app/router/AppRouter'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AppProviders><AppRouter /></AppProviders></React.StrictMode>,
)
