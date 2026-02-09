# Network Map

A Next.js app to visualize contacts around the world.

## Setup

Install dependencies:

```bash
npm install
```

Create a Supabase project and copy your project URL + anon/publishable key.

Create a `.env.local` file (you can start from `.env.local.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
```

In Supabase, open the SQL editor and run the schema from `supabase/schema.sql`.

Run the dev server:

```bash
npm run dev
```

Then open http://localhost:3000

## Deployment

Deploy to Vercel and add the same environment variables in the project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

Supabase Auth handles sign-in, and Row Level Security keeps each user’s contacts private.

This is a project I coded fully in English with Codex just for fun. I've been meaning to make a visual network database for myself for a while but only got round to it now. The entire thing from setup to deployment took about 4 hours. The last 10% took 90% of the time, as always) Feel free to use/adapt as needed!
