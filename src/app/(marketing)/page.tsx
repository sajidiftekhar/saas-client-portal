import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckSquare,
  FolderKanban,
  MessageSquare,
  Upload,
  Shield,
  Users,
} from "lucide-react";

const features = [
  {
    icon: FolderKanban,
    title: "Project Management",
    description:
      "Organize client engagements into projects with tasks, deadlines, and priority levels.",
  },
  {
    icon: CheckSquare,
    title: "Task Tracking",
    description:
      "Kanban boards and list views to keep everyone on the same page — team and clients alike.",
  },
  {
    icon: MessageSquare,
    title: "Realtime Chat",
    description:
      "Per-project chat rooms powered by Supabase Realtime. Messages appear instantly.",
  },
  {
    icon: Upload,
    title: "File Storage",
    description:
      "Upload, share, and preview documents, designs, and contracts directly in the portal.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Owners, team members, and clients each see exactly what they need — nothing more.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Row-Level Security enforces strict tenant isolation. No data leaks between agencies.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <span className="font-semibold">Client Portal</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button nativeButton={false} render={<Link href="/signup" />}>Get started free</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-24 text-center">
          <Badge variant="secondary" className="mb-4">
            Multi-tenant agency portal
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            Your clients deserve a{" "}
            <span className="text-primary">better portal</span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg mb-8">
            Give clients real-time visibility into projects, tasks, and
            communication — all in one place. Built for agencies that care
            about the experience they deliver.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
              Start for free
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Everything your agency needs
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              One portal. Every tool your team and clients need to collaborate
              smoothly.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/40">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8">
              Create your agency account in seconds.
            </p>
            <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
              Create free account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Client Portal. Built with Next.js &amp;
          Supabase.
        </div>
      </footer>
    </div>
  );
}
