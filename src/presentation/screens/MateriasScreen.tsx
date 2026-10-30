import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORES_MATERIA, ICONOS_MATERIA, IconoMateria, Materia, normalizarIcono } from '../../domain/models/Materia';
import { Usuario } from '../../domain/models/Usuario';
import { RepositorioMateria } from '../../domain/repositories/RepositorioMateria';
import { HttpMateriaRepository } from '../../infrastructure/adapters/HttpMateriaRepository';
import { DatosConfirmacion, DialogoConfirmacion } from '../components/DialogoConfirmacion';
import { useEstilos, useTema } from '../theme/tema';

const materiaRepo: RepositorioMateria = new HttpMateriaRepository();

interface Props {
  usuario: Usuario;
  onVolver: () => void;
}

export const MateriasScreen: React.FC<Props> = ({ usuario, onVolver }) => {
  const estilos = useEstilos(styles);
  const { texto } = useTema();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORES_MATERIA[0]);
  const [icono, setIcono] = useState<IconoMateria>('book-outline');
  const [editando, setEditando] = useState<Materia | null>(null);

  const [confirmacion, setConfirmacion] = useState<
    (DatosConfirmacion & { accion: () => Promise<void> }) | null
  >(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setMaterias(await materiaRepo.listar(usuario.id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las materias');
    } finally {
      setCargando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const limpiarFormulario = () => {
    setNombre('');
    setColor(COLORES_MATERIA[0]);
    setIcono('book-outline');
    setEditando(null);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      setError('Escribe el nombre de la materia');
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        const actualizada = await materiaRepo.actualizar(editando.id, {
          nombre: nombre.trim(),
          color,
          icono,
        });
        setMaterias((prev) => prev.map((m) => (m.id === actualizada.id ? actualizada : m)));
      } else {
        const creada = await materiaRepo.crear(usuario.id, nombre.trim(), color, icono);
        setMaterias((prev) => [...prev, creada]);
      }
      setError(null);
      limpiarFormulario();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la materia');
    } finally {
      setGuardando(false);
    }
  };

  const editar = (materia: Materia) => {
    setEditando(materia);
    setNombre(materia.nombre);
    setColor(materia.color);
    setIcono(normalizarIcono(materia.icono));
    setError(null);
  };

  const pedirEliminar = (materia: Materia) => {
    setConfirmacion({
      titulo: 'Eliminar materia',
      mensaje: `Se eliminará "${materia.nombre}". Las tareas que la usaban quedarán sin materia (no se borran).`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      accion: async () => {
        await materiaRepo.eliminar(materia.id);
        setMaterias((prev) => prev.filter((m) => m.id !== materia.id));
        if (editando?.id === materia.id) limpiarFormulario();
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
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la materia');
    } finally {
      setProcesando(false);
    }
  };

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
              <Text style={estilos.titulo}>Materias</Text>
              <Text style={estilos.subtitulo}>Clasifica tus tareas por asignatura</Text>
            </View>
          </View>

          {error && (
            <View style={estilos.bannerError}>
              <Ionicons name="alert-circle-outline" size={17} color={texto('#B91C1C')} />
              <Text style={estilos.bannerErrorTexto}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)} hitSlop={8}>
                <Ionicons name="close" size={15} color={texto('#B91C1C')} />
              </TouchableOpacity>
            </View>
          )}

          <View style={estilos.tarjetaFormulario}>
            <Text style={estilos.formTitulo}>
              {editando ? 'Editar materia' : 'Nueva materia'}
            </Text>

            <TextInput
              style={estilos.input}
              placeholder="Ej. Cálculo, Sistemas, Economía"
              placeholderTextColor="#94A3B8"
              value={nombre}
              onChangeText={setNombre}
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={() => void guardar()}
            />

            <View style={estilos.colores}>
              {COLORES_MATERIA.map((opcion) => (
                <TouchableOpacity
                  key={opcion}
                  style={[
                    estilos.colorOpcion,
                    { backgroundColor: opcion },
                    color === opcion && estilos.colorOpcionActiva,
                  ]}
                  onPress={() => setColor(opcion)}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${opcion}`}
                >
                  {color === opcion && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={estilos.formSub}>Icono</Text>
            <View style={estilos.iconos}>
              {ICONOS_MATERIA.map((opcion) => (
                <TouchableOpacity
                  key={opcion}
                  style={[estilos.iconoOpcion, icono === opcion && estilos.iconoOpcionActiva]}
                  onPress={() => setIcono(opcion)}
                  accessibilityRole="button"
                  accessibilityLabel={`Icono ${opcion}`}
                >
                  <Ionicons
                    name={opcion}
                    size={19}
                    color={icono === opcion ? '#FFFFFF' : texto('#64748B')}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={estilos.formAcciones}>
              {editando && (
                <TouchableOpacity style={estilos.botonCancelar} onPress={limpiarFormulario}>
                  <Text style={estilos.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={estilos.botonGuardar}
                onPress={() => void guardar()}
                disabled={guardando}
                accessibilityRole="button"
              >
                {guardando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name={editando ? 'save-outline' : 'add'} size={16} color="#FFFFFF" />
                    <Text style={estilos.botonGuardarTexto}>
                      {editando ? 'Guardar cambios' : 'Agregar materia'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={estilos.tituloLista}>
            <Text style={estilos.tituloListaTexto}>Tus materias</Text>
            <Text style={estilos.contador}>{materias.length}</Text>
          </View>

          {cargando ? (
            <ActivityIndicator color="#6366F1" style={estilos.cargando} />
          ) : materias.length === 0 ? (
            <View style={estilos.vacio}>
              <Ionicons name="book-outline" size={40} color="#CBD5E1" />
              <Text style={estilos.vacioTitulo}>Todavía no tienes materias</Text>
              <Text style={estilos.vacioTexto}>
                Crea la primera arriba y luego asígnala al crear una tarea.
              </Text>
            </View>
          ) : (
            materias.map((materia) => (
              <View key={materia.id} style={estilos.fila}>
                <View style={[estilos.iconoMateria, { backgroundColor: `1A` }]}>
                  <Ionicons name={normalizarIcono(materia.icono)} size={17} color={materia.color} />
                </View>
                <Text style={estilos.filaNombre} numberOfLines={1}>
                  {materia.nombre}
                </Text>
                <TouchableOpacity
                  style={estilos.accion}
                  onPress={() => editar(materia)}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${materia.nombre}`}
                >
                  <Ionicons name="create-outline" size={17} color={texto('#4C49ED')} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[estilos.accion, estilos.accionPeligro]}
                  onPress={() => pedirEliminar(materia)}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${materia.nombre}`}
                >
                  <Ionicons name="trash-outline" size={17} color={texto('#DC2626')} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
  contenedor: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 40 },
  contenido: { width: '100%', maxWidth: 760, alignSelf: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
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

  tarjetaFormulario: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 22,
  },
  formTitulo: { fontSize: 15, fontWeight: '800', color: '#1E1B4B', marginBottom: 12 },
  formSub: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 14, marginBottom: 8 },
  iconos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconoOpcion: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoOpcionActiva: { backgroundColor: '#6366F1' },
  iconoMateria: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  colores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  colorOpcion: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOpcionActiva: { borderWidth: 3, borderColor: '#0F172A' },
  formAcciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  botonCancelar: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
  },
  botonCancelarTexto: { fontSize: 13, fontWeight: '700', color: '#475569' },
  botonGuardar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: '#6366F1',
  },
  botonGuardarTexto: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  tituloLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tituloListaTexto: { fontSize: 14, fontWeight: '800', color: '#1E1B4B' },
  contador: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C49ED',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },

  cargando: { marginTop: 30 },
  vacio: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  vacioTitulo: { fontSize: 14, fontWeight: '700', color: '#334155' },
  vacioTexto: { fontSize: 12, color: '#94A3B8', textAlign: 'center', maxWidth: 320 },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  punto: { width: 12, height: 12, borderRadius: 999 },
  filaNombre: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2937' },
  accion: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accionPeligro: { backgroundColor: '#FEE2E2' },
});
