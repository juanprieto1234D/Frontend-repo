import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { HttpTareaRepository } from '../../infrastructure/adapters/HttpTareaRepository';
import { ObtenerTareasUseCase } from '../../application/use-cases/ObtenerTareasUseCase';
import { Tarea } from '../../domain/models/Tarea';

// Inyección de dependencias siguiendo Arquitectura Hexagonal
const repo = new HttpTareaRepository();
const obtenerTareasUseCase = new ObtenerTareasUseCase(repo);

export const HomeScreen = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerTareasUseCase.ejecutar()
      .then(setTareas)
      .catch((err) => console.log('Error cargando tareas:', err))
      .finally(() => setCargando(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TaskUp</Text>
      {cargando ? (
        <ActivityIndicator size="large" color="#5C46F7" />
      ) : (
        <FlatList
          data={tareas}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>No hay tareas registradas aún</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.taskTitle}>{item.titulo}</Text>
              {item.descripcion && <Text style={styles.desc}>{item.descripcion}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#F8F9FA' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#5C46F7', marginBottom: 20, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  card: { padding: 15, backgroundColor: '#FFF', borderRadius: 10, marginBottom: 12, elevation: 2 },
  taskTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  desc: { fontSize: 14, color: '#666', marginTop: 4 }
});