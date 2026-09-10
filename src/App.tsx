import { useEffect, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Eye,
  EyeOff,
  Menu,
  X,
} from "lucide-react";
import lessonData from "./data/lessons.json";
import validationData from "./data/validations.json";

const theoryFiles = import.meta.glob("./data/theory/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const theoryFileNames: Record<LessonKey, string> = {
  ensimmäinen: "01-ensimmainen",
  muotoilu: "02-muotoilu",
  listat: "03-listat",
  linkit: "04-linkit",
  kuvat: "05-kuvat",
  semanttinen: "06-semanttinen",
  cssperusteet: "07-cssperusteet",
  selektorit: "08-selektorit",
  tekstityylit: "09-tekstityylit",
  boxmodel: "10-boxmodel",
  taustat: "11-taustat",
  flexbox: "12-flexbox",
  flexkaytanto: "13-flexkaytanto",
  grid: "14-grid",
  responsiivisuus: "15-responsiivisuus",
  lomakkeet: "16-lomakkeet",
  hyva: "17-hyva",
  loppuprojekti: "18-loppuprojekti",
};

type LessonKey = keyof typeof lessonData;
type Lesson = {
  number: string;
  title: string;
  short: string;
  theory: string;
  topics: string[];
  exercises: string[];
  project?: string;
  example: string;
  task: string;
  hint: string;
  language: "html" | "css";
};
type ValidationRule = {
  source: "html" | "css";
  kind: "contains" | "count" | "regex";
  value: string;
  min?: number;
};

const lessons = lessonData as Record<LessonKey, Lesson>;
const progressStorageKey = "markup-studio-progress";

type SavedProgress = {
  activeLesson: LessonKey;
  completed: LessonKey[];
  drafts: Record<string, { html: string; css: string }>;
};

const defaultHtml =
  "<main>\n  <h1>Tervetuloa sivulleni</h1>\n  <p>Opettelen juuri HTML:ää.</p>\n</main>";

function readSavedProgress(): SavedProgress | null {
  try {
    const saved = window.localStorage.getItem(progressStorageKey);
    return saved ? (JSON.parse(saved) as SavedProgress) : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(markdown: string) {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  let listItems: string[] = [];
  let skippedDocumentTitle = false;
  const renderCode = (value: string, language: string) => {
    const normalizedLanguage = language.toLowerCase();
    return normalizedLanguage === "html" || normalizedLanguage === "css"
      ? highlightCode(value, normalizedLanguage)
      : escapeHtml(value);
  };
  const inline = (value: string) =>
    escapeHtml(value).replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-white/10 px-1.5 py-0.5 text-[#d8f566]">$1</code>',
    );
  const flushList = () => {
    if (listItems.length > 0) {
      output.push(
        `<ul class="grid gap-2 pl-5 text-[#c0c4b8]">${listItems.map((item) => `<li class="list-disc">${inline(item)}</li>`).join("")}</ul>`,
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        output.push(
          `<pre class="code-surface overflow-x-auto rounded-lg p-5 text-sm leading-7 text-[#f4f2eb]"><code data-language="${codeLanguage}">${renderCode(codeLines.join("\n"), codeLanguage)}</code></pre>`,
        );
        inCode = false;
        codeLanguage = "";
        codeLines = [];
      } else {
        flushList();
        inCode = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();
    if (line.startsWith("# ")) {
      if (!skippedDocumentTitle) {
        skippedDocumentTitle = true;
        continue;
      }
      output.push(
        `<h2 class="text-2xl font-semibold text-[#f4f2eb]">${inline(line.slice(2))}</h2>`,
      );
    }
    else if (line.startsWith("## "))
      output.push(
        `<h3 class="text-xl font-semibold text-[#f4f2eb]">${inline(line.slice(3))}</h3>`,
      );
    else if (line.trim())
      output.push(
        `<p class="leading-relaxed text-[#c0c4b8]">${inline(line)}</p>`,
      );
  }
  if (inCode)
    output.push(
      `<pre class="code-surface overflow-x-auto rounded-lg p-5 text-sm leading-7 text-[#f4f2eb]"><code data-language="${codeLanguage}">${renderCode(codeLines.join("\n"), codeLanguage)}</code></pre>`,
    );
  flushList();
  return output.join("");
}

function highlightCode(value: string, language: "html" | "css") {
  const tokens: string[] = [];
  const protect = (markup: string) =>
    `\uE000${String.fromCharCode(0xe100 + tokens.push(markup) - 1)}\uE001`;
  const restore = (markup: string) =>
    markup.replace(
      /\uE000([\uE100-\uE8FF])\uE001/g,
      (_, token) => tokens[token.charCodeAt(0) - 0xe100],
    );
  const escaped = escapeHtml(value);
  if (language === "html")
    return restore(
      escaped
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, (match) =>
          protect(`<span class="text-[#596052]">${match}</span>`),
        )
        .replace(
          /(&lt;\/)([a-z0-9-]+)/gi,
          (_, bracket, name) =>
            `${bracket}${protect(`<span class="text-[#ff9d8e]">${name}</span>`)}`,
        )
        .replace(
          /([a-z-]+)(=)(&quot;[^&]*?&quot;)/gi,
          (_, name, equals, attributeValue) =>
            `${protect(`<span class="text-[#d8f566]">${name}</span>`)}${equals}${protect(`<span class="text-[#f4c95d]">${attributeValue}</span>`)}`,
        )
        .replace(
          /(&lt;)([a-z0-9-]+)/gi,
          (_, bracket, name) =>
            `${bracket}${protect(`<span class="text-[#ff9d8e]">${name}</span>`)}`,
        ),
    );
  return restore(
    escaped
      .replace(/(\/\*[\s\S]*?\*\/)/g, (match) =>
        protect(`<span class="text-[#596052]">${match}</span>`),
      )
      .replace(
        /([a-z-]+)(\s*:)/gi,
        (_, property, colon) =>
          `${protect(`<span class="text-[#ff9d8e]">${property}</span>`)}${colon}`,
      )
      .replace(
        /(#[0-9a-f]{3,8}|\b\d+(?:\.\d+)?(?:rem|px|%|vh|vw)?\b)/gi,
        (match) => protect(`<span class="text-[#f4c95d]">${match}</span>`),
      ),
  );
}

function findHtmlError(value: string) {
  const voidTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);
  const stack: string[] = [];
  const tags = value.match(/<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (tag.startsWith("<!--") || tag.endsWith("/>")) continue;
    const match = tag.match(/^<\/?([a-z][a-z0-9-]*)/i);
    if (!match) continue;
    const name = match[1].toLowerCase();
    if (voidTags.has(name)) continue;
    if (tag.startsWith("</")) {
      if (stack.at(-1) !== name)
        return `Sulkeva tagi </${name}> ei vastaa avaavaa tagia.`;
      stack.pop();
    } else {
      stack.push(name);
    }
  }
  return stack.length > 0 ? `Tagi <${stack.at(-1)}> jää sulkematta.` : null;
}

function validateLesson(key: LessonKey, html: string, css: string) {
  const rules = (validationData[key as keyof typeof validationData] ??
    []) as ValidationRule[];
  return rules.every((rule) => {
    const source = (rule.source === "html" ? html : css)
      .toLowerCase()
      .replace(/\s+/g, "");
    const value = rule.value.toLowerCase().replace(/\s+/g, "");
    if (rule.kind === "count")
      return (
        (
          source.match(
            new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          ) ?? []
        ).length >= (rule.min ?? 1)
      );
    if (rule.kind === "regex")
      return new RegExp(rule.value, "i").test(
        rule.source === "html" ? html : css,
      );
    return source.includes(value);
  });
}

function Header({ onHome }: { onHome: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
      <button
        onClick={onHome}
        className="flex items-center gap-3 font-semibold tracking-tight"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-[#d8f566] text-[#11130f]">
          <Code2 size={20} />
        </span>
        <span>
          Markup<span className="text-[#d8f566]">.studio</span>
        </span>
      </button>
      <nav className="hidden items-center gap-8 text-sm text-[#a6aa9e] md:flex">
        <button onClick={onHome} className="transition hover:text-[#d8f566]">
          Oppimispolku
        </button>
      </nav>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-lg border border-white/10 p-2 md:hidden"
        aria-label="Avaa valikko"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {menuOpen && (
        <nav className="absolute right-6 top-18 rounded-xl border border-white/10 bg-[#20241d] p-4 text-sm">
          <button onClick={onHome}>Oppimispolku</button>
        </nav>
      )}
    </header>
  );
}

function LearningPath({
  completed,
  onSelect,
}: {
  completed: Set<LessonKey>;
  onSelect: (key: LessonKey) => void;
}) {
  const progress = Math.round(
    (completed.size / Object.keys(lessons).length) * 100,
  );
  return (
    <section
      aria-label={`Oppimispolku, ${progress}% valmis`}
      className="mx-auto max-w-5xl px-6 pb-20 pt-16 lg:px-10 lg:pt-24"
    >
      <div className="max-w-2xl">
        <p className="mono text-xs uppercase tracking-[.2em] text-[#d8f566]">
          Oppimispolku / 18 oppituntia
        </p>
        <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-.06em] sm:text-7xl">
          Rakenna sivu,
          <br />
          <span className="text-[#d8f566]">askel kerrallaan.</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#a6aa9e]">
          Aloita perusteista. Lue lyhyt teoria, kokeile koodia ja suorita pieni
          tehtävä ennen seuraavaa oppituntia.
        </p>
      </div>
      <div className="relative mt-16 grid gap-4 md:grid-cols-3">
        <div className="absolute left-[16%] right-[16%] top-16 hidden h-px bg-[#65722e] md:block" />
        {(Object.keys(lessons) as LessonKey[]).map((key) => {
          const item = lessons[key];
          const done = completed.has(key);
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="group relative rounded-2xl border border-white/10 bg-[#20241d] p-5 text-left transition hover:-translate-y-1 hover:border-[#d8f566]/70 md:text-center"
            >
              <span
                className={`relative z-10 mx-auto grid size-12 place-items-center rounded-full border-2 font-semibold ${done ? "border-[#d8f566] bg-[#d8f566] text-[#11130f]" : "border-[#65722e] bg-[#11130f] text-[#d8f566]"}`}
              >
                {done ? <Check size={20} /> : item.number}
              </span>
              <h2 className="mt-6 text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-[#8f9689]">{item.short}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#d8f566]">
                Aloita <ArrowRight size={15} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CodeEditor({
  lesson,
  html,
  css,
  setHtml,
  setCss,
}: {
  lesson: Lesson;
  html: string;
  css: string;
  setHtml: (value: string) => void;
  setCss: (value: string) => void;
}) {
  const [showPreview, setShowPreview] = useState(true);
  const [activeFile, setActiveFile] = useState<"html" | "css">(lesson.language);
  const activeCode = activeFile === "html" ? html : css;
  const updateCode = (value: string) =>
    activeFile === "html" ? setHtml(value) : setCss(value);
  const lines = activeCode.split("\n");
  const htmlError = activeFile === "html" ? findHtmlError(activeCode) : null;
  const editorId = "editor";
  const editorClass =
    "overflow-hidden rounded-xl border border-white/10 bg-[#20241d]";
  const editorDataHtmlError = htmlError ?? undefined;
  const ariaLabel = htmlError ? `HTML-virhe: ${htmlError}` : "Koodieditori";
  const previewDocument = `<!doctype html><html lang="fi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${lesson.language === "css" ? css : ""}</style></head><body>${html}</body></html>`;
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab" && event.key !== "Enter") return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeCursor = activeCode.slice(0, start);
    const currentLine = beforeCursor.slice(beforeCursor.lastIndexOf("\n") + 1);
    const indentation = currentLine.match(/^\s*/)?.[0] ?? "";
    const content = currentLine.trim();
    const closingLine = activeFile === "html" && /^<\//.test(content);
    const shouldNest =
      event.key === "Enter" &&
      (activeFile === "css"
        ? /\{\s*$/.test(content)
        : /<(html|head|body|main|section|article|header|footer|nav|div|ul|ol|form)[^>]*>\s*$/i.test(
            content,
          ));
    const lineIndentation =
      closingLine && indentation.length >= 2
        ? indentation.slice(0, -2)
        : indentation;
    const inserted =
      event.key === "Tab"
        ? "  "
        : `\n${lineIndentation}${shouldNest ? "  " : ""}`;
    const nextCode = `${activeCode.slice(0, start)}${inserted}${activeCode.slice(end)}`;
    updateCode(nextCode);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + inserted.length,
        start + inserted.length,
      );
    });
  };
  return (
    <div
      id={editorId}
      data-html-error={editorDataHtmlError}
      aria-label={ariaLabel}
      className={editorClass}
    >
      <div className="flex items-end justify-between border-b border-white/10 px-4 pt-3">
        <div className="flex items-end gap-1">
          <button
            onClick={() => setActiveFile("html")}
            className={`mono border-b-2 px-4 pb-3 pt-1 text-xs ${activeFile === "html" ? "border-[#d8f566] text-[#f4f2eb]" : "border-transparent text-[#7e8477]"}`}
          >
            harjoitus.html
          </button>
          <button
            onClick={() => setActiveFile("css")}
            className={`mono border-b-2 px-4 pb-3 pt-1 text-xs ${activeFile === "css" ? "border-[#d8f566] text-[#f4f2eb]" : "border-transparent text-[#7e8477]"}`}
          >
            tyylit.css
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          aria-label={
            showPreview ? "Piilota live-esikatselu" : "Näytä live-esikatselu"
          }
          className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#d8f566]"
        >
          {showPreview ? <Eye size={14} /> : <EyeOff size={14} />} live
        </button>
      </div>
      <div className={showPreview ? "grid lg:grid-cols-2" : "grid"}>
        <div
          className={
            showPreview
              ? "border-b border-white/10 lg:border-b-0 lg:border-r"
              : ""
          }
        >
          <div className="border-b border-white/10 px-5 py-2 text-[11px] text-[#7e8477]">
            Muokkaa koodia
          </div>
          <div className="code-surface flex min-h-72 overflow-hidden">
            <div
              aria-hidden="true"
              className="mono select-none border-r border-white/10 px-4 py-6 text-right text-sm leading-6 text-[#596052]"
            >
              {lines.map((_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              <pre
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-6 text-sm leading-6 mono"
              >
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(activeCode, activeFile),
                  }}
                />
              </pre>
              <textarea
                aria-label={`${activeFile === "html" ? "HTML" : "CSS"}-koodieditori`}
                value={activeCode}
                onChange={(event) => updateCode(event.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                wrap="off"
                className="relative z-10 mono min-h-72 w-full resize-y bg-transparent p-6 text-sm leading-6 text-transparent caret-[#f4f2eb] outline-none selection:bg-[#d8f566]/20"
              />
            </div>
          </div>
        </div>
        {showPreview && (
          <div className="bg-[#f4f2eb]">
            <div className="border-b border-[#d5d7cc] px-5 py-2 text-[11px] text-[#65722e]">
              Esikatselu
            </div>
            <iframe
              title="Koodin live-esikatselu"
              srcDoc={previewDocument}
              sandbox="allow-same-origin"
              className="min-h-72 w-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LessonView({
  lessonKey,
  onHome,
  onComplete,
  onNext,
}: {
  lessonKey: LessonKey;
  onHome: () => void;
  onComplete: () => void;
  onNext: () => void;
}) {
  const sourceLesson = lessons[lessonKey];
  const theoryMarkdown =
    theoryFiles[`./data/theory/${theoryFileNames[lessonKey]}.md`] ||
    sourceLesson.theory;
  const lesson = {
    ...sourceLesson,
    theory: theoryMarkdown,
    task: `${sourceLesson.task}${sourceLesson.exercises.length > 0 ? ` Harjoitukset: ${sourceLesson.exercises.join(" ja ")}.` : ""}${sourceLesson.project ? ` Miniprojekti: ${sourceLesson.project}.` : ""}`,
  };
  const savedDraft = readSavedProgress()?.drafts[lessonKey];
  const [html, setHtml] = useState(savedDraft?.html ?? defaultHtml);
  const [css, setCss] = useState(
    savedDraft?.css ?? (lesson.language === "css" ? lesson.example : ""),
  );
  const [taskDone, setTaskDone] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "passed" | "failed">(
    "idle",
  );
  const checkSolution = () => {
    const passed = validateLesson(lessonKey, html, css);
    setTestResult(passed ? "passed" : "failed");
    if (passed) {
      setTaskDone(true);
      onComplete();
    }
  };
  useEffect(() => {
    const saved = readSavedProgress();
    const next: SavedProgress = {
      activeLesson: lessonKey,
      completed: saved?.completed ?? [],
      drafts: { ...(saved?.drafts ?? {}), [lessonKey]: { html, css } },
    };
    window.localStorage.setItem(progressStorageKey, JSON.stringify(next));
  }, [lessonKey, html, css]);
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-10 lg:px-10">
      <button
        onClick={onHome}
        className="mb-12 inline-flex items-center gap-2 text-sm text-[#a6aa9e] transition hover:text-[#d8f566]"
      >
        <ArrowLeft size={16} /> Takaisin oppimispolulle
      </button>
      <div className="max-w-3xl">
        <p className="mono text-xs uppercase tracking-[.2em] text-[#d8f566]">
          Oppitunti {lesson.number}
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-.06em] sm:text-6xl">
          {lesson.title}
        </h1>
        <div
          className="mt-8 space-y-4"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(theoryMarkdown) }}
        />
      </div>
      <section className="mt-12 grid gap-6 border-y border-white/10 py-10 md:grid-cols-[.8fr_1.2fr] md:items-start">
        <div>
          <p className="mono text-xs uppercase tracking-[.16em] text-[#d8f566]">
            01 / Teoria
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Mitä sinun pitää tietää?
          </h2>
          <p className="mt-4 leading-relaxed text-[#c0c4b8]">
            Rakenna ensin ymmärrys siitä, mitä koodi tekee. Sen jälkeen sama
            asia tuntuu luonnolliselta editorissa.
          </p>
        </div>
        <pre className="code-surface rounded-lg p-5 text-sm leading-7 text-[#f4f2eb]">
          <code>{lesson.example}</code>
        </pre>
      </section>
      <section id="harjoittele" className="mt-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mono text-xs uppercase tracking-[.16em] text-[#d8f566]">
              02 / Kokeile
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Testaa teoria käytännössä.
            </h2>
          </div>
          <span className="mono text-xs text-[#596052]">live-editori</span>
        </div>
        <CodeEditor
          lesson={lesson}
          html={html}
          css={css}
          setHtml={setHtml}
          setCss={setCss}
        />
      </section>
      <section className="mt-10 rounded-xl border border-[#d8f566]/30 bg-[#20241d] p-6 lg:p-8">
        <p className="mono text-xs uppercase tracking-[.16em] text-[#d8f566]">
          03 / Tehtävä
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Nyt sinä kokeilet.</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-[#c0c4b8]">
          {lesson.task}
        </p>
        <p className="mono mt-4 text-xs text-[#7e8477]">Vihje: {lesson.hint}</p>
        <button
          onClick={checkSolution}
          className={`mt-6 rounded-lg px-4 py-3 text-sm font-semibold ${taskDone ? "bg-white/10 text-[#d8f566]" : "bg-[#d8f566] text-[#11130f]"}`}
        >
          {testResult === "passed" ? "Tarkistettu" : "Tarkasta"}
        </button>
        <p role="status" className="mt-4 text-sm text-[#d8f566]">
          {testResult === "passed"
            ? "Oikein! Tehtävä on suoritettu."
            : testResult === "failed"
              ? "Ratkaisu ei ole vielä valmis."
              : ""}
        </p>
        {testResult === "passed" && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onHome}
              className="rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-[#f4f2eb]"
            >
              Takaisin polulle
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-lg bg-[#d8f566] px-4 py-3 text-sm font-semibold text-[#11130f]"
            >
              Seuraava vaihe <ArrowRight size={16} className="ml-2 inline" />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function App() {
  const saved = readSavedProgress();
  const [view, setView] = useState<"home" | "lesson">("home");
  const [activeLesson, setActiveLesson] = useState<LessonKey>(
    saved?.activeLesson ?? "ensimmäinen",
  );
  const [completed, setCompleted] = useState<Set<LessonKey>>(
    new Set(saved?.completed ?? []),
  );
  const openLesson = (key: LessonKey) => {
    setActiveLesson(key);
    setView("lesson");
    window.localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        ...(readSavedProgress() ?? { completed: [], drafts: {} }),
        activeLesson: key,
      }),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const completeLesson = () => {
    const next = new Set(completed).add(activeLesson);
    setCompleted(next);
    const current = readSavedProgress();
    window.localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        activeLesson,
        completed: [...next],
        drafts: current?.drafts ?? {},
      }),
    );
  };
  const nextLesson = () => {
    const keys = Object.keys(lessons) as LessonKey[];
    const next = keys[keys.indexOf(activeLesson) + 1];
    if (next) {
      openLesson(next);
    } else {
      goHome();
    }
  };
  const goHome = () => {
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="min-h-screen bg-[#11130f] text-[#f4f2eb]">
      <Header onHome={goHome} />
      {view === "home" ? (
        <LearningPath completed={completed} onSelect={openLesson} />
      ) : (
        <LessonView
          lessonKey={activeLesson}
          onHome={goHome}
          onComplete={completeLesson}
          onNext={nextLesson}
        />
      )}
      <footer className="mx-auto max-w-5xl px-6 py-8 text-xs text-[#596052] lg:px-10">
        Markup.studio / Oppimateriaali verkon rakentamiseen
      </footer>
    </div>
  );
}

export default App;
