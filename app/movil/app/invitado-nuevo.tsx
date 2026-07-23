// INVITADO NUEVO — formulario mínimo + generación del pase QR de acceso.
// El QR codifica el vínculo socio↔invitado↔placa que la garita valida.
import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { StackHeader } from '../src/components/Header';
import { Badge, Button } from '../src/components/UI';
import { colors, font, fontFamily, radius, shadow, spacing } from '../src/theme';
import { socio } from '../src/data/mock';

/** Vence al final del día en que se genera el pase (hora local). */
function expiraHoy(): string {
  const hoy = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${p(hoy.getMonth() + 1)}-${p(hoy.getDate())}T23:59`;
}

export default function InvitadoNuevo() {
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [placa, setPlaca] = useState('');
  const [llegaEn, setLlegaEn] = useState<'VEHICULO' | 'PIE'>('VEHICULO');
  const [generado, setGenerado] = useState(false);

  const qrValue = JSON.stringify({
    t: 'CLC-INV',
    socio: socio.numeroDerecho,
    inv: nombre || 'Invitado',
    doc: documento,
    placa: llegaEn === 'VEHICULO' ? placa.toUpperCase() : '',
    llegaEn,
    exp: expiraHoy(),
  });

  const compartir = async () => {
    try {
      await Share.share({
        message:
          `Pase de invitado · La Campiña Country Club\n` +
          `Invitado: ${nombre || 'Invitado'}${documento ? ` (CI ${documento})` : ''}\n` +
          (llegaEn === 'VEHICULO' && placa ? `Placa: ${placa.toUpperCase()}\n` : '') +
          `Invita: ${socio.nombre} · ${socio.numeroDerecho}\n` +
          `Válido hoy hasta las 23:59. Presenta este pase (QR en la app) en garita.`,
      });
    } catch {
      // el usuario canceló o la plataforma no soporta compartir — no es un error
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StackHeader titulo={generado ? 'Pase de acceso' : 'Nueva invitación'} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!generado ? (
          <>
            <View style={styles.cuposInfo}>
              <Ionicons name="people" size={18} color={colors.navy} />
              <Text style={styles.cuposText}>
                Te quedan {socio.invitadosPermitidos - socio.invitadosUsados} cupos de {socio.invitadosPermitidos} hoy
              </Text>
            </View>

            <Campo label="Nombre del invitado" icon="person-outline" value={nombre} onChange={setNombre} placeholder="Ej. Carlos Muñoz" />
            <Campo label="Documento / Cédula" icon="card-outline" value={documento} onChange={setDocumento} placeholder="Ej. 1712345678" keyboard="numeric" />

            <View style={styles.tipoRow}>
              <Text style={styles.tipoLabel}>Llega en</Text>
              <View style={styles.tipoOpts}>
                <Pressable
                  onPress={() => setLlegaEn('VEHICULO')}
                  style={[styles.tipoOpt, llegaEn === 'VEHICULO' && styles.tipoOptActivo]}
                >
                  <Ionicons name="car" size={16} color={llegaEn === 'VEHICULO' ? '#fff' : colors.navy} />
                  <Text style={llegaEn === 'VEHICULO' ? styles.tipoOptTextActivo : styles.tipoOptText}>Vehículo</Text>
                </Pressable>
                <Pressable
                  onPress={() => setLlegaEn('PIE')}
                  style={[styles.tipoOpt, llegaEn === 'PIE' && styles.tipoOptActivo]}
                >
                  <Ionicons name="walk" size={16} color={llegaEn === 'PIE' ? '#fff' : colors.navy} />
                  <Text style={llegaEn === 'PIE' ? styles.tipoOptTextActivo : styles.tipoOptText}>A pie</Text>
                </Pressable>
              </View>
            </View>

            {llegaEn === 'VEHICULO' && (
              <View style={{ marginTop: spacing(3) }}>
                <Campo label="Placa del vehículo (opcional)" icon="car-outline" value={placa} onChange={setPlaca} placeholder="Ej. PCP-6521" autoCap />
              </View>
            )}

            <Button title="Generar pase QR" icon="qr-code" variant="gold" onPress={() => setGenerado(true)} style={{ marginTop: spacing(5) }} />
            <Text style={styles.legal}>El invitado recibirá el pase por WhatsApp. La garita confirma su ingreso por placa o rostro.</Text>
          </>
        ) : (
          <View style={styles.pase}>
            <View style={[styles.paseCard, shadow(2)]}>
              <View style={styles.paseHead}>
                <Text style={styles.paseClub}>LA CAMPIÑA</Text>
                <Text style={styles.paseSub}>PASE DE INVITADO</Text>
              </View>
              <View style={styles.qrWrap}>
                <QRCode value={qrValue} size={196} color={colors.navyDeep} backgroundColor="#fff" />
              </View>
              <Text style={styles.paseNombre}>{nombre || 'Invitado'}</Text>
              <View style={styles.paseMeta}>
                {!!documento && <Badge tono="navy">CI {documento}</Badge>}
                {llegaEn === 'VEHICULO' && !!placa && <Badge tono="gold">{placa.toUpperCase()}</Badge>}
                {llegaEn === 'PIE' && <Badge tono="sky">A PIE</Badge>}
              </View>
              <View style={styles.paseFooter}>
                <Ionicons name="person-circle-outline" size={16} color={colors.textSoft} />
                <Text style={styles.paseFooterText}>Invita: {socio.nombre} · {socio.numeroDerecho}</Text>
              </View>
              <View style={styles.paseValid}>
                <Ionicons name="time-outline" size={14} color={colors.green} />
                <Text style={styles.paseValidText}>Válido hoy hasta las 23:59</Text>
              </View>
            </View>

            <Button title="Compartir pase" icon="share-social" variant="primary" onPress={compartir} style={{ marginTop: spacing(5) }} />
            <Button title="Crear otra invitación" icon="add" variant="ghost" onPress={() => setGenerado(false)} style={{ marginTop: spacing(3) }} />
          </View>
        )}
        <View style={{ height: spacing(8) }} />
      </ScrollView>
    </View>
  );
}

function Campo({
  label,
  icon,
  value,
  onChange,
  placeholder,
  keyboard,
  autoCap,
}: {
  label: string;
  icon: any;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  keyboard?: 'numeric';
  autoCap?: boolean;
}) {
  return (
    <View style={{ marginBottom: spacing(3) }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={colors.textSoft} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboard === 'numeric' ? 'number-pad' : 'default'}
          autoCapitalize={autoCap ? 'characters' : 'words'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(5) },
  cuposInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), backgroundColor: colors.skySoft, padding: spacing(3), borderRadius: radius.md, marginBottom: spacing(5) },
  cuposText: { fontSize: font.small, fontFamily: fontFamily.medium, color: colors.navy },
  label: { fontSize: font.small, fontFamily: fontFamily.medium, color: colors.textSoft, marginBottom: spacing(2) },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
  },
  input: { flex: 1, paddingVertical: spacing(3.5), fontSize: font.body, color: colors.text },
  tipoRow: { marginTop: spacing(2) },
  tipoLabel: { fontSize: font.small, fontFamily: fontFamily.medium, color: colors.textSoft, marginBottom: spacing(2) },
  tipoOpts: { flexDirection: 'row', gap: spacing(3) },
  tipoOpt: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(2), paddingVertical: spacing(3), borderRadius: radius.md, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  tipoOptActivo: { backgroundColor: colors.navy, borderColor: colors.navy },
  tipoOptText: { fontSize: font.small, fontFamily: fontFamily.semibold, color: colors.navy },
  tipoOptTextActivo: { fontSize: font.small, fontFamily: fontFamily.semibold, color: '#fff' },
  legal: { fontSize: font.tiny, color: colors.textFaint, textAlign: 'center', marginTop: spacing(4), lineHeight: 16 },
  pase: { alignItems: 'center' },
  paseCard: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing(6), alignItems: 'center', width: '100%', borderTopWidth: 5, borderTopColor: colors.gold },
  paseHead: { alignItems: 'center', marginBottom: spacing(4) },
  paseClub: { fontSize: font.h2, fontFamily: fontFamily.bold, color: colors.navy, letterSpacing: 1 },
  paseSub: { fontSize: font.tiny, fontFamily: fontFamily.semibold, color: colors.gold, letterSpacing: 3, marginTop: 2 },
  qrWrap: { padding: spacing(4), backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  paseNombre: { fontSize: font.h3, fontFamily: fontFamily.semibold, color: colors.text, marginTop: spacing(4) },
  paseMeta: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) },
  paseFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(4) },
  paseFooterText: { fontSize: font.tiny, color: colors.textSoft },
  paseValid: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(3), backgroundColor: colors.greenSoft, paddingHorizontal: spacing(3), paddingVertical: spacing(2), borderRadius: 999 },
  paseValidText: { fontSize: font.tiny, fontFamily: fontFamily.semibold, color: colors.green },
});
