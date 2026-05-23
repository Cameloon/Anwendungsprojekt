import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, ShieldAlert, Scale } from "lucide-react";
import Navbar from "@/components/Navbar";

type LegalDocument = {
  title: string;
  icon: typeof FileText;
  intro: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    list?: string[];
  }>;
};

const sharedNotice =
  "Hinweis: Die folgenden Texte sind als Projektvorlage gedacht und müssen vor einer echten Veröffentlichung mit den tatsächlichen Pflichtangaben und einer rechtlichen Prüfung ergänzt werden.";

const legalDocuments: Record<"impressum" | "datenschutz" | "nutzungsordnung", LegalDocument> = {
  impressum: {
    title: "Impressum",
    icon: Scale,
    intro: "Angaben für das studentische Projekt StudentPlanner.",
    sections: [
      {
        heading: "Angaben gemäß § 5 TMG",
        paragraphs: [
          "StudentPlanner ist ein Projekt der DHBW. Bitte ergänze hier die tatsächlich verantwortliche natürliche oder juristische Person, sobald die Anwendung außerhalb des Projekts veröffentlicht wird.",
        ],
      },
      {
        heading: "Kontakt",
        paragraphs: [
          "E-Mail: [Kontaktadresse eintragen]",
          "Telefon: [optional eintragen]",
          "Adresse: [Postanschrift eintragen]",
        ],
      },
      {
        heading: "Verantwortlich für den Inhalt",
        paragraphs: [
          "Verantwortlich für die Inhalte dieser Webanwendung ist das jeweilige Projektteam beziehungsweise die zu benennende verantwortliche Person.",
        ],
      },
    ],
  },
  datenschutz: {
    title: "Datenschutzerklärung",
    icon: ShieldAlert,
    intro: "Wie StudentPlanner mit personenbezogenen Daten umgeht.",
    sections: [
      {
        heading: "1. Verantwortlicher",
        paragraphs: [
          "Verantwortlich für die Datenverarbeitung ist die für das Projekt benannte Person oder Stelle. Bitte ergänze hier die vollständigen Kontaktdaten.",
        ],
      },
      {
        heading: "2. Welche Daten verarbeitet werden",
        paragraphs: [
          "Je nach Nutzung verarbeitet StudentPlanner Anmelde- und Profildaten, erstellte Inhalte wie Forenbeiträge, Skripte, Planungsdaten sowie technische Nutzungsdaten.",
          "Bei der Nutzung von Authentifizierung, Datenbank- oder Speicherdiensten können zusätzlich Protokoll- und Metadaten anfallen.",
        ],
        list: [
          "Account- und Profildaten",
          "Inhalte aus Forum, Planung und Skript-Bibliothek",
          "Technische Nutzungs- und Diagnosedaten",
          "Nachrichten und Benachrichtigungen innerhalb der Anwendung",
        ],
      },
      {
        heading: "3. Zwecke der Verarbeitung",
        paragraphs: [
          "Die Daten werden verarbeitet, um die Funktionen der Anwendung bereitzustellen, Benutzerkonten zu verwalten, Inhalte zwischen Nutzenden zu teilen und die Nutzung technisch abzusichern.",
        ],
      },
      {
        heading: "4. Speicherdauer und Löschung",
        paragraphs: [
          "Personenbezogene Daten werden gelöscht, sobald sie für den jeweiligen Zweck nicht mehr benötigt werden oder du eine Löschung verlangst, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
        ],
      },
      {
        heading: "5. Betroffenenrechte",
        paragraphs: [
          "Du hast im Regelfall das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen bestimmte Verarbeitungen.",
        ],
      },
    ],
  },
  nutzungsordnung: {
    title: "Nutzungsordnung",
    icon: FileText,
    intro: "Regeln für die Nutzung von StudentPlanner im Projektkontext.",
    sections: [
      {
        heading: "1. Grundsatz",
        paragraphs: [
          "StudentPlanner soll Studierenden beim Organisieren, Austauschen und Teilen von Lernmaterial helfen. Die Nutzung ist nur im Rahmen der geltenden Gesetze und der guten wissenschaftlichen und digitalen Praxis erlaubt.",
        ],
      },
      {
        heading: "2. Erlaubte Nutzung",
        paragraphs: [
          "Erlaubt sind das Anlegen von Terminen, das Erstellen von Beiträgen, das Hochladen von Lernmaterial sowie der Austausch mit anderen Studierenden, solange dabei Rechte Dritter respektiert werden.",
        ],
      },
      {
        heading: "3. Verbotene Inhalte",
        paragraphs: [
          "Untersagt sind insbesondere rechtswidrige, beleidigende, diskriminierende, urheberrechtsverletzende oder sicherheitsgefährdende Inhalte sowie Spam und Manipulationen an der Plattform.",
        ],
      },
      {
        heading: "4. Verfügbarkeit und Änderungen",
        paragraphs: [
          "Die Anwendung wird im Rahmen des Projekts bereitgestellt. Funktionen können angepasst, ergänzt oder vorübergehend eingeschränkt werden.",
        ],
      },
      {
        heading: "5. Eigenverantwortung",
        paragraphs: [
          "Nutzende sind für ihre Inhalte selbst verantwortlich. Vor dem Teilen von Materialien sollte geprüft werden, ob alle erforderlichen Rechte und Freigaben vorliegen.",
        ],
      },
    ],
  },
};

type LegalPageProps = {
  documentKey: keyof typeof legalDocuments;
};

const LegalPage = ({ documentKey }: LegalPageProps) => {
  const document = legalDocuments[documentKey];
  const Icon = document.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-4xl px-6 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
            <Icon className="h-4 w-4 text-primary" />
            Rechtliche Informationen
          </div>

          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">{document.title}</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{document.intro}</p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-950 dark:text-amber-100">
            {sharedNotice}
          </div>

          <div className="space-y-6">
            {document.sections.map((section) => (
              <section key={section.heading} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-3 text-xl font-semibold">{section.heading}</h2>
                <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.list ? (
                    <ul className="ml-5 list-disc space-y-2">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/40 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">Zurück zur Anwendung</p>
              <p className="text-sm text-muted-foreground">Von hier aus kommst du direkt wieder zu den wichtigsten Bereichen.</p>
            </div>
            <Link to="/" className="inline-flex">
              <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
                Startseite
              </button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export const ImpressumPage = () => <LegalPage documentKey="impressum" />;
export const DatenschutzPage = () => <LegalPage documentKey="datenschutz" />;
export const NutzungsordnungPage = () => <LegalPage documentKey="nutzungsordnung" />;