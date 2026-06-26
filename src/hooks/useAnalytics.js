import { useState, useEffect } from 'react';
import { fetchAnalyticsPQRS, fetchAnalyticsPQRSSedes, fetchAnalyticsFranquicias, fetchAnalyticsDomicilios, fetchAnalyticsPQRSMensual, fetchAnalyticsSedesImagen, fetchAnalyticsCandidatos } from '../services/api.js';
import { supabase } from '../supabase.js';

export const useAnalytics = (session) => {
    const [periodo, setPeriodo] = useState('historico');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [dataPqrs, setDataPqrs] = useState(null);
    const [dataPqrsMensual, setDataPqrsMensual] = useState([]);
    const [dataPqrsSedes, setDataPqrsSedes] = useState([]);
    const [dataSedesImagen, setDataSedesImagen] = useState([]);
    const [dataFranquicias, setDataFranquicias] = useState([]);
    const [dataDomicilios, setDataDomicilios] = useState([]);
    const [dataCandidatos, setDataCandidatos] = useState(null);
    const [cargando, setCargando] = useState(true);

    const cargarAnaliticas = async () => {
        try {
            setCargando(true);
            const [resPqrs, resPqrsMensual, resPqrsSedes, resSedesImagen, resFranquicias, resDomicilios, resCandidatos] = await Promise.all([
                fetchAnalyticsPQRS(periodo, fechaInicio, fechaFin),
                fetchAnalyticsPQRSMensual(periodo, fechaInicio, fechaFin),
                fetchAnalyticsPQRSSedes(periodo, fechaInicio, fechaFin),
                fetchAnalyticsSedesImagen(),
                fetchAnalyticsFranquicias(periodo, fechaInicio, fechaFin),
                fetchAnalyticsDomicilios(periodo, fechaInicio, fechaFin),
                fetchAnalyticsCandidatos(periodo, fechaInicio, fechaFin)
            ]);
            setDataPqrs(resPqrs);
            setDataPqrsMensual(resPqrsMensual);
            setDataPqrsSedes(resPqrsSedes);
            setDataSedesImagen(resSedesImagen);
            setDataFranquicias(resFranquicias);
            setDataDomicilios(resDomicilios);
            setDataCandidatos(resCandidatos);
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
                .on('postgres_changes', { event: '*', schema: 'public', table: 'candidatos_corporativos' }, () => {
                    cargarAnaliticas();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, periodo, fechaInicio, fechaFin]);

    return { periodo, setPeriodo, fechaInicio, setFechaInicio, fechaFin, setFechaFin, dataPqrs, dataPqrsMensual, dataPqrsSedes, dataSedesImagen, dataFranquicias, dataDomicilios, dataCandidatos, cargando, cargarAnaliticas };
};
