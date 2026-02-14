import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom"; 
import { useRegistration } from "../hooks/useRegistration";
import {  MapPin, Check, X } from 'lucide-react';
// IMPORTANTE: Asegúrate de que la ruta sea correcta según tu estructura de carpetas
import BackgroundCC from "../components/BackgroundCC";

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { storeId: paramStoreId } = useParams<{ storeId: string }>(); 
    const [searchParams] = useSearchParams();
    
    // Estados de UI
    // El registro empieza OCULTO
const [showRegisterModal, setShowRegisterModal] = useState(false); 

// Los términos empiezan VISIBLES
const [showTermsModal, setShowTermsModal] = useState(true); 

const [showGif, setShowGif] = useState(false);
const [isRegistered, setIsRegistered] = useState(false);

// El check ya empieza MARCADO (porque se asume que leerá el modal que sale primero)
const [termsAccepted, setTermsAccepted] = useState(true);

    // ELIMINADOS LOS ESTADOS LOCALES DE PHONE Y VOUCHER PARA USAR LOS DEL HOOK
    // const [phone, setPhone] = useState(''); 
    // const [voucher, setVoucher] = useState<File | null>(null);

    const activeStoreId = paramStoreId || searchParams.get("store");

    const { 
        loading, 
        message, 
        handleSpin, 
        storeName,
        name, setName,
        phone, setPhone,      // <--- AÑADIDO: Traemos el estado del hook
        voucher, setVoucher   // <--- AÑADIDO: Traemos el estado del hook
    } = useRegistration();

    // const goToStores = () => {
    //     if (activeStoreId) {
    //         navigate(`/tiendas?store=${activeStoreId}`);
    //     } else {
    //         navigate('/tiendas');
    //     }
    // };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validaciones básicas
        if (!name || !phone || !voucher || !termsAccepted) {
            alert("Por favor completa todos los campos y acepta los términos.");
            return;
        }

        // 2. Validar longitud de Teléfono
        if (phone.length < 9) {
            alert("El teléfono debe tener al menos 9 dígitos");
            return;
        }

        //console.log("Datos de registro:", { name, phone, voucher });

        setShowRegisterModal(false);
        setIsRegistered(true);
    };

    const onSpinClick = async () => {
        if (showGif || loading || !activeStoreId || !isRegistered) {
            if (!isRegistered && !loading && !showGif) setShowRegisterModal(true);
            return;
        }

        const result = await handleSpin();

        if (result.success && result.prizeName) {
            setShowGif(true);
            setTimeout(() => {
                navigate('/exit', {
                    state: { 
                        prizeName: result.prizeName, 
                        registerId: result.registerId,
                        isAnonymous: false,
                        storeId: activeStoreId 
                    },
                });
            }, 4000); 
        } 
    };

   
    
    return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
        
        {/* 1. FONDO PRINCIPAL (RULETA) */}
        <div className="absolute inset-0 z-0">
            <BackgroundCC />
        </div>

        <img src="/logoik.png" alt="logo" className="w-31 h-auto mb-6 z-10 drop-shadow-md relative" />

        {/* === CONTENEDOR DE LA RULETA === */}
        <div className={`relative z-10 w-76 h-76 sm:w-96 sm:h-96 flex items-center justify-center transition-opacity duration-500 ${!isRegistered ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
    
    {/* === FLECHA (Ahora abajo y volteada) === */}
    <div className="absolute -bottom-11 left-1/2 transform -translate-x-1/2  z-30 pointer-events-none">
        <img src="/arrow.png" alt="Flecha Ganadora" className="w-11 h-11 object-contain drop-shadow-2xl"/>
    </div>

    {/* === RULETA (Con el nuevo GIF) === */}
    <img 
        src={showGif ? "/ruletaik.gif" : "/ruletaik.png"} 
        alt="Ruleta" 
        className="w-full h-full object-contain drop-shadow-2xl"
    />

    {/* Se eliminó el botón central (GO) que estaba aquí */}
</div>

{/* === NAVBAR INFERIOR === */}
<div className="z-20 mt-10 flex flex-col items-center gap-2 relative">
    <div className="flex items-center gap-1">
        <button 
            onClick={onSpinClick} 
            disabled={showGif || loading || !activeStoreId || !isRegistered}
            className={`
                flex items-center px-8 py-2 rounded-full text-black transform transition-all border-2 border-transparent
                ${showGif || loading || !activeStoreId || !isRegistered
                    ? 'grayscale opacity-70 cursor-not-allowed' 
                    : 'hover:brightness-110 active:scale-95' 
                }
            `}
        >
            <span className="text-xl tracking-tight font-arponaBold text-white uppercase border-2 border-transparent px-7 rounded-full py-1 bg-[#1C3F8C] ">
                {isRegistered ? "Juega Aquí" : "Regístrate"}
            </span>
        </button>

        {/* Se eliminó el botón de Settings que estaba aquí */}
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
                
                {/* Contenedor Flex para alinear caja y botón fuera */}
                <div className="flex flex-col items-center justify-center w-full mt-20 mb-10 relative z-10">
                    
                   <div 
    className="bg-transparent border-2 border-[#1C3F8C] font-arponaBold rounded-3xl p-4 w-auto shadow-2xl relative"
    
>
                        
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

                        {/* FORMULARIO CON ID */}
                        <form id="register-form" onSubmit={handleRegisterSubmit} className="space-y-2 text-start">
                            
                            {/* Input Nombre */}
                            <div>
                                <label className="block text-[#1C3F8C] text-[13px] font-bold mb-0 ">Nombres y apellidos</label>
                                <input 
                                    type="text" 
                                    placeholder=""
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-76 px-3 py-1 bg-white border border-[#1C3F8C] border-2  rounded-full text-[#1C3F8C] text-sm placeholder-gray-500 transition-all focus:outline-none"
                                />
                            </div>

                            {/* Input Teléfono */}
                            <div>
                                <label className="block text-[#1C3F8C] text-[13px] font-bold mb-0 ">Teléfono</label>
                                <input 
                                    type="tel" 
                                    placeholder=""
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    maxLength={9}
                                    required
                                    className="w-76 px-3 py-1 bg-white border border-[#1C3F8C] border-2  rounded-full text-[#1C3F8C] text-sm placeholder-gray-500 focus:outline-none transition-all"
                                />
                            </div>

                            {/* Input Foto Voucher */}
                            <div>
                                <label className="block text-[#1C3F8C] text-[13px] font-bold mb-0 ">Foto de Voucher</label>
                                <label className="cursor-pointer border-[#1C3F8C] bg-white flex items-center justify-left gap-2 w-76 px-3 py-1 border-2  rounded-full text-[#1C3F8C] text-sm font-arponaBold hover:bg-[#1C3F8C] hover:text-white transition-all shadow-[0_0_10px_rgba(162,231,26,0.3)] active:scale-95">
                                    
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

                    {/* BOTÓN FUERA DE LA CAJA (Vinculado al form por ID) */}
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

        {/* --- MODAL DE TÉRMINOS CON BORDE NEÓN --- */}
        {showTermsModal && (
            // 1. Agregamos 'flex-col' aquí para que la imagen quede arriba del cuadro
            <div className="fixed inset-0 z-[60] p-2 animate-fade-in flex flex-col items-center justify-center">
                
                {/* FONDO DEL MODAL TÉRMINOS */}
                <div className="absolute inset-0 z-0">
                    <BackgroundCC />
                </div>

                {/* --- NUEVA IMAGEN AQUÍ --- */}
                {/* z-10 para que esté sobre el fondo, mb-4 para dar espacio antes del cuadro */}
                <img 
                    src="/logoik.png" 
                    alt="Logo" 
                    className="w-30 h-auto mb-10 z-10 relative drop-shadow-lg"
                />

                <div className="bg-transparent border-2 border-[#1C3F8C] rounded-3xl p-4
                px-5 max-w-md w-full relative shadow-[0_0_30px_rgba(162,231,26,0.2)] z-10">
                    <button 
                        onClick={() => {
                            setShowTermsModal(false);    // Cierra términos
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