import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, Search, FileImage, ChevronLeft, ChevronRight, Filter, Clock, AlertTriangle, Download } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { exportarAExcel } from '../utils/exportExcel.js';
import { fetchTickets } from '../services/api.js';

const calcularSLA = (fechaCreacion, estado) => {
  if (estado === 'Cerrado') return { color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700', texto: 'Completado', nivel: 0 };
  if (!fechaCreacion) return { color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700', texto: 'N/A', nivel: 0 };

  const creacion = new Date(fechaCreacion);
  const ahora = new Date();
  
  let diasHabiles = 0;
  let fechaIter = new Date(creacion);
  
  // Sumar días excluyendo fines de semana
  while (fechaIter < ahora) {
    const dia = fechaIter.getDay();
    if (dia !== 0 && dia !== 6) { // 0=Domingo, 6=Sábado
      diasHabiles++;
    }
    fechaIter.setDate(fechaIter.getDate() + 1);
  }

  if (diasHabiles > 4) {
    return { color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30', texto: `${diasHabiles}d Vencido`, nivel: 3 };
  } else if (diasHabiles >= 3) {
    return { color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30', texto: `${diasHabiles}d Alerta`, nivel: 2 };
  } else {
    return { color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30', texto: `${diasHabiles}d OK`, nivel: 1 };
  }
};

const TicketsTable = ({ tickets, cargando, total, page, pageSize, search, estado, fechaInicio, fechaFin, tipoReporte, motivo, categoria, orden, setPage, setPageSize, setSearch, setEstado, setFechaInicio, setFechaFin, setTipoReporte, setMotivo, setCategoria, setOrden, handleCambiarEstado, setFotoModal, rolUsuario }) => {
  const [ticketAResolver, setTicketAResolver] = useState(null);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [notaTexto, setNotaTexto] = useState('');
  const [notaVisible, setNotaVisible] = useState(null);

  // Filtrar tickets si es gerencia jurídica
  const ticketsProcesados = useMemo(() => {
    if (!tickets) return [];
    if (rolUsuario === 'gerencia_juridica') {
      return tickets.filter(t => t.tipo_novedad === 'Objeto en el producto' || t.motivo === 'Objeto en el producto');
    }
    return tickets;
  }, [tickets, rolUsuario]);

  const onSelectChange = (ticketId, nuevoEstado) => {
    if (nuevoEstado === 'Cerrado') {
      setTicketAResolver(ticketId);
      setNotaTexto('');
    } else {
      const loadingToast = toast.loading('Cambiando estado...');
      handleCambiarEstado(ticketId, nuevoEstado).then(() => {
        toast.dismiss(loadingToast);
      }).catch(() => toast.dismiss(loadingToast));
    }
  };

  const confirmarCierre = () => {
    if (notaTexto.trim() === '') {
      toast.error('Por favor, ingresa una nota detallando la solución.');
      return;
    }
    const loadingToast = toast.loading('Cerrando ticket...');
    handleCambiarEstado(ticketAResolver, 'Cerrado', notaTexto).then(() => {
      toast.dismiss(loadingToast);
    }).catch(() => toast.dismiss(loadingToast));
    setTicketAResolver(null);
  };

  const handleExportar = async () => {
    try {
      setExportando(true);
      const toastId = toast.loading('Extrayendo datos para Excel...');
      
      const res = await fetchTickets(1, 10000, search, estado, fechaInicio, fechaFin, tipoReporte, motivo, categoria);
      const datosCompletos = res.data || [];
      
      if (datosCompletos.length === 0) {
        toast.error('No hay datos que coincidan con los filtros.', { id: toastId });
        return;
      }
      
      exportarAExcel(datosCompletos, 'Reporte_PQRS', (ticket) => ({
        ID: ticket.id,
        Radicado: ticket.id || 'N/A',
        'Fecha Creación': new Date(ticket.fecha_creacion).toLocaleString(),
        Estado: ticket.estado,
        'Nombre Cliente': ticket.nombre_cliente || 'N/A',
        'Correo Cliente': ticket.correo_cliente || 'N/A',
        'Celular Cliente': ticket.celular_cliente,
        'Tipo Reporte': ticket.tipo_reporte || 'N/A',
        Motivo: ticket.motivo || 'N/A',
        Novedad: ticket.tipo_novedad,
        Detalle: ticket.detalle,
        'Nombre Franquicia': ticket.nombre_franquicia,
        'Nota Resolución': ticket.nota_resolucion || 'N/A'
      }));
      
      toast.success(`Se exportaron ${datosCompletos.length} tickets.`, { id: toastId });
    } catch (error) {
      console.error("Error al exportar:", error);
      toast.error('Hubo un error al generar el Excel.');
    } finally {
      setExportando(false);
    }
  };

  // Ajustamos anchos y paddings en las celdas para evitar el scroll horizontal
  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Radicado',
      cell: info => <span className="font-black text-slate-900 dark:text-white">#{info.getValue()}</span>
    },
    {
      accessorKey: 'celular_cliente',
      header: 'Contacto',
      cell: ({ row }) => {
        const celular = row.original.celular_cliente;
        const nombre = row.original.nombre_cliente || 'Sin nombre';
        const correo = row.original.correo_cliente || 'Sin correo';
        return (
          <div className="flex flex-col gap-1 min-w-[140px]">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{nombre}</span>
            <span className="font-semibold text-cosechas-verde dark:text-emerald-400 text-xs">{celular}</span>
            {correo !== 'Sin correo' && <span className="text-xs text-slate-500 dark:text-slate-400 break-all">{correo}</span>}
          </div>
        );
      }
    },
    {
      id: 'franquicia',
      accessorFn: row => `${row.nombre_franquicia || 'Sedes Generales'} ${row.nit_franquiciado || ''}`,
      header: 'Franquicia',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-[120px]">
          <span className="font-bold text-slate-800 dark:text-white leading-tight">
            {row.original.nombre_franquicia || "Sedes Generales"}
          </span>
          {row.original.nit_franquiciado && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              NIT: {row.original.nit_franquiciado}
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'tipo_novedad',
      header: 'Categoría',
      cell: ({ row }) => {
        const data = row.original;
        let parts = [];
        if (data.tipo_reporte && data.tipo_reporte !== "Novedad") parts.push(data.tipo_reporte);
        if (data.motivo) parts.push(data.motivo);
        if (data.tipo_novedad && data.tipo_novedad !== "Novedad" && data.tipo_novedad !== "No especificado" && data.tipo_novedad !== data.tipo_reporte && data.tipo_novedad !== data.motivo) parts.push(data.tipo_novedad);
        
        return <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight flex flex-col">{parts.length > 0 ? parts.join(" ➔ ") : data.tipo_novedad}</span>;
      }
    },
    {
      accessorKey: 'detalle',
      header: 'Descripción',
      cell: info => (
        // max-w-[200px] obliga a que el texto se corte en 2 líneas sin expandir la tabla
        <p className="line-clamp-2 text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px] text-xs" title={info.getValue()}>
          {info.getValue()}
        </p>
      )
    },
    {
      id: 'evidencia',
      header: () => <div className="text-center">Evidencia</div>,
      cell: ({ row }) => {
        const evidencia = row.original.evidencia;
        return (
          <div className="flex justify-center">
            {evidencia && evidencia.startsWith('http') ? (
              <button onClick={() => setFotoModal(evidencia)} className="relative inline-block group/img">
                <img src={evidencia} alt="Evidencia" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-600 group-hover/img:border-cosechas-rojo transition-all shadow-sm" />
                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                  <Search className="w-4 h-4 text-white" />
                </div>
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                <FileImage className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'sla',
      header: () => <div className="text-center">SLA</div>,
      cell: ({ row }) => {
        const ticket = row.original;
        const sla = calcularSLA(ticket.fecha_creacion, ticket.estado);
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border w-full whitespace-nowrap ${sla.color}`}>
              {sla.nivel === 3 ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {sla.texto}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'estado',
      header: () => <div className="text-center">Estado</div>,
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="flex flex-col items-center gap-1.5">
            {ticket.estado === 'Abierto' && (
              <span className="inline-flex items-center justify-center gap-1.5 bg-cosechas-rojo/10 text-cosechas-rojo px-2.5 py-1 rounded-full text-[11px] font-bold border border-cosechas-rojo/20 w-full whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-cosechas-rojo animate-pulse"></span> Abierto
              </span>
            )}
            {ticket.estado === 'En Proceso' && (
              <span className="inline-flex items-center justify-center bg-cosechas-amarillo/20 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-full text-[11px] font-bold border border-cosechas-amarillo/40 w-full whitespace-nowrap">
                En Proceso
              </span>
            )}
            {ticket.estado === 'Cerrado' && (
              <>
                <span className="inline-flex items-center justify-center bg-cosechas-verde/10 text-cosechas-verde px-2.5 py-1 rounded-full text-[11px] font-bold border border-cosechas-verde/30 w-full whitespace-nowrap">
                  Resuelto
                </span>
                {ticket.cerrado_por_rol && (
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                    Por: {ticket.cerrado_por_rol.replace('_', ' ')}
                  </span>
                )}
                {ticket.nota_resolucion && (
                  <button onClick={() => setNotaVisible(ticket.nota_resolucion)} className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600 w-full justify-center">
                    <FileText className="w-3 h-3" /> Nota
                  </button>
                )}
              </>
            )}
          </div>
        );
      }
    },
    ...(rolUsuario !== 'gerencia_juridica' ? [{
      id: 'accion',
      header: () => <div className="text-right">Acción</div>,
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="text-right">
            <select
              value={ticket.estado}
              onChange={(e) => onSelectChange(ticket.id, e.target.value)}
              disabled={ticket.estado === 'Cerrado'}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-2 py-1.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cosechas-rojo/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-[100px]"
            >
              {ticket.estado !== 'Cerrado' && <option value="Abierto">🔴 Abierto</option>}
              {ticket.estado !== 'Cerrado' && <option value="En Proceso">🟡 Procesar</option>}
              <option value="Cerrado">🟢 {ticket.estado === 'Cerrado' ? 'Cerrado' : 'Resolver'}</option>
            </select>
          </div>
        );
      }
    }] : [])
  ], [rolUsuario]);

  const table = useReactTable({
    data: ticketsProcesados,
    columns,
    state: { 
      pagination: { pageIndex: page, pageSize: pageSize }
    },
    pageCount: Math.ceil((total || 0) / pageSize) || -1,
    manualPagination: true,
    manualFiltering: true,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex: page, pageSize });
        setPage(newState.pageIndex);
        setPageSize(newState.pageSize);
      } else {
        setPage(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"><Search className="w-4 h-4" /></span>
            <input
              type="text"
              placeholder="Buscar por radicado, celular, franquicia o detalle..."
              className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cosechas-rojo/50 text-slate-700 dark:text-slate-200 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Estado:</span>
            <select
              value={estado}
              onChange={e => setEstado(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cosechas-rojo/50 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
            >
              <option value="">Mostrar Todos</option>
              <option value="Abierto">🔴 Abiertos</option>
              <option value="En Proceso">🟡 En Proceso</option>
              <option value="Cerrado">🟢 Resueltos</option>
            </select>

            {/* Filtro por Orden */}
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cosechas-rojo/50 text-slate-700 dark:text-slate-200 cursor-pointer font-medium"
            >
              <option value="desc">Más Recientes</option>
              <option value="asc">Más Antiguos</option>
            </select>

            <button 
              onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${mostrarFiltrosAvanzados ? 'bg-cosechas-rojo text-white border-cosechas-rojo shadow-md' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Filter className="w-4 h-4" /> Filtros
            </button>
            <button 
              onClick={handleExportar}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {exportando ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-700 dark:border-emerald-400"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Excel
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mostrarFiltrosAvanzados && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha Inicio</label>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cosechas-rojo/50 outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha Fin</label>
                  <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cosechas-rojo/50 outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Reporte</label>
                  <select value={tipoReporte} onChange={e => { setTipoReporte(e.target.value); setMotivo(''); setCategoria(''); }} className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cosechas-rojo/50 outline-none">
                    <option value="">Cualquiera</option>
                    <option value="Inconformidad">Inconformidad</option>
                    <option value="Sugerencia">Sugerencia</option>
                    <option value="Felicitación">Felicitación</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Motivo</label>
                  <select value={motivo} onChange={e => { setMotivo(e.target.value); setCategoria(''); }} disabled={tipoReporte === 'Felicitación' || !tipoReporte} className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cosechas-rojo/50 outline-none disabled:opacity-50">
                    <option value="">Cualquiera</option>
                    <option value="Servicio">Servicio</option>
                    <option value="Producto">Producto</option>
                    <option value="Servicio-Producto">Ambos</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Novedad</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} disabled={tipoReporte === 'Felicitación' || !motivo} className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cosechas-rojo/50 outline-none disabled:opacity-50">
                    <option value="">Todas</option>
                    {(motivo === 'Servicio' || motivo === 'Servicio-Producto') && (
                      <>
                        <option value="Actitud del asesor">Actitud del asesor</option>
                        <option value="Horario">Horario</option>
                        <option value="Presentación establecimiento">Presentación establecimiento</option>
                        <option value="Pago/Novedad">Pago/Novedad</option>
                        <option value="Disponibilidad carta">Disponibilidad carta</option>
                      </>
                    )}
                    {(motivo === 'Producto' || motivo === 'Servicio-Producto') && (
                      <>
                        <option value="Preparación">Preparación</option>
                        <option value="Objeto en el producto">Objeto en el producto</option>
                        <option value="Presentación del producto">Presentación del producto</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => {
                      setFechaInicio(''); setFechaFin(''); setTipoReporte(''); setMotivo(''); setCategoria(''); setSearch(''); setEstado('');
                    }}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    Borrar Filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-xl overflow-hidden relative z-10"
      >
        {/* Mantenemos el overflow-x-auto por si se abre en pantallas muy pequeñas (celulares), pero en PC ya no saldrá scroll */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-700/50 text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    // Redujimos los px-6 a px-3 para comprimir la tabla de forma elegante
                    <th key={header.id} className="px-3 py-4">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-700/50 transition-opacity duration-200 ${cargando ? 'opacity-40' : 'opacity-100'}`}>
              <AnimatePresence>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, i) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={row.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-3 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center font-medium text-slate-500 dark:text-slate-400">
                      No se encontraron resultados para la búsqueda.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* --- NUEVA PAGINACIÓN CON SELECTOR DE FILAS --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-700/50 gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Página <span className="font-bold text-slate-700 dark:text-slate-200">{table.getState().pagination.pageIndex + 1}</span> de <span className="font-bold text-slate-700 dark:text-slate-200">{table.getPageCount()}</span>
            </span>

            {/* El selector de registros por página */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Mostrar:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md px-2 py-1 focus:ring-cosechas-rojo/50 focus:outline-none cursor-pointer"
              >
                {[5, 10, 20, 50, 100].map(pageSize => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize} filas
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {ticketAResolver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700"
            >
              <div className="w-12 h-12 bg-cosechas-rojo/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-cosechas-rojo" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Resolución de Ticket #{ticketAResolver}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                Por favor, detalla la solución brindada. Una vez cerrado, el ticket no podrá ser modificado.
              </p>
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cosechas-rojo focus:border-cosechas-rojo mb-6 min-h-[120px] shadow-inner transition-all resize-none"
                placeholder="Ej: Se contactó al cliente y se ofreció un bono compensatorio tras verificar el error en la sede..."
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
              ></textarea>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setTicketAResolver(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCierre}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-cosechas-rojo hover:bg-cosechas-rojo/90 shadow-md shadow-cosechas-rojo/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Guardar y Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notaVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" 
            onClick={() => setNotaVisible(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full border-t-4 border-cosechas-verde" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-cosechas-verde/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-cosechas-verde" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Resolución</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-inner">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {notaVisible}
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setNotaVisible(null)} 
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketsTable;
