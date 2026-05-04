# LightWeight E2E Tests

> Harness mínimo de Playwright para tests end-to-end. Cubre **LW-438**.

## Instalación

```bash
cd e2e
npm install
npx playwright install chromium
```

## Ejecutar el smoke test

Arranca el frontend en otra terminal (debe quedar escuchando en `http://localhost:5173`):

```bash
cd src/front && npm run dev
```

Luego, desde `e2e/`:

```bash
npm run test:e2e:browser
```

Resultado esperado: `1 passed`.

---

> La guía completa (Trace Viewer, convenciones, debugging, fixtures) llegará con **LW-446**.
