import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom"; 
import { useRegistration } from "../hooks/useRegistration";
import { MapPin, Check, X } from 'lucide-react';
// IMPORTANTE: Asegúrate de que la ruta sea correcta según tu estructura de carpetas
import BackgroundCC from "../components/BackgroundCC";

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { storeId: paramStoreId } = useParams<{ storeId: string }>(); 
    const [searchParams] = useSearchParams();
    
    // Estados de UI
    const [showRegisterModal, setShowRegisterModal] = useState(false); 
    const [showTermsModal, setShowTermsModal] = useState(true); 
    const [showGif, setShowGif] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    // NUEVO ESTADO: Contador
    const [countdown, setCountdown] = useState<number | null>(null);

    // El check ya empieza MARCADO
    const [termsAccepted, setTermsAccepted] = useState(true);

    const activeStoreId = paramStoreId || searchParams.get("store");

    const { 
        loading, 
        message, 
        handleSpin, 
        storeName,
        name, setName,
        phone, setPhone,  
        dni, setDni,    // <--- AÑADIDO: Traemos el estado del hook
        voucher, setVoucher 
    } = useRegistration();

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validaciones básicas de existencia
        if (!name || !phone || !voucher || !dni || !termsAccepted) {
            alert("Por favor completa todos los campos y acepta los términos.");
            return;
        }

        // 2. Validar longitud de DNI (9 dígitos exactos)


        // 2. Validar formato de DNI (8 o 9 dígitos numéricos)
        const dniRegex = /^\d{8,9}$/;
        if (!dniRegex.test(dni)) {
            alert("Formato de DNI inválido (debe tener 8 o 9 dígitos).");
            return;
        }

        // 3. Validar longitud de Teléfono (9 dígitos exactos)
        if (phone.length < 9) {
            alert("El teléfono debe tener 9 dígitos.");
            return;
        }

        setShowRegisterModal(false);
        setIsRegistered(true);
    };

    // Helper para pausar la ejecución
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const onSpinClick = async () => {
    // 1. Bloqueo inmediato: Si ya está cargando, o el GIF está activo, o no está registrado, salimos.
    if (loading || showGif || countdown !== null || !isRegistered || !activeStoreId) {
        if (!isRegistered && !loading && !showGif) setShowRegisterModal(true);
        return;
    }

    // --- MAGIA UX: Iniciamos el GIF y el contador INMEDIATAMENTE ---
    setShowGif(true);
    setCountdown(5);

    let currentCount = 5;
    const timer = setInterval(() => {
        currentCount -= 1;
        if (currentCount > 0) {
            setCountdown(currentCount);
        } else {
            setCountdown(0);
        }
    }, 1000);

    try {
        const result = await handleSpin();

        if (result.success && result.prizeName) {
            // Esperar a que el contador visual termine
            if (currentCount > 0) {
                await wait(currentCount * 1000);
            } else {
                await wait(1000); 
            }
            
            clearInterval(timer);
            
            navigate('/exit', {
                state: { 
                    prizeName: result.prizeName, 
                    registerId: result.registerId,
                    isAnonymous: false,
                    storeId: activeStoreId 
                },
            });
        } else {
            // AQUÍ MANEJAMOS EL ERROR (DNI duplicado, sin stock, etc.)
            clearInterval(timer);
            setShowGif(false);
            setCountdown(null);
            // El mensaje de error ya viene del hook 'message', 
            // pero forzamos un reset del estado de registro si el error es de "ya participó"
            if (message?.toLowerCase().includes("ya participó") || message?.toLowerCase().includes("registrado")) {
                setIsRegistered(false); // Obliga a revisar sus datos
            }
        }
    } catch (error) {
        clearInterval(timer);
        setShowGif(false);
        setCountdown(null);
    }
};

    return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
        
        {/* 1. FONDO PRINCIPAL (RULETA) */}
        <div className="absolute inset-0 z-0">
            <BackgroundCC />
        </div>

        {/* --- PRE-CARGA DEL GIF PARA EVITAR PARPADEOS --- */}
        <link rel="preload" as="image" href="/ruletaik.gif" />

        <img src="/logoik.png" alt="logo" className="w-31 h-auto mb-6 z-10 drop-shadow-md relative" />

        {/* === CONTENEDOR DE LA RULETA === */}
        <div className={`relative z-10 w-76 h-76 sm:w-96 sm:h-96 flex items-center justify-center transition-opacity duration-500 ${!isRegistered ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
            
            {/* === FLECHA === */}
            <div className="absolute -bottom-11 left-1/2 transform -translate-x-1/2  z-30 pointer-events-none">
                <img src="/arrow.png" alt="Flecha Ganadora" className="w-11 h-11 object-contain drop-shadow-2xl"/>
            </div>

            {/* === RULETA (Con el nuevo GIF) === */}
            <img 
                src={showGif ? "/ruletaik.gif" : "/ruletaik.png"} 
                alt="Ruleta" 
                className="w-full h-full object-contain drop-shadow-2xl"
            />
        </div>

        {/* === NAVBAR INFERIOR === */}
        <div className="z-20 mt-10 flex flex-col items-center gap-2 relative">
            <div className="flex items-center gap-1">
                
<button 
    onClick={onSpinClick} 
    // Añadimos 'loading' a las condiciones de disabled
    disabled={showGif || loading || !isRegistered || countdown !== null}
    className={`
        flex items-center px-8 py-2 rounded-full text-black transform transition-all border-2 border-transparent min-w-[200px] justify-center
        ${(showGif || loading || countdown !== null) 
            ? 'grayscale opacity-50 cursor-wait scale-95' // Cambio visual claro de "bloqueado"
            : 'hover:brightness-110 active:scale-95' 
        }
    `}
>
    <span className="text-xl tracking-tight font-arponaBold text-white uppercase border-2 border-transparent px-7 rounded-full py-1 bg-[#1C3F8C] whitespace-nowrap">
        {loading ? "Verificando..." : (countdown !== null ? (countdown > 0 ? countdown : "Suerte...") : "Juega Aquí")}
    </span>
</button>
            </div>

            {activeStoreId && (
                <div className="flex items-center gap-1 text-black/80 mt-1 animate-fade-in">
                    <MapPin size={12} className="text-black" />
                    <span className="text-xs font-medium tracking-wide uppercase">
                        {storeName || `Tienda: ${activeStoreId}`}
                    </span>
                </div>
            )}
        </div>

        {message && (
            <div className="mt-4 z-20 bg-black/90 text-red-600 px-4 py-2 rounded-lg font-bold shadow-lg text-center mx-4 max-w-xs text-sm relative">
                {message}
            </div>
        )}
        
        {/* ======================================= */}
        {/* 2. MODAL DE REGISTRO (FORMULARIO)       */}
        {/* ======================================= */}
        {showRegisterModal && (
            <div className="fixed inset-0 z-50 p-4 animate-fade-in overflow-y-auto flex items-center justify-center">
                
                {/* 2. FONDO DEL MODAL REGISTRO */}
                <div className="absolute inset-0 z-0">
                    <BackgroundCC />
                </div>
                
                {/* Contenedor Flex */}
                <div className="flex flex-col items-center justify-center w-full mt-20 mb-10 relative z-10">
                    
                    <div className="bg-transparent border-2 border-[#1C3F8C] font-arponaBold rounded-3xl p-4 w-auto shadow-2xl relative">
                        
                        {/* --- LOGO --- */}
                        <div className="absolute -top-42 left-1/2 transform -translate-x-1/2 z-20 w-full flex justify-center">
                            <img 
                                src="/logoik.png" 
                                alt="Logo IncaKola" 
                                className="w-34 md:w-31 h-auto" 
                            />
                        </div>

                        {/* Cabecera */}
                        <div className="text-left mb-2 mt-0">
                            <h2 className="text-[29px] text-[#1C3F8C] font-mont-extrabold  mb-0 tracking-tight font-arponaBold">REGÍSTRATE</h2>
                            <p className="text-[#1C3F8C] text-[15px] text-left  mb-3 leading-3 font-arponaBold">Llena tus datos y participa por<br/> fabulosos premios</p>
                        </div>

                        {/* FORMULARIO */}
                        <form id="register-form" onSubmit={handleRegisterSubmit} className="space-y-2 text-start">
    
                            {/* Input Nombre */}
                            <div>
                                <label className="block text-[#1C3F8C] text-[13px] font-bold mb-0 ">Nombres y apellidos</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-76 px-3 py-1 bg-white border border-[#1C3F8C] border-2 rounded-full text-[#1C3F8C] text-sm focus:outline-none"
                                />
                            </div>

                            {/* Input DNI (VALIDADO Y AÑADIDO) */}
                            <div>
                                <label className="block text-[#1C3F8C] text-[13px] font-bold mb-0 ">DNI</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))} // Solo números
                                    maxLength={9}
                                    required
                                    className="w-76 px-3 py-1 bg-white border border-[#1C3F8C] border-2 rounded-full text-[#1C3F8C] text-sm focus:outline-none"
                                />
                            </div>

                            {/* Input Teléfono */}
                            <div>
                                <label className="block text-[#1C3F8C] text-[13px] font-bold mb-0 ">Teléfono</label>
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Solo números
                                    maxLength={9}
                                    required
                                    className="w-76 px-3 py-1 bg-white border border-[#1C3F8C] border-2 rounded-full text-[#1C3F8C] text-sm focus:outline-none"
                                />
                            </div>

                            {/* Input Foto Voucher */}
                            <div>
                                <label className="block text-[#1C3F8C] text-[13px] font-bold mb-0 ">Foto de Voucher</label>
                                <label className="cursor-pointer border-[#1C3F8C] bg-white flex items-center justify-left gap-2 w-76 px-3 py-1 border-2 rounded-full text-[#1C3F8C] text-sm font-arponaBold hover:bg-[#1C3F8C] hover:text-white transition-all shadow-[0_0_10px_rgba(162,231,26,0.3)] active:scale-95">
                                    
                                    {voucher ? "ARCHIVO SELECCIONADO" : "SELECCIONAR ARCHIVO"}
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setVoucher(e.target.files[0]);
                                            }
                                        }}
                                        required
                                    />
                                </label>
                            </div>

                            {/* CHECKBOX TÉRMINOS */}
                            <div className="flex items-start gap-2 mt-4 px-2 max-w-[288px]">
                                <div className="relative flex items-center pt-1">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-black bg-transparent transition-all checked:bg-[#1C3F8C] checked:border-black"
                                    />
                                    <div className="pointer-events-none absolute top-1 left-0 text-white opacity-0 peer-checked:opacity-100 flex items-center justify-center w-4 h-4">
                                        <Check size={12}  />
                                    </div>
                                </div>
                                <label htmlFor="terms" className="mt-1 text-[10px] text-gray-900 cursor-pointer select-none leading-tight">
                                    Acepto los <span 
                                        onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                                        className="text-[#1C3F8C] underline font-bold cursor-pointer"
                                    >términos y condiciones</span> 
                                </label>
                            </div>
                        </form>
                    </div>

                    {/* BOTÓN FUERA DE LA CAJA */}
                    <button
                        type="submit"
                        form="register-form"
                        disabled={!termsAccepted}
                        className={`w-48 mt-10 py-1 rounded-full text-white bg-[#1C3F8C] font-arponaBold text-2xl shadow-lg border-2 border-[#1C3F8C] transition-all active:scale-95 
                            ${termsAccepted 
                                ? 'hover:brightness-110 shadow-[0_0_20px_rgba(101,199,195,0.4)]' 
                                : 'opacity-40 cursor-not-allowed grayscale'
                            }
                        `}
                    >
                        ENVIAR
                    </button>

                </div>
            </div>
        )}

        {/* --- MODAL DE TÉRMINOS --- */}
        {showTermsModal && (
            <div className="fixed inset-0 z-[60] p-2 animate-fade-in flex flex-col items-center justify-center">
                
                <div className="absolute inset-0 z-0">
                    <BackgroundCC />
                </div>

                <img 
                    src="/logoik.png" 
                    alt="Logo" 
                    className="w-30 h-auto mb-10 z-10 relative drop-shadow-lg"
                />

                <div className="bg-transparent border-2 border-[#1C3F8C] rounded-3xl p-4
                px-5 max-w-md w-full relative shadow-[0_0_30px_rgba(162,231,26,0.2)] z-10">
                    <button 
                        onClick={() => {
                            setShowTermsModal(false); 
                            setShowRegisterModal(true);
                        }}
                        className="absolute top-4 right-4 text-[#1C3F8C] hover:scale-110 transition-transform border-2 border-[#1C3F8C] rounded-full "
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                    
                    <br />
                    
                    <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar py-3">
                        <p className="text-[#1C3F8C] text-xs leading-3.5 font-markpro text-justify font-light">
                            <strong>Promoción válida a nivel nacional del 16 de febrero al 24 de abril de 2026</strong> , o hasta agotar stock de premios, lo que ocurra primero. Mecánica:  Participan personas naturales mayores de 18 años, con residencia legal y domicilio en el territorio nacional del Perú, que realice la compra según el canal en el que se encuentre : 
                            <br />
                            AASS (Autoservicios), Por la compra de S/ 15 en Inca Kola, CSTORES (Tiendas de conveniencia), Por la compra de 2 Inca Kolas,QSR(Quick Service Restaurants) Por la compra de combos con Inca Kola, CINES ,Por la compra de tu combo con Inca Kola, podrás participar del juego y ganar premios al instante. 
                            <br /><br />
                            Para jugar  en la Activación IK - DESTAPA UN VIAJE CON SABOR, deberás ingresar a la landing page escaneando el código QR , llenar tus datos y subir la foto de tu boucher de compra  . Entrarás automaticamente al sorteo de diferentes premios. El horario para ingresar a la landing page será de acuerdo a los horarios de activación del local a realizar  
                            <br />
                            <br />
                            <strong>Los premios son Tote Bags , Lentes, Mesa , Polo, Puff, Toalla, Vaso, Audifonos y Speakers.</strong>
                            <br /><br />
                            <strong>Modalidad de entrega de premios:</strong> Los premios se entregarán en al área de activación de la marca del local a implementar , deberá mostrarse la pantalla de premio y el boucher de compra al personal de activación para registrar y entregar el premio .
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
};

export default RegisterPage;