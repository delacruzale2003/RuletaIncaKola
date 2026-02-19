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
    dni: string; // <--- Agregado
    voucher: File | null; 
    setName: (val: string) => void;
    setPhone: (val: string) => void;
    setDni: (val: string) => void; // <--- Agregado
    setVoucher: (val: File | null) => void;
    handleSpin: () => Promise<SpinResult>; 
}

export const useRegistration = (): RouletteHook => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [storeName, setStoreName] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [dni, setDni] = useState(""); // <--- Nuevo estado
    const [voucher, setVoucher] = useState<File | null>(null);

    const { storeId } = useParams<RouteParams>();

    // ... (useEffect de fetchStoreInfo se mantiene igual)

    const handleSpin = async (): Promise<SpinResult> => {
        setMessage("");

        // Validaciones Frontend
        if (!storeId) {
            setMessage("Error: No se identificó la tienda.");
            return { success: false };
        }
        
        // Validación mejorada incluyendo DNI
        if (!name.trim() || !phone.trim() || !dni.trim() || !voucher) {
            setMessage("⚠️ Por favor completa todos los datos.");
            return { success: false };
        }

        // Validación específica para DNI peruano
        if (dni.length !== 9) {
            setMessage("⚠️ Formato de DNI inválido");
            return { success: false };
        }

        setLoading(true);

        try {
            // 1. Subida a PHP (se mantiene igual)
            const formDataImage = new FormData();
            formDataImage.append("photo", voucher); 
            const uploadRes = await fetch("https://ptm.pe/PremiosApp/upload_fixed.php", {
                method: "POST",
                body: formDataImage,
            });

            const uploadJson = await uploadRes.json();
            if (!uploadJson.url && !uploadJson.filename) { 
                 throw new Error(uploadJson.error || "Hubo un inconveniente al subir la imagen, refresque la página e intente nuevamente.");
            }
            const voucherUrl = uploadJson.url || `https://ptm.pe/PremiosApp/uploads_fixed/${uploadJson.filename}`;

            // 2. Registrar en Node con DNI
            const payload = { 
                storeId, 
                campaign: CAMPAIGN_ID,
                name, 
                phone,
                dni, // <--- Enviamos el DNI
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
                setMessage(`⚠️ ${resJson.message || "Inconveniente al procesar , refresque la página e intente nuevamente."}`);
                return { success: false };
            }

        } catch (err: any) {
            setMessage(err.message || " Hubo un inconveniente, refresque la página e intente nuevamente.");
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading, message, storeId, storeName,
        name, setName,
        phone, setPhone,
        dni, setDni, // <--- Retornamos nuevos valores
        voucher, setVoucher,
        handleSpin,
    };
};