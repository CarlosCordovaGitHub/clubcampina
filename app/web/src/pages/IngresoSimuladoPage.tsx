import { useRef, useState } from 'react';
import type { EventoAcceso } from '@club-campina/shared-types';
import { useRegistrarAcceso } from '../features/eventos';
import { BadgeResultado } from '../components/Badge';

type Modo = 'ingreso' | 'salida';

export function IngresoSimuladoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [modo, setModo] = useState<Modo>('ingreso');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultado, setResultado] = useState<EventoAcceso | null>(null);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const { ingreso, salida } = useRegistrarAcceso();
  const mutacion = modo === 'ingreso' ? ingreso : salida;

  const seleccionar = (f: File | undefined | null) => {
    if (!f || !f.type.startsWith('image/')) return;
    setArchivo(f);
    setResultado(null);
    setError('');
    setPreview(URL.createObjectURL(f));
  };

  const procesar = async () => {
    if (!archivo) return;
    setError('');
    try {
      setResultado(await mutacion.mutateAsync(archivo));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error procesando la imagen');
    }
  };

  return (
    <>
      <h1>Registro de acceso (simulación de cámara)</h1>
      <div className="tarjeta">
        <div className="fila separada">
          <div className="fila">
            <button
              className={modo === 'ingreso' ? 'primario' : 'secundario'}
              onClick={() => setModo('ingreso')}
            >
              Ingreso
            </button>
            <button
              className={modo === 'salida' ? 'primario' : 'secundario'}
              onClick={() => setModo('salida')}
            >
              Salida
            </button>
          </div>
          <button
            className="primario"
            disabled={!archivo || mutacion.isPending}
            onClick={procesar}
          >
            {mutacion.isPending
              ? 'Reconociendo placa…'
              : `Procesar ${modo === 'ingreso' ? 'ingreso' : 'salida'}`}
          </button>
        </div>

        <div
          className={`dropzone ${arrastrando ? 'activo' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            seleccionar(e.dataTransfer.files[0]);
          }}
        >
          {preview ? (
            <img src={preview} alt="Foto seleccionada" />
          ) : (
            <p>
              Arrastra aquí la foto del vehículo (con la placa visible)
              <br />o haz clic para seleccionarla
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => seleccionar(e.target.files?.[0])}
          />
        </div>
        {error && <p style={{ color: 'var(--rojo)' }}>{error}</p>}
      </div>

      {resultado && (
        <div className="tarjeta">
          <h2>Resultado</h2>
          <div className="resultado-evento">
            {resultado.fotoUrl && (
              <img src={resultado.fotoUrl} alt="Foto del evento" />
            )}
            <dl>
              <dt>Resultado</dt>
              <dd><BadgeResultado resultado={resultado.resultado} /></dd>
              <dt>Placa detectada</dt>
              <dd><strong>{resultado.placaDetectada}</strong></dd>
              <dt>Confianza OCR</dt>
              <dd>
                {resultado.confianzaOcr != null
                  ? `${(resultado.confianzaOcr * 100).toFixed(1)}%`
                  : '—'}
              </dd>
              <dt>Titular</dt>
              <dd>
                {resultado.vehiculo?.miembro?.nombre ??
                  (resultado.vehiculo?.visitante
                    ? `Visitante: ${resultado.vehiculo.visitante.nombre}`
                    : '—')}
              </dd>
              <dt>Motor de lectura</dt>
              <dd>
                {resultado.ocrBackend ?? '—'}
                {resultado.ocrBbox
                  ? ` · placa en [${resultado.ocrBbox.join(', ')}]`
                  : ''}
              </dd>
              <dt>Zona asignada</dt>
              <dd>{resultado.zona?.codigo ?? '—'}</dd>
              {resultado.motivo && (
                <>
                  <dt>Motivo</dt>
                  <dd>{resultado.motivo}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
