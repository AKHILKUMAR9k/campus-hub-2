# Campus Hub

![Campus Hub](https://campus-hub-2-cjpj.vercel.app/og.png)

**Campus Hub** is the next generation of campus life. A premium platform for students and organizers to discover events, join clubs, and manage campus activities with ease.

## Tech Stack

- **Frontend:** Next.js 15, React 18, Tailwind CSS, Radix UI, Framer Motion
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel

## Features

- **Event Discovery & Registration:** Browse upcoming events and register with a single click.
- **Club Management:** Discover student clubs, apply for memberships, and manage club activities.
- **Role-Based Access Control:** Distinct experiences for Students, Club Organizers, and Administrators.
- **Admin Dashboard:** Comprehensive analytics, user management, and approval workflows.
- **Real-time Updates:** Powered by Supabase real-time subscriptions.
- **Automated Emails:** Integration with SendGrid for event reminders and notifications.

## Getting Started Locally

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (for database and auth)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/campus-hub.git
   cd campus-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add the following variables:
   ```env
   # Supabase Keys
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Optional: SendGrid for Emails
   SENDGRID_API_KEY=your_sendgrid_api_key
   FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Deployment

Campus Hub is optimized for deployment on Vercel.

1. Create a production project on Supabase and apply your database migrations.
2. Push your code to GitHub.
3. Import your repository into Vercel.
4. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel Environment Variables.
5. Deploy!

For a detailed deployment guide, refer to [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

This project is licensed under the MIT License.
