import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Settings, Menu, Lock } from 'lucide-react';
import BackgroundCC from "../components/BackgroundCC";

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { storeId: paramStoreId } = useParams<{ storeId: string }>();
    const [searchParams] = useSearchParams();

    // --- ESTADOS PARA LOGIN ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const activeStoreId = paramStoreId || searchParams.get("store");

    // --- LÓGICA DE LOGIN ---
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === "admin" && password === "admin123") {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Credenciales incorrectas");
        }
    };

    // --- NAVEGACIÓN ---
    const goToStores = () => {
        if (activeStoreId) {
            navigate(`/tiendas?store=${activeStoreId}`);
        } else {
            navigate('/tiendas');
        }
    };

    const goToRegistros = () => {
        navigate('/registros'); 
    };

    // --- ESTILOS ---
    const neonColor = '#ffcf2a';

    const neonCircleStyle = {
        backgroundColor: 'transparent',
        
        
    };

    const inputStyle = "w-full px-4 py-2 bg-white border border-white/30 rounded-full text-black placeholder-gray-400 focus:outline-none  focus:ring-1  transition-all text-center";

    return (
        <div className="relative min-h-[100dvh] flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
            
            <BackgroundCC />

            {/* LOGO SIEMPRE VISIBLE (Un poco más pequeño en login para dar espacio) */}
            <div className={`flex items-center justify-center w-full transition-all duration-500 ${isAuthenticated ? 'flex-1' : 'mb-8'}`}>
                <img 
                    src="/amadeus_schweppeslogo.png" 
                    alt="amadeus schweppes logo" 
                    className={`h-auto transition-all duration-500 ${isAuthenticated ? 'w-48 sm:w-64' : 'w-32 sm:w-40'}`} 
                />
            </div>

            {/* --- CONTENIDO CONDICIONAL --- */}
            {!isAuthenticated ? (
                // === VISTA DE LOGIN ===
                <div className="z-20 w-full max-w-xs animate-fade-in">
                    <form 
                        onSubmit={handleLogin}
                        className="bg-transparent  p-8 rounded-3xl flex flex-col gap-4"
                        
                    >
                        <div className="flex justify-center mb-2">
                            <div className="p-3 rounded-full r  bg-black/50">
                                <Lock size={24} color={neonColor} />
                            </div>
                        </div>

                        <h2 className="text-white text-center text-xl font-bold tracking-widest mb-2">ACCESO </h2>

                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Usuario" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={inputStyle}
                            />
                            <input 
                                type="password" 
                                placeholder="Contraseña" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputStyle}
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs text-center font-bold animate-pulse">
                                {error}
                            </p>
                        )}

                        <button 
                            type="submit"
                            className="w-full py-2 border-2 border-black rounded-full font-bold text-black mt-2 tracking-widest hover:brightness-110 active:scale-95 transition-transform "
                            
                        >
                            ENTRAR
                        </button>
                    </form>
                </div>
            ) : (
                // === VISTA DE MENÚ (Una vez logueado) ===
                <div 
                    className="fixed bottom-0 left-0 w-full flex justify-center items-center gap-10 px-4 z-50 animate-fade-in-up"
                    style={{ 
                        paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 20px)' 
                    }}
                >
                    {/* Botón de Registros */}
                    <button
                        onClick={goToRegistros}
                        style={neonCircleStyle}
                        className="flex items-center justify-center w-16 h-16 rounded-full transform transition-all active:scale-90 hover:scale-105 bg-black/20 backdrop-blur-sm"
                        title="Registros"
                    >
                        <Menu size={32} className="text-white" />
                    </button>

                    {/* Botón de Configuración */}
                    <button
                        onClick={goToStores}
                        style={neonCircleStyle}
                        className="flex items-center justify-center w-16 h-16 rounded-full transform transition-all active:scale-90 hover:scale-105 bg-black/20 backdrop-blur-sm"
                        title="Configuración"
                    >
                        <Settings size={32} className="text-white" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Home;