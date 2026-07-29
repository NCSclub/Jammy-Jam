# Jammy Jam

Official event website and registration administration dashboard for Jammy Jam.

## Admin dashboard

The private dashboard is available at `/admin`. It includes participant search,
team/solo filters, check-in management, overnight-stay totals, participant
editing, and CSV export.

Create a `.env.local` file from `.env.example` before opening the dashboard:

```bash
ADMIN_PASSWORD=use-a-strong-event-password
ADMIN_SESSION_SECRET=use-a-long-random-secret
```

The current participant list is demo data used to validate the interface.
Connect it to the registration database/API before production use.

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public website or
[http://localhost:3000/admin](http://localhost:3000/admin) for the dashboard.

The application uses Next.js App Router, React, TypeScript, and Tailwind CSS.
