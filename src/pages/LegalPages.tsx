import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
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



type LegalDocumentKey = "impressum" | "datenschutz" | "nutzungsordnung";

type LegalPageProps = {
  documentKey: LegalDocumentKey;
};

const LegalPage = ({ documentKey }: LegalPageProps) => {
  const { language } = useLanguage();

  const sharedNotice = language.match({
    english: () =>
      "Notice: The following texts are intended as a project template and must be supplemented with the actual mandatory information and a legal review before a real publication.",
    german: () =>
      "Hinweis: Die folgenden Texte sind als Projektvorlage gedacht und müssen vor einer echten Veröffentlichung mit den tatsächlichen Pflichtangaben und einer rechtlichen Prüfung ergänzt werden.",
  });

  const legalDocuments: Record<LegalDocumentKey, LegalDocument> = language.match({
    english: () => ({
      impressum: {
        title: "Legal Notice",
        icon: Scale,
        intro: "Information for the student project StudentPlanner.",
        sections: [
          {
            heading: "Information pursuant to § 5 TMG",
            paragraphs: [
              "StudentPlanner is a project of DHBW. Please add the actual responsible natural or legal person here once the application is published outside the project.",
            ],
          },
          {
            heading: "Contact",
            paragraphs: [
              "Email: [Enter contact address]",
              "Phone: [optional]",
              "Address: [Enter postal address]",
            ],
          },
          {
            heading: "Responsible for content",
            paragraphs: [
              "Responsible for the content of this web application is the respective project team or the person to be named.",
            ],
          },
        ],
      },
      datenschutz: {
        title: "Privacy Policy",
        icon: ShieldAlert,
        intro: "How StudentPlanner handles personal data.",
        sections: [
          {
            heading: "1. Data Controller",
            paragraphs: [
              "Responsible for data processing is the person or entity designated for the project. Please add the complete contact details here.",
            ],
          },
          {
            heading: "2. What data is processed",
            paragraphs: [
              "Depending on usage, StudentPlanner processes login and profile data, created content such as forum posts, scripts, planning data as well as technical usage data.",
              "When using authentication, database or storage services, additional log and metadata may be generated.",
            ],
            list: [
              "Account and profile data",
              "Content from forum, planner and script library",
              "Technical usage and diagnostic data",
              "Messages and notifications within the application",
            ],
          },
          {
            heading: "3. Purposes of processing",
            paragraphs: [
              "The data is processed to provide the application's functions, manage user accounts, share content between users, and technically secure usage.",
            ],
          },
          {
            heading: "4. Storage duration and deletion",
            paragraphs: [
              "Personal data will be deleted as soon as it is no longer needed for the respective purpose or you request deletion, unless legal retention obligations conflict.",
            ],
          },
          {
            heading: "5. Data subject rights",
            paragraphs: [
              "As a rule, you have the right to information, correction, deletion, restriction of processing, data portability, and objection to certain processing.",
            ],
          },
        ],
      },
      nutzungsordnung: {
        title: "Terms of Use",
        icon: FileText,
        intro: "Rules for using StudentPlanner in the project context.",
        sections: [
          {
            heading: "1. Basic principle",
            paragraphs: [
              "StudentPlanner is intended to help students organize, exchange and share learning materials. Use is only permitted within the framework of applicable laws and good scientific and digital practice.",
            ],
          },
          {
            heading: "2. Permitted use",
            paragraphs: [
              "Permitted activities include creating appointments, posting content, uploading learning materials, and exchanging with other students, provided that third-party rights are respected.",
            ],
          },
          {
            heading: "3. Prohibited content",
            paragraphs: [
              "Specifically prohibited are illegal, offensive, discriminatory, copyright-infringing or security-threatening content as well as spam and manipulation of the platform.",
            ],
          },
          {
            heading: "4. Availability and changes",
            paragraphs: [
              "The application is provided as part of the project. Functions may be adjusted, supplemented, or temporarily restricted.",
            ],
          },
          {
            heading: "5. Personal responsibility",
            paragraphs: [
              "Users are responsible for their own content. Before sharing materials, it should be checked whether all necessary rights and approvals are in place.",
            ],
          },
        ],
      },
    }),
    german: () => ({
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
    }),
  });

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
            {language.match({ english: () => "Legal Information", german: () => "Rechtliche Informationen" })}
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
              <p className="font-medium">{language.match({ english: () => "Back to the application", german: () => "Zurück zur Anwendung" })}</p>
              <p className="text-sm text-muted-foreground">{language.match({ english: () => "From here you can get directly back to the most important areas.", german: () => "Von hier aus kommst du direkt wieder zu den wichtigsten Bereichen." })}</p>
            </div>
            <Link to="/" className="inline-flex">
              <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
                {language.match({ english: () => "Home", german: () => "Startseite" })}
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