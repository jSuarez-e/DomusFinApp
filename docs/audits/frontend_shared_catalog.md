# Catálogo de Componentes Compartidos (Frontend)

Este documento es una base de conocimiento para evitar la duplicación de código en la aplicación. A continuación se listan los componentes reutilizables y estilos globales existentes en `/frontend`.

## 1. Componentes Compartidos (`/shared/components`)

- **`account-item`**: Renderiza el saldo, icono y detalles básicos de una cuenta bancaria o billetera.
- **`admin-warning`**: Un banner de alerta reutilizable utilizado para mostrar mensajes críticos de permisos para usuarios con rol de administrador.
- **`app-empty-state`**: Componente genérico para mostrar mensajes amigables cuando listas o colecciones de datos están vacías (ej. "No hay transacciones aún").
- **`auth-header`**: Cabecera decorativa estándar reutilizada en las páginas de inicio de sesión (`login`), registro (`register`), y recuperación de contraseñas.
- **`capture-channel-item`**: Elemento de la lista utilizado en la configuración de automatización y lectura de canales de captura de comprobantes.
- **`category-list-item`**: Muestra una categoría de ingreso/gasto. Soporta modo de administración (botones de editar/eliminar).
- **`credit-card-ui`**: Renderización visual estilo "tarjeta física" que muestra la marca, últimos 4 dígitos y deuda actual de una tarjeta de crédito.
- **`expense-item`**: Componente estándar para mostrar una transacción/gasto individual con icono de categoría, fecha y valor.
- **`loan-progress`**: Componente compuesto que incluye la barra de progreso y las estadísticas resumidas (abonado vs restante) de un préstamo.
- **`member-item`**: Muestra la información de un miembro del hogar, su rol (User/Admin) y permite gestionar permisos.
- **`menu-option-item`**: Ítem reutilizable usado para armar menús de navegación laterales o listas de configuración.
- **`password-input`**: Campo de formulario especializado para contraseñas, incluye toggle de visibilidad (ojo) e integración con el "Strength Meter".
- **`payment-item`**: Ítem de lista especializado en mostrar métodos de pago configurados.
- **`report-legend`**: Leyendas de colores utilizadas para acompañar los gráficos circulares o de barras en la sección de reportes analíticos.
- **`savings-progress`**: Barra de progreso interactiva y datos consolidados para las metas de ahorro.

## 2. Clases CSS Globales de Utilidad (`global.css`)

Se pueden utilizar estas clases en cualquier vista sin reescribir CSS:

### 2.1. Layout Dashboard y Tarjetas
- **`.dashboard-content`**: Controla el color de fondo estándar de las vistas tipo dashboard (`var(--ion-background-color, #f4f7f6)`).
- **`.dashboard-container`**: Wrapper principal con márgenes controlados, `max-width` para responsividad y espaciado (flex).
- **`.dashboard-card`**: Tarjetas con bordes redondeados (20px), sombra suave y color de fondo estandarizado.
- **`.full-card`**: Fuerza el 100% del ancho del contenedor en tarjetas.
- **`.card-title-group` / `.card-title-group--spaced`**: Agrupadores de títulos de sección e iconos.
- **`.card-title` / `.card-icon`**: Tipografía de títulos secundarios y tamaño estandarizado de iconos.

### 2.2 Formularios y Controles de Ajustes
- **`.settings-segment`**: Contenedor de las pestañas superiores en vistas de configuración y administración.
- **`.settings-form__field`**: Envoltorio base para campos (`margin-bottom: 20px;`).
- **`.settings-form__label`**: Etiqueta descriptiva (Small, uppercase, letter-spacing).
- **`.settings-form__input-wrapper`**: Caja con borde que contiene los inputs y cambia su estado (`focus-within`) y color de sombra.
- **`.settings-action-row` / `.settings-form__submit`**: Márgenes y dimensionamiento de los botones principales de envío en formularios de configuración.

### 2.3 Utilidades y Mensajes
- **`.settings-error-container` / `.settings-error-text`**: Clases para mensajes de validación de texto en rojo.
- **`.premium-alert`**: Modificador de clases inyectado en `AlertController` para aplicar el diseño y bordes definidos globalmente para modales flotantes.

> [!IMPORTANT]
> Si en el futuro desarrollas una vista nueva que necesite contenedores blancos con sombra, inputs formales o listas de gastos/cuentas, **usa estrictamente estos componentes y clases**. No crees nuevas clases `.my-card` en el CSS local de tu componente.
