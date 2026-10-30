import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Materia } from '../../domain/models/Materia';
import { Tarea } from '../../domain/models/Tarea';
import { Usuario } from '../../domain/models/Usuario';
import { RepositorioTarea } from '../../domain/repositories/RepositorioTarea';
import { RepositorioMateria } from '../../domain/repositories/RepositorioMateria';
import { HttpTareaRepository } from '../../infrastructure/adapters/HttpTareaRepository';
import { HttpMateriaRepository } from '../../infrastructure/adapters/HttpMateriaRepository';
import { useEstilos } from '../theme/tema';

const tareaRepo: RepositorioTarea = new HttpTareaRepository();
const materiaRepo: RepositorioMateria = new HttpMateriaRepository();

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const pad = (n: number) => String(n).padStart(2, '0');
const claveDia = (fecha: Date) => `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
const horaDe = (fecha: Date) => `${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;

const inicioDelMes = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), 1);

/** Celdas del mes, empezando en lunes. `null` = hueco antes/después. */
function construirCeldas(mes: Date): (Date | null)[] {
  const primero = inicioDelMes(mes);
  const desplazamiento = (primero.getDay() + 6) % 7; // getDay(): 0=domingo
  const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();

  const celdas: (Date | null)[] = [];
  for (let i = 0; i < desplazamiento; i += 1) celdas.push(null);
  for (let dia = 1; dia <= diasEnMes; dia += 1) {
    celdas.push(new Date(mes.getFullYear(), mes.getMonth(), dia));
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

function enSemanas(celdas: (Date | null)[]): (Date | null)[][] {
  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

interface Props {
  usuario: Usuario;
  onVolver: () => void;
}

export const CalendarioScreen: React.FC<Props> = ({ usuario, onVolver }) => {
  const estilos = useEstilos(styles);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mes, setMes] = useState(() => inicioDelMes(new Date()));
  const [seleccionado, setSeleccionado] = useState(() => claveDia(new Date()));

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [listaTareas, listaMaterias] = await Promise.all([
        tareaRepo.listarPorUsuario(usuario.id),
        materiaRepo.listar(usuario.id),
      ]);
      setTareas(listaTareas);
      setMaterias(listaMaterias);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus tareas');
    } finally {
      setCargando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const materiasPorId = useMemo(() => {
    const mapa: Record<string, Materia> = {};
    materias.forEach((m) => {
      mapa[m.id] = m;
    });
    return mapa;
  }, [materias]);

  /** Tareas agrupadas por día local. */
  const tareasPorDia = useMemo(() => {
    const mapa: Record<string, Tarea[]> = {};
    tareas.forEach((tarea) => {
      if (!tarea.fechaLimite) return;
      const clave = claveDia(tarea.fechaLimite);
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(tarea);
    });
    Object.values(mapa).forEach((lista) => {
      lista.sort((a, b) => (a.fechaLimite?.getTime() ?? 0) - (b.fechaLimite?.getTime() ?? 0));
    });
    return mapa;
  }, [tareas]);

  const semanas = useMemo(() => enSemanas(construirCeldas(mes)), [mes]);
  const hoy = claveDia(new Date());
  const tareasDelDia = tareasPorDia[seleccionado] ?? [];
  const sinFecha = tareas.filter((t) => !t.fechaLimite).length;

  const cambiarMes = (delta: number) => {
    setMes((actual) => new Date(actual.getFullYear(), actual.getMonth() + delta, 1));
  };

  const irAHoy = () => {
    const ahora = new Date();
    setMes(inicioDelMes(ahora));
    setSeleccionado(claveDia(ahora));
  };

  const colorDe = (tarea: Tarea): string =>
    (tarea.materiaId && materiasPorId[tarea.materiaId]?.color) || '#94A3B8';

  const nombreDiaSeleccionado = (() => {
    const [anio, mesNum, dia] = seleccionado.split('-').map(Number);
    return `${dia} de ${MESES[mesNum - 1]} de ${anio}`;
  })();

  return (
    <View style={estilos.contenedor}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.contenido}>
          <View style={estilos.header}>
            <TouchableOpacity
              style={estilos.botonVolver}
              onPress={onVolver}
              accessibilityRole="button"
              accessibilityLabel="Volver a mis tareas"
            >
              <Ionicons name="arrow-back" size={18} color="#1E1B4B" />
            </TouchableOpacity>
            <View style={estilos.headerTexto}>
              <Text style={estilos.titulo}>Calendario</Text>
              <Text style={estilos.subtitulo}>Tus tareas organizadas por día</Text>
            </View>
            <TouchableOpacity
              style={estilos.botonHoy}
              onPress={irAHoy}
              accessibilityRole="button"
              accessibilityLabel="Ir a hoy"
            >
              <Text style={estilos.botonHoyTexto}>Hoy</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={estilos.bannerError}>
              <Ionicons name="alert-circle-outline" size={17} color="#B91C1C" />
              <Text style={estilos.bannerErrorTexto}>{error}</Text>
            </View>
          )}

          <View style={estilos.tarjetaCalendario}>
            <View style={estilos.navegacion}>
              <TouchableOpacity
                style={estilos.flecha}
                onPress={() => cambiarMes(-1)}
                accessibilityRole="button"
                accessibilityLabel="Mes anterior"
              >
                <Ionicons name="chevron-back" size={18} color="#475569" />
              </TouchableOpacity>

              <Text style={estilos.mesTitulo}>
                {MESES[mes.getMonth()]} {mes.getFullYear()}
              </Text>

              <TouchableOpacity
                style={estilos.flecha}
                onPress={() => cambiarMes(1)}
                accessibilityRole="button"
                accessibilityLabel="Mes siguiente"
              >
                <Ionicons name="chevron-forward" size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={estilos.filaSemana}>
              {DIAS_SEMANA.map((dia) => (
                <Text key={dia} style={estilos.diaSemana}>
                  {dia}
                </Text>
              ))}
            </View>

            {semanas.map((semana, indice) => (
              <View key={`semana-${indice}`} style={estilos.filaSemana}>
                {semana.map((fecha, posicion) => {
                  if (!fecha) {
                    return <View key={`hueco-${indice}-${posicion}`} style={estilos.celda} />;
                  }

                  const clave = claveDia(fecha);
                  const delDia = tareasPorDia[clave] ?? [];
                  const esSeleccionado = clave === seleccionado;
                  const esHoy = clave === hoy;

                  return (
                    <TouchableOpacity
                      key={clave}
                      style={[estilos.celda, esSeleccionado && estilos.celdaSeleccionada]}
                      onPress={() => setSeleccionado(clave)}
                      accessibilityRole="button"
                      accessibilityLabel={`${fecha.getDate()} de ${MESES[fecha.getMonth()]}`}
                    >
                      <Text
                        style={[
                          estilos.numeroDia,
                          esHoy && !esSeleccionado && estilos.numeroHoy,
                          esSeleccionado && estilos.numeroSeleccionado,
                        ]}
                      >
                        {fecha.getDate()}
                      </Text>

                      <View style={estilos.puntos}>
                        {delDia.slice(0, 3).map((tarea) => (
                          <View
                            key={tarea.id}
                            style={[estilos.punto, { backgroundColor: esSeleccionado ? '#E0E7FF' : colorDe(tarea) }]}
                          />
                        ))}
                        {delDia.length > 3 && (
                          <Text style={[estilos.mas, esSeleccionado && estilos.masSeleccionado]}>
                            +{delDia.length - 3}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={estilos.tituloDiaFila}>
            <View>
              <Text style={estilos.tituloDia}>Tareas del día</Text>
              <Text style={estilos.subtituloDia}>{nombreDiaSeleccionado}</Text>
            </View>
            <Text style={estilos.contador}>{tareasDelDia.length}</Text>
          </View>

          {cargando ? (
            <ActivityIndicator color="#6366F1" style={estilos.cargando} />
          ) : tareasDelDia.length === 0 ? (
            <View style={estilos.vacio}>
              <Ionicons name="calendar-clear-outline" size={36} color="#CBD5E1" />
              <Text style={estilos.vacioTitulo}>Sin tareas para este día</Text>
              <Text style={estilos.vacioTexto}>
                Toca otro día o crea una tarea con fecha límite desde el inicio.
              </Text>
            </View>
          ) : (
            tareasDelDia.map((tarea) => {
              const materia = tarea.materiaId ? materiasPorId[tarea.materiaId] : undefined;

              return (
                <View key={tarea.id} style={estilos.filaTarea}>
                  <View style={[estilos.horaCaja, { borderLeftColor: colorDe(tarea) }]}>
                    <Text style={estilos.horaTexto}>
                      {tarea.fechaLimite ? horaDe(tarea.fechaLimite) : '--:--'}
                    </Text>
                  </View>

                  <View style={estilos.tareaInfo}>
                    <Text
                      style={[estilos.tareaTitulo, tarea.completada && estilos.tareaCompletada]}
                      numberOfLines={2}
                    >
                      {tarea.titulo}
                    </Text>

                    <View style={estilos.tareaMeta}>
                      {materia && (
                        <View style={[estilos.chip, { backgroundColor: `${materia.color}1A` }]}>
                          <View style={[estilos.puntoChip, { backgroundColor: materia.color }]} />
                          <Text style={[estilos.chipTexto, { color: materia.color }]}>
                            {materia.nombre}
                          </Text>
                        </View>
                      )}
                      {tarea.completada && (
                        <View style={estilos.chipHecha}>
                          <Ionicons name="checkmark" size={11} color="#047857" />
                          <Text style={estilos.chipHechaTexto}>Hecha</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {sinFecha > 0 && (
            <View style={estilos.sinFecha}>
              <Ionicons name="information-circle-outline" size={15} color="#64748B" />
              <Text style={estilos.sinFechaTexto}>
                {sinFecha} tarea{sinFecha === 1 ? '' : 's'} sin fecha límite (no aparecen en el calendario)
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 40 },
  contenido: { width: '100%', maxWidth: 760, alignSelf: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  botonVolver: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTexto: { flex: 1 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitulo: { fontSize: 13, color: '#64748B', marginTop: 2 },
  botonHoy: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#0F172A',
  },
  botonHoyTexto: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bannerErrorTexto: { flex: 1, fontSize: 12, color: '#B91C1C' },

  tarjetaCalendario: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 22,
  },
  navegacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  flecha: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mesTitulo: { fontSize: 15, fontWeight: '800', color: '#0F172A', textTransform: 'capitalize' },

  filaSemana: { flexDirection: 'row' },
  diaSemana: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    paddingVertical: 6,
  },
  celda: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 3,
  },
  celdaSeleccionada: { backgroundColor: '#0F172A' },
  numeroDia: { fontSize: 13, fontWeight: '600', color: '#334155' },
  numeroHoy: { color: '#4C49ED', fontWeight: '800' },
  numeroSeleccionado: { color: '#FFFFFF', fontWeight: '800' },
  puntos: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 6 },
  punto: { width: 5, height: 5, borderRadius: 999 },
  mas: { fontSize: 8, color: '#94A3B8', fontWeight: '700' },
  masSeleccionado: { color: '#E0E7FF' },

  tituloDiaFila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tituloDia: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  subtituloDia: { fontSize: 12, color: '#64748B', marginTop: 1, textTransform: 'capitalize' },
  contador: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C49ED',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },

  cargando: { marginTop: 24 },
  vacio: { alignItems: 'center', paddingVertical: 26, gap: 7 },
  vacioTitulo: { fontSize: 14, fontWeight: '700', color: '#334155' },
  vacioTexto: { fontSize: 12, color: '#94A3B8', textAlign: 'center', maxWidth: 320 },

  filaTarea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 9,
  },
  horaCaja: { borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 1 },
  horaTexto: { fontSize: 12, fontWeight: '800', color: '#475569' },
  tareaInfo: { flex: 1 },
  tareaTitulo: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  tareaCompletada: { textDecorationLine: 'line-through', color: '#94A3B8' },
  tareaMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  chipTexto: { fontSize: 10, fontWeight: '700' },
  puntoChip: { width: 6, height: 6, borderRadius: 999 },
  chipHecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  chipHechaTexto: { fontSize: 10, fontWeight: '700', color: '#047857' },

  sinFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sinFechaTexto: { fontSize: 11, color: '#64748B', flex: 1 },
});
