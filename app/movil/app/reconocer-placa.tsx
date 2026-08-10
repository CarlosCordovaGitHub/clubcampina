// RECONOCER PLACA — demo del flujo de ALPR (Automatic License Plate
// Recognition) desde la app. 100% simulado: no llama a ningún backend real,
// pero reproduce fielmente el contrato de POST /plate/recognize del motor
// de visión (plate_text, confidence, processing_ms, backend) y la decisión
// de acceso (autorizado / visitante / no registrado) que tomaría el sistema.
import React, { useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackHeader } from '../src/components/Header';
import { Badge, Button, Card } from '../src/components/UI';
import { colors, font, fontFamily, radius, spacing } from '../src/theme';
import { socio, invitados } from '../src/data/mock';

type Decision = 'AUTORIZADO' | 'VISITANTE' | 'NO_REGISTRADO';

type Resultado = {
  placa: string;
  confianza: number;
  procesamientoMs: number;
  backend: string;
  decision: Decision;
  titular: string;
};

// vehículos "registrados" para esta simulación — el propio socio y sus
// invitados de hoy, tomados de src/data/mock.ts para que la demo sea coherente
// con el resto de la app.
const VEHICULOS_REGISTRADOS: { placa: string; titular: string }[] = [
  { placa: 'PBX-4471', titular: socio.nombre },
  ...invitados.filter((i) => i.placa).map((i) => ({ placa: i.placa as string, titular: `${i.nombre} (invitado)` })),
];

function placaAleatoria(): string {
  const letras = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
  const l = () => letras[Math.floor(Math.random() * letras.length)];
  const n = () => Math.floor(Math.random() * 10);
  return `${l()}${l()}${l()}-${n()}${n()}${n()}${n()}`;
}

function simularReconocimiento(): Resultado {
  // 65% de las veces "reconoce" una placa ya registrada (demo agradecida);
  // el resto, una placa nueva para mostrar también el caso "no registrado".
  const usarRegistrada = Math.random() < 0.65;
  const registrada = VEHICULOS_REGISTRADOS[Math.floor(Math.random() * VEHICULOS_REGISTRADOS.length)];
  const placa = usarRegistrada ? registrada.placa : placaAleatoria();
  const match = VEHICULOS_REGISTRADOS.find((v) => v.placa === placa);

  return {
    placa,
    confianza: Math.round((91 + Math.random() * 8) * 10) / 10, // 91.0–99.0
    procesamientoMs: Math.round(18 + Math.random() * 24), // 18–42 ms, como fast-alpr real
    backend: 'fast-alpr',
    decision: match ? 'AUTORIZADO' : Math.random() < 0.5 ? 'VISITANTE' : 'NO_REGISTRADO',
    titular: match ? match.titular : '—',
  };
}

const DECISION_INFO: Record<Decision, { label: string; tono: 'green' | 'amber' | 'red'; icon: any }> = {
  AUTORIZADO: { label: 'INGRESO AUTORIZADO', tono: 'green', icon: 'checkmark-circle' },
  VISITANTE: { label: 'VISITANTE · VALIDAR EN GARITA', tono: 'amber', icon: 'time' },
  NO_REGISTRADO: { label: 'PLACA NO REGISTRADA', tono: 'red', icon: 'close-circle' },
};

export default function ReconocerPlaca() {
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const inputRef = useRef<any>(null);

  const elegirImagen = () => {
    if (Platform.OS !== 'web') return; // demo pensado para la versión web
    if (!inputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setImagenUri(reader.result as string);
          setResultado(null);
        };
        reader.readAsDataURL(file);
      };
      inputRef.current = input;
    }
    inputRef.current.click();
  };

  const analizar = () => {
    if (!imagenUri) return;
    setAnalizando(true);
    setResultado(null);
    setTimeout(() => {
      setResultado(simularReconocimiento());
      setAnalizando(false);
    }, 1100 + Math.random() * 600);
  };

  const reiniciar = () => {
    setImagenUri(null);
    setResultado(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StackHeader titulo="Reconocer placa" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.introBox}>
          <Ionicons name="scan-outline" size={18} color={colors.sky} />
          <Text style={styles.introText}>
            Demo del reconocimiento automático de placas (ALPR). Sube la foto de un vehículo y el sistema
            simula el mismo flujo que corre en garita: lectura de la placa, nivel de confianza y decisión
            de acceso.
          </Text>
        </View>

        <Pressable onPress={elegirImagen} style={[styles.dropzone, imagenUri && styles.dropzoneConImagen]}>
          {imagenUri ? (
            <Image source={{ uri: imagenUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="camera-outline" size={34} color={colors.sky} />
              <Text style={styles.dropzoneTitle}>Sube una foto de la placa</Text>
              <Text style={styles.dropzoneSub}>
                {Platform.OS === 'web' ? 'Toca para elegir una imagen' : 'Disponible en la versión web del demo'}
              </Text>
            </>
          )}
        </Pressable>

        {imagenUri && !resultado && (
          <Button
            title={analizando ? 'Analizando placa…' : 'Analizar placa'}
            icon="scan"
            variant="gold"
            loading={analizando}
            onPress={analizar}
            style={{ marginTop: spacing(4) }}
          />
        )}

        {resultado && (
          <Card level={2} style={{ marginTop: spacing(4) }}>
            <View style={styles.placaChip}>
              <Text style={styles.placaTexto}>{resultado.placa}</Text>
            </View>

            <View style={styles.decisionRow}>
              <Ionicons
                name={DECISION_INFO[resultado.decision].icon}
                size={20}
                color={
                  DECISION_INFO[resultado.decision].tono === 'green'
                    ? colors.green
                    : DECISION_INFO[resultado.decision].tono === 'amber'
                    ? colors.amber
                    : colors.red
                }
              />
              <Text style={styles.decisionTexto}>{DECISION_INFO[resultado.decision].label}</Text>
            </View>
            {resultado.decision === 'AUTORIZADO' && (
              <Text style={styles.titular}>Titular: {resultado.titular}</Text>
            )}

            <View style={styles.metaRow}>
              <Metadato label="Confianza" valor={`${resultado.confianza}%`} />
              <Metadato label="Procesamiento" valor={`${resultado.procesamientoMs} ms`} />
              <Metadato label="Motor" valor={resultado.backend} />
            </View>

            <Button title="Probar con otra foto" icon="refresh" variant="ghost" onPress={reiniciar} style={{ marginTop: spacing(4) }} />
          </Card>
        )}

        <Text style={styles.legal}>
          Resultado simulado con fines de demostración — no se envía ninguna imagen a un servidor. En el
          sistema en producción, esta misma pantalla llama al motor de visión real (fast-alpr / EasyOCR).
        </Text>

        <View style={{ height: spacing(8) }} />
      </ScrollView>
    </View>
  );
}

function Metadato({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaValor}>{valor}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(5) },
  introBox: {
    flexDirection: 'row',
    gap: spacing(3),
    backgroundColor: colors.skySoft,
    borderRadius: radius.md,
    padding: spacing(4),
    marginBottom: spacing(4),
    alignItems: 'flex-start',
  },
  introText: { flex: 1, fontSize: font.small, color: colors.navy, lineHeight: 19, fontFamily: fontFamily.regular },
  dropzone: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropzoneConImagen: { borderStyle: 'solid', borderColor: colors.sky },
  preview: { width: '100%', height: 220 },
  dropzoneTitle: { fontSize: font.body, fontFamily: fontFamily.semibold, color: colors.text, marginTop: spacing(3) },
  dropzoneSub: { fontSize: font.small, color: colors.textSoft, marginTop: 2 },
  placaChip: {
    alignSelf: 'center',
    backgroundColor: colors.navyDeep,
    borderRadius: radius.sm,
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(6),
    marginBottom: spacing(4),
  },
  placaTexto: { color: '#fff', fontFamily: fontFamily.bold, fontSize: 22, letterSpacing: 2 },
  decisionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(2) },
  decisionTexto: { fontFamily: fontFamily.semibold, fontSize: font.body, color: colors.text },
  titular: { textAlign: 'center', fontSize: font.small, color: colors.textSoft, marginTop: spacing(1) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing(4) },
  metaItem: { alignItems: 'center' },
  metaValor: { fontSize: font.h3, fontFamily: fontFamily.semibold, color: colors.navy },
  metaLabel: { fontSize: font.tiny, color: colors.textSoft, marginTop: 2 },
  legal: { fontSize: font.tiny, color: colors.textFaint, textAlign: 'center', marginTop: spacing(5), lineHeight: 16 },
});
