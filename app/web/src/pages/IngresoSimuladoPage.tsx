import { useEffect, useRef, useState } from 'react';
import type { EventoAcceso } from '@club-campina/shared-types';
import { useRegistrarAcceso } from '../features/eventos';
import { BadgeResultado } from '../components/Badge';

type Modo = 'ingreso' | 'salida';
type Fuente = 'archivo' | 'camara';

export function IngresoSimuladoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [modo, setModo] = useState<Modo>('ingreso');
  const [fuente, setFuente] = useState<Fuente>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultado, setResultado] = useState<EventoAcceso | null>(null);
  const [error, setError] = useState('');
  const [errorCamara, setErrorCamara] = useState('');
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

  const detenerCamara = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (fuente !== 'camara') {
      detenerCamara();
      return;
    }
    setErrorCamara('');
    // Cámara trasera si es un celular (facingMode 'environment'); en laptop
    // el navegador simplemente usa la webcam disponible.
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((e) => {
        setErrorCamara(
          e instanceof Error
            ? `No se pudo acceder a la cámara: ${e.message}`
            : 'No se pudo acceder a la cámara',
        );
      });
    return detenerCamara;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuente]);

  const capturarDesdeCamera = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      seleccionar(new File([blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  return (
    <>
      <h1>Registro de acceso</h1>
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

        <div className="fila" style={{ marginBottom: '0.75rem' }}>
          <button
            className={fuente === 'archivo' ? 'primario' : 'secundario'}
            onClick={() => setFuente('archivo')}
          >
            Subir foto
          </button>
          <button
            className={fuente === 'camara' ? 'primario' : 'secundario'}
            onClick={() => setFuente('camara')}
          >
            Usar cámara en vivo
          </button>
        </div>

        {fuente === 'archivo' ? (
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
        ) : (
          <div>
            {errorCamara ? (
              <p style={{ color: 'var(--rojo)' }}>
                {errorCamara}. En el navegador debes dar permiso de cámara; si
                estás en un celular, ábrelo con la IP del servidor por HTTPS
                (o localhost) — Chrome/Safari bloquean la cámara en HTTP para
                otros hosts.
              </p>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', maxHeight: 360, borderRadius: 10, background: '#000' }}
                />
                <div className="fila" style={{ marginTop: '0.75rem' }}>
                  <button className="primario" onClick={capturarDesdeCamera}>
                    Capturar foto
                  </button>
                </div>
              </>
            )}
            {preview && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: 'var(--gris-600)', fontSize: '0.85rem' }}>
                  Última captura:
                </p>
                <img src={preview} alt="Captura de cámara" style={{ maxWidth: 280, borderRadius: 8 }} />
              </div>
            )}
          </div>
        )}
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
