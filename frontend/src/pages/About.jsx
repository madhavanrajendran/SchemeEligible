import {
  ExternalLink,
  Heart,
  Code2,
  Bot,
  RefreshCw,
  CheckCircle2,
  Database,
} from "lucide-react";

import Navbar from "@/components/custom/Navbar";

const teamMembers = [
  {
    name: "Madhavan R",
    role: "Full Stack Developer",
    description:
      "Designed and developed the core platform, including the user interface, backend APIs, database integration, eligibility engine, scheme management system, and automated AI-powered scheme updater.",
    contributions: [
      "Frontend Development",
      "Backend & REST APIs",
      "Database Integration",
      "Eligibility Engine",
      "Scheme Management",
      "AI Scheme Updater",
      "System Integration",
    ],
    portfolio: "https://madhavansportfolio.vercel.app",
    icon: Code2,
  },
  {
    name: "Ayisha Banu S",
    role: "Full Stack Developer",
    description:
      "Designed and developed the AI assistant that helps users interact with the platform, understand government schemes, and get assistance while navigating the system.",
    contributions: [
      "AI Assistant",
      "Chatbot Development",
      "AI Integration",
      "User Assistance",
    ],
    portfolio: "https://ayishabanudev.netlify.app/",
    icon: Bot,
  },
];

const About = () => {
  return (
<>
<Navbar/>
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="px-6 pb-16 pt-24 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              About Us
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Making government schemes
              <span className="block text-primary">
                easier to discover.
              </span>
            </h1>

            <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
              SchemeCheck is a platform designed to help users discover Tamil
              Nadu Government schemes, check their preliminary eligibility,
              and understand scheme requirements through a simple and
              accessible interface.
            </p>
          </div>
        </div>
      </section>

      {/* About the Project */}
      <section className="border-y bg-muted/30 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Our Project
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built to simplify scheme discovery.
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground">
              <p className="leading-7">
                SchemeCheck brings government scheme information and
                eligibility checking together in one place. Users can select a
                scheme, provide the required details, and receive a
                preliminary eligibility result.
              </p>

              <p className="leading-7">
                The platform combines a rule-based eligibility system with an
                AI-powered assistant that helps users understand and interact
                with scheme information.
              </p>

              <p className="leading-7">
                We also built a separate AI-powered updater that checks
                available official sources, detects changes, analyzes updated
                information, compares it with existing scheme data, and sends
                relevant updates to the platform automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Built */}
      <section className="px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              What We Built
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              A complete platform with intelligent features.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-card p-6">
              <CheckCircle2 className="mb-5 text-primary" size={24} />

              <h3 className="font-semibold">
                Eligibility Checking
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A rule-based system evaluates user details against the
                eligibility requirements of each scheme.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <Bot className="mb-5 text-primary" size={24} />

              <h3 className="font-semibold">
                AI Assistant
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                An AI assistant helps users interact with the platform and
                understand government scheme information.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <RefreshCw className="mb-5 text-primary" size={24} />

              <h3 className="font-semibold">
                AI Scheme Updater
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A separate automated AI system monitors official sources,
                detects changes, analyzes them, and updates scheme information
                when required.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <Database className="mb-5 text-primary" size={24} />

              <h3 className="font-semibold">
                Full-Stack Platform
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The project includes a responsive frontend, backend APIs,
                database integration, scheme management, and secure system
                communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-y bg-muted/30 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Credits
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The people behind SchemeCheck.
            </h2>

            <p className="mt-4 max-w-2xl text-muted-foreground">
              A collaborative project where each member contributed to
              different parts of the platform.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {teamMembers.map((member) => {
              const Icon = member.icon;

              return (
                <article
                  key={member.name}
                  className="rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon size={24} />
                    </div>

                    <a
                      href={member.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Portfolio
                      <ExternalLink size={15} />
                    </a>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-2xl font-semibold">
                      {member.name}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-primary">
                      {member.role}
                    </p>

                    <p className="mt-4 leading-7 text-muted-foreground">
                      {member.description}
                    </p>
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm font-semibold">
                      Contributions
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {member.contributions.map((contribution) => (
                        <span
                          key={contribution}
                          className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium"
                        >
                          {contribution}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm leading-6 text-muted-foreground">
            SchemeCheck provides preliminary eligibility information for
            assistance purposes. Final eligibility and approval are determined
            by the respective government department according to its official
            rules and verification process.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center">
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          Made with
          <Heart size={15} className="fill-current text-primary" />
          by the SchemeCheck team
        </p>
      </footer>
    </main>
    </>
  );
};

export default About;