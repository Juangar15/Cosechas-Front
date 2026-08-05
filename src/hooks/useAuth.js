import { useState, useEffect } from 'react';
import { supabase } from '../supabase.js'; // Asegúrate de que la ruta sea correcta
import { fetchUserRole } from '../services/api';

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [rolUsuario, setRolUsuario] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión actual al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Limpiamos la URL para evitar que el token quede en el historial
        if (window.location.hash.includes('access_token') || window.location.hash.includes('type=')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
      if (session?.user?.email) {
        obtenerYGuardarRol(session.user.email);
      } else {
        setCargandoAuth(false);
      }
    });

    // 2. Escuchar cambios (cuando inician o cierran sesión)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        if (window.location.hash.includes('access_token') || window.location.hash.includes('type=')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
      if (session?.user?.email) {
        obtenerYGuardarRol(session.user.email);
      } else {
        setRolUsuario(null);
        setCargandoAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función auxiliar para buscar el rol
  const obtenerYGuardarRol = async (email) => {
    setCargandoAuth(true);
    const rol = await fetchUserRole(email);
    setRolUsuario(rol);
    setCargandoAuth(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRolUsuario(null);
  };

  return { session, rolUsuario, cargandoAuth, signOut };
};