# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server (React app at http://localhost:5173)
- `pnpm build` - Build for production (TypeScript compilation + Vite build)
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint checks
- `pnpm check` - Full validation (TypeScript check + build + dry-run deploy)
- `pnpm deploy` - Deploy to Cloudflare Workers
- `pnpm cf-typegen` - Generate Cloudflare Workers types

## Architecture

This is a full-stack React application that runs on Cloudflare Workers, combining:

### Frontend (React + Vite)
- **Location**: `src/react-app/`
- **Entry point**: `src/react-app/main.tsx`
- **Main component**: `src/react-app/App.tsx`
- Built with Vite and deployed as static assets to Workers

### Backend (Hono API)
- **Location**: `src/worker/index.ts`
- **Framework**: Hono web framework
- Runs on Cloudflare Workers runtime
- API routes prefixed with `/api/`

### Configuration
- **Wrangler config**: `wrangler.json` - Cloudflare Workers deployment settings
- **Vite config**: `vite.config.ts` - Uses React and Cloudflare plugins
- **TypeScript**: Multiple tsconfig files for different parts (app, worker, node)

## Key Integration Points

The React app communicates with the Hono backend via fetch calls to `/api/` routes. The Cloudflare Workers runtime serves both the static React assets and the Hono API from the same domain.

## Development Notes

- The project uses the Cloudflare Vite plugin for seamless Workers integration
- Assets are configured for single-page application routing
- Development uses Vite's dev server; production uses Workers runtime
- TypeScript is configured separately for the React app and Worker contexts