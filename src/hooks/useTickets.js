import { useState, useEffect } from 'react';
import { fetchTickets, updateTicketStatus } from '../services/api.js';
import toast from 'react-hot-toast';
import { supabase } from '../supabase.js';

export const useTickets = (session) => {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  // Estados de paginación y filtrado (manejados desde el backend)
  const [page, setPage] = useState(0); // react-table maneja base 0
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoReporte, setTipoReporte] = useState('');
  const [motivo, setMotivo] = useState('');
  const [categoria, setCategoria] = useState('');

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Trampa 2: Debounce del buscador para no enviar spam a la API
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Trampa 3: Reiniciar a la página 1 (index 0) al cambiar filtros o el tamaño de la página
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, estado, pageSize, fechaInicio, fechaFin, tipoReporte, motivo, categoria]);

  const cargarTickets = async (mostrarToast = false) => {
    try {
      setCargando(true);
      // Backend espera páginas base 1, por lo que enviamos page + 1
      const res = await fetchTickets(page + 1, pageSize, debouncedSearch, estado, fechaInicio, fechaFin, tipoReporte, motivo, categoria);
      setTickets(res.data || []);
      setTotal(res.total || 0);
      if (mostrarToast) toast.success('Datos actualizados correctamente.');
    } catch (error) {
      console.error("Error al cargar los tickets:", error);
      setTickets([]); // Limpiar estado para que no quede la memoria del rol anterior
      setTotal(0);
      if (mostrarToast) toast.error('Error al actualizar datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (session) {
      cargarTickets();

      const channel = supabase.channel('tickets-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets_pqrs' }, () => {
          cargarTickets();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, page, pageSize, debouncedSearch, estado, fechaInicio, fechaFin, tipoReporte, motivo, categoria]);

  const handleCambiarEstado = async (ticketId, nuevoEstado, notaResolucion = null) => {
    const toastId = toast.loading(`Actualizando a ${nuevoEstado}...`);
    try {
      await updateTicketStatus(ticketId, nuevoEstado, notaResolucion);
      setTickets(tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, estado: nuevoEstado, nota_resolucion: notaResolucion || ticket.nota_resolucion }
          : ticket
      ));
      toast.success(nuevoEstado === 'Cerrado' ? 'Ticket cerrado con éxito' : `Estado cambiado a ${nuevoEstado}`, { id: toastId });
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      toast.error('Error al actualizar el estado', { id: toastId });
    }
  };

  return { 
    tickets, total, cargando, 
    page, pageSize, search, estado, 
    fechaInicio, fechaFin, tipoReporte, motivo, categoria,
    setPage, setPageSize, setSearch, setEstado, 
    setFechaInicio, setFechaFin, setTipoReporte, setMotivo, setCategoria,
    cargarTickets, handleCambiarEstado 
  };
};