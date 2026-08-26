# Plan de Reorganización de Arquitectura de Archivos

## Objetivo
Reordenar la estructura de carpetas del proyecto para mejorar legibilidad, escalabilidad y mantenimiento, sin introducir lógica nueva ni cambios de comportamiento.

El trabajo se limitará a:

- crear subcarpetas por dominio/responsabilidad
- mover archivos existentes
- actualizar imports
- actualizar `architecture.md` para reflejar la nueva convención

## Alcance

Se reorganizarán estas áreas:

- `src/hooks`
- `src/services`
- `src/types`
- `src/lib`

No se modificará:

- lógica de negocio
- contratos de API
- nombres de funciones o clases, salvo que exista un conflicto técnico real
- comportamiento funcional de pantallas, hooks, servicios o helpers

## Criterio de Organización

La nueva estructura se ordenará por dominio/flujo funcional, no solo por tipo técnico.

Dominios principales:

- `analytics`
- `auth`
- `client-supplier`
- `company`
- `conciliation`
- `parser`
- `voucher`
- `shared`
- `platform` o `integrations` para infraestructura transversal dentro de `lib`

## Estructura Propuesta

### `src/hooks`

```text
src/hooks/
  analytics/
    use-analytics.ts
    use-analytics-chart.ts
  auth/
    use-auth.ts
  client-supplier/
    use-client-supplier-form.ts
    use-clients-suppliers.ts
    use-clients-suppliers-management.ts
  conciliation/
    use-conciliations.ts
    use-conciliation-pdf-preview.ts
  voucher/
    use-vouchers.ts
    use-voucher-management.ts
    use-voucher-form.ts
    use-voucher-form-options.ts
    use-voucher-inline-third-party.ts
    use-voucher-preview.ts
    use-voucher-export.ts
  shared/
    use-debounced-value.ts
    use-element-width.ts
    use-mobile.ts
    use-notifications.ts
```

### `src/services`

```text
src/services/
  analytics/
    analytics.service.ts
  catalog/
    catalog.service.ts
  client-supplier/
    client.service.ts
    supplier.service.ts
  company/
    company.service.ts
    company-notification.service.ts
  conciliation/
    conciliations.service.ts
  parser/
    async-batch-runner.service.ts
    batch-execution-lock.service.ts
    gcp-async-batch-runner.service.ts
    local-async-batch-runner.service.ts
    parser-response.service.ts
    parser-storage.service.ts
    voucher-batch-execution.service.ts
    voucher-parser.service.ts
    voucher-persistence.service.ts
  voucher/
    voucher.service.ts
    voucher-export.service.ts
```

### `src/types`

```text
src/types/
  analytics/
    analytics.ts
  auth/
    auth.ts
  client-supplier/
    client-supplier.ts
  company/
    company.ts
  conciliation/
    conciliation-pdf-preview.ts
    conciliations.ts
  notification/
    notification.ts
  parser/
    async-batch-runner.ts
    gemini-parser.ts
    parser-batch.ts
  voucher/
    voucher.ts
    voucher-form.ts
    voucher-export.ts
```

### `src/lib`

```text
src/lib/
  api/
    api-client.ts
  database/
    prisma.ts
    redis.ts
  integrations/
    gemini.ts
    supabase-client.ts
    supabase-server.ts
  domain/
    cuit.ts
    tax-jurisdictions.ts
  shared/
    utils.ts
  constants/
    messages.ts
  helpers/
    client-supplier/
      client-supplier.ts
      client-supplier-api.ts
      client-supplier-management.ts
      client-supplier-ui.ts
    conciliation/
      conciliation-pdf-preview.ts
      conciliations.ts
      conciliations-state.ts
    parser/
      async-batch-runner.ts
      batch-execution-lock.ts
      gcp-workflow-auth.ts
      gemini-parser.ts
      parser-auth.ts
      parser-batch.ts
      parser-file.ts
      parser-pdf.ts
      parser-repair.ts
      parser-text.ts
    platform/
      date-timezone.ts
      excel-builder.ts
      formatting.ts
      load-env.ts
      pagination.ts
      promise-cache.ts
      query-state.ts
      swr.ts
    voucher/
      voucher-export.ts
      voucher-form.ts
      voucher-inline-third-party.ts
      voucher-management.ts
  schemas/
    client-supplier/
      client-supplier-schemas.ts
    conciliation/
      conciliations-schemas.ts
    parser/
      parser-batch-schemas.ts
    voucher/
      voucher.ts
      voucher-export-schemas.ts
      voucher-form-schemas.ts
      voucher-schemas.ts
```

## Cambios en `architecture.md`

Se deberá actualizar explícitamente:

### 1. Regla de organización de carpetas

Hoy la arquitectura desalienta subcarpetas en `types`, `schemas`, `helpers`, etc.

Se debe reemplazar por una regla como esta:

- la organización de `hooks`, `services`, `types`, `helpers`, `schemas` y módulos de `lib` debe hacerse por dominio o responsabilidad
- se permiten subcarpetas cuando mejoren claridad arquitectónica
- no deben crearse carpetas genéricas ambiguas si el archivo pertenece claramente a un dominio existente

### 2. Fuente de verdad de estructura

Agregar una sección que explicite:

- organización por dominio
- objetivos de esa organización
- ejemplos de ubicación correcta
- criterio para decidir entre `shared`, `platform`, `integrations` y carpetas de dominio

### 3. Regla de movimientos futuros

Agregar una regla explícita:

- antes de crear un archivo nuevo, se debe ubicar dentro del dominio existente correspondiente
- no se deben volver a crear archivos sueltos en la raíz de `hooks`, `services`, `types` o `lib` salvo que sean módulos verdaderamente transversales

## Estrategia de Implementación

### Fase 1. Actualización documental

- actualizar `architecture.md`
- dejar explícita la nueva convención de carpetas y subcarpetas

### Fase 2. Reorganización de `src/types`

- mover archivos de tipos por dominio
- actualizar imports en todo el proyecto

### Fase 3. Reorganización de `src/lib`

- mover primero módulos base (`api`, `database`, `integrations`, `domain`, `shared`)
- luego `helpers` por dominio
- luego `schemas` por dominio
- actualizar imports en todo el proyecto

### Fase 4. Reorganización de `src/services`

- mover servicios por dominio
- actualizar imports

### Fase 5. Reorganización de `src/hooks`

- mover hooks por dominio
- actualizar imports

### Fase 6. Validación final

- correr `eslint`
- correr `tsc --noEmit`

## Reglas de Ejecución

- no renombrar archivos salvo conflicto real
- no cambiar firmas públicas si no es estrictamente necesario
- no introducir wrappers, helpers o servicios nuevos que no existían
- no tocar lógica de negocio
- mantener imports absolutos con `src/...`
- hacer movimientos por bloques para poder corregir imports con menor riesgo

## Riesgos

- imports rotos por movimientos encadenados
- referencias internas cruzadas entre `helpers`, `types` y `services`
- inconsistencias temporales si se mueve `lib` antes de `types`
- nombres similares dentro de `voucher` y `parser` que pueden generar confusión si no se respeta el dominio correcto

## Orden Recomendado

1. `architecture.md`
2. `src/types`
3. `src/lib`
4. `src/services`
5. `src/hooks`
6. `eslint`
7. `tsc --noEmit`

## Resultado Esperado

Al finalizar:

- no habrá archivos sueltos innecesarios en la raíz de `hooks`, `services`, `types` y `lib`
- la estructura reflejará dominios funcionales reales
- los imports quedarán alineados con esa organización
- `architecture.md` quedará consistente con la implementación real del proyecto
