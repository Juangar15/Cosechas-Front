import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Store, MapPin, Phone, Edit, Eye, X, Save, Plus, AlertCircle, Bell, BellRing, Clock, Download } from 'lucide-react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { supabase } from '../supabase.js';
import toast from 'react-hot-toast';
import colombiaData from '../data/colombia.json';
import { exportarAExcel } from '../utils/exportExcel.js';

// --- DICCIONARIO DE DATOS CON REGLAS ESTRICTAS ---
const FORM_SECTIONS = {
    "Centro de Costos": [
        { name: 'ceco_nombre', label: 'Nombre CECO', required: true },
        { name: 'ceco_hgi_cosechas', label: 'CECO HGI Cosechas', required: true, type: 'number' },
        { name: 'ceco_dependencia_hgi', label: 'Dependencia HGI', readOnly: true, placeholder: 'Auto-generado (F...)' },
        { name: 'ceco_zona_hgi', label: 'Zona HGI', required: true, type: 'select', options: ['Amazonas', 'Antioquia', 'Chocó', 'Costa', 'Cundinamarca-Boyacá', 'Eje Cafetero', 'La Dorada-Doradal-Puerto Boyacá', 'Meta-Casanare', 'Monteria San Andrés', 'Santanderes', 'Tolima-Huila', 'Valle-Cauca-Nariño', 'Valledupar-Guajira'] }
    ],
    "Tercero (Franquiciado)": [
        { name: 'tercero_nit', label: 'NIT / CC', required: true, mask: 'nit', placeholder: 'Ej: 900.111.222' },
        { name: 'tercero_razon_social', label: 'Razón Social', required: true, maxLength: 30 },
        { name: 'tercero_rep_legal', label: 'Representante Legal', required: true, maxLength: 50 },
        { name: 'tercero_celular_rl', label: 'Celular R.L.', mask: 'phone', placeholder: '10 dígitos' },
        { name: 'tercero_correo', label: 'Correo Electrónico', type: 'email' },
        { name: 'tercero_correo_cc', label: 'Correo Cámara Comercio', type: 'email' },
        { name: 'tercero_tipo_franquiciado', label: 'Tipo Franquiciado', required: true, type: 'select', options: ['FRANQUICIADO', 'FRANQUICIANTE', 'SUBFRANQUICIADO', 'ZONA'] },
        { name: 'tercero_regimen_trib', label: 'Régimen Tributario', required: true, type: 'select', options: ['ORDINARIO (COMÚN)', 'SIMPLE TRIBUTACIÓN'] }
    ],
    "Franquiciado Zonal": [
        { name: 'zonal_nombre', label: 'Nombre Zonal', allowNA: true },
        { name: 'zonal_telefono', label: 'Teléfono Zonal', allowNA: true, mask: 'phone' },
        { name: 'zonal_correo', label: 'Correo Zonal', allowNA: true }
    ],
    "Punto de Venta": [
        { name: 'pdv_estado', label: 'Estado', required: true, type: 'select', options: ['CERRADO', 'CERRADO TEMPORAL', 'OPERANDO', 'SIN PTO', 'TRASLADO', 'ZONA', 'ZONA SIN PTO'] },
        { name: 'pdv_direccion', label: 'Dirección', required: true },
        { name: 'pdv_ubicacion', label: 'Barrio / Ubicación', allowNA: true },
        { name: 'pdv_departamento', label: 'Departamento', required: true, type: 'departamento' },
        { name: 'pdv_ciudad', label: 'Ciudad', required: true, type: 'ciudad' },
        { name: 'pdv_cc_mall_calle', label: 'CC / Mall / Calle' },
        { name: 'latitud', label: 'Latitud', type: 'number', step: 'any' },
        { name: 'longitud', label: 'Longitud', type: 'number', step: 'any' },
        { name: 'pdv_burbuja_local', label: 'Burbuja / Local', type: 'select', options: ['Burbuja', 'Local', 'N/A'] },
        { name: 'pdv_horario', label: 'Horario', placeholder: 'Ej: L-V 8am a 6pm', allowNA: true },
        { name: 'pdv_nueva_imagen', label: 'Nueva Imagen', type: 'select', options: ['Sí', 'No', 'Próximo'] },
        { name: 'pdv_tv', label: 'Tiene TV', type: 'select', options: ['Si', 'No'] },
        // Campos Condicionales de TV
        { name: 'pdv_tv_cantidad', label: 'Cantidad TV', type: 'select', options: ['1', '2'], condition: { field: 'pdv_tv', value: 'Si' } },
        { name: 'pdv_aplicacion', label: 'Aplicación TV', type: 'select', options: ['Maginfo', 'CosechasTV', 'USB'], condition: { field: 'pdv_tv', value: 'Si' } },

        { name: 'pdv_telefono', label: 'Teléfono Fijo', mask: 'phone', allowNA: true },
        { name: 'pdv_celular', label: 'Celular PDV', mask: 'phone', allowNA: true },

        { name: 'pdv_fecha_apertura', label: 'Fecha Apertura', required: true, type: 'date', allowNA: true },
        { name: 'pdv_fecha_cierre', label: 'Fecha Cierre', type: 'date', allowNA: true },
        { name: 'pdv_asesora_callcenter', label: 'Asesora Call Center', required: true, type: 'select', options: ['Karen Mahecha', 'Luisa Marin', 'Yeiner Andres Baloyes', '#N/D'] },
        { name: 'pdv_aplicacion_rappi', label: 'Aplicación', required: true, type: 'select', options: ['Didi', 'Rappi', 'No'] }
    ],
    "Administrador": [
        { name: 'admin_nombre', label: 'Nombre Administrador', allowNA: true },
        { name: 'admin_celular', label: 'Celular Administrador', allowNA: true, mask: 'phone' },
        { name: 'admin_correo', label: 'Correo Administrador', allowNA: true, type: 'email' }
    ],
    "Contrato": [
        { name: 'contrato_prefijo', label: 'Prefijo' },
        { name: 'contrato_numero', label: 'Número', type: 'number' },
        { name: 'contrato_modelo', label: 'Modelo', required: true, type: 'select', options: ['Nuevo', 'Vigente', 'No Vigente', 'N/A'] },
        { name: 'contrato_fecha_inicio', label: 'Fecha Inicio', required: true, type: 'date' },
        { name: 'contrato_revisado', label: 'Revisado', type: 'select', options: ['Si', 'No'] },
        { name: 'contrato_duracion_anios', label: 'Duración (Años)', required: true, type: 'number' },
        { name: 'contrato_preaviso_meses', label: 'Preaviso (Meses)', type: 'select', options: ['3', '6', 'N/A'] },
        { name: 'contrato_prorroga', label: 'Prórroga / Renovación', type: 'select', options: ['Pendiente', 'Pendiente Anulacion', 'Prorroga', 'Renovacion', 'N/A'] },
        { name: 'contrato_zona_proteccion', label: 'Zona Protección', required: true, type: 'select', options: ['SI', 'NO', 'N/A'] },
        { name: 'contrato_permite_decision', label: 'Permite Decisión Unilateral', required: true, type: 'select', options: ['SI', 'NO', 'N/A'] },
        { name: 'contrato_fecha_suscripcion', label: 'Fecha Suscripción', required: true, type: 'date', allowNA: true },
        { name: 'contrato_legalizado', label: 'Contrato Legalizado', required: true, type: 'select', options: ['OK', 'PTE FIRMA', 'PTE FISICO', 'N/A'] },
        { name: 'contrato_observacion', label: 'Observación Contrato' },
        { name: 'contrato_admite_not_correo', label: 'Admite Not. Correo Electrónico', type: 'select', options: ['SI', 'NO'] },
        { name: 'contrato_fecha_inicio_regalias', label: 'Fecha Inicio Regalías', type: 'date' }
    ],
    "Software": [
        { name: 'software_tipo', label: 'Tipo de Software', required: true, type: 'select', options: ['En Linea', 'Sin Software', 'Sin Internet', 'Cerró', 'Chily Sistem', 'Mekano', 'Suspendido'] },
        { name: 'software_observacion', label: 'Observación Software' },
        { name: 'software_contrato_legalizado', label: 'Contrato Software Legalizado', type: 'select', options: ['Si', 'No'] },
        { name: 'software_inicio_certificado', label: 'Inicio Certificado Digital', type: 'date' },
        { name: 'software_vencimiento_certificado', label: 'Vencimiento Certificado Digital', type: 'date' }
    ],
    "Póliza": [
        { name: 'poliza_corredor', label: 'Corredor de Seguros', required: true },
        { name: 'poliza_vencimiento', label: 'Venc. Póliza', type: 'date' },
        { name: 'poliza_motivo_cancelacion', label: 'Motivo Cancelación Póliza' }
    ],
    "Requerimientos y Otros": [
        { name: 'req_requerimiento', label: 'Requerimiento', type: 'select', options: ['Si', 'No'] },
        { name: 'req_observaciones_historia', label: 'Observaciones / Hist. Clínica' },
        { name: 'req_autorizacion_datos', label: 'Autorización Tratamiento Datos', type: 'select', options: ['Si', 'No'] }
    ]
};

const SedesTable = ({ sedes, cargarSedes, rolUsuario }) => {
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState([]);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [alertaBorrador, setAlertaBorrador] = useState(false);
    const [buscandoCoords, setBuscandoCoords] = useState(false);
    const autocompletarCoordenadas = async () => {
        const direccion = sedeActiva?.pdv_direccion;
        const ciudad = sedeActiva?.pdv_ciudad;
        if (!direccion || !ciudad) {
            toast.error('Por favor ingresa la Dirección y la Ciudad primero.');
            return;
        }

        setBuscandoCoords(true);
        const toastId = toast.loading('Calculando coordenadas automáticamente...');
        
        try {
            const query = `${direccion}, ${ciudad}, Colombia`;
            // Usamos ArcGIS (Esri) que es el mejor geocodificador para Colombia (Gratis para uso no masivo)
            const response = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=1&singleLine=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data && data.candidates && data.candidates.length > 0) {
                const lon = data.candidates[0].location.x;
                const lat = data.candidates[0].location.y;
                setSedeActiva(prev => ({
                    ...prev,
                    latitud: parseFloat(lat),
                    longitud: parseFloat(lon)
                }));
                toast.success('Coordenadas detectadas y aplicadas', { id: toastId });
            } else {
                toast.error('No se encontraron coordenadas exactas. Intenta simplificar la dirección.', { id: toastId });
            }
        } catch (error) {
            toast.error('Error al contactar el servicio de mapas', { id: toastId });
            console.error('Error al autocompletar', error);
        } finally {
            setBuscandoCoords(false);
        }
    };
    const [modoModal, setModoModal] = useState('ver');
    const [sedeActiva, setSedeActiva] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [seccionActiva, setSeccionActiva] = useState(Object.keys(FORM_SECTIONS)[0]);
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
    const [mostrarModalBienvenida, setMostrarModalBienvenida] = useState(false);

    const alertasSedes = useMemo(() => {
        if (!sedes) return [];
        const alertas = [];
        const hoy = new Date();

        sedes.forEach(sede => {
            const { contrato_fecha_inicio, contrato_duracion_anios, contrato_preaviso_meses } = sede;
            if (contrato_fecha_inicio && contrato_duracion_anios && contrato_preaviso_meses !== 'N/A' && contrato_preaviso_meses) {
                const fechaInicio = new Date(contrato_fecha_inicio);

                const fechaFin = new Date(fechaInicio);
                fechaFin.setFullYear(fechaFin.getFullYear() + Number(contrato_duracion_anios));

                const fechaAlerta = new Date(fechaFin);
                fechaAlerta.setMonth(fechaAlerta.getMonth() - Number(contrato_preaviso_meses));

                if (hoy >= fechaAlerta) {
                    const msPorDia = 1000 * 60 * 60 * 24;
                    const diasRestantes = Math.ceil((fechaFin - hoy) / msPorDia);
                    const mesesRestantes = (diasRestantes / 30.44).toFixed(1);

                    let tipo = 'aviso';
                    let mensaje = '';

                    if (hoy > fechaFin) {
                        tipo = 'vencido';
                        mensaje = `Contrato vencido hace ${Math.abs(diasRestantes)} días`;
                    } else {
                        tipo = 'preaviso';
                        mensaje = `Contrato vence en ${mesesRestantes} meses (${fechaFin.toLocaleDateString()})`;
                    }

                    alertas.push({
                        id: sede.id,
                        nombre: sede.ceco_nombre || sede.tercero_razon_social || 'Sede sin nombre',
                        tipo,
                        mensaje,
                        fechaFin
                    });
                }
            }

            // Alerta de certificado digital
            const { software_vencimiento_certificado } = sede;
            if (software_vencimiento_certificado) {
                // Agregar sufijo 'T00:00:00' para evitar problemas de zona horaria si la fecha viene limpia
                const fechaStr = software_vencimiento_certificado.includes('T') ? software_vencimiento_certificado : `${software_vencimiento_certificado}T00:00:00`;
                const fechaVencimiento = new Date(fechaStr);
                const msPorDia = 1000 * 60 * 60 * 24;
                // Calculamos diferencia entre fechas (ignorando horas)
                const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                const vencimientoNormalizado = new Date(fechaVencimiento.getFullYear(), fechaVencimiento.getMonth(), fechaVencimiento.getDate());
                const diasRestantes = Math.ceil((vencimientoNormalizado - hoyNormalizado) / msPorDia);

                if (diasRestantes <= 10) {
                    let tipo = 'aviso';
                    let mensaje = '';

                    if (diasRestantes < 0) {
                        tipo = 'vencido';
                        mensaje = `Certificado digital vencido hace ${Math.abs(diasRestantes)} días`;
                    } else if (diasRestantes === 0) {
                        tipo = 'vencido';
                        mensaje = `Certificado digital vence HOY`;
                    } else {
                        tipo = 'preaviso';
                        mensaje = `Certificado digital vence en ${diasRestantes} días`;
                    }

                    alertas.push({
                        id: `${sede.id}-cert`,
                        nombre: sede.ceco_nombre || sede.tercero_razon_social || 'Sede sin nombre',
                        tipo,
                        mensaje,
                        fechaFin: fechaVencimiento
                    });
                }
            }
        });
        return alertas.sort((a, b) => a.fechaFin - b.fechaFin);
    }, [sedes]);

    useEffect(() => {
        if (alertasSedes.length > 0 && !localStorage.getItem('alertaSedesVista')) {
            setMostrarModalBienvenida(true);
            localStorage.setItem('alertaSedesVista', 'true');
        }
    }, [alertasSedes.length]);

    const ciudadesDisponibles = useMemo(() => {
        if (!sedeActiva?.pdv_departamento) return [];
        const departamentoSeleccionado = colombiaData.find(d => d.departamento === sedeActiva.pdv_departamento);
        return departamentoSeleccionado ? departamentoSeleccionado.ciudades : [];
    }, [sedeActiva?.pdv_departamento]);

    useEffect(() => {
        if (modalAbierto && modoModal !== 'ver' && sedeActiva) {
            if (modoModal === 'crear') {
                localStorage.setItem('borradorSedeCosechas', JSON.stringify(sedeActiva));
            }
            const prevenirRecarga = (e) => {
                e.preventDefault();
                e.returnValue = '';
            };
            window.addEventListener('beforeunload', prevenirRecarga);
            return () => window.removeEventListener('beforeunload', prevenirRecarga);
        }
    }, [modalAbierto, modoModal, sedeActiva]);

    const abrirModal = (sede, modo) => {
        setMostrarErrores(false);
        if (modo === 'crear') {
            const borradorStr = localStorage.getItem('borradorSedeCosechas');
            if (borradorStr && Object.keys(JSON.parse(borradorStr)).length > 0) {
                setModoModal(modo);
                setAlertaBorrador(true);
                return;
            } else {
                setSedeActiva({});
            }
        } else {
            setSedeActiva(sede || {});
        }
        setModoModal(modo);
        setSeccionActiva(Object.keys(FORM_SECTIONS)[0]);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        if (modoModal === 'crear') localStorage.removeItem('borradorSedeCosechas');
        setModalAbierto(false);
        setMostrarErrores(false);
        setTimeout(() => setSedeActiva(null), 300);
    };

    const handleInputChange = (e) => {
        const { name, value, dataset } = e.target;
        let formattedValue = value;

        if (dataset.mask === 'nit') {
            const numericValue = value.replace(/\D/g, '');
            formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        else if (dataset.mask === 'phone') {
            formattedValue = value.replace(/\D/g, '').slice(0, 10);
        }

        setSedeActiva(prev => {
            const newState = { ...prev, [name]: formattedValue };

            // Lógica en cascada de Departamento -> Ciudad
            if (name === 'pdv_departamento' && prev?.pdv_departamento !== formattedValue) {
                newState.pdv_ciudad = '';
            }

            // Lógica de Autocompletado HGI Cosechas -> Dependencia
            if (name === 'ceco_hgi_cosechas') {
                newState.ceco_dependencia_hgi = formattedValue ? `F${formattedValue}` : '';
            }

            // Lógica de limpieza si desmarcan TV
            if (name === 'pdv_tv' && formattedValue !== 'Si') {
                newState.pdv_tv_cantidad = '';
                newState.pdv_aplicacion = '';
            }

            return newState;
        });
    };

    const toggleNA = (fieldName) => {
        if (modoModal === 'ver') return;
        setSedeActiva(prev => ({
            ...prev,
            [fieldName]: prev[fieldName] === 'N/A' ? '' : 'N/A'
        }));
    };

    const validarFormulario = () => {
        for (const [seccion, campos] of Object.entries(FORM_SECTIONS)) {
            for (const campo of campos) {
                if (campo.condition && sedeActiva?.[campo.condition.field] !== campo.condition.value) {
                    continue;
                }

                const valor = sedeActiva?.[campo.name];
                const esNA = valor === 'N/A';

                if (campo.required && !esNA && (!valor || valor.toString().trim() === '')) {
                    setSeccionActiva(seccion);
                    toast.error(`Falta llenar un campo obligatorio: ${campo.label}`, {
                        icon: '⚠️',
                        duration: 4000
                    });
                    return false;
                }

                if (valor && !esNA && campo.type === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(valor)) {
                        setSeccionActiva(seccion);
                        toast.error(`El formato de correo no es válido en: ${campo.label}`);
                        return false;
                    }
                }
            }
        }
        return true;
    };

    const handleExportar = () => {
        const filasFiltradas = table.getFilteredRowModel().rows.map(r => r.original);
        if (filasFiltradas.length === 0) {
            toast.error('No hay datos para exportar.');
            return;
        }
        exportarAExcel(filasFiltradas, 'Directorio_Sedes', (sede) => {
            return sede;
        });
        toast.success(`Se exportaron ${filasFiltradas.length} sedes.`);
    };

    const guardarSede = async (e) => {
        e.preventDefault();
        setMostrarErrores(true);

        if (!validarFormulario()) {
            return;
        }

        setGuardando(true);
        const loadingToast = toast.loading(modoModal === 'crear' ? 'Creando nueva sede...' : 'Guardando cambios...');

        try {
            const payload = { ...sedeActiva };
            if (modoModal === 'crear') {
                delete payload.id;
                delete payload.fecha_creacion;
            }

            if (modoModal === 'editar') {
                const { error } = await supabase.from('sedes_oficiales').update(payload).eq('id', sedeActiva.id);
                if (error) throw error;
                toast.success('Sede actualizada correctamente', { id: loadingToast });
            } else {
                const { error } = await supabase.from('sedes_oficiales').insert([payload]);
                if (error) throw error;
                toast.success('Sede creada exitosamente', { id: loadingToast });
                localStorage.removeItem('borradorSedeCosechas');
            }

            cerrarModal();
            if (cargarSedes) cargarSedes();

        } catch (error) {
            console.error('Error guardando en Supabase:', error.message);
            toast.error('Ocurrió un error al guardar los datos', { id: loadingToast });
        } finally {
            setGuardando(false);
        }
    };

    // Filtrar sedes para roles de solo lectura
    const sedesProcesadas = useMemo(() => {
        if (!sedes) return [];
        if (['montajes', 'espectador_sedes'].includes(rolUsuario)) {
            return sedes.filter(s => s.pdv_estado === 'OPERANDO');
        }
        return sedes;
    }, [sedes, rolUsuario]);

    const columns = useMemo(() => [
        {
            accessorKey: 'tercero_nit',
            header: 'NIT',
            cell: info => <span className="font-black text-slate-900 dark:text-white">{info.getValue() || 'N/A'}</span>
        },
        {
            accessorKey: 'ceco_nombre',
            header: 'Nombre Sede',
            cell: ({ row }) => {
                const nombre = row.getValue('ceco_nombre') || 'Sin Nombre';
                const alerta = alertasSedes.find(a => a.id === row.original.id);

                return (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-cosechas-verde dark:text-emerald-400">{nombre}</span>
                        {alerta && (
                            <div title={alerta.mensaje} className={`p-1 rounded-full ${alerta.tipo === 'vencido' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                <AlertCircle className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'pdv_direccion',
            header: 'Ubicación',
            cell: ({ row }) => {
                const direccion = row.original.pdv_direccion;
                const ciudad = row.original.pdv_ciudad;
                return (
                    <div className="flex flex-col min-w-[150px]">
                        {ciudad && (
                            <span className="text-[10px] font-bold text-cosechas-rojo uppercase tracking-widest mb-1 opacity-80 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {ciudad}
                            </span>
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                            <Store className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" /> {direccion || '-'}
                        </span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'pdv_celular',
            header: 'Contacto',
            cell: ({ row }) => {
                const celular = row.original.pdv_celular;
                return (
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" /> {celular || 'No registrado'}
                    </span>
                );
            }
        },
        ...(!['montajes', 'espectador_sedes'].includes(rolUsuario) ? [{
            id: 'pdv_estado',
            accessorKey: 'pdv_estado',
            header: () => <div className="text-center">Estado</div>,
            cell: ({ row }) => {
                const estado = row.original.pdv_estado || 'Activo';
                const esCerrado = estado.toLowerCase().includes('cerrad');
                return (
                    <div className="flex justify-center">
                        <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${esCerrado
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50'
                            : 'bg-cosechas-verde/10 text-cosechas-verde border-cosechas-verde/30'
                            }`}>
                            {esCerrado ? '❌ Cerrado' : '✅ Activo'}
                        </span>
                    </div>
                );
            }
        }] : []),
        {
            id: 'acciones',
            header: () => <div className="text-right">Acciones</div>,
            cell: ({ row }) => {
                const sede = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <button onClick={() => abrirModal(sede, 'ver')} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm" title="Ver Detalles Completos">
                            <Eye className="w-4 h-4" />
                        </button>
                        {!['espectador_sedes', 'montajes'].includes(rolUsuario) && (
                            <button onClick={() => abrirModal(sede, 'editar')} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm" title="Editar Sede">
                                <Edit className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                );
            }
        }
    ], [alertasSedes, rolUsuario]);

    const table = useReactTable({
        data: sedesProcesadas,
        columns,
        state: { globalFilter, columnFilters },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 relative z-[60]">
                <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center w-full xl:w-auto">
                    <div className="relative w-full sm:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar sedes..."
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-200 transition-all"
                        />
                    </div>

                    {!['montajes', 'espectador_sedes'].includes(rolUsuario) && (
                        <select
                            value={columnFilters.find(f => f.id === 'pdv_estado')?.value || ''}
                            onChange={e => {
                                const val = e.target.value;
                                setColumnFilters(prev => {
                                    const next = prev.filter(f => f.id !== 'pdv_estado');
                                    if (val) next.push({ id: 'pdv_estado', value: val });
                                    return next;
                                });
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
                        >
                            <option value="">Todos los Estados</option>
                            <option value="OPERANDO">✅ OPERANDO</option>
                            <option value="CERRADO">❌ CERRADO</option>
                            <option value="CERRADO TEMPORAL">⏸️ CERRADO TEMPORAL</option>
                            <option value="ZONA">🗺️ ZONA</option>
                            <option value="ZONA SIN PTO">🗺️ ZONA SIN PTO</option>
                            <option value="SIN PTO">⚠️ SIN PTO</option>
                            <option value="TRASLADO">🚚 TRASLADO</option>
                        </select>
                    )}

                    <button
                        onClick={handleExportar}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        Excel
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)} className="relative p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                            <Bell className="w-5 h-5" />
                            {alertasSedes.length > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 translate-x-1/3 -translate-y-1/3"></span>
                            )}
                        </button>

                        <AnimatePresence>
                            {mostrarNotificaciones && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMostrarNotificaciones(false)}></div>
                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <BellRing className="w-4 h-4 text-orange-500" /> Alertas de Contratos
                                            </h4>
                                            <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold px-2.5 py-0.5 rounded-full">{alertasSedes.length}</span>
                                        </div>
                                        <div className="max-h-[60vh] overflow-y-auto p-2">
                                            {alertasSedes.length === 0 ? (
                                                <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                                                    No hay alertas pendientes.
                                                </div>
                                            ) : (
                                                alertasSedes.map((alerta, index) => (
                                                    <div key={`${alerta.id}-${index}`} onClick={() => { abrirModal(sedes.find(s => s.id === alerta.id), 'ver'); setMostrarNotificaciones(false); }} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex gap-3">
                                                        <div className={`mt-0.5 p-1.5 rounded-full shrink-0 h-fit ${alerta.tipo === 'vencido' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                                            {alerta.tipo === 'vencido' ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{alerta.nombre}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{alerta.mensaje}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {!['espectador_sedes', 'montajes'].includes(rolUsuario) && (
                        <button onClick={() => abrirModal(null, 'crear')} className="flex items-center gap-2 bg-cosechas-verde hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-cosechas-verde/20 hover:-translate-y-0.5">
                            <Plus className="w-4 h-4" /> Nueva Sede
                        </button>
                    )}
                </div>            </div>

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
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
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
                                            No se encontraron sedes con esos criterios.
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

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
                        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* MODAL DE ALERTA DE BORRADOR */}
            <AnimatePresence>
                {alertaBorrador && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 bg-cosechas-verde/10 rounded-full flex items-center justify-center mb-4">
                                <Edit className="w-6 h-6 text-cosechas-verde" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Borrador Detectado</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                                Tienes un registro de sede sin terminar. ¿Deseas recuperar los datos donde los dejaste o empezar de cero?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => { localStorage.removeItem('borradorSedeCosechas'); setSedeActiva({}); setSeccionActiva(Object.keys(FORM_SECTIONS)[0]); setAlertaBorrador(false); setModalAbierto(true); }} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    Empezar de cero
                                </button>
                                <button onClick={() => { setSedeActiva(JSON.parse(localStorage.getItem('borradorSedeCosechas'))); setSeccionActiva(Object.keys(FORM_SECTIONS)[0]); setAlertaBorrador(false); setModalAbierto(true); }} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-cosechas-verde hover:bg-emerald-600 shadow-md shadow-cosechas-verde/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                    Recuperar datos
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL COMPLETO */}
            <AnimatePresence>
                {modalAbierto && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6" onClick={cerrarModal}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-700 flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>

                            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                                <div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        {modoModal === 'ver' && <><Eye className="w-6 h-6 text-blue-500" /> Detalle de la Sede</>}
                                        {modoModal === 'editar' && <><Edit className="w-6 h-6 text-orange-500" /> Editar Registro Maestro</>}
                                        {modoModal === 'crear' && <><Plus className="w-6 h-6 text-cosechas-verde" /> Registrar Nueva Sede</>}
                                    </h3>
                                    {sedeActiva?.ceco_nombre && modoModal !== 'crear' && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">ID Base de Datos: #{sedeActiva.id} | {sedeActiva.ceco_nombre}</p>
                                    )}
                                </div>
                                <button onClick={cerrarModal} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Navegación Lateral */}
                                <div className="w-1/4 min-w-[200px] border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 overflow-y-auto p-4">
                                    <nav className="space-y-1">
                                        {Object.keys(FORM_SECTIONS).map((seccion) => {
                                            const tieneErrorAca = mostrarErrores && FORM_SECTIONS[seccion].some(c => {
                                                // Ignorar si el campo está oculto por condición
                                                if (c.condition && sedeActiva?.[c.condition.field] !== c.condition.value) return false;
                                                return c.required && sedeActiva?.[c.name] !== 'N/A' && (!sedeActiva?.[c.name] || sedeActiva?.[c.name].toString().trim() === '');
                                            });

                                            return (
                                                <button
                                                    key={seccion}
                                                    type="button"
                                                    onClick={() => setSeccionActiva(seccion)}
                                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${seccionActiva === seccion
                                                        ? 'bg-white dark:bg-slate-800 text-cosechas-verde shadow-sm border border-slate-200 dark:border-slate-700'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    {seccion}
                                                    {tieneErrorAca && <AlertCircle className="w-4 h-4 text-red-500" />}
                                                </button>
                                            )
                                        })}
                                    </nav>
                                </div>

                                {/* Formulario */}
                                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-800">
                                    <form id="sede-form" noValidate onSubmit={guardarSede}>
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-3 mb-6 flex justify-between items-center">
                                            <span>{seccionActiva}</span>
                                            {seccionActiva === 'Punto de Venta' && modoModal !== 'ver' && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => autocompletarCoordenadas(sedeActiva?.pdv_direccion, sedeActiva?.pdv_ciudad)} 
                                                    disabled={buscandoCoords}
                                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    <MapPin className="w-4 h-4" /> {buscandoCoords ? 'Buscando...' : 'Autocompletar Coordenadas'}
                                                </button>
                                            )}
                                        </h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {FORM_SECTIONS[seccionActiva].map((campo) => {
                                                // EVALUACIÓN CONDICIONAL: Si el campo depende de otro valor y no se cumple, no lo dibujamos
                                                if (campo.condition && sedeActiva?.[campo.condition.field] !== campo.condition.value) {
                                                    return null;
                                                }

                                                const valorActual = sedeActiva?.[campo.name];
                                                const esNA = valorActual === 'N/A';
                                                // Los campos readOnly también desactivan el input para el usuario (Ej: Dependencia HGI)
                                                const disableInput = modoModal === 'ver' || campo.readOnly;

                                                const esInvalido = mostrarErrores && campo.required && !esNA && (!valorActual || valorActual.toString().trim() === '');
                                                const bordeInput = esInvalido
                                                    ? 'border-red-500 ring-1 ring-red-500/50 focus:ring-red-500'
                                                    : 'border-slate-200 dark:border-slate-600 focus:ring-cosechas-verde';

                                                return (
                                                    <div key={campo.name}>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                                {campo.label} {campo.required && <span className="text-red-500 ml-1">*</span>}
                                                            </label>
                                                            {campo.allowNA && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleNA(campo.name)}
                                                                    disabled={modoModal === 'ver'}
                                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${esNA
                                                                        ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                                                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700'
                                                                        }`}
                                                                >
                                                                    N/A
                                                                </button>
                                                            )}
                                                        </div>

                                                        {campo.type === 'select' ? (
                                                            <select
                                                                name={campo.name}
                                                                value={valorActual || ''}
                                                                onChange={handleInputChange}
                                                                disabled={disableInput}
                                                                className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200 font-medium transition-all ${bordeInput} ${disableInput ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                            >
                                                                <option value="">Seleccione...</option>
                                                                {campo.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        )
                                                            : campo.type === 'departamento' ? (
                                                                <select
                                                                    name={campo.name}
                                                                    value={valorActual || ''}
                                                                    onChange={handleInputChange}
                                                                    disabled={disableInput}
                                                                    className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200 font-medium transition-all ${bordeInput} ${disableInput ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <option value="">Seleccione Departamento</option>
                                                                    {colombiaData.map(d => <option key={d.departamento} value={d.departamento}>{d.departamento}</option>)}
                                                                </select>
                                                            )
                                                                : campo.type === 'ciudad' ? (
                                                                    <select
                                                                        name={campo.name}
                                                                        value={valorActual || ''}
                                                                        onChange={handleInputChange}
                                                                        disabled={disableInput || !sedeActiva?.pdv_departamento}
                                                                        className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200 font-medium transition-all ${bordeInput} ${disableInput || !sedeActiva?.pdv_departamento ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <option value="">Seleccione Ciudad</option>
                                                                        {ciudadesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                                                    </select>
                                                                )
                                                                    : (
                                                                        <input
                                                                            type={esNA && campo.type === 'date' ? 'text' : (campo.type || 'text')}
                                                                            name={campo.name}
                                                                            data-mask={campo.mask}
                                                                            maxLength={campo.maxLength}
                                                                            value={valorActual || ''}
                                                                            onChange={handleInputChange}
                                                                            disabled={disableInput}
                                                                            className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200 font-medium transition-all ${bordeInput} ${disableInput ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                            placeholder={campo.placeholder || `Ingresar ${campo.label.toLowerCase()}`}
                                                                        />
                                                                    )}

                                                        {esInvalido && (
                                                            <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" /> Este campo es obligatorio
                                                            </p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">
                                    {modoModal === 'ver' ? 'Modo de solo lectura activado' : 'Los campos marcados con (*) son obligatorios.'}
                                </span>
                                <div className="flex gap-3">
                                    <button type="button" onClick={cerrarModal} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        {modoModal === 'ver' ? 'Cerrar Panel' : 'Cancelar Edición'}
                                    </button>

                                    {modoModal !== 'ver' && (
                                        <button type="submit" form="sede-form" disabled={guardando} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-cosechas-verde hover:bg-emerald-600 transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Save className="w-4 h-4" />
                                            {guardando ? 'Sincronizando...' : (modoModal === 'crear' ? 'Guardar Nueva Sede' : 'Actualizar Registro')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL DE BIENVENIDA DE ALERTAS */}
            <AnimatePresence>
                {mostrarModalBienvenida && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden">

                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-orange-400 to-red-500 opacity-10"></div>

                            <div className="relative z-10">
                                <motion.div
                                    initial={{ rotate: -15 }} animate={{ rotate: [15, -15, 15, -15, 0] }} transition={{ duration: 1.5, ease: "easeInOut" }}
                                    className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-orange-200 dark:border-orange-800/50"
                                >
                                    <BellRing className="w-10 h-10 text-orange-500 dark:text-orange-400 drop-shadow-md" />
                                </motion.div>

                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                    ¡Atención Requerida!
                                </h3>

                                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                                    Tienes <span className="font-bold text-orange-500 dark:text-orange-400 text-lg">{alertasSedes.length}</span> {alertasSedes.length === 1 ? 'contrato' : 'contratos'} que requieren tu atención inmediata por vencimiento o periodo de preaviso.
                                </p>

                                <div className="flex flex-col gap-3">
                                    <button onClick={() => { setMostrarModalBienvenida(false); setMostrarNotificaciones(true); }} className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                        Revisar Alertas Ahora
                                    </button>
                                    <button onClick={() => setMostrarModalBienvenida(false)} className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        Más tarde
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SedesTable;
