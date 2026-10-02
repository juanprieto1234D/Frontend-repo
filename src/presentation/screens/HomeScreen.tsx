import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Tarea {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  dueDate?: string | null;
}

interface Props {
  usuario: any;
  setUsuario: (user: any) => void;
}

type Urgencia = 'vence_pronto' | 'esta_semana' | 'con_tiempo' | null;

export default function HomeScreen({ usuario, setUsuario }: Props) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'completadas'>('todas');
  const [cargando, setCargando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState<Date | null>(null);
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);

  const API_URL = 'http://localhost:3000/api/tareas';

  const userId = usuario?.id || usuario?.userId || usuario?._id;
  const nombreUsuario = usuario?.nombre || usuario?.name || usuario?.email?.split('@')[0] || 'Usuario';
  const iniciales = nombreUsuario.slice(0, 2).toUpperCase();

  const obtenerTareas = async () => {
    if (!userId || String(userId).includes('@')) return;
    try {
      setCargando(true);
      const res = await fetch(`${API_URL}?usuarioId=${userId}&userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        const listaMapeada = Array.isArray(data)
          ? data.map((t: any) => ({
              id: t.id,
              title: t.title || t.titulo || 'Sin título',
              description: t.description || t.descripcion || '',
              completed: t.completed ?? t.completada ?? false,
              dueDate: t.dueDate || t.fechaLimite || null,
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

  const crearTarea = async () => {
    if (!titulo.trim()) {
      alert('Ingresa un título para la tarea');
      return;
    }
    if (!userId || String(userId).includes('@')) {
      alert('Sesión no válida o falta el ID único de usuario. Por favor vuelve a iniciar sesión.');
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
      };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setTitulo('');
        setDescripcion('');
        setFechaLimite(null);
        setModalVisible(false);
        obtenerTareas();
      } else {
        alert(`Error al guardar: ${data.message || data.error || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error al enviar la tarea:', error);
      alert('Error de conexión con la API');
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
      Alert.alert('Error', error.message || 'No se pudo actualizar la tarea');
    }
  };

  const eliminarTarea = (tarea: Tarea) => {
    Alert.alert('Eliminar tarea', `¿Seguro que quieres eliminar "${tarea.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/${tarea.id}`, { method: 'DELETE' });
            if (!res.ok && res.status !== 204) {
              const data = await res.json();
              throw new Error(data.error || 'No se pudo eliminar la tarea');
            }
            setTareas((actual) => actual.filter((t) => t.id !== tarea.id));
          } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo eliminar la tarea');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    obtenerTareas();
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
    vence_pronto: { texto: 'Vence pronto', color: '#DC2626', fondo: '#FEE2E2' },
    esta_semana: { texto: 'Esta semana', color: '#D97706', fondo: '#FEF3C7' },
    con_tiempo: { texto: 'Con tiempo', color: '#16A34A', fondo: '#DCFCE7' },
  };

  const tareasFiltradas = tareas.filter((t) => {
    if (filtro === 'pendientes') return !t.completed;
    if (filtro === 'completadas') return t.completed;
    return true;
  });

  // --- Estadísticas, 100% calculadas de lo que ya existe (dueDate, completed) ---
  const pendientesCount = tareas.filter((t) => !t.completed).length;
  const urgentesCount = tareas.filter((t) => calcularUrgencia(t.dueDate, t.completed) === 'vence_pronto').length;
  const completadasCount = tareas.filter((t) => t.completed).length;
  const progresoPorcentaje = tareas.length > 0 ? Math.round((completadasCount / tareas.length) * 100) : 0;

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{saludo}</Text>
          <Text style={styles.userName}>Hola, {nombreUsuario}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciales}</Text>
          <View style={styles.onlineDot} />
        </View>
      </View>

      {/* Tarjetas de estadísticas */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.statLabel}>Urgentes</Text>
          </View>
          <Text style={[styles.statNumero, { color: '#DC2626' }]}>{urgentesCount}</Text>
          <Text style={styles.statSub}>Vencen pronto</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
          <View style={styles.statHeaderRow}>
            <Ionicons name="trending-up" size={12} color="#6366F1" />
            <Text style={styles.statLabel}>Progreso</Text>
          </View>
          <Text style={[styles.statNumero, { color: '#4F46E5' }]}>{progresoPorcentaje}%</Text>
          <Text style={styles.statSub}>Completado</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <View style={styles.statHeaderRow}>
            <Ionicons name="list" size={12} color="#16A34A" />
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <Text style={[styles.statNumero, { color: '#15803D' }]}>{pendientesCount}</Text>
          <Text style={styles.statSub}>Por hacer</Text>
        </View>
      </View>

      {/* Tarjeta IA con degradado */}
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.summaryCard}>
        <View style={styles.summaryBadgeRow}>
          <Ionicons name="sparkles" size={14} color="#E0E7FF" />
          <Text style={styles.summaryBadge}>GEMINI AI SUMMARY</Text>
        </View>
        <Text style={styles.summaryText}>
          {pendientesCount === 0
            ? '¡No tienes tareas pendientes! Disfruta tu día 🎉'
            : `Tienes ${pendientesCount} tarea${pendientesCount === 1 ? '' : 's'} pendiente${pendientesCount === 1 ? '' : 's'}${
                urgentesCount > 0 ? `, ${urgentesCount} de ellas vence pronto` : ''
              }. ¡Enfócate en completarlas hoy!`}
        </Text>
      </LinearGradient>

      {/* Encabezado Agenda */}
      <View style={styles.agendaHeader}>
        <Text style={styles.agendaSub}>MI AGENDA</Text>
        <View style={styles.agendaTitleRow}>
          <Text style={styles.agendaTitle}>Tareas de hoy</Text>
          <Text style={styles.agendaCount}>{pendientesCount} pendientes</Text>
        </View>
      </View>

      {/* Pestañas / Filtros */}
      <View style={styles.tabsContainer}>
        {(['todas', 'pendientes', 'completadas'] as const).map((opcion) => (
          <TouchableOpacity
            key={opcion}
            style={[styles.tab, filtro === opcion && styles.activeTab]}
            onPress={() => setFiltro(opcion)}
          >
            <Text style={[styles.tabText, filtro === opcion && styles.activeTabText]}>
              {opcion === 'todas' ? 'Todas' : opcion === 'pendientes' ? 'Pendientes' : 'Completadas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de Tareas */}
      {cargando ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tareasFiltradas}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const fechaTexto = formatearFechaLimite(item.dueDate);
            const vencida = estaVencida(item.dueDate, item.completed);
            const urgencia = calcularUrgencia(item.dueDate, item.completed);

            return (
              <View style={styles.cardTarea}>
                <TouchableOpacity onPress={() => alternarCompletada(item)} hitSlop={8}>
                  <View style={[styles.checkCircle, item.completed && styles.checkCircleActive]}>
                    {item.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <View style={styles.filaTituloUrgencia}>
                    <Text style={[styles.tituloTarea, item.completed && styles.tituloCompletado]}>
                      {item.title}
                    </Text>
                    {urgencia && (
                      <View style={[styles.badgeUrgencia, { backgroundColor: infoUrgencia[urgencia].fondo }]}>
                        <Text style={[styles.badgeUrgenciaTexto, { color: infoUrgencia[urgencia].color }]}>
                          {infoUrgencia[urgencia].texto}
                        </Text>
                      </View>
                    )}
                  </View>

                  {item.description ? <Text style={styles.descTarea}>{item.description}</Text> : null}

                  {fechaTexto && (
                    <View style={styles.filaFechaItem}>
                      <Ionicons name="calendar-outline" size={12} color={vencida ? '#EF4444' : '#6366F1'} />
                      <Text style={[styles.fechaTexto, vencida && styles.fechaVencida]}>
                        {vencida ? 'Vencida · ' : ''}
                        {fechaTexto}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={() => eliminarTarea(item)} hitSlop={8} style={styles.btnEliminar}>
                  <Ionicons name="trash-outline" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.vacioContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color="#CBD5E1" />
              <Text style={styles.vacioTitulo}>
                {filtro === 'completadas' ? 'Aún no completas tareas' : 'No hay tareas aquí'}
              </Text>
              <Text style={styles.vacioTexto}>
                {filtro === 'todas' ? 'Toca el botón + para crear tu primera tarea' : 'Cambia de pestaña o crea una nueva'}
              </Text>
            </View>
          }
        />
      )}

      {/* Botón Flotante "+" */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Modal Nueva Tarea */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Tarea</Text>

            <TextInput
              style={styles.input}
              placeholder="Título de la tarea"
              placeholderTextColor="#94A3B8"
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              style={styles.input}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#94A3B8"
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <Text style={styles.labelFecha}>Fecha límite (opcional)</Text>

            {Platform.OS === 'web' ? (
              <View style={styles.filaFecha}>
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
                    <Text style={styles.btnQuitarFecha}>Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <View style={styles.filaFecha}>
                  <TouchableOpacity style={styles.btnFecha} onPress={() => setMostrarPickerFecha(true)}>
                    <Ionicons name="calendar-outline" size={14} color="#6366F1" />
                    <Text style={styles.btnFechaTexto}>
                      {fechaLimite
                        ? fechaLimite.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Elegir fecha'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnFecha} onPress={() => setMostrarPickerHora(true)}>
                    <Ionicons name="time-outline" size={14} color="#6366F1" />
                    <Text style={styles.btnFechaTexto}>
                      {fechaLimite
                        ? fechaLimite.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : 'Elegir hora'}
                    </Text>
                  </TouchableOpacity>

                  {fechaLimite && (
                    <TouchableOpacity onPress={() => setFechaLimite(null)} hitSlop={8}>
                      <Text style={styles.btnQuitarFecha}>Quitar</Text>
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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: '#F1F5F9' }]}
                onPress={() => {
                  setModalVisible(false);
                  setFechaLimite(null);
                }}
              >
                <Text style={{ color: '#475569', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnModal, { backgroundColor: '#6366F1' }]} onPress={crearTarea}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 13, color: '#64748B' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
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

  tabsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
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

  cardTarea: {
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

  badgeUrgencia: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  badgeUrgenciaTexto: { fontSize: 10, fontWeight: '700' },

  descTarea: { fontSize: 13, color: '#64748B', marginTop: 3 },
  filaFechaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  fechaTexto: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
  fechaVencida: { color: '#EF4444' },
  btnEliminar: { padding: 4 },

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