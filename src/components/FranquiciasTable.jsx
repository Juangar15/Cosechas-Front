import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, Search, ChevronLeft, ChevronRight, Store, MessageCircle, Filter, Clock, AlertTriangle, Download, Camera } from 'lucide-react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { exportarAExcel } from '../utils/exportExcel.js';
import ImageModal from './ImageModal.jsx';
import { fetchFranquicias } from '../services/api.js';

const calcularSLA = (fechaCreacion, estado) => {
  if (estado !== 'Pendiente') return { color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700', texto: 'Completado', nivel: 0 };
  if (!fechaCreacion) return { color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700', texto: 'N/A', nivel: 0 };

  const creacion = new Date(fechaCreacion);
  const ahora = new Date();
  const horasTranscurridas = Math.abs(ahora - creacion) / 36e5;

  if (horasTranscurridas > 48) {
    return { color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30', texto: `+${Math.floor(horasTranscurridas)}h Vencido`, nivel: 3 };
  } else if (horasTranscurridas > 24) {
    return { color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30', texto: `${Math.floor(horasTranscurridas)}h Alerta`, nivel: 2 };
  } else {
    return { color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30', texto: `${Math.floor(horasTranscurridas)}h OK`, nivel: 1 };
  }
};

const FranquiciasTable = ({ franquicias, cargando, total, page, pageSize, search, estado, fechaInicio, fechaFin, orden, setPage, setPageSize, setSearch, setEstado, setFechaInicio, setFechaFin, setOrden, handleCambiarEstado }) => {
    const [ticketAResolver, setTicketAResolver] = useState(null);
    const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [notaTexto, setNotaTexto] = useState('');
    const [nuevoEstadoPendiente, setNuevoEstadoPendiente] = useState('');
    const [notaVisible, setNotaVisible] = useState(null);
    const [fotoModal, setFotoModal] = useState(null);

    const onSelectChange = (solicitudId, nuevoEstado) => {
        if (nuevoEstado === 'Contactado' || nuevoEstado === 'Descartado') {
            setTicketAResolver(solicitudId);
            setNuevoEstadoPendiente(nuevoEstado);
            setNotaTexto('');
        } else {
            const loadingToast = toast.loading('Actualizando prospecto...');
            handleCambiarEstado(solicitudId, nuevoEstado)
                .then(() => toast.dismiss(loadingToast))
                .catch(() => toast.dismiss(loadingToast));
        }
    };

    const confirmarCierre = () => {
        if (notaTexto.trim() === '') {
            toast.error('Por favor, ingresa los detalles de la gestión.');
            return;
        }
        const loadingToast = toast.loading('Guardando gestión...');
        handleCambiarEstado(ticketAResolver, nuevoEstadoPendiente, notaTexto)
            .then(() => toast.dismiss(loadingToast))
            .catch(() => toast.dismiss(loadingToast));
        setTicketAResolver(null);
    };

    const handleExportar = async () => {
        try {
            setExportando(true);
            const toastId = toast.loading('Extrayendo datos de Leads para Excel...');
            
            const res = await fetchFranquicias(1, 10000, search, estado, fechaInicio, fechaFin);
            const datosCompletos = res.data || [];
            
            if (datosCompletos.length === 0) {
                toast.error('No hay datos que coincidan con los filtros.', { id: toastId });
                return;
            }
            
            exportarAExcel(datosCompletos, 'Reporte_Leads', (lead) => ({
                ID: lead.id,
                'Fecha Creación': new Date(lead.fecha_creacion).toLocaleString(),
                Estado: lead.estado,
                'Tipo Franquicia': lead.tipo_franquicia || 'N/A',
                'Nombre': lead.nombre || 'N/A',
                'Celular': lead.celular,
                'Correo': lead.correo || 'N/A',
                'Ciudad': lead.ciudad || 'N/A',
                'Local Identificado': lead.local_identificado || 'N/A',
                'Dirección Local': lead.direccion_local || 'N/A',
                'Involucramiento': lead.involucramiento || 'N/A',
                'Nota Resolucion': lead.nota_resolucion || 'N/A'
            }));
            
            toast.success(`Se exportaron ${datosCompletos.length} prospectos.`, { id: toastId });
        } catch (error) {
            console.error("Error al exportar:", error);
            toast.error('Hubo un error al generar el Excel.');
        } finally {
            setExportando(false);
        }
    };

    // Columnas ajustadas para no generar scroll horizontal
    const columns = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: info => <span className="font-black text-slate-900 dark:text-white">#{info.getValue()}</span>
        },
        {
            accessorKey: 'celular',
            header: 'Contacto Prospecto',
            cell: ({ row }) => {
                const celular = row.original.celular;
                const nombre = row.original.nombre || 'Sin nombre';
                const correo = row.original.correo || 'Sin correo';
                const celularLimpio = celular ? celular.replace(/\D/g, '') : '';
                return (
                    <div className="flex flex-col gap-1 min-w-[150px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{nombre}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-cosechas-verde dark:text-emerald-400 text-xs">{celular}</span>
                            {celularLimpio && (
                                <a
                                    href={`https://wa.me/${celularLimpio}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-cosechas-verde/10 text-cosechas-verde hover:bg-cosechas-verde hover:text-white rounded-md transition-colors border border-cosechas-verde/20"
                                    title="Contactar por WhatsApp"
                                >
                                    <MessageCircle className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        {correo !== 'Sin correo' && <span className="text-xs text-slate-500 dark:text-slate-400 break-all">{correo}</span>}
                    </div>
                );
            }
        },
        {
            accessorKey: 'perfil',
            header: 'Detalles del Local',
            cell: ({ row }) => {
                const ciudad = row.original.ciudad;
                const local = row.original.local_identificado;
                const direccion = row.original.direccion_local;
                const foto = row.original.foto_local;
                const rol = row.original.involucramiento;
                
                return (
                    <div className="flex flex-col min-w-[150px] gap-1">
                        {ciudad && ciudad !== 'No especificada' && (
                            <span className="text-[10px] font-bold text-cosechas-rojo uppercase tracking-widest opacity-80">
                                📍 {ciudad}
                            </span>
                        )}
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                            <strong>Local:</strong> {local}
                        </span>
                        {direccion && (
                            <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={direccion}>
                                <strong>Dir:</strong> {direccion}
                            </span>
                        )}
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                            <strong>Rol:</strong> {rol}
                        </span>
                        {foto && foto !== 'No adjuntó foto' && foto.startsWith('http') && (
                            <button 
                                onClick={() => setFotoModal(foto)}
                                className="mt-1 flex items-center justify-center gap-1 text-[10px] bg-cosechas-verde/10 text-cosechas-verde hover:bg-cosechas-verde hover:text-white px-2 py-1 rounded transition-colors font-bold w-fit"
                            >
                                <Camera className="w-3 h-3" /> Ver Foto
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'tipo_franquicia',
            header: 'Interés',
            cell: ({ row }) => {
                const tipo = row.original.tipo_franquicia || 'No especificado';
                let colorClass = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
                
                if (tipo.includes("Nueva")) colorClass = "bg-cosechas-verde/10 text-cosechas-verde border-cosechas-verde/30";
                else if (tipo.includes("Operación") || tipo.includes("operacion")) colorClass = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30";
                
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${colorClass}`}>
                            {tipo.toUpperCase()}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'sla',
            header: () => <div className="text-center">SLA</div>,
            cell: ({ row }) => {
                const lead = row.original;
                const sla = calcularSLA(lead.fecha_creacion, lead.estado);
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
            header: () => <div className="text-center">Estado Comercial</div>,
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                        {lead.estado === 'Pendiente' && (
                            <span className="inline-flex items-center justify-center gap-1.5 bg-cosechas-rojo/10 text-cosechas-rojo px-2.5 py-1 rounded-full text-[11px] font-bold border border-cosechas-rojo/20 w-full whitespace-nowrap">
                                <span className="h-1.5 w-1.5 rounded-full bg-cosechas-rojo animate-pulse"></span> Pendiente
                            </span>
                        )}
                        {lead.estado === 'Contactado' && (
                            <span className="inline-flex items-center justify-center bg-cosechas-verde/10 text-cosechas-verde px-2.5 py-1 rounded-full text-[11px] font-bold border border-cosechas-verde/30 w-full whitespace-nowrap">
                                ✅ Contactado
                            </span>
                        )}
                        {lead.estado === 'Descartado' && (
                            <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-600 w-full whitespace-nowrap">
                                ❌ Descartado
                            </span>
                        )}
                        {lead.nota_resolucion && (
                            <button
                                onClick={() => setNotaVisible(lead.nota_resolucion)}
                                className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600 w-full justify-center"
                            >
                                <FileText className="w-3 h-3" /> Ver Gestión
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'accion',
            header: () => <div className="text-right">Acción</div>,
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <div className="text-right">
                        <select
                            value={lead.estado}
                            onChange={(e) => onSelectChange(lead.id, e.target.value)}
                            disabled={lead.estado === 'Contactado' || lead.estado === 'Descartado'}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-2 py-1.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cosechas-verde/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-[115px]"
                        >
                            {lead.estado === 'Pendiente' && <option value="Pendiente">🔴 Pendiente</option>}
                            {lead.estado !== 'Descartado' && <option value="Contactado">✅ {lead.estado === 'Contactado' ? 'Contactado' : 'Contactar'}</option>}
                            {lead.estado !== 'Contactado' && <option value="Descartado">❌ {lead.estado === 'Descartado' ? 'Descartado' : 'Descartar'}</option>}
                        </select>
                    </div>
                );
            }
        }
    ], []);

    const table = useReactTable({
        data: franquicias || [],
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
            {/* BARRA SUPERIOR DE BÚSQUEDA Y FILTROS */}
            <div className="flex flex-col gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                            <Search className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar prospecto por celular, dirección o dudas..."
                            className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cosechas-verde/50 text-slate-700 dark:text-slate-200 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Estado:</span>
                        <select
                            value={estado}
                            onChange={e => setEstado(e.target.value)}
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cosechas-verde/50 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
                        >
                            <option value="">Todos los Leads</option>
                            <option value="Pendiente">🔴 Pendientes</option>
                            <option value="Contactado">✅ Contactados</option>
                            <option value="Descartado">❌ Descartados</option>
                        </select>
                        <select
                            value={orden}
                            onChange={(e) => setOrden(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cosechas-verde/50 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
                        >
                            <option value="desc">Más Recientes</option>
                            <option value="asc">Más Antiguos</option>
                        </select>
                        <button 
                            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${mostrarFiltrosAvanzados ? 'bg-cosechas-verde text-white border-cosechas-verde shadow-md' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha Inicio</label>
                                    <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cosechas-verde/50 outline-none" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha Fin</label>
                                    <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cosechas-verde/50 outline-none" />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={() => {
                                            setFechaInicio(''); setFechaFin(''); setSearch(''); setEstado('');
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

            {/* TABLA DE PROSPECTOS */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 relative z-10"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-700/50 text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
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
                                            No se encontraron prospectos comerciales.
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN CON SELECTOR DE FILAS */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-700/50 gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Página <span className="font-bold text-slate-700 dark:text-slate-200">{table.getState().pagination.pageIndex + 1}</span> de <span className="font-bold text-slate-700 dark:text-slate-200">{table.getPageCount()}</span>
                        </span>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Mostrar:</span>
                            <select
                                value={table.getState().pagination.pageSize}
                                onChange={e => table.setPageSize(Number(e.target.value))}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md px-2 py-1 focus:ring-cosechas-verde/50 focus:outline-none cursor-pointer"
                            >
                                {[5, 10, 20, 50, 100].map(pageSize => (
                                    <option key={pageSize} value={pageSize}>{pageSize} filas</option>
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

            {/* MODAL DE REGISTRAR GESTIÓN (Oscuro) */}
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
                            <div className="w-12 h-12 bg-cosechas-verde/10 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-6 h-6 text-cosechas-verde" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Registrar Gestión Comercial</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                                Añade los detalles de la llamada, cotización o reunión con este prospecto (ID #{ticketAResolver}).
                            </p>
                            <textarea
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cosechas-verde focus:border-cosechas-verde mb-6 min-h-[120px] shadow-inner transition-all resize-none"
                                placeholder="Ej: Se le envió cotización formal por correo y se agendó reunión para el viernes..."
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
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-cosechas-verde hover:bg-cosechas-verde/90 shadow-md shadow-cosechas-verde/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Guardar Gestión
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL PARA VER GESTIÓN (Oscuro) */}
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
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Detalle de Gestión</h3>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-inner">
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{notaVisible}</p>
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
            <ImageModal fotoModal={fotoModal} setFotoModal={setFotoModal} />
        </div>
    );
};

export default FranquiciasTable;
