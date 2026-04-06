import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Playground from './pages/playground'
import LandingPage from './pages/landingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/playground/:roomId" element={<Playground />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
