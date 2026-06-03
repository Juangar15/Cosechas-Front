import React from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, Filter, HeadphonesIcon, CheckCircle2, Percent, TrendingUp, Download, Users } from 'lucide-react';
import { exportarAExcel } from '../utils/exportExcel.js';
import { supabase } from '../supabase.js';
import toast from 'react-hot-toast';

const COLORS = ['#16a34a', '#15803d', '#14532d', '#22c55e', '#4ade80', '#86efac'];

const AnalyticsDashboard = ({ analyticsData, modoOscuro, rolUsuario }) => {
    const { periodo, setPeriodo, dataPqrs, dataPqrsMensual, dataPqrsSedes, dataSedesImagen, dataFranquicias, dataDomicilios, cargando } = analyticsData;
    const [filtroImagen, setFiltroImagen] = React.useState('');

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando métricas en tiempo real...</p>
            </div>
        );
    }

    const exportarIndividual = (data, nombreHoja, sufijoArchivo) => {
        const datos = {};
        datos[nombreHoja] = data;
        exportarAExcel(datos, `${sufijoArchivo}_${periodo}`);
    };

    const handleExportar = () => {
        if (rolUsuario === 'montajes') {
            const datos = {
                'Estado_Imagen': dataSedesImagen?.map(item => ({ Estado: item.name, Cantidad: item.value })) || []
            };
            exportarAExcel(datos, `Estado_Imagen_Sedes_${periodo}`);
            return;
        }

        const datos = {
            'Resumen_General': [{
                Periodo: periodo,
                'Total PQRS': dataPqrs?.total || 0,
                'PQRS Resueltas': dataPqrs?.cerrados || 0,
                'Tasa de Resolución (%)': dataPqrs?.tasa_resolucion ? dataPqrs.tasa_resolucion.toFixed(1) : '0.0'
            }],
            'PQRS_Sedes': dataPqrsSedes?.map(item => ({ Sede: item.sede, 'Cantidad PQRS': item.cantidad })) || [],
            'Leads_Franquicias': dataFranquicias?.map(item => ({ Ciudad: item.ciudad, 'Cantidad Leads': item.cantidad })) || [],
            'Domicilios': dataDomicilios?.map(item => ({ Sede: item.sede, 'Recomendaciones': item.recomendaciones })) || [],
            'Tendencia_Mensual': dataPqrsMensual?.map(item => ({ Mes: item.mes, Cantidad: item.cantidad })) || [],
            'Estado_Imagen': dataSedesImagen?.map(item => ({ Estado: item.name, Cantidad: item.value })) || []
        };
        
        exportarAExcel(datos, `Estadisticas_Completas_${periodo}`);
    };

    const renderGraficoImagen = () => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Estado de Nueva Imagen</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sedes Operando</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select 
                        value={filtroImagen}
                        onChange={e => setFiltroImagen(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
                    >
                        <option value="">Todas</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                        <option value="Próximo">Próximo</option>
                    </select>
                    <button 
                        onClick={async () => {
                            let query = supabase.from('sedes_oficiales').select('ceco_nombre, tercero_nit, tercero_razon_social, pdv_nueva_imagen').eq('pdv_estado', 'OPERANDO');
                            if (filtroImagen) {
                                query = query.eq('pdv_nueva_imagen', filtroImagen);
                            }
                            const { data, error } = await query;
                            if (error) { toast.error('Error al descargar'); return; }
                            if (!data || data.length === 0) { toast.error('No hay datos con ese filtro'); return; }
                            const datosExportar = data.map(sede => ({
                                'Nombre Sede': sede.ceco_nombre || 'Sin Nombre',
                                'NIT': sede.tercero_nit || 'No Registrado',
                                'Razón Social': sede.tercero_razon_social || 'No Registrado',
                                'Nueva Imagen': sede.pdv_nueva_imagen || 'No Registrado'
                            }));
                            exportarAExcel({'Reporte_Imagen': datosExportar}, `Reporte_Imagen_Detallado_${periodo}`);
                            toast.success('Reporte descargado correctamente');
                        }}
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors border border-blue-100 dark:border-blue-800/50 flex items-center gap-2 font-bold text-sm" title="Descargar reporte con NIT y Razón Social"
                    >
                        <Download className="w-4 h-4" /> Detallado
                    </button>
                    <button 
                        onClick={() => exportarIndividual(dataSedesImagen?.map(item => ({ Estado: item.name, Cantidad: item.value })) || [], 'Estado_Imagen', 'Reporte_Imagen_Resumen')}
                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800/50" title="Exportar resumen gráfico"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
                {dataSedesImagen && dataSedesImagen.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <PieChart>
                            <Pie
                                data={dataSedesImagen}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {dataSedesImagen.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
                                    fontWeight: 'bold',
                                    backgroundColor: modoOscuro ? '#1e293b' : '#ffffff',
                                    color: modoOscuro ? '#f8fafc' : '#1e293b'
                                }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: modoOscuro ? '#cbd5e1' : '#475569' }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                        No hay datos de imagen registrados.
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 relative z-10"
        >
            {/* CONTROLES GLOBALES */}

            {/* VISTA MONTAJES: SOLO GRAFICO DE NUEVA IMAGEN */}
            {rolUsuario === 'montajes' && renderGraficoImagen()}

            {/* VISTA GENERAL: RESTO DE GRÁFICOS (PQRS, Domicilios, etc) */}
            {rolUsuario !== 'montajes' && (
                <>
                    {/* TARJETAS RESUMEN DE PQRS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-cosechas-rojo/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-cosechas-rojo/10 rounded-2xl flex items-center justify-center text-cosechas-rojo shadow-inner">
                            <HeadphonesIcon className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-500 dark:text-slate-400">Total PQRS</h3>
                    </div>
                    <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        {dataPqrs?.total || 0}
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-cosechas-verde/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-cosechas-verde/10 rounded-2xl flex items-center justify-center text-cosechas-verde shadow-inner">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-500 dark:text-slate-400">Tickets Cerrados</h3>
                    </div>
                    <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        {dataPqrs?.cerrados || 0}
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                            <Percent className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-500 dark:text-slate-400">Resolución</h3>
                    </div>
                    <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-1">
                        {dataPqrs?.tasa_resolucion ? dataPqrs.tasa_resolucion.toFixed(1) : '0.0'}<span className="text-2xl text-slate-400">%</span>
                    </div>
                </motion.div>
            </div>

            {/* SECCIÓN DE GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* GRÁFICO BARRAS: FRANQUICIAS */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Potenciales Franquiciados (Leads)</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Top 10 Ciudades con Interés</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => exportarIndividual(dataFranquicias?.map(item => ({ Ciudad: item.ciudad, 'Cantidad Leads': item.cantidad })) || [], 'Leads', 'Reporte_Leads')}
                            className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800/50" title="Exportar solo este gráfico"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="flex-1 min-h-[300px] w-full">
                        {dataFranquicias && dataFranquicias.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <BarChart data={dataFranquicias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis 
                                        dataKey="ciudad" 
                                        tick={{ fill: modoOscuro ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis 
                                        tick={{ fill: modoOscuro ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <RechartsTooltip 
                                        cursor={{ fill: modoOscuro ? '#334155' : '#f1f5f9' }}
                                        contentStyle={{ 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
                                            fontWeight: 'bold',
                                            backgroundColor: modoOscuro ? '#1e293b' : '#ffffff',
                                            color: modoOscuro ? '#f8fafc' : '#1e293b'
                                        }}
                                        itemStyle={{ color: modoOscuro ? '#4ade80' : '#16a34a' }}
                                    />
                                    <Bar dataKey="cantidad" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                                No hay datos en este periodo.
                            </div>
                        )}
                    </div>
                </div>

                {/* GRÁFICO TORTA: DOMICILIOS */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Hit Rate Domicilios</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Top Sedes Más Recomendadas</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => exportarIndividual(dataDomicilios?.map(item => ({ Sede: item.sede, 'Recomendaciones': item.recomendaciones })) || [], 'Domicilios', 'Reporte_Domicilios')}
                            className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800/50" title="Exportar solo este gráfico"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-[300px] w-full">
                        {dataDomicilios && dataDomicilios.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <PieChart>
                                    <Pie
                                        data={dataDomicilios}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="recomendaciones"
                                        nameKey="sede"
                                        stroke="none"
                                    >
                                        {dataDomicilios.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
                                            fontWeight: 'bold',
                                            backgroundColor: modoOscuro ? '#1e293b' : '#ffffff',
                                            color: modoOscuro ? '#f8fafc' : '#1e293b'
                                        }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: modoOscuro ? '#cbd5e1' : '#475569' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                                No hay datos en este periodo.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* GRÁFICO BARRAS: PQRS POR SEDE (NUEVO) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col mt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <HeadphonesIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Incidencias (PQRS) por Sede</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Volumen de Novedades Registradas</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => exportarIndividual(dataPqrsSedes?.map(item => ({ Sede: item.sede, 'Cantidad PQRS': item.cantidad })) || [], 'PQRS_Sedes', 'Reporte_PQRS_Sedes')}
                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800/50" title="Exportar solo este gráfico"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
                
                <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
                    {dataPqrsSedes && dataPqrsSedes.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={dataPqrsSedes.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis 
                                    dataKey="sede" 
                                    tick={{ fill: modoOscuro ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <YAxis 
                                    tick={{ fill: modoOscuro ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: modoOscuro ? '#334155' : '#f1f5f9' }}
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
                                        fontWeight: 'bold',
                                        backgroundColor: modoOscuro ? '#1e293b' : '#ffffff',
                                        color: modoOscuro ? '#f8fafc' : '#1e293b'
                                    }}
                                    itemStyle={{ color: modoOscuro ? '#fb923c' : '#ea580c' }}
                                    formatter={(value) => [`${value} PQRS`, 'Cantidad']}
                                />
                                <Bar dataKey="cantidad" fill="#ea580c" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                            No hay datos en este periodo.
                        </div>
                    )}
                </div>
            </div>

            {/* GRÁFICO BARRAS: TENDENCIA MENSUAL (NUEVO) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col mt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Tendencia Mensual de PQRS</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Evolución Histórica</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => exportarIndividual(dataPqrsMensual?.map(item => ({ Mes: item.mes, Cantidad: item.cantidad })) || [], 'Tendencia_Mensual', 'Reporte_Tendencia_Mensual')}
                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800/50" title="Exportar solo este gráfico"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
                
                <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
                    {dataPqrsMensual && dataPqrsMensual.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <BarChart data={dataPqrsMensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis 
                                    dataKey="mes" 
                                    tick={{ fill: modoOscuro ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <YAxis 
                                    tick={{ fill: modoOscuro ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: modoOscuro ? '#334155' : '#f1f5f9' }}
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
                                        fontWeight: 'bold',
                                        backgroundColor: modoOscuro ? '#1e293b' : '#ffffff',
                                        color: modoOscuro ? '#f8fafc' : '#1e293b'
                                    }}
                                    itemStyle={{ color: modoOscuro ? '#818cf8' : '#4f46e5' }}
                                    formatter={(value) => [`${value} PQRS`, 'Cantidad']}
                                />
                                <Bar dataKey="cantidad" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                            Aún no hay suficientes datos históricos.
                        </div>
                    )}
                </div>
            </div>

            {/* GRÁFICO NUEVA IMAGEN (Visible para admin y gerencia_juridica también) */}
            {['admin', 'gerencia_juridica'].includes(rolUsuario) && renderGraficoImagen()}
            </>
            )}
        </motion.div>
    );
};

export default AnalyticsDashboard;
