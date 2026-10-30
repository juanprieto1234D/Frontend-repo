import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Materia, normalizarIcono } from '../../domain/models/Materia';
import { RepositorioMateria } from '../../domain/repositories/RepositorioMateria';
import { HttpMateriaRepository } from '../../infrastructure/adapters/HttpMateriaRepository';
import { useEstilos, useTema } from '../theme/tema';
import { DatosConfirmacion, DialogoConfirmacion } from '../components/DialogoConfirmacion';

const materiaRepo: RepositorioMateria = new HttpMateriaRepository();
const INFO_URGENCIA: Record<Exclude<Urgencia, null>, { texto: string; color: string; fondo: string }> = {
  vence_pronto: { texto: 'Alta', color: '#DC2626', fondo: '#FEE2E2' },
  esta_semana: { texto: 'Media', color: '#D97706', fondo: '#FEF3C7' },
  con_tiempo: { texto: 'Baja', color: '#16A34A', fondo: '#DCFCE7' },
};

interface PropsTarjeta {
  tarea: Tarea;
  materia?: Materia;
  fechaTexto: string | null;
  vencida: boolean;
  urgencia: Urgencia;
  indice: number;
  onAlternar: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}

/**
 * Tarjeta de tarea con animaciones:
 *  - entrada en cascada (fade + subida)
 *  - rebote del check al completar
 *  - elevación al pasar el mouse (solo web)
 */
const TarjetaTarea: React.FC<PropsTarjeta> = ({
  tarea,
  materia,
  fechaTexto,
  vencida,
  urgencia,
  indice,
  onAlternar,
  onEditar,
  onEliminar,
}) => {
  const estilos = useEstilos(styles);
  const { modo, texto, fondo } = useTema();

  const entrada = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 380,
      delay: Math.min(indice, 8) * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [entrada, indice]);

  const animarCheck = () => {
    pulso.setValue(0);
    Animated.sequence([
      Animated.timing(pulso, { toValue: 1, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulso, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  const animarHover = (valor: number) => {
    Animated.timing(hover, {
      toValue: valor,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const tinteTarjeta = materia?.color ?? '#94A3B8';
  const coloresTarjeta: [string, string] = [
    `${tinteTarjeta}${modo === 'oscuro' ? '1F' : '0F'}`,
    `${tinteTarjeta}${modo === 'oscuro' ? '59' : '38'}`,
  ];

  const desplazamiento = entrada.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const elevacion = hover.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const escalaCheck = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  return (
    <Animated.View
      onPointerEnter={() => animarHover(1)}
      onPointerLeave={() => animarHover(0)}
      style={[
        estilos.cardTarea,
        materia && { borderLeftWidth: 3, borderLeftColor: materia.color },
        { opacity: entrada, transform: [{ translateY: Animated.add(desplazamiento, elevacion) }] },
      ]}
    >
      <LinearGradient
        colors={coloresTarjeta}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        pointerEvents="none"
      />

      <TouchableOpacity
        onPress={() => {
          animarCheck();
          onAlternar();
        }}
        hitSlop={8}
      >
        <Animated.View
          style={[
            estilos.checkCircle,
            tarea.completed && estilos.checkCircleActive,
            { transform: [{ scale: escalaCheck }] },
          ]}
        >
          {tarea.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </Animated.View>
      </TouchableOpacity>

      <View style={[estilos.iconoTarea, { backgroundColor: `${materia?.color ?? '#94A3B8'}1A` }]}>
        <Ionicons
          name={normalizarIcono(materia?.icono)}
          size={17}
          color={materia?.color ?? texto('#94A3B8')}
        />
      </View>

      <View style={{ flex: 1 }}>
        {materia && (
          <View style={[estilos.chipMateria, { backgroundColor: `${materia.color}1A` }]}>
            <View style={[estilos.puntoChip, { backgroundColor: materia.color }]} />
            <Text style={[estilos.chipMateriaTexto, { color: materia.color }]}>
              {materia.nombre}
            </Text>
          </View>
        )}

        <View style={estilos.filaTituloUrgencia}>
          <Text style={[estilos.tituloTarea, tarea.completed && estilos.tituloCompletado]}>
            {tarea.title}
          </Text>
          {urgencia && (
            <View
              style={[estilos.badgeUrgencia, { backgroundColor: fondo(INFO_URGENCIA[urgencia].fondo) }]}
            >
              <View
                style={[estilos.badgePunto, { backgroundColor: texto(INFO_URGENCIA[urgencia].color) }]}
              />
              <Text style={[estilos.badgeUrgenciaTexto, { color: texto(INFO_URGENCIA[urgencia].color) }]}>
                {INFO_URGENCIA[urgencia].texto}
              </Text>
            </View>
          )}
        </View>

        {tarea.description ? <Text style={estilos.descTarea}>{tarea.description}</Text> : null}

        {fechaTexto && (
          <View style={estilos.filaFechaItem}>
            <Ionicons name="calendar-outline" size={12} color={vencida ? '#EF4444' : '#6366F1'} />
            <Text style={[estilos.fechaTexto, vencida && estilos.fechaVencida]}>
              {vencida ? 'Vencida · ' : ''}
              {fechaTexto}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={onEditar}
        hitSlop={8}
        style={estilos.btnEditar}
        accessibilityLabel={`Editar ${tarea.title}`}
      >
        <Ionicons name="create-outline" size={17} color={texto('#4C49ED')} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onEliminar} hitSlop={8} style={estilos.btnEliminar}>
        <Ionicons name="trash-outline" size={17} color={texto('#DC2626')} />
      </TouchableOpacity>
    </Animated.View>
  );
};


interface Tarea {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  dueDate?: string | null;
  materiaId?: string | null;
}

interface Props {
  usuario: any;
  setUsuario: (user: any) => void;
  /** Cierra la sesión y vuelve al login (limpia el token). */
  onCerrarSesion?: () => void;
  /** Solo se pasa cuando el usuario es ADMIN. */
  onAbrirPanelAdmin?: () => void;
  /** Abre la pantalla de materias. */
  onAbrirMaterias?: () => void;
  /** Abre el calendario. */
  onAbrirCalendario?: () => void;
}

type Urgencia = 'vence_pronto' | 'esta_semana' | 'con_tiempo' | null;

export default function HomeScreen({
  usuario,
  setUsuario,
  onCerrarSesion,
  onAbrirPanelAdmin,
  onAbrirMaterias,
  onAbrirCalendario,
}: Props) {
  const estilos = useEstilos(styles);
  const { modo, alternar, fondo, texto } = useTema();
  const { width: anchoVentana } = useWindowDimensions();
  const esEscritorio = anchoVentana >= 900;
  const esAdmin = usuario?.rol === 'ADMIN';

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'completadas' | 'materia'>('todas');
  const [cargando, setCargando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Tarea | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState<Date | null>(null);
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);

  // Materias del usuario (clasificación de tareas)
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [filtroMateria, setFiltroMateria] = useState<string | null>(null);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string | null>(null);
  const [orden, setOrden] = useState<'fecha' | 'prioridad' | 'materia'>('fecha');
  const [menuVisible, setMenuVisible] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<
    (DatosConfirmacion & { accion: () => Promise<void> }) | null
  >(null);
  const [procesando, setProcesando] = useState(false);
  const hoja = useRef(new Animated.Value(0)).current;

  // 7) El modal sube con un spring y el fondo hace fade (animationType='fade')
  useEffect(() => {
    if (!modalVisible) return;
    hoja.setValue(0);
    Animated.spring(hoja, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      damping: 18,
      stiffness: 180,
    }).start();
  }, [modalVisible, hoja]);

  const API_URL = 'http://localhost:3000/tareas';

  const userId = usuario?.id || usuario?.userId || usuario?._id;
  const nombreUsuario = usuario?.nombre || usuario?.name || usuario?.email?.split('@')[0] || 'Usuario';
  const iniciales = nombreUsuario.slice(0, 2).toUpperCase();

  const obtenerTareas = async () => {
    if (!userId || String(userId).includes('@')) return;
    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/${userId}`);
      const data = await res.json();
      if (res.ok) {
        const listaMapeada = Array.isArray(data)
          ? data.map((t: any) => ({
              id: t.id,
              title: t.title || t.titulo || 'Sin título',
              description: t.description || t.descripcion || '',
              completed: t.completed ?? t.completada ?? false,
              dueDate: t.dueDate || t.fechaLimite || null,
              materiaId: t.materiaId ?? null,
            }))
          : [];
        setTareas(listaMapeada);
      }
    } catch (error) {
      console.error('Error al obtener tareas:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarMaterias = async () => {
    if (!userId) return;
    try {
      setMaterias(await materiaRepo.listar(userId));
    } catch (error) {
      console.error('Error al obtener materias:', error);
    }
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(null);
    setTitulo('');
    setDescripcion('');
    setFechaLimite(null);
    setMateriaSeleccionada(null);
  };

  const abrirNueva = () => {
    setEditando(null);
    setTitulo('');
    setDescripcion('');
    setFechaLimite(null);
    setMateriaSeleccionada(null);
    setModalVisible(true);
  };

  const abrirEdicion = (tarea: Tarea) => {
    setEditando(tarea);
    setTitulo(tarea.title);
    setDescripcion(tarea.description ?? '');
    setFechaLimite(tarea.dueDate ? new Date(tarea.dueDate) : null);
    setMateriaSeleccionada(tarea.materiaId ?? null);
    setModalVisible(true);
  };

  const guardarTarea = async () => {
    if (!titulo.trim()) {
      setAviso('Ingresa un título para la tarea');
      return;
    }
    if (!userId || String(userId).includes('@')) {
      setAviso('Sesión no válida o falta el ID único de usuario. Por favor vuelve a iniciar sesión.');
      setUsuario(null);
      return;
    }
    try {
      const fechaISO = fechaLimite ? fechaLimite.toISOString() : null;
      const payload = {
        title: titulo,
        titulo: titulo,
        description: descripcion,
        descripcion: descripcion,
        userId: userId,
        usuarioId: userId,
        dueDate: fechaISO,
        fechaLimite: fechaISO,
        materiaId: materiaSeleccionada,
      };

      const url = editando ? `${API_URL}/${editando.id}` : API_URL;
      const metodo = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        cerrarModal();
        obtenerTareas();
      } else {
        setAviso(`Error al guardar: ${data.message || data.error || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error al enviar la tarea:', error);
      setAviso('Error de conexión con la API');
    }
  };

  const alternarCompletada = async (tarea: Tarea) => {
    const nuevoEstado = !tarea.completed;
    setTareas((actual) => actual.map((t) => (t.id === tarea.id ? { ...t, completed: nuevoEstado } : t)));
    try {
      const res = await fetch(`${API_URL}/${tarea.id}/completar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: nuevoEstado }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo actualizar la tarea');
      }
    } catch (error: any) {
      setTareas((actual) => actual.map((t) => (t.id === tarea.id ? { ...t, completed: !nuevoEstado } : t)));
      setAviso(error.message || 'No se pudo actualizar la tarea');
    }
  };

  const eliminarTarea = (tarea: Tarea) => {
    setConfirmacion({
      titulo: 'Eliminar tarea',
      mensaje: `¿Seguro que quieres eliminar "${tarea.title}"?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      accion: async () => {
        const res = await fetch(`${API_URL}/${tarea.id}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'No se pudo eliminar la tarea');
        }
        setTareas((actual) => actual.filter((t) => t.id !== tarea.id));
      },
    });
  };

  const ejecutarConfirmacion = async () => {
    if (!confirmacion || procesando) return;
    setProcesando(true);
    try {
      await confirmacion.accion();
      setConfirmacion(null);
    } catch (e) {
      setConfirmacion(null);
      setAviso(e instanceof Error ? e.message : 'No se pudo eliminar la tarea');
    } finally {
      setProcesando(false);
    }
  };

  useEffect(() => {
    obtenerTareas();
    void cargarMaterias();
  }, [userId]);

  const formatearFechaLimite = (iso?: string | null): string | null => {
    if (!iso) return null;
    const fecha = new Date(iso);
    const ahora = new Date();
    const esMismoDia = (a: Date, b: Date) =>
      a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    const manana = new Date(ahora);
    manana.setDate(ahora.getDate() + 1);
    const hora = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (esMismoDia(fecha, ahora)) return `Hoy · ${hora}`;
    if (esMismoDia(fecha, manana)) return `Mañana · ${hora}`;
    const diaMes = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    return `${diaMes} · ${hora}`;
  };

  const estaVencida = (iso?: string | null, completada?: boolean): boolean => {
    if (!iso || completada) return false;
    return new Date(iso).getTime() < Date.now();
  };

  // Clasifica la urgencia de una tarea según qué tan cerca está su fecha límite.
  // Todo calculado en el cliente a partir de dueDate — no requiere campos nuevos.
  const calcularUrgencia = (iso?: string | null, completada?: boolean): Urgencia => {
    if (!iso || completada) return null;
    const ahora = Date.now();
    const limite = new Date(iso).getTime();
    const horasRestantes = (limite - ahora) / (1000 * 60 * 60);

    if (horasRestantes < 24) return 'vence_pronto'; // incluye negativas = ya vencidas
    if (horasRestantes < 24 * 7) return 'esta_semana';
    return 'con_tiempo';
  };

  const infoUrgencia: Record<Exclude<Urgencia, null>, { texto: string; color: string; fondo: string }> = {
    vence_pronto: { texto: 'Alta', color: '#DC2626', fondo: '#FEE2E2' },
    esta_semana: { texto: 'Media', color: '#D97706', fondo: '#FEF3C7' },
    con_tiempo: { texto: 'Baja', color: '#16A34A', fondo: '#DCFCE7' },
  };

  const tareasFiltradas = tareas.filter((t) => {
    if (filtro === 'materia') {
      return filtroMateria ? (t.materiaId ?? null) === filtroMateria : true;
    }
    if (filtro === 'pendientes') return !t.completed;
    if (filtro === 'completadas') return t.completed;
    return true;
  });

  const pesoPrioridad: Record<string, number> = {
    vence_pronto: 0,
    esta_semana: 1,
    con_tiempo: 2,
  };

  const tareasOrdenadas = [...tareasFiltradas].sort((a, b) => {
    if (orden === 'materia') {
      const nombreA = materias.find((m) => m.id === a.materiaId)?.nombre ?? 'zzz';
      const nombreB = materias.find((m) => m.id === b.materiaId)?.nombre ?? 'zzz';
      return nombreA.localeCompare(nombreB);
    }

    if (orden === 'prioridad') {
      const prioridadA = pesoPrioridad[calcularUrgencia(a.dueDate, a.completed) ?? 'con_tiempo'];
      const prioridadB = pesoPrioridad[calcularUrgencia(b.dueDate, b.completed) ?? 'con_tiempo'];
      if (prioridadA !== prioridadB) return prioridadA - prioridadB;
    }

    const fechaA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const fechaB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return fechaA - fechaB;
  });

  // --- Estadísticas, 100% calculadas de lo que ya existe (dueDate, completed) ---
  const pendientesCount = tareas.filter((t) => !t.completed).length;
  const urgentesCount = tareas.filter((t) => calcularUrgencia(t.dueDate, t.completed) === 'vence_pronto').length;
  const completadasCount = tareas.filter((t) => t.completed).length;
  const progresoPorcentaje = tareas.length > 0 ? Math.round((completadasCount / tareas.length) * 100) : 0;
  const vencidas = tareas.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate).getTime() < Date.now(),
  ).length;

  const hojaY = hoja.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <LinearGradient
      colors={modo === 'oscuro' ? ['#0F172A', '#131F33'] : ['#EEF2FF', '#FBFCFE']}
      style={[estilos.container, { backgroundColor: 'transparent' }]}
    >
      <LinearGradient
        colors={['#4C49ED', '#6B3CE9', '#2E1C73']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.headerBanda, esEscritorio && estilos.headerBandaEscritorio]}
      >
        <View style={estilos.headerInterior}>
          <View style={estilos.headerIzquierda}>
            <View style={estilos.insigniaRol}>
              <Ionicons name="school-outline" size={11} color="#C7D2FE" />
              <Text style={estilos.insigniaRolTexto}>ESTUDIANTE</Text>
            </View>
            <Text style={estilos.headerTitulo} numberOfLines={1}>
              Hola, {nombreUsuario}
            </Text>
          </View>

          <View style={estilos.headerAcciones}>
            {esEscritorio && (
              <Text style={estilos.headerSaludo} numberOfLines={1}>
                {saludo}
              </Text>
            )}

            <View style={[estilos.estado, vencidas > 0 && estilos.estadoAlerta]}>
              <View
                style={[
                  estilos.estadoPunto,
                  { backgroundColor: vencidas > 0 ? '#EF4444' : '#10B981' },
                ]}
              />
              <Text style={[estilos.estadoTexto, vencidas > 0 && estilos.estadoTextoAlerta]}>
                {vencidas > 0 ? `${vencidas} vencida${vencidas === 1 ? '' : 's'}` : 'Al día'}
              </Text>
            </View>

            {esEscritorio && onAbrirCalendario && (
              <TouchableOpacity
                style={estilos.botonHeader}
                onPress={onAbrirCalendario}
                accessibilityRole="button"
                accessibilityLabel="Abrir calendario"
              >
                <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
                <Text style={estilos.botonHeaderTexto}>Calendario</Text>
              </TouchableOpacity>
            )}

            {esEscritorio && onAbrirMaterias && (
              <TouchableOpacity
                style={estilos.botonHeader}
                onPress={onAbrirMaterias}
                accessibilityRole="button"
                accessibilityLabel="Abrir materias"
              >
                <Ionicons name="book-outline" size={15} color="#FFFFFF" />
                <Text style={estilos.botonHeaderTexto}>Materias</Text>
              </TouchableOpacity>
            )}

            {esAdmin && onAbrirPanelAdmin && (
              <TouchableOpacity
                style={estilos.botonHeader}
                onPress={onAbrirPanelAdmin}
                accessibilityRole="button"
                accessibilityLabel="Abrir panel de administración"
              >
                <Ionicons name="shield-checkmark-outline" size={15} color="#FFFFFF" />
                <Text style={estilos.botonHeaderTexto}>Panel admin</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={estilos.botonIcono}
              onPress={alternar}
              accessibilityRole="button"
              accessibilityLabel={modo === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              <Ionicons
                name={modo === 'oscuro' ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {esEscritorio && (
              <Pressable
                style={({ pressed }) => [estilos.botonHero, pressed && { transform: [{ scale: 0.96 }] }]}
                onPress={abrirNueva}
                accessibilityRole="button"
                accessibilityLabel="Nueva tarea"
              >
                <Ionicons name="add" size={17} color="#0F172A" />
                <Text style={estilos.botonHeroTexto}>Nueva tarea</Text>
              </Pressable>
            )}

            {onCerrarSesion && (
              <TouchableOpacity
                style={estilos.botonIcono}
                onPress={onCerrarSesion}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
              >
                <Ionicons name="log-out-outline" size={19} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={[estilos.contenido, esEscritorio && estilos.contenidoEscritorio]}>

        {aviso && (
          <View style={estilos.bannerAviso}>
            <Ionicons name="alert-circle-outline" size={17} color={texto('#B91C1C')} />
            <Text style={estilos.bannerAvisoTexto}>{aviso}</Text>
            <TouchableOpacity onPress={() => setAviso(null)} hitSlop={8} accessibilityLabel="Cerrar aviso">
              <Ionicons name="close" size={15} color={texto('#B91C1C')} />
            </TouchableOpacity>
          </View>
        )}
        <View style={[estilos.cuerpo, esEscritorio && estilos.cuerpoEscritorio]}>
          {/* Columna lateral: métricas y resumen */}
          <View style={[estilos.columnaLateral, esEscritorio && estilos.columnaLateralEscritorio]}>
            {/* Tarjetas de estadísticas */}
            <View style={[estilos.statsRow, esEscritorio && estilos.statsRowEscritorio]}>
        <View style={[estilos.statCard, estilos.statUrgente]}>
          <View style={estilos.statHeaderRow}>
            <View style={[estilos.statDot, { backgroundColor: texto('#EF4444') }]} />
            <Text style={estilos.statLabel}>Urgentes</Text>
          </View>
          <Text style={[estilos.statNumero, { color: texto('#DC2626') }]}>{urgentesCount}</Text>
          <Text style={estilos.statSub}>Vencen pronto</Text>
        </View>

        <View style={[estilos.statCard, estilos.statProgreso]}>
          <View style={estilos.statHeaderRow}>
            <Ionicons name="trending-up" size={12} color={texto('#6366F1')} />
            <Text style={estilos.statLabel}>Progreso</Text>
          </View>
          <Text style={[estilos.statNumero, { color: texto('#4F46E5') }]}>{progresoPorcentaje}%</Text>
          <Text style={estilos.statSub}>Completado</Text>
        </View>

        <View style={[estilos.statCard, estilos.statMaterias]}>
          <View style={estilos.statHeaderRow}>
            <Ionicons name="book-outline" size={12} color={texto('#8B5CF6')} />
            <Text style={estilos.statLabel}>Materias</Text>
          </View>
          <Text style={[estilos.statNumero, { color: texto('#7C3AED') }]}>{materias.length}</Text>
          <Text style={estilos.statSub}>Registradas</Text>
        </View>
      </View>

      {/* Tarjeta IA con degradado */}
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={estilos.summaryCard}>
        <View style={estilos.summaryBadgeRow}>
          <Ionicons name="sparkles" size={14} color="#E0E7FF" />
          <Text style={estilos.summaryBadge}>GEMINI AI SUMMARY</Text>
        </View>
        <Text style={estilos.summaryText}>
          {pendientesCount === 0
            ? '¡No tienes tareas pendientes! Disfruta tu día 🎉'
            : `Tienes ${pendientesCount} tarea${pendientesCount === 1 ? '' : 's'} pendiente${pendientesCount === 1 ? '' : 's'}${
                urgentesCount > 0 ? `, ${urgentesCount} de ellas vence pronto` : ''
              }. ¡Enfócate en completarlas hoy!`}
        </Text>
            </LinearGradient>
          </View>

          {/* Columna principal: agenda */}
          <View style={estilos.columnaPrincipal}>
            {/* Encabezado Agenda */}
            <View style={estilos.agendaHeader}>
        <Text style={estilos.agendaSub}>MI AGENDA</Text>
        <View style={estilos.agendaTitleRow}>
          <Text style={estilos.agendaTitle}>Tareas de hoy</Text>
          <View style={estilos.agendaDerecha}>
            {esEscritorio && (
              <TouchableOpacity
                style={estilos.botonNuevaTarea}
                onPress={abrirNueva}
                accessibilityRole="button"
                accessibilityLabel="Nueva tarea"
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={estilos.botonNuevaTareaTexto}>Nueva tarea</Text>
              </TouchableOpacity>
            )}
            <Text style={estilos.agendaCount}>
              {pendientesCount} pendiente{pendientesCount === 1 ? '' : 's'}
            </Text>

            <TouchableOpacity
              style={estilos.botonMenu}
              onPress={() => setMenuVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Opciones de orden"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Pestañas / Filtros */}
      <View style={estilos.tabsContainer}>
        {(['todas', 'pendientes', 'completadas', 'materia'] as const).map((opcion) => (
          <TouchableOpacity
            key={opcion}
            style={[estilos.tab, filtro === opcion && estilos.activeTab]}
            onPress={() => setFiltro(opcion)}
          >
            <Text style={[estilos.tabText, filtro === opcion && estilos.activeTabText]}>
              {opcion === 'todas'
                ? 'Todas'
                : opcion === 'pendientes'
                  ? 'Pendientes'
                  : opcion === 'completadas'
                    ? 'Completadas'
                    : 'Por materia'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtro === 'materia' && (
        <View style={estilos.filtroMaterias}>
          {materias.length === 0 ? (
            <Text style={estilos.sinMaterias}>
              Todavía no tienes materias. Créalas desde el botón Materias del encabezado.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.filtroMateriasContenido}
            >
              <TouchableOpacity
                style={[estilos.chipFiltro, filtroMateria === null && estilos.chipFiltroActivo]}
                onPress={() => setFiltroMateria(null)}
              >
                <Text
                  style={[
                    estilos.chipFiltroTexto,
                    filtroMateria === null && estilos.chipFiltroTextoActivo,
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>

              {materias.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    estilos.chipFiltro,
                    filtroMateria === m.id && {
                      backgroundColor: `${m.color}1A`,
                      borderColor: m.color,
                    },
                  ]}
                  onPress={() => setFiltroMateria(m.id)}
                >
                  <View style={[estilos.puntoChip, { backgroundColor: m.color }]} />
                  <Text
                    style={[estilos.chipFiltroTexto, filtroMateria === m.id && { color: m.color }]}
                  >
                    {m.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Lista de Tareas */}
      {cargando ? (
        <ActivityIndicator size="large" color={texto('#6366F1')} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tareasOrdenadas}
          keyExtractor={(item) => `${filtro}-${filtroMateria ?? 'todas'}-${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <TarjetaTarea
              tarea={item}
              materia={materias.find((m) => m.id === item.materiaId)}
              fechaTexto={formatearFechaLimite(item.dueDate)}
              vencida={estaVencida(item.dueDate, item.completed)}
              urgencia={calcularUrgencia(item.dueDate, item.completed)}
              indice={index}
              onAlternar={() => alternarCompletada(item)}
              onEditar={() => abrirEdicion(item)}
              onEliminar={() => eliminarTarea(item)}
            />
          )}
          ListEmptyComponent={
            <View style={[estilos.vacioContainer, esEscritorio && estilos.vacioContainerEscritorio]}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color="#CBD5E1" />
              <Text style={estilos.vacioTitulo}>
                {filtro === 'completadas' ? 'Aún no completas tareas' : 'No hay tareas aquí'}
              </Text>
              <Text style={estilos.vacioTexto}>
                {filtro === 'todas'
                  ? 'Crea tu primera tarea y empieza a organizar tu semana.'
                  : 'Cambia de pestaña o crea una nueva tarea.'}
              </Text>

              <TouchableOpacity
                style={estilos.botonVacio}
                onPress={abrirNueva}
                accessibilityRole="button"
                accessibilityLabel="Crear tarea"
              >
                <Ionicons name="add" size={17} color="#FFF" />
                <Text style={estilos.botonVacioTexto}>Crear mi primera tarea</Text>
              </TouchableOpacity>

              <View style={estilos.tips}>
                <View style={estilos.tipFila}>
                  <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                  <Text style={estilos.tipTexto}>Asigna una fecha límite para verla como urgente</Text>
                </View>
                <View style={estilos.tipFila}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#94A3B8" />
                  <Text style={estilos.tipTexto}>Marca las tareas completadas con el círculo</Text>
                </View>
                <View style={estilos.tipFila}>
                  <Ionicons name="funnel-outline" size={13} color="#94A3B8" />
                  <Text style={estilos.tipTexto}>Usa las pestañas para filtrar tu agenda</Text>
                </View>
              </View>
            </View>
          }
        />
      )}

          </View>
        </View>

        {/* Botón Flotante "+" (solo móvil; en escritorio está el botón de la agenda) */}
        {!esEscritorio && (
          <Pressable
            style={({ pressed }) => [estilos.fab, pressed && { transform: [{ scale: 0.94 }] }]}
            onPress={abrirNueva}
            accessibilityRole="button"
            accessibilityLabel="Nueva tarea"
          >
            <Ionicons name="add" size={28} color="#FFF" />
          </Pressable>
        )}
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={estilos.menuFondo}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
          <View style={estilos.menuTarjeta}>
            <Text style={estilos.menuTitulo}>Ordenar por</Text>
            {(
              [
                { clave: 'fecha', texto: 'Fecha límite', icono: 'calendar-outline' },
                { clave: 'prioridad', texto: 'Prioridad', icono: 'flag-outline' },
                { clave: 'materia', texto: 'Materia', icono: 'book-outline' },
              ] as const
            ).map((opcion) => (
              <TouchableOpacity
                key={opcion.clave}
                style={[estilos.menuOpcion, orden === opcion.clave && estilos.menuOpcionActiva]}
                onPress={() => {
                  setOrden(opcion.clave);
                  setMenuVisible(false);
                }}
              >
                <Ionicons
                  name={opcion.icono}
                  size={17}
                  color={orden === opcion.clave ? '#4C49ED' : '#64748B'}
                />
                <Text
                  style={[
                    estilos.menuOpcionTexto,
                    orden === opcion.clave && estilos.menuOpcionTextoActiva,
                  ]}
                >
                  {opcion.texto}
                </Text>
                {orden === opcion.clave && <Ionicons name="checkmark" size={16} color={texto('#4C49ED')} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Modal Nueva Tarea */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={estilos.modalOverlay}>
          <Animated.View style={[estilos.modalContent, { transform: [{ translateY: hojaY }] }]}>
            <Text style={estilos.modalTitle}>{editando ? 'Editar tarea' : 'Nueva Tarea'}</Text>

            <TextInput
              style={estilos.input}
              placeholder="Título de la tarea"
              placeholderTextColor="#94A3B8"
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              style={estilos.input}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#94A3B8"
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <Text style={estilos.labelFecha}>Materia (opcional)</Text>

            {materias.length === 0 ? (
              <Text style={estilos.sinMaterias}>
                Aún no tienes materias. Créalas desde el botón Materias del encabezado.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={estilos.materiasModal}
              >
                <TouchableOpacity
                  style={[
                    estilos.chipSeleccion,
                    materiaSeleccionada === null && estilos.chipSeleccionActivo,
                  ]}
                  onPress={() => setMateriaSeleccionada(null)}
                >
                  <Text
                    style={[
                      estilos.chipSeleccionTexto,
                      materiaSeleccionada === null && estilos.chipSeleccionTextoActivo,
                    ]}
                  >
                    Sin materia
                  </Text>
                </TouchableOpacity>

                {materias.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      estilos.chipSeleccion,
                      materiaSeleccionada === m.id && {
                        borderColor: m.color,
                        backgroundColor: `${m.color}1A`,
                      },
                    ]}
                    onPress={() => setMateriaSeleccionada(m.id)}
                  >
                    <View style={[estilos.puntoChip, { backgroundColor: m.color }]} />
                    <Text
                      style={[
                        estilos.chipSeleccionTexto,
                        materiaSeleccionada === m.id && { color: m.color },
                      ]}
                    >
                      {m.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={estilos.labelFecha}>Fecha límite (opcional)</Text>

            {Platform.OS === 'web' ? (
              <View style={estilos.filaFecha}>
                {React.createElement('input', {
                  type: 'date',
                  value: fechaLimite ? fechaLimite.toISOString().split('T')[0] : '',
                  onChange: (e: any) => {
                    const valor = e.target.value;
                    if (!valor) {
                      setFechaLimite(null);
                      return;
                    }
                    const [anio, mes, dia] = valor.split('-').map(Number);
                    setFechaLimite((actual) => {
                      const base = actual ? new Date(actual) : new Date();
                      base.setFullYear(anio, mes - 1, dia);
                      return new Date(base);
                    });
                  },
                  style: {
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#1F2937',
                  },
                })}

                {React.createElement('input', {
                  type: 'time',
                  value: fechaLimite ? fechaLimite.toTimeString().slice(0, 5) : '',
                  onChange: (e: any) => {
                    const valor = e.target.value;
                    if (!valor) return;
                    const [horas, minutos] = valor.split(':').map(Number);
                    setFechaLimite((actual) => {
                      const base = actual ? new Date(actual) : new Date();
                      base.setHours(horas, minutos);
                      return new Date(base);
                    });
                  },
                  style: {
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#1F2937',
                  },
                })}

                {fechaLimite && (
                  <TouchableOpacity onPress={() => setFechaLimite(null)} hitSlop={8}>
                    <Text style={estilos.btnQuitarFecha}>Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <View style={estilos.filaFecha}>
                  <TouchableOpacity style={estilos.btnFecha} onPress={() => setMostrarPickerFecha(true)}>
                    <Ionicons name="calendar-outline" size={14} color={texto('#6366F1')} />
                    <Text style={estilos.btnFechaTexto}>
                      {fechaLimite
                        ? fechaLimite.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Elegir fecha'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={estilos.btnFecha} onPress={() => setMostrarPickerHora(true)}>
                    <Ionicons name="time-outline" size={14} color={texto('#6366F1')} />
                    <Text style={estilos.btnFechaTexto}>
                      {fechaLimite
                        ? fechaLimite.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : 'Elegir hora'}
                    </Text>
                  </TouchableOpacity>

                  {fechaLimite && (
                    <TouchableOpacity onPress={() => setFechaLimite(null)} hitSlop={8}>
                      <Text style={estilos.btnQuitarFecha}>Quitar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {mostrarPickerFecha && (
                  <DateTimePicker
                    value={fechaLimite || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, fechaSeleccionada) => {
                      setMostrarPickerFecha(Platform.OS === 'ios');
                      if (event.type === 'dismissed' || !fechaSeleccionada) return;
                      setFechaLimite((actual) => {
                        const base = actual ? new Date(actual) : new Date();
                        base.setFullYear(fechaSeleccionada.getFullYear());
                        base.setMonth(fechaSeleccionada.getMonth());
                        base.setDate(fechaSeleccionada.getDate());
                        return base;
                      });
                      if (Platform.OS !== 'ios') setMostrarPickerFecha(false);
                    }}
                  />
                )}

                {mostrarPickerHora && (
                  <DateTimePicker
                    value={fechaLimite || new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, horaSeleccionada) => {
                      setMostrarPickerHora(Platform.OS === 'ios');
                      if (event.type === 'dismissed' || !horaSeleccionada) return;
                      setFechaLimite((actual) => {
                        const base = actual ? new Date(actual) : new Date();
                        base.setHours(horaSeleccionada.getHours());
                        base.setMinutes(horaSeleccionada.getMinutes());
                        return base;
                      });
                      if (Platform.OS !== 'ios') setMostrarPickerHora(false);
                    }}
                  />
                )}
              </>
            )}

            <View style={estilos.modalButtons}>
              <TouchableOpacity
                style={[estilos.btnModal, { backgroundColor: '#F1F5F9' }]}
                onPress={cerrarModal}
              >
                <Text style={{ color: '#475569', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[estilos.btnModal, { backgroundColor: '#6366F1' }]} onPress={guardarTarea}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>
                  {editando ? 'Guardar cambios' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
      <DialogoConfirmacion
        visible={confirmacion !== null}
        datos={confirmacion}
        procesando={procesando}
        onConfirmar={() => void ejecutarConfirmacion()}
        onCancelar={() => {
          if (!procesando) setConfirmacion(null);
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contenido: {
    flex: 1,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contenidoEscritorio: { paddingTop: 20, paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerBanda: { width: '100%', paddingTop: 44, paddingBottom: 16 },
  headerBandaEscritorio: { paddingTop: 16 },
  headerInterior: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
  },
  headerIzquierda: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  headerTitulo: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', flexShrink: 1 },
  headerSaludo: { color: '#C7D2FE', fontSize: 12, fontWeight: '600', maxWidth: 140 },
  insigniaRol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  insigniaRolTexto: { color: '#E0E7FF', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  botonIcono: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  botonHeroTexto: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  headerHero: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 18,
  },
  headerFondo: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTexto: { flexShrink: 1, paddingRight: 8 },
  headerAcciones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  botonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  botonHeaderTexto: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  botonSalir: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cuerpo: { flex: 1 },
  cuerpoEscritorio: { flexDirection: 'row-reverse', gap: 20, alignItems: 'stretch' },
  columnaLateral: { width: '100%' },
  columnaLateralEscritorio: { width: 340, flexShrink: 0 },
  columnaPrincipal: { flex: 1 },
  statsRowEscritorio: { flexDirection: 'column', gap: 10, marginBottom: 14 },
  agendaDerecha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botonNuevaTarea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  botonNuevaTareaTexto: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  botonVacio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  botonVacioTexto: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  vacioContainerEscritorio: { marginTop: 30 },
  tips: { marginTop: 24, gap: 8, width: '100%', maxWidth: 400 },
  tipFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipTexto: { fontSize: 12, color: '#94A3B8' },
  greeting: { fontSize: 13, color: '#C7D2FE' },
  userName: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: { color: '#4338CA', fontWeight: 'bold', fontSize: 14 },
  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 1,
    right: 1,
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 12 },
  statHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  statNumero: { fontSize: 22, fontWeight: 'bold' },
  statSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  summaryCard: { borderRadius: 20, padding: 18, marginBottom: 22 },
  summaryBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  summaryBadge: { color: '#E0E7FF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  summaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', lineHeight: 20 },

  agendaHeader: { marginBottom: 14 },
  agendaSub: { fontSize: 11, fontWeight: '700', color: '#6366F1', letterSpacing: 0.6 },
  agendaTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  agendaTitle: { fontSize: 19, fontWeight: 'bold', color: '#0F172A' },
  agendaCount: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  tabsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activeTab: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  activeTabText: { color: '#FFFFFF' },

  filtroMaterias: { marginBottom: 14 },
  filtroMateriasContenido: { gap: 8, paddingRight: 4 },
  chipFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipFiltroActivo: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  chipFiltroTexto: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  chipFiltroTextoActivo: { color: '#FFFFFF' },

  chipMateria: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 5,
  },
  chipMateriaTexto: { fontSize: 10, fontWeight: '700' },
  puntoChip: { width: 7, height: 7, borderRadius: 999 },

  materiasModal: { gap: 8, paddingVertical: 2 },
  chipSeleccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipSeleccionActivo: { borderColor: '#0F172A', backgroundColor: '#0F172A' },
  chipSeleccionTexto: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipSeleccionTextoActivo: { color: '#FFFFFF' },
  sinMaterias: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  bannerAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bannerAvisoTexto: { flex: 1, fontSize: 12, color: '#B91C1C' },

  greetingFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statUrgente: { backgroundColor: '#FEF2F2' },
  statProgreso: { backgroundColor: '#EEF2FF' },
  statMaterias: { backgroundColor: '#F5F3FF' },
  botonTema: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  estadoAlerta: { backgroundColor: '#FEE2E2' },
  estadoPunto: { width: 6, height: 6, borderRadius: 999 },
  estadoTexto: { fontSize: 10, fontWeight: '700', color: '#047857' },
  estadoTextoAlerta: { color: '#B91C1C' },
  badgePunto: { width: 5, height: 5, borderRadius: 999 },
  botonMenu: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuFondo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuTarjeta: { width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14 },
  menuTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 6,
  },
  menuOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  menuOpcionActiva: { backgroundColor: '#EEF2FF' },
  menuOpcionTexto: { flex: 1, fontSize: 13, fontWeight: '600', color: '#334155' },
  menuOpcionTextoActiva: { color: '#4C49ED', fontWeight: '700' },

  cardTarea: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  iconoTarea: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkCircleActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },

  filaTituloUrgencia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tituloTarea: { fontSize: 15, fontWeight: '600', color: '#1E293B', flexShrink: 1 },
  tituloCompletado: { textDecorationLine: 'line-through', color: '#94A3B8' },

  badgeUrgencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  badgeUrgenciaTexto: { fontSize: 10, fontWeight: '700' },

  descTarea: { fontSize: 13, color: '#64748B', marginTop: 3 },
  filaFechaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  fechaTexto: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
  fechaVencida: { color: '#EF4444' },
  btnEliminar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEditar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  vacioContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  vacioTitulo: { fontSize: 15, fontWeight: '700', color: '#334155', marginTop: 12 },
  vacioTexto: { textAlign: 'center', color: '#94A3B8', marginTop: 4, fontSize: 13 },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 22, padding: 22, gap: 12 },
  modalTitle: { fontSize: 19, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: '#1E293B',
  },
  labelFecha: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 },
  filaFecha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnFecha: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  btnFechaTexto: { fontSize: 13, color: '#1F2937' },
  btnQuitarFecha: { fontSize: 12, color: '#EF4444', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btnModal: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 10 },
});
