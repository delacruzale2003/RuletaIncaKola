import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import ExitPage from './pages/ExitPage';
import Tienda from './pages/Tiendas';
import Home from './pages/Home'; 
 // <--- 1. Importa tu nuevo componente
import './App.css';
import Registross from './pages/Registros';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Ruta Raíz */}
        <Route path="/" element={<Home />} />

        {/* 2. Ruta de Configuración / Selección de Tienda */}
        <Route path="/tiendas" element={<Tienda />} />

        {/* 3. Ruta de Salida */}
        <Route path="/exit" element={<ExitPage />} />

        {/* 4. Ruta de Visualización de Registros 
             IMPORTANTE: Debe ir antes que /:storeId 
        */}
        <Route path="/registros" element={<Registross />} />

        {/* 5. Ruta Dinámica con storeId: 
             Cualquier texto que no sea 'tiendas', 'exit' o 'registros'
             será interpretado como un ID de tienda.
        */}
        <Route path="/:storeId" element={<RegisterPage />} />

        {/* 6. Redirección de seguridad */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;