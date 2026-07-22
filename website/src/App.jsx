import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Docs from './pages/Docs'
import Architecture from './pages/Architecture'
import Development from './pages/Development'
import Research from './pages/Research'

function App() {
  return (
    <BrowserRouter basename="/Orion">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/docs/architecture" element={<Architecture />} />
          <Route path="/docs/development" element={<Development />} />
          <Route path="/docs/research" element={<Research />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
