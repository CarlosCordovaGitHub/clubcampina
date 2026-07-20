# Cómo probar la app en tu teléfono (misma red Wi-Fi)

La app corre sobre **Expo SDK 57** (actualizada el 20-jul-2026 justo para esto:
el Expo Go de las tiendas solo acepta el SDK más reciente).

## 1. Prepara el teléfono (una sola vez)

Instala **Expo Go**:
- **Android** → Play Store: <https://play.google.com/store/apps/details?id=host.exp.exponent>
- **iPhone** → App Store: <https://apps.apple.com/app/expo-go/id982107779>

Conecta el teléfono **al mismo Wi-Fi que tu PC** (no datos móviles; ojo si tu
router separa las bandas 2.4/5 GHz en redes distintas o tiene "aislamiento AP").

## 2. En la PC

```powershell
cd "C:\Users\Sebas\Documents\PARKING CLC\clubcampina\app\movil"
npm install        # solo la primera vez o si cambiaron dependencias
npx expo start
```

Queda corriendo un servidor (Metro) en el puerto **8081** y aparece un **código
QR** en la terminal.

> **Firewall de Windows**: la primera vez Windows suele preguntar si permites a
> Node.js usar la red — marca **"Redes privadas"** y acepta. Si no preguntó y el
> teléfono no conecta, ejecuta una vez (PowerShell como administrador):
>
> ```powershell
> New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081
> ```

## 3. En el teléfono

- **Android**: abre **Expo Go** → "Scan QR code" → escanea el QR de la terminal.
- **iPhone**: abre la **cámara** normal → apunta al QR → toca el aviso "Abrir en
  Expo Go".

La app carga en unos segundos (la primera vez tarda más porque compila). Con la
app abierta, **cada cambio que se guarde en el código se refleja al instante**
(Fast Refresh). Agita el teléfono para abrir el menú de desarrollo (recargar,
etc.).

## Si no conecta por Wi-Fi

1. Verifica que PC y teléfono están en la MISMA red (en la terminal, Expo
   muestra la URL `exp://192.168.x.x:8081` — esa IP debe ser la de tu PC).
2. Prueba el modo túnel (funciona aunque el router bloquee tráfico entre
   dispositivos; requiere internet y es un poco más lento):

   ```powershell
   npx expo start --tunnel
   ```

3. Último recurso: cable USB (solo Android, con depuración USB activada):
   `npx expo start --localhost` + `adb reverse tcp:8081 tcp:8081`.

## Otras formas de ver la app

| Comando | Qué hace |
|---|---|
| `npm run web` (o tecla `w` en la terminal de expo) | La abre en el navegador de la PC |
| `npm run export:web` | Genera la versión web estática en `dist/` |

## Qué probar (fase 1)

Login (cualquier texto) → **Inicio** (parqueadero en vivo cambia solo cada ~5 s)
→ tab **Parqueadero** (pellizca/arrastra/doble toque, chips Trasero/Frontal,
toca una plaza) → **Invitados** → "Nueva invitación" → genera el **pase QR** →
"Compartir pase" → **Perfil** → "Registrar mi rostro" (mira cómo el banner
dorado del Inicio desaparece). Todo es demo local: no hay backend todavía.
