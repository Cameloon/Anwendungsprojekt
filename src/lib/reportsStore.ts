export interface PostReport {
  id: string;
  postId: string;
  postTitle: string;
  forumName: string;
  reason: string;
  reportedBy: string;
  createdAt: number;
  status: "offen" | "erledigt";
}

const KEY = "post_reports_v1";
const EVENT = "post_reports_changed";

export const loadReports = (): PostReport[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PostReport[]) : [];
  } catch {
    return [];
  }
};

export const saveReports = (reports: PostReport[]) => {
  localStorage.setItem(KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event(EVENT));
};

export const addReport = (report: PostReport) => {
  saveReports([report, ...loadReports()]);
};

export const dismissReport = (id: string) => {
  saveReports(
    loadReports().map((r) => (r.id === id ? { ...r, status: "erledigt" } : r))
  );
};

export const subscribeReports = (cb: () => void) => {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
};
