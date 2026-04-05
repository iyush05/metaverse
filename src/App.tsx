import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Playground from './pages/playground'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<>Hi there</>} />
        <Route path="/playground/:roomId" element={<Playground />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
