# Playwright extension test scaffold

This repository includes a Playwright test scaffold built to validate a local Chrome extension (Manifest V3) in a repeatable way.

> Main rule: these are integration tests with human-level assertions, not unit tests with frameworks like vitest.

## Cómo funciona

El test levantado por `tests/playwright-extension.spec.js` hace lo siguiente:

1. Carga Chromium con la extensión unpacked utilizando una carpeta local.
2. Descubre el id de extensión `chrome-extension://<id>/...` mediante el protocolo CDP.
3. Abre una página de prueba (`https://example.com`) y valida que el content script inyectado haya añadido el botón esperado.
4. Hace clic en el botón inyectado para validar el flujo de comunicación `content script -> background -> sidepanel`.
5. Abre directamente `sidepanel.html` desde el contexto de la extensión.
6. Valida la presencia de elementos clave del sidepanel (`#title`, `#refresh`, `#send`, `#messages`).
7. Solicita la apertura del sidepanel mediante un mensaje al background, similar a hacer clic en la acción de la extensión.
8. Hace acciones en el sidepanel: clic en `Refresh` y clic en `Send To Content`.
9. Captura y verifica errores de consola para asegurar que no hay fallos visibles.

## Archivos principales

- `tests/playwright-extension-helpers.js`
  - Contiene helpers genéricos para lanzar Chromium con la extensión cargada.
  - Provee funciones reutilizables: navegación, validaciones de selectores y texto, conteo de elementos y captura de consola.
  - Está pensado para poder usarlo con esta extensión y con otras extensiones similares.

- `tests/playwright-extension.spec.js`
  - Script de prueba específico que usa los helpers.
  - Ejecuta una serie de aserciones genéricas sobre la inyección del content script y la interfaz del sidepanel.

## Qué cubre el test

- `launchExtensionContext`: arranca Chromium con `--load-extension` y `--disable-extensions-except`.
- Detección automática del `extensionId` usando CDP.
- Apertura de una página web normal y verificación de que el content script inyectó el botón esperado.
- Interacción con el content script para enviar un mensaje al panel.
- Apertura de la página de sidepanel y validación de su estructura DOM.
- Verificación de que no haya errores de consola en el sidepanel.

## Ejecución

1. Instala Playwright y Chromium en el workspace:

```bash
npm init -y
npm i -D playwright
npx playwright install chromium
```

2. Ejecuta el script de prueba genérico:

```bash
node tests/playwright-extension.spec.js
```

3. Para probar otra extensión, pasa la carpeta de la extensión como argumento:

```bash
node tests/playwright-extension.spec.js ../path/to/your/extension
```

## Pruebas de resiliencia del service worker

El archivo `tests/stateless_messages/playwright-extension-worker-resilience.spec.js` valida que los mensajes persistan incluso cuando el service worker se reinicia:

```bash
node tests/stateless_messages/playwright-extension-worker-resilience.spec.js
```

Este test:
1. Envía mensajes desde el content script
2. Fuerza el reinicio del service worker (cerrando el contexto del background)
3. Envía más mensajes después del reinicio
4. Verifica que chrome.storage.session persiste correctamente

El archivo `tests/stateless_messages/playwright-extension-diagnostic.spec.js` es una herramienta de diagnóstico que inspecciona el estado de `chrome.storage.session` directamente:

```bash
node tests/stateless_messages/playwright-extension-diagnostic.spec.js
```

Esto es útil para validar que los mensajes se están almacenando correctamente en la extensión.

## Test runner

Para ejecutar todas las pruebas de forma organizada:

```bash
node tests/stateless_messages/run-all-tests.js
```

Esto ejecutará sequencialmente:
- Generic extension assertions
- Service worker resilience tests
- Storage diagnostic inspection

## Documentación específica de pruebas

Cada extensión tiene su propia carpeta de pruebas con documentación detallada:

- [tests/stateless_messages/README.md](tests/stateless_messages/README.md) — Guía completa de test cases para la extensión `stateless_messages`

## Adaptación a otras extensiones

Si tu extensión usa otros selectores o nombres de botones, modifica `tests/playwright-extension.spec.js` para:

- cambiar el selector del botón inyectado en el content script
- cambiar los selectores del sidepanel (`#title`, `#refresh`, `#send`, `#messages`)
- añadir validaciones adicionales de DOM o contenido específico

También puedes reutilizar `tests/playwright-extension-helpers.js` en otros proyectos, ya que contiene utilidades genéricas de Playwright.

## Glosario de helpers disponibles

- `launchExtensionContext(extensionPath, options)` — lanza Chromium con la extensión cargada y devuelve el contexto, una página inicial y el `extensionId` detectado.
- `findExtensionId(client)` — busca un target `chrome-extension://` usando CDP y devuelve el id de extensión.
- `openUrl(page, url, options)` — navega a una URL con tiempos de espera configurables.
- `assertSelectorVisible(page, selector, options)` — espera a que un selector exista y sea visible.
- `assertSelectorExists(page, selector, options)` — espera a que un selector esté presente en el DOM, aunque no sea visible.
- `assertTextContains(page, selector, expected, options)` — valida que el texto de un selector contenga una cadena esperada.
- `assertTextEquals(page, selector, expected, options)` — valida que el texto de un selector sea exactamente igual a una cadena esperada.
- `assertUrlContains(page, expected, options)` — valida que la URL actual de la página contenga un fragmento esperado.
- `assertElementCount(page, selector, expectedCount, options)` — valida la cantidad de elementos que coinciden con un selector.
- `assertNoConsoleErrors(entries)` — valida que no existan entradas de consola con tipo `error`.
- `clickText(page, text, options)` — hace clic en un elemento identificado por texto.
- `clickSelector(page, selector, options)` — hace clic en un elemento identificado por selector CSS.
- `createConsoleLogger(page)` — recopila entradas de consola y errores de página en un arreglo.
- `assertConsoleContains(entries, expectedText)` — verifica que exista un mensaje de consola que contenga el texto esperado.
- `openExtensionPage(context, extensionId, relativePath)` — abre una página interna de la extensión usando `chrome-extension://<id>/<path>`.
- `openExtensionSidePanel(context, extensionId)` — solicita al background que abra el sidepanel como si se hubiese hecho clic en la acción de la extensión.
- `closeServiceWorker(context, extensionId, options)` — fuerza el cierre/reinicio del service worker navegando a su contexto y cerrando la página.
- `delay(ms)` — utilidad para esperar un número de milisegundos.
- `closeContext(context)` — cierra el contexto de Playwright.

## Notas

- Si el script no puede descubrir el `extensionId`, abre manualmente la extensión en Chromium y mira su id en `chrome://extensions`.
- El test se ejecuta con `headless: false` por defecto, porque la UI del sidepanel y las extensiones suelen necesitar un navegador visible.
- Si quieres ejecutar sin UI, cambia `headless: false` a `true` en `tests/playwright-extension-helpers.js`.
