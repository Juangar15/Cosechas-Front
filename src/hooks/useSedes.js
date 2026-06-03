import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';
import toast from 'react-hot-toast';

export const useSedes = (session, rolUsuario) => {
    const [sedes, setSedes] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarSedes = useCallback(async () => {
        if (!session) return;

        try {
            const { data, error } = await supabase
                .from('sedes_oficiales')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            
            // Filtro local para el espectador (complementa la seguridad de RLS)
            if (rolUsuario === 'espectador_sedes') {
                setSedes(data ? data.filter(s => ['OPERANDO', 'CERRADO'].includes(s.pdv_estado)) : []);
            } else {
                setSedes(data || []);
            }
        } catch (error) {
            console.error('Error cargando sedes:', error.message);
            toast.error('Error al sincronizar el directorio de sedes');
        }
    }, [session]);

    useEffect(() => {
        if (!session) return;

        // 1. Carga inicial de datos (encendemos el spinner de carga)
        setCargando(true);
        cargarSedes().finally(() => setCargando(false));

        // 2. CONEXIÓN EN TIEMPO REAL (El "Escuchador")
        const suscripcionSedes = supabase
            .channel('cambios-directorio-sedes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Escucha TODO: Insert (Nuevo), Update (Editar) y Delete (Borrar)
                    schema: 'public',
                    table: 'sedes_oficiales'
                },
                (payload) => {
                    console.log('Sincronización en tiempo real detectada:', payload);
                    // Cuando alguien cambia algo, recargamos la tabla de forma silenciosa 
                    // (sin activar el spinner de cargando para que la pantalla no parpadee)
                    cargarSedes();
                }
            )
            .subscribe();

        // 3. Limpiar la suscripción si el usuario cambia de pantalla o cierra sesión
        return () => {
            supabase.removeChannel(suscripcionSedes);
        };
    }, [session, cargarSedes]);

    return { sedes, cargando, cargarSedes };
};