import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarDays,
  MessageSquare,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  Users,
  ShieldCheck,
  Clock,
  Star,
} from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";




const Index = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const features = language.match({
    english: () => [
      {
        title: "Schedule Planner",
        description:
          "Keep track of deadlines, exams and important due dates.",
        icon: CalendarDays,
        path: "/planner",
      },
      {
        title: "Student Forum",
        description:
          "Discuss with fellow students, ask questions and share knowledge.",
        icon: MessageSquare,
        path: "/forum",
      },
      {
        title: "Script Library",
        description:
          "Upload scripts and organize your study materials in one place.",
        icon: FileText,
        path: "/skripte",
      },
    ],
    german: () => [
      {
        title: "Termin-Planner",
        description:
          "Behalte den Überblick über Abgabetermine, Prüfungen und wichtige Deadlines.",
        icon: CalendarDays,
        path: "/planner",
      },
      {
        title: "Studenten-Forum",
        description:
          "Diskutiere mit Kommilitonen, stelle Fragen und teile Wissen.",
        icon: MessageSquare,
        path: "/forum",
      },
      {
        title: "Skript-Bibliothek",
        description:
          "Lade Skripte hoch und organisiere dein Lernmaterial an einem Ort.",
        icon: FileText,
        path: "/skripte",
      },
    ],
  });

  const benefits = language.match({
    english: () => [
      {
        icon: Zap,
        title: "Fast & simple",
        text: "No setup hurdles – just get started and stay organized.",
      },
      {
        icon: Clock,
        title: "Save time",
        text: "All tools in one place. No more juggling 7 tabs at once.",
      },
      {
        icon: Users,
        title: "Strong together",
        text: "Exchange ideas with other students and learn together.",
      },
      {
        icon: ShieldCheck,
        title: "Secure & private",
        text: "Your data stays your data. Encrypted & protected.",
      },
    ],
    german: () => [
      {
        icon: Zap,
        title: "Schnell & einfach",
        text: "Keine Setup-Hürden – einfach loslegen und organisiert bleiben.",
      },
      {
        icon: Clock,
        title: "Spare Zeit",
        text: "Alle Tools an einem Ort. Schluss mit 7 Tabs gleichzeitig.",
      },
      {
        icon: Users,
        title: "Gemeinsam stark",
        text: "Tausche dich mit anderen Studierenden aus und lernt zusammen.",
      },
      {
        icon: ShieldCheck,
        title: "Sicher & privat",
        text: "Deine Daten bleiben deine Daten. Verschlüsselt & geschützt.",
      },
    ],
  });

  const testimonials = language.match({
    english: () => [
      {
        name: "Lena M.",
        role: "Business Information Systems, DHBW Stuttgart",
        text: "Finally no more forgotten submissions between theory and practice phases.",
      },
      {
        name: "Jonas K.",
        role: "Industrial Management, DHBW Mannheim",
        text: "Sharing scripts with the whole course has never been this easy.",
      },
      {
        name: "Sara B.",
        role: "Mechanical Engineering, DHBW Karlsruhe",
        text: "Clear, fast, and actually fun to use.",
      },
    ],
    german: () => [
      {
        name: "Lena M.",
        role: "Wirtschaftsinformatik, DHBW Stuttgart",
        text: "Endlich keine vergessenen Abgaben mehr zwischen Theorie- und Praxisphase.",
      },
      {
        name: "Jonas K.",
        role: "BWL-Industrie, DHBW Mannheim",
        text: "Skripte mit dem ganzen Kurs teilen war noch nie so easy.",
      },
      {
        name: "Sara B.",
        role: "Maschinenbau, DHBW Karlsruhe",
        text: "Übersichtlich, schnell und macht sogar Spaß zu benutzen.",
      },
    ],
  });

  const stats = language.match({
    english: () => [
      { value: "9", label: "DHBW Locations" },
      { value: "3-Month", label: "Theory/Practice Rhythm" },
      { value: "100%", label: "For Dual Students" },
    ],
    german: () => [
      { value: "9", label: "DHBW-Standorte" },
      { value: "3-Monats", label: "Theorie-/Praxisrhythmus" },
      { value: "100%", label: "Für Duale Studis" },
    ],
  });


  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 md:pt-24 pb-12 md:pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Gradient background blobs */}
        <div className="absolute inset-0 -z-0 pointer-events-none">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 sm:left-1/4 sm:translate-x-0 w-44 sm:w-[380px] md:w-[480px] h-44 sm:h-[380px] md:h-[480px] rounded-full blur-3xl opacity-30 bg-gradient-to-br from-primary to-accent" />
          <div className="absolute top-36 right-4 sm:right-10 w-36 sm:w-[300px] md:w-[380px] h-36 sm:h-[300px] md:h-[380px] rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-accent to-primary" />
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="h-4 w-4" />
            {language.match({ english: () => "Specifically for DHBW students", german: () => "Speziell für DHBW-Studierende" })}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-[1.05] tracking-tight"
          >
            {language.match({ english: () => "Your studies at the", german: () => "Dein Studium an der" })}
            <br />
            <span className="text-gradient">DHBW</span>
            {language.match({ english: () => ", organized", german: () => ", organisiert" })}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10"
          >
            {language.match({
              english: () =>
                "Exams, practical phases, scripts and exchange with your course – all in one place, made for dual students.",
              german: () =>
                "Klausuren, Praxisphasen, Skripte und Austausch mit deinem Kurs – alles an einem Ort, gemacht für Duale Studierende.",
            })}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/dashboard">
              <Button
                size="lg"
                className="gap-2 text-base shadow-lg shadow-primary/25"
              >
                {language.match({ english: () => "Get started", german: () => "Jetzt loslegen" })} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/planner">
              <Button size="lg" variant="outline" className="text-base">
                {language.match({ english: () => "View planner", german: () => "Planner ansehen" })}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 sm:mt-16 max-w-xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-heading text-3xl md:text-4xl font-bold text-gradient">
                  {s.value}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-3">
              {language.match({ english: () => "Everything included.", german: () => "Alles drin." })}{" "}
              <span className="text-gradient">{language.match({ english: () => "Nothing superfluous.", german: () => "Nichts überflüssig." })}</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {language.match({ english: () => "Three tools that really work together.", german: () => "Drei Werkzeuge, die wirklich zusammen funktionieren." })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.path} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-3">
              {language.match({ english: () => "Why", german: () => "Warum" })} <span className="text-gradient">StudentPlanner</span>{language.match({ english: () => "?", german: () => "?" })}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {language.match({ english: () => "Built by students, for students.", german: () => "Gebaut von Studierenden, für Studierende." })}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center p-4"
              >
                <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {b.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              {language.match({ english: () => "What students say", german: () => "Das sagen Studierende" })}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                  „{t.text}"
                </p>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-10 md:p-14 text-center relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                {language.match({ english: () => "Ready to bring order to the chaos?", german: () => "Bereit, Ordnung ins Chaos zu bringen?" })}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                {language.match({ english: () => "Start now – free of charge, just get started.", german: () => "Starte jetzt – ohne Kosten, einfach loslegen." })}
              </p>
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 text-base">
                  {language.match({ english: () => "To dashboard", german: () => "Zum Dashboard" })} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ambient decoration */}
      <div className="fixed top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default Index;
