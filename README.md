## Configuración rápida

```bash
pnpm install
```

### Desarrollo local

```bash
pnpm dev
```

Arranca Next.js con Turbopack en [http://localhost:3000](http://localhost:3000). Cualquier cambio en `src/` recarga automáticamente la UI.

### Linter

Ejecución puntual:

```bash
pnpm lint
```

Modo observador (recomendado en paralelo a `pnpm dev`):

```bash
pnpm lint:watch
```

El comando utiliza `next lint`, lo que garantiza que las mismas reglas se apliquen tanto en desarrollo como en los builds de producción.

### Build de producción

```bash
pnpm build
```

Genera la build optimizada utilizando Turbopack; asegúrate de que `pnpm lint` pase antes de desplegar.

### Despliegue

El proyecto está preparado para Vercel. Consulta la [documentación oficial](https://nextjs.org/docs/app/building-your-application/deploying) para detalles adicionales.
