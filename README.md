# NEGAN — escena privada

Miniapp estática para continuar una sola escena de rol Negan/Oddi con contexto precargado y exportación final a TXT.

## Arquitectura

- Frontend: GitHub Pages (`index.html`, `style.css`, `app.js`, `context.js`).
- IA: Qwen 3.6 27B mediante Groq.
- API key: guardada como secreto en un Cloudflare Worker (`worker.js`). Nunca se publica en GitHub Pages.
- Historial: `localStorage` del navegador.
- Exportación: botón **Cerrar y exportar** genera un resumen factual para canon y añade la transcripción completa a un `.txt` descargable.

## 1. Crear la clave de Groq

1. Entra en Groq Console.
2. Crea una API key.
3. No la pegues en ningún archivo del repositorio.

## 2. Crear el Worker de Cloudflare

1. Crea una cuenta gratuita en Cloudflare si no tienes una.
2. Ve a **Workers & Pages → Create → Worker**.
3. Sustituye el código del Worker por el contenido de `worker.js`.
4. Deploy.
5. En el Worker, ve a **Settings → Variables and Secrets → Add → Secret**.
6. Nombre: `GROQ_API_KEY`.
7. Valor: tu clave de Groq.
8. Guarda la URL del Worker, por ejemplo `https://negan-intimo.tuusuario.workers.dev`.

## 3. Subir la app a GitHub

1. Crea un repositorio nuevo, por ejemplo `negan-intimo`.
2. Sube a la raíz estos archivos: `index.html`, `style.css`, `app.js`, `context.js`.
3. No necesitas subir `worker.js` si no quieres; puede quedarse como copia local.
4. En GitHub: **Settings → Pages**.
5. En **Build and deployment**, selecciona **Deploy from a branch**.
6. Branch: `main`, carpeta `/ (root)`.
7. Guarda y espera a que GitHub muestre la URL de Pages.

## 4. Primer inicio

1. Abre la URL de GitHub Pages.
2. Pulsa ⚙︎.
3. Pega la URL del Worker.
4. Deja el modelo como `qwen/qwen3.6-27b`.
5. Guarda.
6. La app ya muestra el último turno de Oddi precargado.
7. Pulsa **Continuar desde aquí** para que Negan responda directamente a ese turno.

## 5. Uso

- Escribe solo los turnos de Oddi.
- El historial queda guardado localmente en ese navegador/dispositivo.
- `Enter` envía. `Shift+Enter` hace salto de línea.
- Si borras los datos del navegador, perderás el historial local; exporta antes.

## 6. Terminar y llevarlo de vuelta al proyecto

Pulsa **Cerrar y exportar**.

La app pedirá al mismo modelo un resumen neutral para canon y descargará:

`NEGAN_ODDI_ESCENA_INTIMA_AAAA-MM-DD.txt`

El archivo contiene primero el resumen para canon y después la transcripción completa. Súbelo al proyecto de ChatGPT y pide que se incorpore al Canon Vivo/Continuidad según el protocolo habitual.

## Nota

La app no intenta eludir guardrails de ningún proveedor. La escena está configurada como ficción privada entre adultos y el modelo/proveedor seguirá aplicando sus propias políticas. El frontend no añade una capa adicional de moderación.
