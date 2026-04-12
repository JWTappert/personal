# skull

Interactive 3D skull. One page, one experience.

Astro + vanilla Three.js, static output.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:4321.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Produce a static build in `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm test` | Run vitest once |
| `npm run test:watch` | Run vitest in watch mode |

## Structure

```
src/
  pages/index.astro   # page shell: canvas, HUD, hint flash overlay
  skull/              # scene, shader material, post-FX, interactions,
                      # idle motion, HUD, puzzle logic
  shaders/            # GLSL vertex + fragment shaders (imported via ?raw)
tests/                # vitest tests (pure puzzle logic only)
public/
  models/skull.obj    # skull geometry
```
