import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { AdminUsuario, TareaAdmin } from '../../domain/models/AdminUsuario';
import { Estadisticas } from '../../domain/models/Estadisticas';
import { Usuario } from '../../domain/models/Usuario';
import { esErrorSesion } from '../../domain/errors/ErrorSesion';
import { RepositorioAdmin } from '../../domain/repositories/RepositorioAdmin';
import { HttpAdminRepository } from '../../infrastructure/adapters/HttpAdminRepository';
import { DatosConfirmacion, DialogoConfirmacion } from '../components/DialogoConfirmacion';
import { useEstilos, useTema } from '../theme/tema';

type NombreIcono = React.ComponentProps<typeof Ionicons>['name'];

// Composición: la pantalla depende del PUERTO (RepositorioAdmin), no de fetch.
const adminRepo: RepositorioAdmin = new HttpAdminRepository();

const ESPACIO_SUPERIOR =
  Platform.OS === 'web'
    ? 26
    : Platform.OS === 'android'
      ? (StatusBar.currentHeight ?? 24) + 14
      : 58;

// A partir de este ancho el panel cambia a layout de escritorio (barra superior,
// métricas en fila y filas de usuario horizontales). En móvil no cambia nada.
const ANCHO_MAX = 1100;
const CORTE_ESCRITORIO = 900;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatearFecha = (valor: string): string => {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
};

const inicialesDe = (nombre: string): string => {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
};

const mensajeDe = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado.';

interface Props {
  usuario: Usuario;
  onVerMisTareas: () => void;
  onCerrarSesion: () => void;
}

interface Confirmacion extends DatosConfirmacion {
  accion: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Subcomponentes de presentación
// ---------------------------------------------------------------------------

const TarjetaEstadistica: React.FC<{
  icono: NombreIcono;
  etiqueta: string;
  valor?: number;
  color: string;
  escritorio?: boolean;
}> = ({ icono, etiqueta, valor, color, escritorio = false }) => {
  const estilos = useEstilos(styles);

  return (
    <View style={[estilos.tarjeta, escritorio && estilos.tarjetaEscritorio]}>
      <View
        style={[
          estilos.tarjetaIcono,
          escritorio && estilos.tarjetaIconoEscritorio,
          { backgroundColor: `${color}1A` },
        ]}
      >
        <Ionicons name={icono} size={18} color={color} />
      </View>
      <View style={escritorio ? estilos.tarjetaTextosEscritorio : undefined}>
        <Text style={estilos.tarjetaValor}>{valor === undefined ? '—' : valor}</Text>
        <Text style={estilos.tarjetaEtiqueta}>{etiqueta}</Text>
      </View>
    </View>
  );
};

const FilaUsuario: React.FC<{
  item: AdminUsuario;
  esPropio: boolean;
  escritorio: boolean;
  onVerTareas: () => void;
  onAlternarEstado: () => void;
  onEliminar: () => void;
}> = ({ item, esPropio, escritorio, onVerTareas, onAlternarEstado, onEliminar }) => {
  const estilos = useEstilos(styles);
  const { texto } = useTema();
  const nombreVisible = item.nombre || 'Sin nombre';

  return (
    <View style={[estilos.fila, escritorio && estilos.filaEscritorio]}>
      <View style={[estilos.filaSuperior, escritorio && estilos.filaSuperiorEscritorio]}>
        <View style={[estilos.avatar, !item.activo && estilos.avatarInactivo]}>
          <Text style={estilos.avatarTexto}>{inicialesDe(nombreVisible)}</Text>
        </View>

        <View style={estilos.filaInfo}>
          <View style={estilos.filaNombreFila}>
            <Text style={estilos.filaNombre} numberOfLines={1}>
              {nombreVisible}
            </Text>
            {item.rol === 'ADMIN' && (
              <View style={estilos.chipAdmin}>
                <Text style={estilos.chipAdminTexto}>ADMIN</Text>
              </View>
            )}
            {esPropio && (
              <View style={estilos.chipYo}>
                <Text style={estilos.chipYoTexto}>TÚ</Text>
              </View>
            )}
          </View>

          <Text style={estilos.filaCorreo} numberOfLines={1}>
            {item.correo || 'sin correo'}
          </Text>

          <View style={estilos.filaMeta}>
            <View
              style={[estilos.puntoEstado, { backgroundColor: item.activo ? '#10B981' : '#EF4444' }]}
            />
            <Text style={estilos.filaMetaTexto}>{item.activo ? 'Activa' : 'Bloqueada'}</Text>
            <Text style={estilos.filaMetaSeparador}>·</Text>
            <Text style={estilos.filaMetaTexto}>{item.totalTareas} tareas</Text>
            {item.tareasCompletadas !== undefined && (
              <Text style={estilos.filaMetaTexto}>· {item.tareasCompletadas} completadas</Text>
            )}
          </View>
        </View>
      </View>

      <View style={[estilos.filaBotones, escritorio && estilos.filaBotonesEscritorio]}>
        <TouchableOpacity
          style={estilos.botonSecundario}
          onPress={onVerTareas}
          accessibilityRole="button"
          accessibilityLabel={`Ver tareas de ${nombreVisible}`}
        >
          <Ionicons name="document-text-outline" size={14} color={texto('#4C49ED')} />
          <Text style={estilos.botonSecundarioTexto}>Tareas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            estilos.botonSecundario,
            !item.activo && estilos.botonSecundarioVerde,
            esPropio && estilos.botonDeshabilitado,
          ]}
          onPress={onAlternarEstado}
          disabled={esPropio}
          accessibilityRole="button"
          accessibilityLabel={item.activo ? 'Bloquear cuenta' : 'Activar cuenta'}
        >
          <Ionicons
            name={item.activo ? 'lock-closed-outline' : 'lock-open-outline'}
            size={14}
            color={texto(item.activo ? '#B45309' : '#047857')}
          />
          <Text
            style={[estilos.botonSecundarioTexto, { color: item.activo ? '#B45309' : '#047857' }]}
          >
            {item.activo ? 'Bloquear' : 'Activar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botonPeligro}
          onPress={onEliminar}
          disabled={esPropio}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar a ${nombreVisible}`}
        >
          <Ionicons name="trash-outline" size={14} color={texto(esPropio ? '#D1D5DB' : '#DC2626')} />
          <Text style={[estilos.botonPeligroTexto, esPropio && estilos.textoDeshabilitado]}>
            Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ModalTareas: React.FC<{
  visible: boolean;
  usuario: AdminUsuario | null;
  tareas: TareaAdmin[];
  cargando: boolean;
  error: string | null;
  onCerrar: () => void;
  onRecargar: () => void;
  onEliminar: (tarea: TareaAdmin) => void;
}> = ({ visible, usuario, tareas, cargando, error, onCerrar, onRecargar, onEliminar }) => {
  const estilos = useEstilos(styles);
  const { texto } = useTema();
  const completadas = tareas.filter((t) => t.completada).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.modalFondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} />

        <View style={estilos.modalTarjeta}>
          <View style={estilos.modalEncabezado}>
            <View style={estilos.modalAvatar}>
              <Text style={estilos.modalAvatarTexto}>
                {inicialesDe(usuario?.nombre || usuario?.correo || '?')}
              </Text>
            </View>
            <View style={estilos.modalEncabezadoTexto}>
              <Text style={estilos.modalNombre} numberOfLines={1}>
                {usuario?.nombre || 'Usuario'}
              </Text>
              <Text style={estilos.modalCorreo} numberOfLines={1}>
                {usuario?.correo}
              </Text>
            </View>
            <TouchableOpacity
              style={estilos.modalCerrar}
              onPress={onCerrar}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={estilos.modalResumen}>
            <Text style={estilos.modalResumenTexto}>
              {tareas.length} tareas · {completadas} completadas · {tareas.length - completadas}{' '}
              pendientes
            </Text>
            <TouchableOpacity onPress={onRecargar} hitSlop={8} accessibilityLabel="Recargar tareas">
              <Ionicons name="refresh" size={16} color={texto('#4C49ED')} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={estilos.modalError}>
              <Text style={estilos.modalErrorTexto}>{error}</Text>
            </View>
          )}

          {cargando ? (
            <View style={estilos.modalCargando}>
              <ActivityIndicator color="#5D5FEF" />
              <Text style={estilos.modalCargandoTexto}>Cargando tareas…</Text>
            </View>
          ) : tareas.length === 0 ? (
            <View style={estilos.modalVacio}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color="#C7D2FE" />
              <Text style={estilos.modalVacioTexto}>
                Este usuario todavía no tiene tareas registradas.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={estilos.modalLista}
              contentContainerStyle={estilos.modalListaContenido}
              showsVerticalScrollIndicator
            >
              {tareas.map((tarea) => (
                <View key={tarea.id} style={estilos.tareaFila}>
                  <Ionicons
                    name={tarea.completada ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={tarea.completada ? '#10B981' : '#9CA3AF'}
                  />
                  <View style={estilos.tareaInfo}>
                    <Text
                      style={[estilos.tareaTitulo, tarea.completada && estilos.tareaTituloHecha]}
                      numberOfLines={1}
                    >
                      {tarea.titulo}
                    </Text>
                    {!!tarea.descripcion && (
                      <Text style={estilos.tareaDescripcion} numberOfLines={2}>
                        {tarea.descripcion}
                      </Text>
                    )}
                    <Text style={estilos.tareaMeta}>
                      {tarea.completada ? 'Completada' : 'Pendiente'}
                      {tarea.fechaLimite
                        ? ` · vence ${formatearFecha(tarea.fechaLimite)}`
                        : tarea.fechaCreacion
                          ? ` · creada ${formatearFecha(tarea.fechaCreacion)}`
                          : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={estilos.tareaEliminar}
                    onPress={() => onEliminar(tarea)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar tarea ${tarea.titulo}`}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={16} color={texto('#DC2626')} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Pantalla principal
// ---------------------------------------------------------------------------

export const AdminDashboardScreen: React.FC<Props> = ({
  usuario,
  onVerMisTareas,
  onCerrarSesion,
}) => {
  const estilos = useEstilos(styles);
  const { modo, alternar, texto } = useTema();
  const { width: anchoVentana } = useWindowDimensions();
  const esEscritorio = anchoVentana >= CORTE_ESCRITORIO;

  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [busqueda, setBusqueda] = useState('');

  const [cargando, setCargando] = useState(true);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<AdminUsuario | null>(null);
  const [tareasUsuario, setTareasUsuario] = useState<TareaAdmin[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(false);
  const [errorTareas, setErrorTareas] = useState<string | null>(null);

  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [procesando, setProcesando] = useState(false);

  const busquedaRef = useRef('');
  const peticionRef = useRef(0);
  const yaCargoRef = useRef(false);

  useEffect(() => {
    busquedaRef.current = busqueda;
  }, [busqueda]);

  const manejarError = useCallback(
    (e: unknown) => {
      if (esErrorSesion(e)) {
        onCerrarSesion();
        return;
      }
      setError(mensajeDe(e));
    },
    [onCerrarSesion],
  );

  const cargarEstadisticas = useCallback(async () => {
    try {
      setEstadisticas(await adminRepo.obtenerEstadisticas());
    } catch (e) {
      manejarError(e);
    }
  }, [manejarError]);

  const cargarUsuarios = useCallback(
    async (texto: string) => {
      // Si el usuario escribe rápido, descartamos respuestas viejas.
      const idPeticion = ++peticionRef.current;
      setCargandoLista(true);
      try {
        const lista = await adminRepo.listarUsuarios(texto);
        if (idPeticion === peticionRef.current) setUsuarios(lista);
      } catch (e) {
        manejarError(e);
      } finally {
        if (idPeticion === peticionRef.current) setCargandoLista(false);
      }
    },
    [manejarError],
  );

  const cargarTodo = useCallback(
    async (conIndicador = true) => {
      if (conIndicador) setCargando(true);
      setError(null);
      try {
        await Promise.all([cargarEstadisticas(), cargarUsuarios(busquedaRef.current)]);
      } finally {
        if (conIndicador) setCargando(false);
      }
    },
    [cargarEstadisticas, cargarUsuarios],
  );

  useEffect(() => {
    // Solo la primera vez: evita recargar el panel si cambia la identidad
    // de las funciones por un re-render del padre.
    if (yaCargoRef.current) return;
    yaCargoRef.current = true;
    void cargarTodo();
  }, [cargarTodo]);

  // Buscador con debounce: no disparamos una petición por cada tecla.
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const temporizador = setTimeout(() => {
      void cargarUsuarios(busqueda);
    }, 400);
    return () => clearTimeout(temporizador);
  }, [busqueda, cargarUsuarios]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargarTodo(false);
    setRefrescando(false);
  };

  // ---------------------------- acciones ----------------------------

  const cambiarEstado = async (objetivo: AdminUsuario, activo: boolean) => {
    try {
      await adminRepo.cambiarEstadoUsuario(objetivo.id, activo);
      setUsuarios((prev) => prev.map((u) => (u.id === objetivo.id ? { ...u, activo } : u)));
      setError(null);
    } catch (e) {
      manejarError(e);
      throw e;
    }
  };

  const alternarEstado = (objetivo: AdminUsuario) => {
    if (objetivo.activo) {
      setConfirmacion({
        titulo: 'Bloquear cuenta',
        mensaje: `${objetivo.nombre || objetivo.correo} no podrá iniciar sesión hasta que la reactives.`,
        textoConfirmar: 'Bloquear',
        peligro: true,
        accion: () => cambiarEstado(objetivo, false),
      });
      return;
    }

    void cambiarEstado(objetivo, true).catch(() => undefined);
  };

  const eliminarUsuario = (objetivo: AdminUsuario) => {
    setConfirmacion({
      titulo: 'Eliminar usuario',
      mensaje: `Se eliminará la cuenta de ${
        objetivo.nombre || objetivo.correo
      } y todas sus tareas. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      accion: async () => {
        await adminRepo.eliminarUsuario(objetivo.id);
        await Promise.all([cargarUsuarios(busquedaRef.current), cargarEstadisticas()]);
      },
    });
  };

  const abrirTareas = async (objetivo: AdminUsuario) => {
    setUsuarioSeleccionado(objetivo);
    setTareasUsuario([]);
    setErrorTareas(null);
    setCargandoTareas(true);
    try {
      setTareasUsuario(await adminRepo.listarTareasDeUsuario(objetivo.id));
    } catch (e) {
      if (esErrorSesion(e)) {
        setUsuarioSeleccionado(null);
        onCerrarSesion();
        return;
      }
      setErrorTareas(mensajeDe(e));
    } finally {
      setCargandoTareas(false);
    }
  };

  const recargarTareas = async () => {
    if (!usuarioSeleccionado) return;
    setErrorTareas(null);
    setCargandoTareas(true);
    try {
      setTareasUsuario(await adminRepo.listarTareasDeUsuario(usuarioSeleccionado.id));
    } catch (e) {
      if (esErrorSesion(e)) {
        onCerrarSesion();
        return;
      }
      setErrorTareas(mensajeDe(e));
    } finally {
      setCargandoTareas(false);
    }
  };

  const eliminarTarea = (tarea: TareaAdmin) => {
    setConfirmacion({
      titulo: 'Eliminar tarea',
      mensaje: `Se eliminará "${tarea.titulo}" de la cuenta de ${
        usuarioSeleccionado?.nombre || 'este usuario'
      }.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      accion: async () => {
        await adminRepo.eliminarTareaAdmin(tarea.id);
        setTareasUsuario((prev) => prev.filter((t) => t.id !== tarea.id));
        await cargarEstadisticas();
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
      manejarError(e);
    } finally {
      setProcesando(false);
    }
  };

  // ---------------------------- render ----------------------------

  if (cargando) {
    return (
      <View style={estilos.pantallaCargando}>
        <StatusBar barStyle="light-content" backgroundColor="#4C49ED" />
        <LinearGradient colors={['#4C49ED', '#6B3CE9', '#2E1C73']} style={estilos.cargandoFondo}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={estilos.cargandoTexto}>Cargando panel de administración…</Text>
        </LinearGradient>
      </View>
    );
  }

  const cabeceraLista = (
    <View>
      {error && (
        <View style={estilos.bannerError}>
          <Ionicons name="alert-circle-outline" size={18} color={texto('#B91C1C')} />
          <Text style={estilos.bannerErrorTexto}>{error}</Text>
          <TouchableOpacity
            onPress={() => setError(null)}
            hitSlop={8}
            accessibilityLabel="Cerrar aviso"
          >
            <Ionicons name="close" size={16} color={texto('#B91C1C')} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[estilos.gridTarjetas, esEscritorio && estilos.gridTarjetasEscritorio]}>
        <TarjetaEstadistica
          icono="people"
          etiqueta="Usuarios"
          valor={estadisticas?.totalUsuarios}
          color="#5D5FEF"
          escritorio={esEscritorio}
        />
        <TarjetaEstadistica
          icono="documents"
          etiqueta="Tareas"
          valor={estadisticas?.totalTareas}
          color="#0EA5E9"
          escritorio={esEscritorio}
        />
        <TarjetaEstadistica
          icono="checkmark-circle"
          etiqueta="Completadas"
          valor={estadisticas?.completadas}
          color="#10B981"
          escritorio={esEscritorio}
        />
        <TarjetaEstadistica
          icono="time"
          etiqueta="Pendientes"
          valor={estadisticas?.pendientes}
          color="#F59E0B"
          escritorio={esEscritorio}
        />
      </View>

      <View style={estilos.resumenSemana}>
        <Ionicons name="trending-up" size={16} color={texto('#4C49ED')} />
        <Text style={estilos.resumenSemanaTexto}>
          <Text style={estilos.resumenSemanaNumero}>
            {estadisticas?.usuariosUltimos7Dias ?? 0}
          </Text>{' '}
          usuarios nuevos en los últimos 7 días
        </Text>
      </View>

      <View style={estilos.buscadorCaja}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={estilos.buscadorInput}
          placeholder="Buscar por nombre o correo"
          placeholderTextColor="#9CA3AF"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {cargandoLista && <ActivityIndicator size="small" color="#5D5FEF" />}
        {!cargandoLista && busqueda.length > 0 && (
          <TouchableOpacity
            onPress={() => setBusqueda('')}
            hitSlop={8}
            accessibilityLabel="Limpiar búsqueda"
          >
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={estilos.tituloSeccionFila}>
        <Text style={estilos.tituloSeccion}>Usuarios registrados</Text>
        <Text style={estilos.tituloSeccionConteo}>{usuarios.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#4C49ED" />

      <LinearGradient
        colors={['#4C49ED', '#6B3CE9', '#2E1C73']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.encabezado, esEscritorio && estilos.encabezadoEscritorio]}
      >
        <View
          style={[estilos.encabezadoInterior, esEscritorio && estilos.encabezadoInteriorEscritorio]}
        >
          {esEscritorio ? (
            <>
              <View style={estilos.barraIzquierda}>
                <View style={estilos.insigniaRol}>
                  <Ionicons name="shield-checkmark" size={11} color="#C7D2FE" />
                  <Text style={estilos.insigniaRolTexto}>ADMINISTRADOR</Text>
                </View>
                <Text style={estilos.barraTitulo}>Panel de administración</Text>
              </View>

              <View style={estilos.barraDerecha}>
                <Text style={estilos.barraUsuario} numberOfLines={1}>
                  Hola, {usuario.nombre || usuario.email}
                </Text>

                <TouchableOpacity
                  style={estilos.botonSalirBarra}
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

                <TouchableOpacity
                  style={estilos.botonMisTareas}
                  onPress={onVerMisTareas}
                  accessibilityRole="button"
                  accessibilityLabel="Ir a mis tareas"
                >
                  <Ionicons name="arrow-back" size={14} color={texto('#1E1B4B')} />
                  <Text style={estilos.botonMisTareasTexto}>Ir a mis tareas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={estilos.botonSalirBarra}
                  onPress={onCerrarSesion}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar sesión"
                >
                  <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={estilos.encabezadoTop}>
                <View style={estilos.encabezadoEtiquetas}>
                  <View style={estilos.insigniaRol}>
                    <Ionicons name="shield-checkmark" size={11} color="#C7D2FE" />
                    <Text style={estilos.insigniaRolTexto}>ADMINISTRADOR</Text>
                  </View>
                </View>
                <View style={estilos.encabezadoAcciones}>
                  <TouchableOpacity
                    onPress={alternar}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={modo === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                  >
                    <Ionicons
                      name={modo === 'oscuro' ? 'sunny-outline' : 'moon-outline'}
                      size={19}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onCerrarSesion}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar sesión"
                  >
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={estilos.encabezadoTitulo}>Panel de administración</Text>
              <Text style={estilos.encabezadoSubtitulo} numberOfLines={1}>
                Hola, {usuario.nombre || usuario.email}
              </Text>

              <TouchableOpacity
                style={estilos.botonMisTareas}
                onPress={onVerMisTareas}
                accessibilityRole="button"
                accessibilityLabel="Ir a mis tareas"
              >
                <Ionicons name="arrow-back" size={14} color={texto('#1E1B4B')} />
                <Text style={estilos.botonMisTareasTexto}>Ir a mis tareas</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={usuarios}
        keyExtractor={(item: AdminUsuario) => item.id || item.correo}
        renderItem={({ item }: { item: AdminUsuario }) => (
          <FilaUsuario
            item={item}
            esPropio={item.id === usuario.id}
            escritorio={esEscritorio}
            onVerTareas={() => void abrirTareas(item)}
            onAlternarEstado={() => alternarEstado(item)}
            onEliminar={() => eliminarUsuario(item)}
          />
        )}
        ListHeaderComponent={cabeceraLista}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Ionicons
              name={busqueda ? 'search-outline' : 'people-outline'}
              size={30}
              color="#C7D2FE"
            />
            <Text style={estilos.vacioTitulo}>
              {busqueda ? 'Sin coincidencias' : 'Todavía no hay usuarios'}
            </Text>
            <Text style={estilos.vacioTexto}>
              {busqueda
                ? `No encontramos usuarios para "${busqueda}".`
                : 'Cuando alguien se registre aparecerá aquí.'}
            </Text>
          </View>
        }
        style={estilos.lista}
        contentContainerStyle={estilos.listaContenido}
        refreshing={refrescando}
        onRefresh={refrescar}
        keyboardShouldPersistTaps="handled"
      />

      <ModalTareas
        visible={usuarioSeleccionado !== null}
        usuario={usuarioSeleccionado}
        tareas={tareasUsuario}
        cargando={cargandoTareas}
        error={errorTareas}
        onCerrar={() => setUsuarioSeleccionado(null)}
        onRecargar={() => void recargarTareas()}
        onEliminar={eliminarTarea}
      />

      <DialogoConfirmacion
        visible={confirmacion !== null}
        datos={confirmacion}
        procesando={procesando}
        onConfirmar={() => void ejecutarConfirmacion()}
        onCancelar={() => {
          if (!procesando) setConfirmacion(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F5F6FA', alignItems: 'center' },

  pantallaCargando: { flex: 1 },
  cargandoFondo: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cargandoTexto: { marginTop: 14, color: '#E0E7FF', fontSize: 13, fontWeight: '600' },

  encabezado: {
    width: '100%',
    paddingTop: ESPACIO_SUPERIOR,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  encabezadoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insigniaRol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  insigniaRolTexto: {
    color: '#E0E7FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  encabezadoEtiquetas: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  encabezadoTitulo: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  encabezadoSubtitulo: { color: '#C7D2FE', fontSize: 13, marginTop: 3, marginBottom: 14 },
  botonMisTareas: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  botonMisTareasTexto: { color: '#1E1B4B', fontSize: 12, fontWeight: '700' },

  lista: { width: '100%', maxWidth: ANCHO_MAX },
  listaContenido: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  gridTarjetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tarjeta: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  tarjetaIcono: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tarjetaValor: { fontSize: 22, fontWeight: '800', color: '#1E1B4B' },
  tarjetaEtiqueta: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2 },

  resumenSemana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 12,
  },
  resumenSemanaTexto: { fontSize: 12, color: '#4338CA', flex: 1 },
  resumenSemanaNumero: { fontWeight: '800' },

  buscadorCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 46,
    marginTop: 18,
  },
  buscadorInput: { flex: 1, fontSize: 13, color: '#1F2937', height: '100%' },

  tituloSeccionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  tituloSeccion: { fontSize: 14, fontWeight: '800', color: '#1E1B4B' },
  tituloSeccionConteo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C49ED',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },

  fila: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  filaSuperior: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInactivo: { backgroundColor: '#F3F4F6' },
  avatarTexto: { fontSize: 13, fontWeight: '800', color: '#4C49ED' },
  filaInfo: { flex: 1 },
  filaNombreFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filaNombre: { fontSize: 14, fontWeight: '700', color: '#1F2937', flexShrink: 1 },
  chipAdmin: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chipAdminTexto: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  chipYo: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chipYoTexto: { color: '#B45309', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  filaCorreo: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  filaMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  puntoEstado: { width: 7, height: 7, borderRadius: 999 },
  filaMetaTexto: { fontSize: 11, color: '#6B7280' },
  filaMetaSeparador: { fontSize: 11, color: '#D1D5DB' },

  filaBotones: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  botonSecundarioVerde: { backgroundColor: '#D1FAE5' },
  botonDeshabilitado: { opacity: 0.45 },
  botonSecundarioTexto: { fontSize: 11, fontWeight: '700', color: '#4C49ED' },
  botonPeligro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  botonPeligroTexto: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  textoDeshabilitado: { color: '#D1D5DB' },

  vacio: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  vacioTitulo: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginTop: 10 },
  vacioTexto: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },

  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  bannerErrorTexto: { flex: 1, fontSize: 12, color: '#B91C1C' },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalTarjeta: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  modalEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarTexto: { fontSize: 13, fontWeight: '800', color: '#4C49ED' },
  modalEncabezadoTexto: { flex: 1 },
  modalNombre: { fontSize: 15, fontWeight: '800', color: '#1E1B4B' },
  modalCorreo: { fontSize: 12, color: '#6B7280' },
  modalCerrar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalResumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
  },
  modalResumenTexto: { flex: 1, fontSize: 11, color: '#475569', fontWeight: '600' },
  modalError: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  modalErrorTexto: { fontSize: 11, color: '#B91C1C' },
  modalCargando: { alignItems: 'center', paddingVertical: 34, gap: 8 },
  modalCargandoTexto: { fontSize: 12, color: '#6B7280' },
  modalVacio: { alignItems: 'center', paddingVertical: 34, gap: 8 },
  modalVacioTexto: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalLista: { marginTop: 8 },
  modalListaContenido: { paddingBottom: 4 },
  tareaFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tareaInfo: { flex: 1 },
  tareaTitulo: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  tareaTituloHecha: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  tareaDescripcion: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  tareaMeta: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  tareaEliminar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---------------------------------------------------------------------
  // Escritorio (>= CORTE_ESCRITORIO). En móvil ninguna de estas se aplica.
  // ---------------------------------------------------------------------
  encabezadoEscritorio: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  encabezadoInterior: { width: '100%' },
  encabezadoInteriorEscritorio: {
    maxWidth: ANCHO_MAX,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  barraIzquierda: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  barraTitulo: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  barraDerecha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  encabezadoAcciones: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  barraUsuario: { color: '#C7D2FE', fontSize: 12, fontWeight: '600', maxWidth: 220 },
  botonSalirBarra: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  gridTarjetasEscritorio: { flexWrap: 'nowrap', gap: 16 },
  tarjetaEscritorio: {
    flex: 1,
    width: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  tarjetaIconoEscritorio: { marginBottom: 0 },
  tarjetaTextosEscritorio: { flexShrink: 1 },

  filaEscritorio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filaSuperiorEscritorio: { flex: 1 },
  filaBotonesEscritorio: { marginTop: 0, flexWrap: 'nowrap', flexShrink: 0 },
});
