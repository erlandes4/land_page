# Copilot Instructions for Lead Management System

## Project Overview
**meu-sistema-leads** is a lead capture and management system for CTI Contabilidade (accounting firm). It consists of:
- **Lead Form** (`app/page.tsx`): Public-facing landing page that captures prospect information (name, WhatsApp, service interest)
- **Dashboard** (`app/dashboard/page.tsx`): Internal interface to manage, track, and convert leads

## Architecture

### Tech Stack
- **Framework**: Next.js 16.1.6 with TypeScript, React 19.2.3
- **Database**: Supabase (PostgreSQL backend)
- **Styling**: Tailwind CSS 4 with PostCSS
- **Client-side State**: React hooks (`useState`, `useEffect`)

### Data Model
Supabase table: `leads`
```typescript
{
  id: number;              // Auto-increment primary key
  nome: string;            // Lead name/company
  whatsapp: string;        // Contact phone
  servico: string;         // Service interest (e.g., "Contabilidade")
  contatado: boolean;      // Prospect reached out flag
  convertido: boolean;     // Conversion status
  notas: string;           // Internal notes on lead
}
```

## Key Patterns & Conventions

### Client Components
Both `app/page.tsx` and `app/dashboard/page.tsx` use `"use client"` directive for interactivity. This is intentional - they require form handling and real-time updates.

### Supabase Integration
- Single client instance (`lib/supabase.ts`) initialized with public anon key
- Direct CRUD operations from client: `.insert()`, `.update()`, `.select()`, `.eq()`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Example flow in dashboard: fetch leads → toggle status → update immediately in Supabase → refresh UI

### Form Handling
- **Lead Form** (`page.tsx`): Simple submit → insert → clear form → alert user
- **Dashboard** (`dashboard/page.tsx`): Immediate optimistic UI updates (local state first), then async Supabase update
- No validation library used; relies on HTML5 `required` attribute

### UI/Styling
- No component library; pure Tailwind CSS utilities
- Consistent palette: slate grays, white backgrounds
- Responsive with mobile-first approach (`p-4` padding, `max-w-md` on form)

## Development Workflow

### Commands
```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm start        # Run production server
npm run lint     # ESLint check
```

### Database Setup
Ensure Supabase project has `leads` table with columns matching data model above. Set RLS policies as needed.

## Critical Integration Points

### Supabase Setup
1. Create `.env.local` with credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
2. Create `leads` table with all fields listed in Data Model section
3. Public anon key allows unauthenticated inserts/selects from form page

### Deployment Considerations
- Public pages expose Supabase credentials intentionally (anon key only)
- No authentication layer currently; rely on Supabase RLS for data protection
- Dashboard is unprotected; add auth layer if deploying to production

## Common Tasks & File Locations

| Task | File |
|------|------|
| Modify lead capture form | [app/page.tsx](app/page.tsx) |
| Update dashboard layout/logic | [app/dashboard/page.tsx](app/dashboard/page.tsx) |
| Change Supabase configuration | [lib/supabase.ts](lib/supabase.ts) |
| Update global styles | [app/globals.css](app/globals.css) |
| Modify metadata/layout | [app/layout.tsx](app/layout.tsx) |

## Notes for AI Agents
- **No error boundaries**: Errors surface as browser alerts; consider adding proper error handling
- **No loading states**: Dashboard shows no spinner while fetching; add skeleton or loading indicator
- **No form validation**: Current implementation uses HTML5; consider adding client-side validation
- **Responsive gaps**: Mobile experience exists but not tested across all viewports
