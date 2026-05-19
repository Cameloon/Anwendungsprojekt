import { motion } from "framer-motion";
import { Sparkles, ExternalLink } from "lucide-react";

interface Tool {
  name: string;
  description: string;
  category: "KI" | "Lernen" | "Notizen" | "Produktivität";
  url: string;
  emoji: string;
}

const tools: Tool[] = [
  {
    name: "ChatGPT",
    description: "Erklärungen, Zusammenfassungen & Brainstorming",
    category: "KI",
    url: "https://chat.openai.com",
    emoji: "🤖",
  },
  {
    name: "NotebookLM",
    description: "Skripte hochladen & gezielt Fragen stellen",
    category: "KI",
    url: "https://notebooklm.google.com",
    emoji: "📓",
  },
  {
    name: "Perplexity",
    description: "Recherche mit Quellenangaben für Hausarbeiten",
    category: "KI",
    url: "https://perplexity.ai",
    emoji: "🔍",
  },
  {
    name: "Anki",
    description: "Karteikarten mit Spaced-Repetition",
    category: "Lernen",
    url: "https://apps.ankiweb.net",
    emoji: "🧠",
  },
  {
    name: "Notion",
    description: "Notizen, Wissensdatenbank & Projektplanung",
    category: "Notizen",
    url: "https://notion.so",
    emoji: "📝",
  },
  {
    name: "Obsidian",
    description: "Vernetzte Markdown-Notizen für Wissen",
    category: "Notizen",
    url: "https://obsidian.md",
    emoji: "🪨",
  },
  {
    name: "Wolfram Alpha",
    description: "Mathe, Physik & Statistik Schritt-für-Schritt",
    category: "Lernen",
    url: "https://wolframalpha.com",
    emoji: "∑",
  },
  {
    name: "Forest",
    description: "Fokus halten, Pomodoro & weniger Handy",
    category: "Produktivität",
    url: "https://forestapp.cc",
    emoji: "🌲",
  },
];

const categoryStyles: Record<Tool["category"], string> = {
  KI: "bg-primary/15 text-primary",
  Lernen: "bg-info/15 text-info",
  Notizen: "bg-success/15 text-success",
  Produktivität: "bg-accent/15 text-accent",
};

const AiTipsCard = () => {
  return (
    <section className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-1 relative">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-heading font-semibold text-lg">Hilfreiche Tools fürs Studium</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5 relative">
        Kuratierte KI- & Produktivitäts-Apps, die wirklich helfen.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 relative">
        {tools.map((tool, i) => (
          <motion.a
            key={tool.name}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-transparent hover:border-primary/30 hover:bg-secondary/70 transition-all"
          >
            <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center text-xl shrink-0">
              {tool.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm text-foreground truncate">
                  {tool.name}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                {tool.description}
              </p>
              <span
                className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryStyles[tool.category]}`}
              >
                {tool.category}
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
};

export default AiTipsCard;
