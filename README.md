# EVERYONE IS CREATIVE™

An interactive generative artwork about effortless production, saturation, choice, and meaning. One continuous four-minute experience connects eight playable arcade games, a procedural Three.js gallery, synthesized Web Audio sound, and a contemplative final reveal.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```bash
npm run build
npm run preview
```

## Controls

- **Tower Stack / Chunk Runner / One Choice:** pointer, touch, or Space.
- **Snake:** arrows, WASD, swipe, or the on-screen direction pad.
- **Color Factory:** choose a color and form, then place marks on the canvas.
- **Break Everything:** pointer, touch, arrows, or A/D.
- **Copy Paste:** select two cards to find each pair.
- **Mashup:** select two ideas and choose “Make a connection.”
- **Global:** P pauses/resumes; the header includes mute and fullscreen controls.

Every game ends automatically after 24 seconds. There are no failure states, and every participant reaches the ending. Sound starts only after the first interaction. Reduced-motion preferences are respected. If WebGL is unavailable, a CSS sculpture fallback keeps the experience usable.

## Architecture

- `src/App.tsx` — explicit narrative state machine, global saturation, pause/fullscreen flow, praise and ending sequences.
- `src/components/GenerativeWorld.tsx` — persistent Three.js world, glossy procedural sculpture, artifact objects, and up to 1,800 seeded instanced motifs. Saturation controls population rather than merely adding a visual filter.
- `src/components/GameShell.tsx` and `src/hooks/useGameClock.ts` — shared timer, score, HUD, cleanup, and artifact capture.
- `src/games/` — eight isolated gameplay modules using Canvas 2D, SVG, or DOM interactions as appropriate.
- `src/lib/audio.ts` — original oscillator-based sound effects with saturation-aware repetition and a silent final reveal.
- `src/lib/experience.ts` — shared palette, game metadata, artifact types, and deterministic PRNG utilities.

All generation and gameplay run locally. There is no backend, account, external AI service, remote font, or asset API. Artifacts intentionally persist only for the current session; reloading starts a new artwork.

Built with React, TypeScript, Vite, Three.js, GSAP, Lucide icons, Space Grotesk, and IBM Plex Mono. Visual geometry and audio are generated in code.
