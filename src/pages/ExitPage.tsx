import React from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin } from 'lucide-react'; 
// IMPORTANTE: Asegúrate de importar tu fondo animado
import BackgroundCC from "../components/BackgroundCC";

const ExitPage: React.FC = () => {
    const location = useLocation();
    
    // Recuperamos datos del state
    const { prizeName, storeId, storeName } = location.state || {}; 

    // Lógica para generar el nombre de la imagen:
    // "Ultra Bocina" -> "ultra_bocina" -> "/ultra_bocina.png"
    const getPrizeImage = (name: string) => {
        if (!name) return null;
        const formattedName = name.trim().toLowerCase().replace(/\s+/g, '_');
        return `/${formattedName}.png`;
    };

    const prizeImage = getPrizeImage(prizeName);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-3 overscroll-y-none relative font-sans text-center overflow-hidden">
            
            {/* 1. FONDO ANIMADO */}
            <div className="absolute inset-0 z-0">
                <BackgroundCC />
            </div>

            <div className="z-10 w-[95%] max-w-xs sm:max-w-sm flex flex-col items-center animate-fade-in-up">
                
                {/* LOGO */}
                <img
                    src="/logoik.png"
                    alt="Logo "
                    className="w-27 sm:w-26 h-auto mb-0 " 
                />
                
                {/* TEXTO DE CABECERA */}
                <div className="mb-3">
                   
                    
                </div>

                {/* IMAGEN DEL PREMIO */}
                {prizeName && prizeImage ? (
                    <div className="mb-8 relative">
                        {/* Efecto de resplandor detrás del premio */}
                        <div className="absolute inset-0 blur-[60px] opacity-20 rounded-full animate-pulse"></div>
                        <img 
                            src={prizeImage} 
                            alt={prizeName}
                            className="w-69 h-auto object-contain mx-auto relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-500 ease-out"
                        />
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-white/50 italic mb-4">
                        Imagen no disponible
                    </div>
                )}

                {/* NOMBRE DEL PREMIO (Estilo Pill Neón) 
                {prizeName && (
                    <div 
                        className="font-teko text-3xl text-white uppercase py-2 px-10 rounded-full mb-8  bg-black/40 backdrop-blur-sm border-2 border-[#a2e71a]"
                        style={{
                            boxShadow: '0 0 20px rgba(162, 231, 26, 0.4), inset 0 0 10px rgba(162, 231, 26, 0.2)',
                            textShadow: '0 0 10px rgba(162, 231, 26, 0.8)'
                        }}
                    >
                        {prizeName}
                    </div>
                )}
                    */}
                
                
                {/* INDICADOR DE TIENDA (Discreto) */}
                {storeId && (
                    
                   
                    <div className="flex items-center gap-1 text-white/40 mt-8">
                        <MapPin size={10} />
                        <span className="text-[9px] font-medium tracking-widest uppercase">
                            {storeName || `Tienda: ${storeId.substring(0, 8)}...`}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExitPage;