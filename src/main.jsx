import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { UserProvider } from './context/UserContext.jsx'
import { PortfolioProvider } from './portfolio/context/PortfolioContext.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <PortfolioProvider>
        <App />
      </PortfolioProvider>
    </UserProvider>

  </React.StrictMode>,
)
