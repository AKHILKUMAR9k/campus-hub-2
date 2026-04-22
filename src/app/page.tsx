import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GraduationCap, Calendar, Users, Trophy, ArrowRight, Sparkles, Rocket, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col mesh-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl font-headline tracking-tight">Campus Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium transition-colors hover:text-primary">
              Login
            </Link>
            <Button asChild className="rounded-full px-6">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
          <div className="container relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 animate-pulse">
              <Sparkles className="h-3 w-3" />
              <span>The Next Generation of Campus Life</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-foreground mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Unite Your <br className="hidden sm:inline" />
              <span className="text-primary italic font-headline">Campus Experience</span>
            </h1>
            <p className="max-w-[42rem] leading-relaxed text-muted-foreground sm:text-xl mb-10">
              A premium platform for students and organizers. Discover events, 
              join elite clubs, and manage your campus activity with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button asChild size="lg" className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                <Link href="/signup">
                  Join the Hub <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-full backdrop-blur-sm">
                <Link href="/login">Organizer Dashboard</Link>
              </Button>
            </div>

            {/* Mockup Display */}
            <div className="relative w-full max-w-5xl mx-auto mt-8 animate-float">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-card rounded-xl border shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9]">
                    <Image 
                        src="/images/mockup.png" 
                        alt="Campus Hub Dashboard" 
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>
          </div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="container relative z-10">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-16">
              <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
                Designed for Excellence
              </h2>
              <p className="max-w-[85%] text-muted-foreground sm:text-lg">
                Experience a suite of tools built specifically for the high-energy campus environment.
              </p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard 
                icon={<Calendar className="h-8 w-8 text-primary" />}
                title="Smart Calendar"
                description="Intelligent event tracking with seamless Google Calendar and iCal synchronization."
              />
              <FeatureCard 
                icon={<Users className="h-8 w-8 text-primary" />}
                title="Elite Clubs"
                description="Connect with top-tier student organizations and build your campus network."
              />
              <FeatureCard 
                icon={<Rocket className="h-8 w-8 text-primary" />}
                title="AI Discovery"
                description="Discover events tailored to your interests using our advanced tagging and matching system."
              />
              <FeatureCard 
                icon={<Trophy className="h-8 w-8 text-primary" />}
                title="Live Analytics"
                description="Real-time registration tracking and engagement metrics for club organizers."
              />
               <FeatureCard 
                icon={<ShieldCheck className="h-8 w-8 text-primary" />}
                title="Admin Verified"
                description="Every club and event is verified by campus administrators for safety and quality."
              />
               <FeatureCard 
                icon={<Sparkles className="h-8 w-8 text-primary" />}
                title="Social Sharing"
                description="One-tap sharing to WhatsApp and Instagram to boost your event's reach."
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 border-t bg-primary/5">
          <div className="container flex flex-col items-center text-center gap-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to transform your campus life?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Join thousands of students and organizers who are already using Campus Hub 
              to make every college moment count.
            </p>
            <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t backdrop-blur-sm">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-bold font-headline">Campus Hub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Campus Hub. Built with excellence for students.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group relative p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all hover:-translate-y-1">
      <div className="mb-4 p-3 rounded-xl bg-primary/5 w-fit group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
