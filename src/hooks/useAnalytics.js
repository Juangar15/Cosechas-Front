import { useState, useEffect } from 'react';
import { fetchAnalyticsPQRS, fetchAnalyticsPQRSSedes, fetchAnalyticsFranquicias, fetchAnalyticsDomicilios, fetchAnalyticsPQRSMensual, fetchAnalyticsSedesImagen } from '../services/api.js';
import { supabase } from '../supabase.js';

export const useAnalytics = (session) => {
    const [periodo, setPeriodo] = useState('historico');
    const [dataPqrs, setDataPqrs] = useState(null);
    const [dataPqrsMensual, setDataPqrsMensual] = useState([]);
    const [dataPqrsSedes, setDataPqrsSedes] = useState([]);
    const [dataSedesImagen, setDataSedesImagen] = useState([]);
    const [dataFranquicias, setDataFranquicias] = useState([]);
    const [dataDomicilios, setDataDomicilios] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarAnaliticas = async () => {
        try {
            setCargando(true);
            const [resPqrs, resPqrsMensual, resPqrsSedes, resSedesImagen, resFranquicias, resDomicilios] = await Promise.all([
                fetchAnalyticsPQRS(periodo),
                fetchAnalyticsPQRSMensual(),
                fetchAnalyticsPQRSSedes(periodo),
                fetchAnalyticsSedesImagen(),
                fetchAnalyticsFranquicias(periodo),
                fetchAnalyticsDomicilios(periodo)
            ]);
            setDataPqrs(resPqrs);
            setDataPqrsMensual(resPqrsMensual);
            setDataPqrsSedes(resPqrsSedes);
            setDataSedesImagen(resSedesImagen);
            setDataFranquicias(resFranquicias);
            setDataDomicilios(resDomicilios);
        } catch (error) {
            console.error("Error al cargar analíticas:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (session) {
            cargarAnaliticas();

            // Configurar subscripciones en tiempo real
            const channel = supabase.channel('analytics-channel')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets_pqrs' }, () => {
                    cargarAnaliticas();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_franquicia' }, () => {
                    cargarAnaliticas();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_domicilios' }, () => {
                    cargarAnaliticas();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'sedes_oficiales' }, () => {
                    cargarAnaliticas();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, periodo]);

    return { periodo, setPeriodo, dataPqrs, dataPqrsMensual, dataPqrsSedes, dataSedesImagen, dataFranquicias, dataDomicilios, cargando, cargarAnaliticas };
};
