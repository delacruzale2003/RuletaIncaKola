import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom"; 
import { API_URL, CAMPAIGN_ID } from "../constants/RegistrationConstants";

export interface SpinResult {
    success: boolean;
    prizeName?: string;
    registerId?: string;
}

interface RouletteHook {
    loading: boolean;
    message: string;
    storeId: string | undefined;
    storeName: string;
    name: string;
    phone: string;
    dni: string; 
    voucher: File | null; 
    setName: (val: string) => void;
    setPhone: (val: string) => void;
    setDni: (val: string) => void; 
    setVoucher: (val: File | null) => void;
    handleSpin: () => Promise<SpinResult>; 
}

export const useRegistration = (): RouletteHook => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [storeName, setStoreName] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [dni, setDni] = useState(""); 
    const [voucher, setVoucher] = useState<File | null>(null);

    // --- MAGIA UX: Captura de ID a prueba de fallos ---
    const params = useParams();
    const [searchParams] = useSearchParams();
    
    // Obtenemos el último segmento de la URL por si React Router falla
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const fallbackId = pathParts.length > 0 ? pathParts[pathParts.length - 1] : undefined;

    // Evaluamos todas las opciones posibles para atrapar el ID
    const activeStoreId = params.storeId || params.id || searchParams.get("store") || fallbackId;

    useEffect(() => {
        const fetchStoreInfo = async () => {
            if (!activeStoreId) return;

            try {
                const res = await fetch(`${API_URL}/api/v1/admin/stores/${activeStoreId}`);
                if (res.ok) {
                    const json = await res.json();
                    
                    if (json.success && json.data) {
                        // Atrapamos el nombre dependiendo de cómo venga estructurado tu JSON
                        const nombreTienda = json.data.name || json.data.store?.name || json.data[0]?.name;
                        if (nombreTienda) {
                            setStoreName(nombreTienda);
                        }
                    }
                }
            } catch (error) {
                console.error("Error al obtener información de la tienda:", error);
            }
        };
        
        fetchStoreInfo();
    }, [activeStoreId]); 

    const handleSpin = async (): Promise<SpinResult> => {
        setMessage("");

        if (!activeStoreId) {
            setMessage("Error: No se identificó la tienda.");
            return { success: false };
        }
        
        if (!name.trim() || !phone.trim() || !dni.trim() || !voucher) {
            setMessage("⚠️ Por favor completa todos los datos.");
            return { success: false };
        }

        const dniLimpio = dni.trim();
        const dniRegex = /^\d{8,9}$/;
        
        if (!dniRegex.test(dniLimpio)) {
            setMessage("⚠️ Formato de DNI inválido");
            return { success: false };
        }

        setLoading(true);

        try {
            const formDataImage = new FormData();
            formDataImage.append("photo", voucher); 
            const uploadRes = await fetch("https://ptm.pe/PremiosApp/upload_fixed.php", {
                method: "POST",
                body: formDataImage,
            });

            const uploadJson = await uploadRes.json();
            if (!uploadJson.url && !uploadJson.filename) { 
                 throw new Error(uploadJson.error || "Hubo un inconveniente al subir la imagen.");
            }
            const voucherUrl = uploadJson.url || `https://ptm.pe/PremiosApp/uploads_fixed/${uploadJson.filename}`;

            const payload = { 
                storeId: activeStoreId, 
                campaign: CAMPAIGN_ID,
                name, 
                phone,
                dni, 
                voucherUrl  
            };

            const res = await fetch(`${API_URL}/api/v1/register-spin-fixed`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const resJson = await res.json();

            if (res.ok) {
                return { success: true, prizeName: resJson.prize, registerId: resJson.registerId };
            } else {
                const errorMsg = resJson.message || "Inconveniente al procesar el registro.";
                setMessage(errorMsg); 
                return { success: false };
            }

        } catch (err: any) {
            setMessage(err.message || "Hubo un inconveniente de conexión.");
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading, message, storeId: activeStoreId, storeName,
        name, setName,
        phone, setPhone,
        dni, setDni, 
        voucher, setVoucher,
        handleSpin,
    };
};