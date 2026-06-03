import { useState, useEffect } from 'react';
import { fetchFranquicias, updateFranquiciaStatus } from '../services/api.js';
import { supabase } from '../supabase.js';

export const useFranquicias = (session) => {
    const [franquicias, setFranquicias] = useState([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [estado, setEstado] = useState('');
    
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, estado, pageSize, fechaInicio, fechaFin]);

    const cargarFranquicias = async () => {
        try {
            setCargando(true);
            const res = await fetchFranquicias(page + 1, pageSize, debouncedSearch, estado, fechaInicio, fechaFin);
            setFranquicias(res.data || []);
            setTotal(res.total || 0);
        } catch (error) {
            console.error("Error al cargar prospectos:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (session) {
            cargarFranquicias();

            const channel = supabase.channel('franquicias-channel')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_franquicia' }, () => {
                    cargarFranquicias();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, page, pageSize, debouncedSearch, estado, fechaInicio, fechaFin]);

    const handleCambiarEstado = async (solicitudId, nuevoEstado, notaResolucion = null) => {
        try {
            await updateFranquiciaStatus(solicitudId, nuevoEstado, notaResolucion);
            setFranquicias(franquicias.map(f =>
                f.id === solicitudId
                    ? { ...f, estado: nuevoEstado, nota_resolucion: notaResolucion || f.nota_resolucion }
                    : f
            ));
        } catch (error) {
            console.error("Error al actualizar el prospecto:", error);
            throw error;
        }
    };

    return { 
        franquicias, total, cargando, 
        page, pageSize, search, estado, 
        fechaInicio, fechaFin,
        setPage, setPageSize, setSearch, setEstado, 
        setFechaInicio, setFechaFin,
        cargarFranquicias, handleCambiarEstado 
    };
};