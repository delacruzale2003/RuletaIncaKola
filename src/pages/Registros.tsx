import { useEffect, useState } from 'react';
import {
    IconX,
} from "@tabler/icons-react";
import { CircleArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from 'xlsx';

// ==========================================================
// 🚨 Tipos Actualizados (SQL/Express)
// ==========================================================

interface Tienda {
    id: string;
    name: string;
}

interface Registro {
    id: string;
    store_id: string;
    prize_id: string;
    name: string;
    phone_number: string;
    dni: string;
    email: string; // <--- Nuevo Campo
    campaign: string;
    status: string;
    created_at: string;
    store_name: string;
    prize_name: string;
    photo_url: string;
}

interface LatestRegister extends Registro {
    store_name: string;
    prize_name: string;
    photo_url: string;
}

export default function Registros() {
    const [registros, setRegistros] = useState<LatestRegister[]>([]);
    const [modalFoto, setModalFoto] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    const campaignName = import.meta.env.VITE_CAMPAIGN ;
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const apiAdmin = `${API_BASE_URL}/api/v1/admin`;

    const [tiendaSeleccionada, setTiendaSeleccionada] = useState<string>('');
    const [tiendasUnicas, setTiendasUnicas] = useState<Tienda[]>([]);

    // --- CARGAR REGISTROS (FILTRADO y con CANCELACIÓN) ---
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchRegistros = async () => {
            setCargando(true);
            try {
                const queryParams = new URLSearchParams({
                    campaign: campaignName,
                });

                if (tiendaSeleccionada) {
                    queryParams.append('storeId', tiendaSeleccionada);
                }

                const res = await fetch(`${apiAdmin}/registers/latest?${queryParams.toString()}`, { signal });

                if (signal.aborted) return;

                if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

                const result = await res.json();
                setRegistros(result.data || []);

            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('Error cargando registros:', err);
            } finally {
                setCargando(false);
            }
        };

        fetchRegistros();

        return () => {
            controller.abort();
        };
    }, [tiendaSeleccionada, campaignName, apiAdmin]);

    // --- CARGAR TIENDAS ---
    useEffect(() => {
        const fetchTiendas = async () => {
            try {
                const res = await fetch(`${apiAdmin}/stores?page=1&limit=100&campaign=${campaignName}`);
                if (!res.ok) return;
                const result = await res.json();
                setTiendasUnicas(result.data.stores || []);
            } catch (err) {
                console.error('Error cargando tiendas:', err);
            }
        };
        fetchTiendas();
    }, [campaignName, apiAdmin]);

    // --- FORMATO DE FECHA ---
    const convertirFechaPeru = (fechaUTC: string) => {
        if (!fechaUTC) return '-';
        const fecha = new Date(fechaUTC);
        const opciones: Intl.DateTimeFormatOptions = {
            timeZone: 'America/Lima',
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: 'numeric', minute: '2-digit', hour12: true,
        };
        return fecha.toLocaleString('es-PE', opciones);
    };

    // --- EXPORTACIÓN GENERAL (Descarga de la Campaña Completa) ---
    const handleDescargarCampaña = async () => {
        try {
            const res = await fetch(`${apiAdmin}/registers/latest?campaign=${campaignName}&limit=99999`);
            const result = await res.json();

            // 💡 ACTUALIZADO: Incluye DNI y Email
            const filas = (result.data || []).map((r: LatestRegister) => ({
                'ID Registro': r.id, 
                'Tienda': r.store_name ?? 'Desconocida', 
                'Nombre Cliente': r.name ?? '—',
                'DNI': r.dni ?? '—',
                'Email': r.email ?? '—', // <--- Nuevo en Excel
                'Estado': r.prize_name ? 'GANADOR' : 'NO GANÓ',
                'Premio': r.prize_name ?? '—', 
                'Fecha Registro': convertirFechaPeru(r.created_at),
            }));

            const hoja = XLSX.utils.json_to_sheet(filas);
            const libro = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(libro, hoja, 'Registros');
            XLSX.writeFile(libro, `registros_${campaignName}_completo.xlsx`);
        } catch (err) {
            console.error('Error al descargar campaña:', err);
            alert('Error al descargar. Revisa la consola.'); 
        }
    };

    // --- EXPORTACIÓN FILTRADA POR TIENDA ---
    const handleDescargarTienda = async () => {
        if (!tiendaSeleccionada) return;

        const selectedStoreName = tiendasUnicas.find(t => t.id === tiendaSeleccionada)?.name || 'Tienda';

        try {
            const res = await fetch(`${apiAdmin}/registers/latest?campaign=${campaignName}&storeId=${tiendaSeleccionada}&limit=99999`);
            const result = await res.json();

            // 💡 ACTUALIZADO: Incluye DNI y Email
            const filas = (result.data || []).map((r: LatestRegister) => ({
                'Tienda': r.store_name, 
                'Cliente': r.name ?? '—', 
                'DNI': r.dni ?? '—',
                'Email': r.email ?? '—', // <--- Nuevo en Excel
                'Premio': r.prize_name ?? '—', 
                'Fecha Registro': convertirFechaPeru(r.created_at),
            }));

            const hoja = XLSX.utils.json_to_sheet(filas);
            const libro = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(libro, hoja, 'Registros');
            XLSX.writeFile(libro, `registros_tienda_${selectedStoreName}.xlsx`);
        } catch (err) {
            console.error('Error al descargar tienda:', err);
            alert('Error al descargar por tienda. Revisa la consola.');
        }
    };

    // --- RENDERIZADO ---
    return (
        <div className="p-4 bg-black min-h-screen">
            <div className="max-w-7xl mx-auto"> {/* Aumenté un poco el ancho para que quepan las nuevas columnas */}
                
                {/* CABECERA Y DESCRIPCIÓN */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-100 mb-2 text-center md:text-left">
                        Registros de premios: <span className="text-[#5dc4c0]">{campaignName}</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base text-center md:text-left leading-relaxed">
                        Esta tabla muestra los registros de participantes en <strong>tiempo real</strong>. 
                        Puedes utilizar el selector de abajo para <strong>filtrar por una tienda específica</strong>. 
                        Además, tienes la opción de <strong>exportar los datos a Excel</strong> para tus reportes.
                    </p>
                </div>

                {/* BOTONES DE DESCARGA */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 flex-wrap justify-center md:justify-start">
                    <button
                        onClick={handleDescargarCampaña}
                        className="flex items-center justify-center gap-3 px-5 py-3 bg-gray-800 text-white border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 w-full md:w-auto group"
                    >
                        <CircleArrowDown size={20} strokeWidth={1.5} className="group-hover:text-[#5dc4c0] transition-colors" />
                        <span className="font-medium">Descargar Campaña Completa</span>
                    </button>

                    <button
                        onClick={handleDescargarTienda}
                        disabled={!tiendaSeleccionada}
                        className="flex items-center justify-center gap-3 px-5 py-3 bg-[#5dc4c0] text-white font-bold rounded-xl hover:brightness-110 disabled:bg-gray-800 disabled:text-gray-500 disabled:border disabled:border-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-[0_0_15px_rgba(93,196,192,0.4)] hover:-translate-y-0.5 active:translate-y-0 w-full md:w-auto"
                    >
                        <CircleArrowDown size={20} strokeWidth={2} />
                        <span className="">
                            Descargar Tienda {tiendaSeleccionada ? `(${tiendasUnicas.find(t => t.id === tiendaSeleccionada)?.name})` : ''}
                        </span>
                    </button>
                </div>

                {/* FILTRO */}
                <div className="mb-6 mx-auto md:mx-0 max-w-sm">
                    <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Filtrar vista por tienda:</label>
                    <div className="relative">
                        <select
                            value={tiendaSeleccionada}
                            onChange={(e) => { setTiendaSeleccionada(e.target.value); }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-700 text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5dc4c0] focus:border-transparent appearance-none cursor-pointer hover:bg-gray-800 transition-colors"
                        >
                            <option value="">Todas las tiendas ({campaignName})</option>
                            {tiendasUnicas.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                {/* TABLA DE DATOS (Fondo Blanco) */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        {cargando ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5dc4c0] mb-2"></div>
                                <div className="text-gray-500 font-medium">Cargando registros...</div>
                            </div>
                        ) : (
                            <motion.div
                                key={tiendaSeleccionada || 'all'}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                            >
                                <table className="min-w-full divide-y divide-gray-200">
                                    {/* Cabecera Gris Clara */}
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left md:text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Tienda</th>
                                            <th scope="col" className="px-6 py-4 text-left md:text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                                            <th scope="col" className="px-6 py-4 text-left md:text-center text-xs font-bold text-gray-500 uppercase tracking-wider">DNI</th>
                                            <th scope="col" className="px-6 py-4 text-left md:text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                            <th scope="col" className="px-6 py-4 text-left md:text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Premio</th>
                                            <th scope="col" className="px-6 py-4 text-left md:text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                        </tr>
                                    </thead>
                                    {/* Cuerpo Blanco */}
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {registros.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                                                    No se encontraron registros para esta selección.
                                                </td>
                                            </tr>
                                        ) : registros.map((r) => (
                                            <tr key={r.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                
                                                <td className="px-6 py-4 whitespace-nowrap text-left md:text-center">
                                                    <div className="text-sm font-semibold text-gray-800">{r.store_name ?? <span className="text-red-500">Desconocida</span>}</div>
                                                </td>
                                                
                                                <td className="px-6 py-4 whitespace-nowrap text-left md:text-center">
                                                    <div className="text-sm text-gray-600 font-medium">{r.name ?? '-'}</div>
                                                </td>

                                                {/* COLUMNA DNI */}
                                                <td className="px-6 py-4 whitespace-nowrap text-left md:text-center">
                                                    <div className="text-sm text-gray-500 font-mono">{r.dni ?? '-'}</div>
                                                </td>

                                                {/* COLUMNA EMAIL */}
                                                <td className="px-6 py-4 whitespace-nowrap text-left md:text-center">
                                                    <div className="text-sm text-gray-500">{r.email ?? '-'}</div>
                                                </td>
                                                
                                                <td className="px-6 py-4 whitespace-nowrap text-left md:text-center">
                                                    {r.prize_name ? (
                                                        <span className="bg-[#5dc4c0] text-white px-3 py-1 rounded-full text-xs font-bold inline-block shadow-sm">
                                                            {r.prize_name}
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-xs font-medium inline-block border border-gray-200">
                                                            No ganó
                                                        </span>
                                                    )}
                                                </td>
                                                
                                                <td className="px-6 py-4 whitespace-nowrap text-left md:text-center text-gray-400 text-xs font-mono">
                                                    {convertirFechaPeru(r.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center items-center gap-2 mt-6 pb-8 text-gray-500 text-sm">
                    <span>Mostrando los últimos</span>
                    <span className="font-bold text-gray-300">{registros.length}</span>
                    <span>registros</span>
                </div>
            </div>

            {/* MODAL DE FOTO (Zoom) - Se mantiene igual */}
            {modalFoto && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalFoto(null)}>
                    <motion.div
                        className="relative bg-white p-2 rounded-2xl max-w-3xl max-h-[90vh] overflow-auto shadow-2xl"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setModalFoto(null)}
                            className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full p-2 transition-colors z-10 shadow-sm"
                        >
                            <IconX size={24} />
                        </button>
                        <img
                            src={modalFoto}
                            alt="Zoom"
                            className="w-full h-auto block max-w-full max-h-[85vh] rounded-xl"
                        />
                    </motion.div>
                </div>
            )}
        </div>
    );
}