import axios from 'axios';
import { supabase } from '../supabase.js';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// --- INTERCEPTORES DE SEGURIDAD (Axios) ---
// 1. Inyectar automáticamente el Token JWT en cada petición a FastAPI
axios.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// 2. Detectar "Sesión Caducada" (401 Unauthorized) y expulsar al usuario
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.error("🔒 Token inválido o sesión caducada. Cerrando sesión...");
            await supabase.auth.signOut();
            window.location.href = '/'; // Fuerza el redireccionamiento al Login
        }
        return Promise.reject(error);
    }
);

export const fetchTickets = async (page = 1, pageSize = 10, search = '', estado = '', fechaInicio = '', fechaFin = '', tipoReporte = '', motivo = '', categoria = '') => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (search) params.append('search', search);
  if (estado) params.append('estado', estado);
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);
  if (tipoReporte) params.append('tipo_reporte', tipoReporte);
  if (motivo) params.append('motivo', motivo);
  if (categoria) params.append('categoria', categoria);
  const respuesta = await axios.get(`${API_URL}/tickets?${params.toString()}`);
  return respuesta.data;
};

// Agregamos notaResolucion con un valor por defecto null
export const updateTicketStatus = async (ticketId, nuevoEstado, notaResolucion = null) => {
  const respuesta = await axios.put(`${API_URL}/tickets/${ticketId}/estado`, {
    nuevo_estado: nuevoEstado,
    nota_resolucion: notaResolucion
  });
  return respuesta.data;
};

// --- NUEVAS PETICIONES PARA FRANQUICIAS (CRM) ---
export const fetchFranquicias = async (page = 1, pageSize = 10, search = '', estado = '', fechaInicio = '', fechaFin = '') => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (search) params.append('search', search);
  if (estado) params.append('estado', estado);
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);
  const respuesta = await axios.get(`${API_URL}/franquicias/solicitudes?${params.toString()}`);
  return respuesta.data;
};

export const updateFranquiciaStatus = async (solicitudId, nuevoEstado, notaResolucion = null) => {
  const respuesta = await axios.put(`${API_URL}/franquicias/solicitudes/${solicitudId}/estado`, {
    nuevo_estado: nuevoEstado,
    nota_resolucion: notaResolucion
  });
  return respuesta.data;
};

// --- NUEVA PETICIÓN PARA OBTENER EL ROL DEL USUARIO ---
export const fetchUserRole = async (email) => {
  try {
    const { data, error } = await supabase
      .from('perfiles_usuarios')
      .select('rol')
      .ilike('email', `%${email.trim()}%`) // Más robusto contra espacios en la BD
      .maybeSingle();

    if (error) throw error;

    return data ? data.rol : 'sin_rol';
  } catch (error) {
    console.error("Error al obtener el rol:", error);
    return 'sin_rol';
  }
};

// --- NUEVAS PETICIONES PARA ANALÍTICAS ---
export const fetchAnalyticsPQRS = async (periodo) => {
  const respuesta = await axios.get(`${API_URL}/analytics/pqrs?periodo=${periodo}`);
  return respuesta.data;
};

export const fetchAnalyticsPQRSMensual = async () => {
  const respuesta = await axios.get(`${API_URL}/analytics/pqrs/mensual`);
  return respuesta.data;
};

export const fetchAnalyticsPQRSSedes = async (periodo) => {
  const respuesta = await axios.get(`${API_URL}/analytics/pqrs/sedes?periodo=${periodo}`);
  return respuesta.data;
};

export const fetchAnalyticsSedesImagen = async () => {
  const respuesta = await axios.get(`${API_URL}/analytics/sedes/imagen`);
  return respuesta.data;
};

export const fetchAnalyticsFranquicias = async (periodo) => {
  const respuesta = await axios.get(`${API_URL}/analytics/franquicias?periodo=${periodo}`);
  return respuesta.data;
};

export const fetchAnalyticsDomicilios = async (periodo) => {
  const respuesta = await axios.get(`${API_URL}/analytics/domicilios?periodo=${periodo}`);
  return respuesta.data;
};