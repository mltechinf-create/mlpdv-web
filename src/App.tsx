import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import Produtos from './pages/Produtos'
import Clientes from './pages/Clientes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registro" element={<Registro />} />
        <Route path="/:cnpj" element={<Login />} />
        <Route path="/:cnpj/dashboard" element={<Dashboard />} />
        <Route path="/:cnpj/produtos" element={<Produtos />} />
        <Route path="/:cnpj/clientes" element={<Clientes />} />
        <Route path="/" element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#006669] to-[#00A5AB] p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">ML PDV Web</h1>
              <p className="text-gray-500 mb-6">Painel administrativo para gerenciar sua empresa</p>
              <a href="/registro" className="block w-full bg-[#006669] hover:bg-[#004d4f] text-white font-semibold py-3 rounded-lg transition mb-3">
                Cadastrar Empresa
              </a>
              <p className="text-sm text-gray-400">Já tem cadastro? Acesse via /SEU_CNPJ</p>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
