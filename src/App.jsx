import React, { useState, useEffect } from 'react';
import Login from './Login.jsx';
import Header from './components/Header.jsx';
import TicketsTable from './components/TicketsTable.jsx';
import FranquiciasTable from './components/FranquiciasTable.jsx';

import SedesTable from './components/SedesTable.jsx';
import { useSedes } from './hooks/useSedes.js';
import { MapPin } from 'lucide-react';

import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import ImageModal from './components/ImageModal.jsx';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Users, HeadphonesIcon, AlertTriangle, BarChart2 } from 'lucide-react';

// Hooks
import { useAuth } from './hooks/useAuth.js';
import { useTheme } from './hooks/useTheme.js';
import { useTickets } from './hooks/useTickets.js';
import { useFranquicias } from './hooks/useFranquicias.js';
import { useAnalytics } from './hooks/useAnalytics.js';

function App() {
  // 1. Extraemos los nuevos estados de autenticación
  const { session, rolUsuario, cargandoAuth, signOut } = useAuth();
  const { modoOscuro, toggleTheme } = useTheme();

  const ticketsHook = useTickets(session);
  const franquiciasHook = useFranquicias(session);
  const analyticsData = useAnalytics(session);

  const { sedes, cargando: cargandoSedes, cargarSedes } = useSedes(session, rolUsuario);

  const [fotoModal, setFotoModal] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('pqrs');

  // 2. Auto-seleccionar la pestaña correcta según el rol
  useEffect(() => {
    if (!rolUsuario) return;
    
    if (rolUsuario === 'admin' || rolUsuario === 'coord_sac' || rolUsuario === 'capacitador') {
      setVistaActiva('pqrs');
    } else if (rolUsuario === 'especialista_leads') {
      setVistaActiva('franquicias');
    } else if (['gerencia_juridica', 'gerente_talento_humano'].includes(rolUsuario)) {
      setVistaActiva('analytics');
    } else if (['abogado_sedes', 'espectador_sedes', 'montajes'].includes(rolUsuario)) {
      setVistaActiva('sedes');
    }
  }, [rolUsuario]);

  const recargarDatos = () => {
    if (vistaActiva === 'pqrs') {
      ticketsHook.cargarTickets();
    } else if (vistaActiva === 'franquicias') {
      franquiciasHook.cargarFranquicias();
    } else if (vistaActiva === 'analytics') {
      analyticsData.cargarAnaliticas();
    } else if (vistaActiva === 'sedes') {
      cargarSedes();
    }
  };

  // --- GUARDIANES DE SEGURIDAD ---

  // A. Pantalla de carga mientras verificamos roles en Supabase
  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cosechas-rojo mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Verificando credenciales de acceso...</p>
      </div>
    );
  }

  // B. Si no hay sesión, al Login
  if (!session) {
    return <Login />;
  }

  // C. Si inició sesión pero no está en la tabla de perfiles_usuarios
  if (rolUsuario === 'sin_rol') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Acceso Denegado</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
          Tu cuenta ha iniciado sesión correctamente, pero no tienes un rol asignado en el sistema operativo.
        </p>
        <button onClick={signOut} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold">
          Cerrar Sesión
        </button>
      </div>
    );
  }

  // --- RENDERIZADO DEL DASHBOARD (SI PASÓ LOS GUARDIANES) ---
  return (
    <div className="min-h-screen bg-madera-light/10 dark:bg-slate-900 font-sans transition-colors duration-300">

      <Header
        modoOscuro={modoOscuro}
        toggleTheme={toggleTheme}
        cargarTickets={recargarDatos}
        signOut={signOut}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
              Panel de Control Operativo
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl font-medium leading-relaxed">
              {rolUsuario === 'admin'
                ? "Gestión centralizada de incidencias (PQRS) y prospectos comerciales (Leads)."
                : rolUsuario === 'pqrs'
                  ? "Gestión de incidencias reportadas por los clientes vía WhatsApp."
                  : "Gestión de prospectos comerciales e interesados en nuevas franquicias."}
            </p>
          </motion.div>
        </div>

        {/* --- SISTEMA DE PESTAÑAS (CONDICIONAL POR ROL) --- */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 md:gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-px">

          {/* Pestaña PQRS */}
          {['admin', 'coord_sac', 'capacitador', 'gerencia_juridica'].includes(rolUsuario) && (
            <button
              onClick={() => setVistaActiva('pqrs')}
              className={`flex items-center whitespace-nowrap shrink-0 gap-2 px-4 md:px-6 py-3 font-bold text-sm rounded-t-xl transition-all font-sans ${vistaActiva === 'pqrs'
                ? 'bg-white dark:bg-slate-800 text-cosechas-rojo border-t border-x border-slate-200 dark:border-slate-700 shadow-[0_4px_0_0_#fff] dark:shadow-[0_4px_0_0_#1e293b] z-10 relative'
                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <HeadphonesIcon className="w-4 h-4" /> PQRS y Novedades
            </button>
          )}

          {/* Pestaña FRANQUICIAS */}
          {['admin', 'especialista_leads'].includes(rolUsuario) && (
            <button
              onClick={() => setVistaActiva('franquicias')}
              className={`flex items-center whitespace-nowrap shrink-0 gap-2 px-4 md:px-6 py-3 font-bold text-sm rounded-t-xl transition-all font-sans ${vistaActiva === 'franquicias'
                ? 'bg-white dark:bg-slate-800 text-cosechas-verde border-t border-x border-slate-200 dark:border-slate-700 shadow-[0_4px_0_0_#fff] dark:shadow-[0_4px_0_0_#1e293b] z-10 relative'
                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <Users className="w-4 h-4" /> Leads Comerciales
            </button>
          )}

          {/* Pestaña ANALÍTICAS */}
          {['admin', 'gerencia_juridica', 'montajes', 'gerente_talento_humano'].includes(rolUsuario) && (
            <button
              onClick={() => setVistaActiva('analytics')}
              className={`flex items-center whitespace-nowrap shrink-0 gap-2 px-4 md:px-6 py-3 font-bold text-sm rounded-t-xl transition-all font-sans ${vistaActiva === 'analytics'
                ? 'bg-white dark:bg-slate-800 text-cosechas-naranja1 border-t border-x border-slate-200 dark:border-slate-700 shadow-[0_4px_0_0_#fff] dark:shadow-[0_4px_0_0_#1e293b] z-10 relative'
                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <BarChart2 className="w-4 h-4" /> Estadísticas
            </button>
          )}

          {/* Pestaña SEDES */}
          {['admin', 'abogado_sedes', 'espectador_sedes', 'montajes'].includes(rolUsuario) && (
            <button
              onClick={() => setVistaActiva('sedes')}
              className={`flex items-center whitespace-nowrap shrink-0 gap-2 px-4 md:px-6 py-3 font-bold text-sm rounded-t-xl transition-all font-sans ${vistaActiva === 'sedes'
                ? 'bg-white dark:bg-slate-800 text-cosechas-purpura border-t border-x border-slate-200 dark:border-slate-700 shadow-[0_4px_0_0_#fff] dark:shadow-[0_4px_0_0_#1e293b] z-10 relative'
                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <MapPin className="w-4 h-4" /> Directorio Sedes
            </button>
          )}
        </div>

        {/* --- RENDERIZADO DE TABLAS Y DASHBOARDS --- */}
        {vistaActiva === 'pqrs' ? (
          ['admin', 'coord_sac', 'capacitador', 'gerencia_juridica'].includes(rolUsuario) ? (
            <TicketsTable 
              tickets={ticketsHook.tickets} 
              cargando={ticketsHook.cargando}
              total={ticketsHook.total}
              page={ticketsHook.page}
              pageSize={ticketsHook.pageSize}
              search={ticketsHook.search}
              estado={ticketsHook.estado}
              fechaInicio={ticketsHook.fechaInicio}
              fechaFin={ticketsHook.fechaFin}
              tipoReporte={ticketsHook.tipoReporte}
              motivo={ticketsHook.motivo}
              categoria={ticketsHook.categoria}
              orden={ticketsHook.orden}
              setPage={ticketsHook.setPage}
              setPageSize={ticketsHook.setPageSize}
              setSearch={ticketsHook.setSearch}
              setEstado={ticketsHook.setEstado}
              setFechaInicio={ticketsHook.setFechaInicio}
              setFechaFin={ticketsHook.setFechaFin}
              setTipoReporte={ticketsHook.setTipoReporte}
              setMotivo={ticketsHook.setMotivo}
              setCategoria={ticketsHook.setCategoria}
              setOrden={ticketsHook.setOrden}
              handleCambiarEstado={ticketsHook.handleCambiarEstado} 
              setFotoModal={setFotoModal}
              rolUsuario={rolUsuario}
            />
          ) : (
            <div className="p-8 text-center text-slate-500 font-bold bg-white dark:bg-slate-800 rounded-3xl border shadow-sm dark:border-slate-700">
                No tienes acceso a este módulo.
            </div>
          )
        ) : vistaActiva === 'franquicias' ? (
            <FranquiciasTable 
              franquicias={franquiciasHook.franquicias} 
              cargando={franquiciasHook.cargando}
              total={franquiciasHook.total}
              page={franquiciasHook.page}
              pageSize={franquiciasHook.pageSize}
              search={franquiciasHook.search}
              estado={franquiciasHook.estado}
              fechaInicio={franquiciasHook.fechaInicio}
              fechaFin={franquiciasHook.fechaFin}
              orden={franquiciasHook.orden}
              setPage={franquiciasHook.setPage}
              setPageSize={franquiciasHook.setPageSize}
              setSearch={franquiciasHook.setSearch}
              setEstado={franquiciasHook.setEstado}
              setFechaInicio={franquiciasHook.setFechaInicio}
              setFechaFin={franquiciasHook.setFechaFin}
              setOrden={franquiciasHook.setOrden}
              handleCambiarEstado={franquiciasHook.handleCambiarEstado} 
            />
        ) : vistaActiva === 'sedes' ? (
          cargandoSedes ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cargando directorio de sedes...</p>
            </div>
          ) : (
            <SedesTable sedes={sedes} cargarSedes={cargarSedes} rolUsuario={rolUsuario} />
          )
        ) : (
          <AnalyticsDashboard analyticsData={analyticsData} modoOscuro={modoOscuro} rolUsuario={rolUsuario} />
        )}
      </main>

      <ImageModal fotoModal={fotoModal} setFotoModal={setFotoModal} />
    </div>
  );
}

export default App;
