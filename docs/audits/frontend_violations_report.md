# Reporte de Violaciones Arquitectónicas (Frontend)

Este documento detalla las violaciones arquitectónicas encontradas en el directorio `/frontend` basadas en los 6 criterios de auditoría.

## 1. HTML Styles (Estilos en Línea)
Se detectó el uso prohibido del atributo `style="..."` directamente en el código HTML. Estos estilos deben ser extraídos a clases CSS.

- **`d:\ANTIGRAVITY\DomusFinApp\frontend\src\app\shared\components\expense-item\expense-item.component.html`**
  - Línea 12: `<div style="display: flex; align-items: center; gap: 4px;">`
  - Línea 21: `<ion-icon name="lock-closed" style="font-size: 0.8rem; color: var(--text-secondary);"></ion-icon>`
  - Línea 34: `<div slot="end" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">`
- **`d:\ANTIGRAVITY\DomusFinApp\frontend\src\app\presentation\pages\savings\savings.page.html`**
  - Línea 132: `<div class="list-header" style="margin-top: 32px;">`
  - Línea 137: `<ion-card class="savings-card" style="opacity: 0.7;">`
  - Línea 141: `<div class="savings-card__icon-wrapper" style="background: var(--ion-color-medium-tint); color: var(--ion-color-medium);">`
  - Línea 153: `<div class="savings-card__amounts" style="margin-bottom: 0;">`
- **`d:\ANTIGRAVITY\DomusFinApp\frontend\src\app\presentation\pages\home\home.page.html`**
  - Líneas 192, 193, 213, 222, 235, 242 (Uso extensivo de `style="display: flex;"` y propiedades de texto).
- **`d:\ANTIGRAVITY\DomusFinApp\frontend\src\app\presentation\pages\admin\admin.page.html`**
  - Líneas 69, 158: `<ion-card class="dashboard-card full-card" style="margin-top: 16px;">`
  - Línea 284: `<div class="settings-error-container" style="margin-top: 8px;">`

## 2. CSS BEM (Metodología BEM)
Múltiples archivos definen clases de utilidad o layouts genéricos en lugar de utilizar selectores bloque-elemento-modificador (BEM).
- **`home.page.css`**: Define clases no-BEM como `.text-success`, `.text-danger`, `.bg-success`, `.mb-12`, `.full-card`, `.dashboard-content`, `.text-center`.
- **`savings.page.css`**: Define clases como `.dashboard-content`, `.dashboard-container`, `.full-card`, `.transparent-toolbar`.

## 3. TypeScript JSDocs
Falta de documentación JSDoc (`/** ... */`) en las definiciones de clases y métodos críticos de presentación y lógica compleja.
- `d:\ANTIGRAVITY\DomusFinApp\frontend\src\app\presentation\pages\home\home.page.ts`: Clase `HomePage` sin descripción.
- `d:\ANTIGRAVITY\DomusFinApp\frontend\src\app\presentation\pages\savings\savings.page.ts`: Clase `SavingsPage` sin descripción.
- `d:\ANTIGRAVITY\DomusFinApp\frontend\src\app\presentation\pages\admin\admin.page.ts`: Clase `AdminPage` carece de JSDocs en métodos públicos como `saveCategory` o `submitSuspendMember`.
- `d:\ANTIGRAVITY\DomusFinApp\frontend\src\app\presentation\pages\settings\settings.page.ts`: Clase `SettingsPage` carece de comentarios de bloque en su declaración.

## 4. Clean Code (SOLID, DRY, KISS)
Se detectó lógica de negocio compleja infiltrada en la capa de presentación (Componentes), reduciendo la cohesión y violando el principio de Responsabilidad Única.
- **`home.page.ts`**: Métodos computados como `featuredGoal` y `upcomingAlerts` iteran sobre arreglos grandes, calculan fechas de vencimiento de tarjetas de crédito y aplican lógicas de priorización. Todo este código de transformación y cálculo de fechas pertenece a un Servicio (ej. `CreditCardService`) o Selector del Store (`home.store.ts`), no al componente.

## 5. Falta de Abstracción HTML
Hay duplicación estructural en el maquetado de paneles, widgets y tarjetas a través de múltiples vistas.
- En **`home.page.html`**, se maqueta la lista de "Metas de Ahorro" (`<div class="savings-item">...</div>`) de manera muy similar (y manual) a cómo se hace en **`savings.page.html`**. Esto debería ser sustituido por el `<app-savings-progress>` o un widget de resumen compartido.
- Las cabeceras de listas (`list-header`) están duplicadas a mano en `home.page.html` y `savings.page.html`.

## 6. Falta de Abstracción CSS
Reglas que deberían estar consolidadas globalmente se repiten y sobreescriben a nivel de componente.
- Las clases `.dashboard-content`, `.dashboard-container`, y `.full-card` están duplicadas idénticamente en **`home.page.css`** y **`savings.page.css`**. 
- Las clases de utilidad de color (`.text-success`, `.text-danger`, `.bg-warning`) se definen localmente en `home.page.css` cuando deberían pertenecer al sistema global (ej. `global.css` o `theme/utilities.css`).
