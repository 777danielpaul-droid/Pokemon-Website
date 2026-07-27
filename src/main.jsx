import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class EB extends React.Component {
  constructor(p){ super(p); this.state = { err: null } }
  static getDerivedStateFromError(err){ return { err } }
  componentDidCatch(err, info){ console.log('CAUGHT:', err && err.stack, info && info.componentStack) }
  render(){
    if (this.state.err) return <pre style={{color:'#f88',padding:20,whiteSpace:'pre-wrap'}}>{String(this.state.err.stack||this.state.err)}</pre>
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EB><App /></EB>
  </React.StrictMode>,
)
