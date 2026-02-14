import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_URL, CAMPAIGN_ID } from "../constants/RegistrationConstants";

// Definimos los parámetros de la ruta
type RouteParams = { storeId: string; };

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
    voucher: File | null; 
    setName: (val: string) => void;
    setPhone: (val: string) => void;
    setVoucher: (val: File | null) => void;
    handleSpin: () => Promise<SpinResult>; 
}

export const useRegistration = (): RouletteHook => {
    // Estados
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [storeName, setStoreName] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [voucher, setVoucher] = useState<File | null>(null);

    const { storeId } = useParams<RouteParams>();

    // Obtener nombre de tienda
    useEffect(() => {
        const fetchStoreInfo = async () => {
            if (!storeId) return;
            try {
                const res = await fetch(`${API_URL}/api/v1/admin/stores/${storeId}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) setStoreName(json.data.name);
                }
            } catch (error) {
                console.error("Error tienda:", error);
            }
        };
        fetchStoreInfo();
    }, [storeId]);

    const handleSpin = async (): Promise<SpinResult> => {
        setMessage("");

        // === LOG DE DEPURACIÓN ===
        console.log("-------------------------------------------------");
        console.log("🕵️‍♂️ INTENTANDO REGISTRAR GIRO");
        console.log("🆔 CAMPAÑA ACTUAL (Constante):", CAMPAIGN_ID);
        console.log("📱 TELÉFONO:", phone);
        console.log("🏪 TIENDA ID:", storeId);
        console.log("-------------------------------------------------");

        // Validaciones Frontend
        if (!storeId) {
            setMessage("Error: No se identificó la tienda.");
            return { success: false };
        }
        if (!name.trim() || !phone.trim() || !voucher) {
            setMessage("⚠️ Por favor completa todos los datos.");
            return { success: false };
        }

        setLoading(true);

        try {
            // 1. Subir Imagen a PHP
            const formDataImage = new FormData();
            formDataImage.append("photo", voucher); 

            console.log("📤 Subiendo imagen a PHP...");
            const uploadRes = await fetch("https://ptm.pe/PremiosApp/upload_fixed.php", {
                method: "POST",
                body: formDataImage,
            });

            const uploadJson = await uploadRes.json();
            console.log("✅ Respuesta PHP:", uploadJson);

            if (!uploadJson.url && !uploadJson.filename) { 
                 throw new Error(uploadJson.error || "Error al subir la imagen.");
            }
            // Normalizar la URL de retorno
            const voucherUrl = uploadJson.url || `https://ptm.pe/PremiosApp/uploads_fixed/${uploadJson.filename}`;

            // 2. Registrar en Node/Express
            const payload = { 
                storeId, 
                campaign: CAMPAIGN_ID, // <--- AQUÍ ESTÁ LA CLAVE
                name, 
                phone,      
                voucherUrl  
            };

            console.log("🚀 Enviando Payload al Backend:", payload);

            const res = await fetch(`${API_URL}/api/v1/register-spin-fixed`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            const resJson = await res.json();
            console.log("📩 Respuesta Backend:", resJson);

            if (res.ok) {
                return { 
                    success: true, 
                    prizeName: resJson.prize, 
                    registerId: resJson.registerId 
                };
            } else {
                setMessage(`⚠️ ${resJson.message || "Error al procesar el giro."}`);
                return { success: false };
            }

        } catch (err: any) {
            console.error("❌ ERROR CRÍTICO EN FRONTEND:", err);
            setMessage(err.message || "❌ Error de conexión.");
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading, message, storeId, storeName,
        name, setName,
        phone, setPhone,
        voucher, setVoucher,
        handleSpin,
    };
};