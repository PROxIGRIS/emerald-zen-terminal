import React, {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  ArrowUp,
  AtSign,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Command,
  Copy,
  CornerDownLeft,
  FileKey2,
  Fingerprint,
  History,
  Laptop2,
  Loader2,
  Lock,
  Logs,
  Menu,
  MoreHorizontal,
  Network,
  PanelLeft,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sun,
  Moon,
  Plus,
  Terminal as TerminalIcon,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import glow from "@/assets/terminal-glow.jpg";

export type AdminTerminalMode = "light" | "dark" | "system";

export type AdminActionName =
  | "lock"
  | "terminate"
  | "freeze"
  | "unfreeze"
  | "kill_task"
  | "set_alias";

export interface AdminTerminalCommand {
  id: string;
  label: string;
  syntax: string;
  description: string;
  kind: "admin" | "cli";
  danger?: "high" | "medium";
  icon?: React.ReactNode;
  category: string;
  aliases?: string[];
}

export interface TerminalHistoryItem {
  id: string;
  kind: "input" | "output" | "error" | "system" | "success";
  text: string;
  timestamp?: string;
  command?: string;
  meta?: string;
}

export interface AdminTerminalExecuteContext {
  raw: string;
  namespace: "admin" | "cli" | "unknown";
  command: string;
  args: string[];
  action?: AdminActionName;
}

export interface AdminTerminalProps {
  /**
   * Display name shown in the operator prompt.
   * Example: "ayush"
   */
  username?: string;

  /**
   * Optional initial transcript. The component includes a polished default
   * session so the page never feels like an empty IDE after first load.
   */
  initialHistory?: TerminalHistoryItem[];

  /**
   * Let the host app execute real Supabase/Edge-Function/local CLI actions.
   * The UI intentionally does not perform privileged operations by itself.
   */
  onExecute?: (
    context: AdminTerminalExecuteContext
  ) => Promise<{
    kind?: TerminalHistoryItem["kind"];
    text: string;
    meta?: string;
  } | void> | {
    kind?: TerminalHistoryItem["kind"];
    text: string;
    meta?: string;
  } | void;

  /**
   * Optional external workstation target. Kept in the page header and can be
   * used by the host application when executing remote admin actions.
   */
  targetName?: string;

  targetId?: string;

  /**
   * Host theme state. The page also works when the application's root already
   * toggles `.dark`, because the CSS is built around the supplied design
   * tokens.
   */
  mode?: AdminTerminalMode;

  /**
   * Compact mobile mode can be forced by the shell when required.
   */
  compact?: boolean;

  className?: string;
}

const ADMIN_ACTIONS: AdminTerminalCommand[] = [
  {
    id: "admin.freeze",
    label: "Freeze workstation",
    syntax: "freeze <workstation>",
    description: "Freeze the selected workstation immediately.",
    kind: "admin",
    danger: "high",
    category: "Endpoint control",
    icon: <Lock size={15} />,
  },
  {
    id: "admin.unfreeze",
    label: "Unfreeze workstation",
    syntax: "unfreeze <workstation>",
    description: "Release an active workstation freeze.",
    kind: "admin",
    category: "Endpoint control",
    icon: <RotateCcw size={15} />,
  },
  {
    id: "admin.lock",
    label: "Lock workstation",
    syntax: "lock <workstation>",
    description: "Issue the current remote lock action.",
    kind: "admin",
    category: "Endpoint control",
    icon: <ShieldCheck size={15} />,
  },
  {
    id: "admin.terminate",
    label: "Terminate",
    syntax: "terminate <workstation>",
    description: "Issue the registered terminate action for a workstation.",
    kind: "admin",
    danger: "high",
    category: "Endpoint control",
    icon: <X size={15} />,
  },
  {
    id: "admin.kill_task",
    label: "Kill task",
    syntax: "kill_task <workstation> <task>",
    description: "Request termination of a named task on the target.",
    kind: "admin",
    danger: "medium",
    category: "Process control",
    icon: <Zap size={15} />,
  },
  {
    id: "admin.set_alias",
    label: "Set workstation alias",
    syntax: "set_alias <workstation> <alias>",
    description: "Change the operator-facing workstation alias.",
    kind: "admin",
    category: "Identity",
    icon: <Fingerprint size={15} />,
  },
];

const CLI_COMMANDS: AdminTerminalCommand[] = [
  {
    id: "cli.status",
    label: "Status",
    syntax: "status",
    description: "Print license, node, and authorization status.",
    kind: "cli",
    category: "Everyday",
    icon: <Activity size={15} />,
  },
  {
    id: "cli.doctor",
    label: "Doctor",
    syntax: "doctor",
    description: "Run the fast endpoint health check.",
    kind: "cli",
    category: "Diagnostics",
    icon: <ShieldCheck size={15} />,
    aliases: ["doctor --deep", "doctor --fix", "doctor --deepfix", "doctor --profile 60s"],
  },
  {
    id: "cli.diagnose",
    label: "Diagnose",
    syntax: "diagnose",
    description: "Check enrollment, connectivity, token state, and signatures.",
    kind: "cli",
    category: "Diagnostics",
    icon: <Search size={15} />,
  },
  {
    id: "cli.logs",
    label: "Logs",
    syntax: "logs",
    description: "Inspect logs or reconstruct the Broker → Core → Brain story.",
    kind: "cli",
    category: "Evidence",
    icon: <Logs size={15} />,
    aliases: ["logs -f", "logs --deep", "logs -f --level warning"],
  },
  {
    id: "cli.alerts",
    label: "Alerts",
    syntax: "alerts",
    description: "Show recent enforcement alerts and triggers.",
    kind: "cli",
    category: "Evidence",
    icon: <Activity size={15} />,
  },
  {
    id: "cli.support-bundle",
    label: "Support bundle",
    syntax: "support-bundle",
    description: "Generate a sanitized troubleshooting bundle.",
    kind: "cli",
    category: "Support",
    icon: <Clipboard size={15} />,
  },
  {
    id: "cli.version",
    label: "Version",
    syntax: "version",
    description: "Print exact release/build metadata.",
    kind: "cli",
    category: "System",
    icon: <Command size={15} />,
  },
  {
    id: "cli.activate",
    label: "Activate",
    syntax: "activate <LICENSE_KEY>",
    description: "Provision the endpoint with a license key.",
    kind: "cli",
    category: "Lifecycle",
    icon: <FileKey2 size={15} />,
    aliases: ["activate --key-file <path>"],
  },
  {
    id: "cli.login",
    label: "Login",
    syntax: "login",
    description: "Authenticate the CLI through browser/device authorization.",
    kind: "cli",
    category: "Authentication",
    icon: <UserRound size={15} />,
    aliases: ["login status", "login logout"],
  },
  {
    id: "cli.boot",
    label: "Boot",
    syntax: "boot",
    description: "Inspect or change startup integration.",
    kind: "cli",
    category: "Lifecycle",
    icon: <RefreshCw size={15} />,
    aliases: ["boot status", "boot enable", "boot disable"],
  },
  {
    id: "cli.reset-identity",
    label: "Reset identity",
    syntax: "reset-identity --confirm",
    description: "Reset machine identity for imaging workflows.",
    kind: "cli",
    category: "Lifecycle",
    icon: <Fingerprint size={15} />,
  },
  {
    id: "cli.deactivate",
    label: "Deactivate",
    syntax: "deactivate",
    description: "Deactivate the endpoint and clear local activation.",
    kind: "cli",
    category: "Lifecycle",
    icon: <Trash2 size={15} />,
  },
  {
    id: "cli.ai",
    label: "AI support",
    syntax: "ai",
    description: "Open the Obylon support assistant.",
    kind: "cli",
    category: "Support",
    icon: <Bot size={15} />,
  },
  {
    id: "cli.auth",
    label: "Auth",
    syntax: "auth",
    description: "Manage Umbraxis authorization and privileged requests.",
    kind: "cli",
    category: "Authentication",
    icon: <ShieldCheck size={15} />,
    aliases: [
      "auth login",
      "auth request",
      "auth status",
      "auth logout",
      "auth authorize",
    ],
  },
];

const ALL_COMMANDS = [...ADMIN_ACTIONS, ...CLI_COMMANDS];

function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitArgs(value: string) {
  return value
    .trim()
    .match(/(?:[^\s"]+|"[^"]*")+/g)
    ?.map((part) => part.replace(/^"|"$/g, "")) ?? [];
}

function nowTime() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function makeId(prefix = "terminal") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCommandFromRaw(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      namespace: "unknown" as const,
      command: "",
      args: [] as string[],
    };
  }

  const withoutPrompt = trimmed
    .replace(/^obylonc(?:\s+|$)/i, "")
    .trim();

  if (withoutPrompt.startsWith("@")) {
    const tokens = splitArgs(withoutPrompt.slice(1));
    return {
      namespace: "admin" as const,
      command: tokens[0] ?? "",
      args: tokens.slice(1),
    };
  }

  if (withoutPrompt.startsWith("/")) {
    const tokens = splitArgs(withoutPrompt.slice(1));
    return {
      namespace: "cli" as const,
      command: tokens[0] ?? "",
      args: tokens.slice(1),
    };
  }

  const tokens = splitArgs(withoutPrompt);
  return {
    namespace: "unknown" as const,
    command: tokens[0] ?? "",
    args: tokens.slice(1),
  };
}

function getDefaultHistory(): TerminalHistoryItem[] {
  return [
    {
      id: makeId("boot"),
      kind: "system",
      text: "OBYLON ADMIN TERMINAL",
      meta: "Secure operator interface",
    },
    {
      id: makeId("ready"),
      kind: "success",
      text: "Session ready. Authorization channel available.",
      meta: "Use @ for remote admin actions · / for obylonc commands",
    },
  ];
}

function commandMatches(
  command: AdminTerminalCommand,
  query: string,
  trigger: "@" | "/"
) {
  const normalized = normalizeQuery(query);
  if (!normalized) return true;

  const candidates = [
    command.syntax,
    command.label,
    command.description,
    ...(command.aliases ?? []),
  ].map((item) => normalizeQuery(item));

  const cleanedTrigger = normalized.startsWith(trigger)
    ? normalized.slice(1)
    : normalized;

  return candidates.some(
    (candidate) =>
      candidate.startsWith(cleanedTrigger) ||
      candidate.includes(cleanedTrigger)
  );
}

function getSuggestionToken(value: string) {
  const atIndex = value.lastIndexOf("@");
  const slashIndex = value.lastIndexOf("/");
  const index = Math.max(atIndex, slashIndex);

  if (index < 0) return null;

  const trigger = value[index] as "@" | "/";
  const text = value.slice(index + 1);

  if (text.includes(" ")) {
    const commandName = text.trim().split(/\s+/)[0];
    return {
      trigger,
      query: commandName,
      index,
    };
  }

  return {
    trigger,
    query: text,
    index,
  };
}

function commandExampleFor(
  command: AdminTerminalCommand,
  trigger: "@" | "/"
) {
  return `${trigger}${command.syntax}`;
}

export default function AdminTerminal({
  username = "admin",
  initialHistory,
  onExecute,
  targetName = "No workstation selected",
  targetId,
  mode = "system",
  compact = false,
  className = "",
}: AdminTerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<TerminalHistoryItem[]>(
    initialHistory?.length ? initialHistory : getDefaultHistory()
  );
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedMobileHeader, setExpandedMobileHeader] = useState(false);
  const [darkTheme, setDarkTheme] = useState(mode === "dark");
  const [commandMode, setCommandMode] = useState<"cli" | "admin">("cli");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const suggestionToken = useMemo(
    () => getSuggestionToken(input),
    [input]
  );

  const suggestionTrigger = suggestionToken?.trigger;
  const suggestionQuery = suggestionToken?.query ?? "";

  const suggestions = useMemo(() => {
    if (!suggestionTrigger) return [];

    const source = suggestionTrigger === "@" ? ADMIN_ACTIONS : CLI_COMMANDS;

    return source
      .filter((command) =>
        commandMatches(command, suggestionQuery, suggestionTrigger)
      )
      .slice(0, 9);
  }, [suggestionQuery, suggestionTrigger]);

  const activeSuggestion = suggestions[selectedSuggestion] ?? suggestions[0];

  useEffect(() => {
    setSelectedSuggestion(0);
  }, [suggestionQuery, suggestionTrigger]);

  useEffect(() => {
    if (!transcriptRef.current) return;
    transcriptRef.current.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history, isRunning]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    }

    return () => {
      // Do not remove .dark for "system", because the host application owns it.
      if (mode === "dark") {
        document.documentElement.classList.remove("dark");
      }
    };
  }, [mode]);

  const pushHistory = (
    kind: TerminalHistoryItem["kind"],
    text: string,
    meta?: string,
    command?: string
  ) => {
    setHistory((previous) => [
      ...previous,
      {
        id: makeId("line"),
        kind,
        text,
        meta,
        command,
        timestamp: nowTime(),
      },
    ]);
  };

  const insertSuggestion = (command: AdminTerminalCommand) => {
    if (!suggestionToken) return;

    const trigger = suggestionToken.trigger;
    const completed = commandExampleFor(command, trigger);

    const nextValue =
      input.slice(0, suggestionToken.index) + completed + " ";

    setInput(nextValue);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(
        nextValue.length,
        nextValue.length
      );
    });
  };

  const executeRaw = async (rawInput: string) => {
    const raw = rawInput.trim();

    if (!raw || isRunning) return;

    const parsed = getCommandFromRaw(raw);

    pushHistory(
      "input",
      raw,
      parsed.namespace === "admin"
        ? "remote admin action"
        : parsed.namespace === "cli"
          ? "obylonc CLI"
          : "unknown command",
      raw
    );

    setInput("");
    setSelectedSuggestion(0);

    if (parsed.namespace === "unknown") {
      pushHistory(
        "error",
        "Unknown command namespace.",
        "Use @<command> for admin actions or /<command> for obylonc."
      );
      return;
    }

    setIsRunning(true);

    try {
      if (onExecute) {
        const result = await onExecute({
          raw,
          namespace: parsed.namespace,
          command: parsed.command,
          args: parsed.args,
          action:
            parsed.namespace === "admin"
              ? (parsed.command as AdminActionName)
              : undefined,
        });

        if (result?.text) {
          pushHistory(
            result.kind ?? "output",
            result.text,
            result.meta
          );
        } else {
          pushHistory(
            "success",
            "Command accepted by the operator shell.",
            parsed.namespace === "admin"
              ? "Awaiting server-authoritative result"
              : "Awaiting CLI result"
          );
        }

        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 540));

      if (parsed.namespace === "admin") {
        pushHistory(
          "success",
          `Queued ${parsed.command}.`,
          targetId
            ? `Target: ${targetName} · ${targetId}`
            : `Target: ${targetName}`
        );
        pushHistory(
          "system",
          "Preview only. No workstation action was performed.",
          "The UI never performs privileged actions directly."
        );
      } else {
        pushHistory(
          "success",
          `obylonc ${parsed.command} accepted.`,
          "Demo shell response"
        );
        pushHistory(
          "output",
          getDemoCliOutput(parsed.command, parsed.args),
          "7.0.9-LTS"
        );
      }
    } catch (error) {
      pushHistory(
        "error",
        error instanceof Error ? error.message : "Command execution failed.",
        "The command was not reported as completed."
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    void executeRaw(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void executeRaw(input);
      return;
    }

    if (
      suggestionTrigger &&
      suggestions.length > 0 &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      event.preventDefault();
      setSelectedSuggestion((current) => {
        const next =
          event.key === "ArrowDown" ? current + 1 : current - 1;
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }

    if (
      suggestionTrigger &&
      suggestions.length > 0 &&
      event.key === "Tab"
    ) {
      event.preventDefault();
      insertSuggestion(activeSuggestion ?? suggestions[0]);
      return;
    }

    if (event.key === "Escape" && suggestionTrigger) {
      event.preventDefault();
      setInput(input.slice(0, suggestionToken?.index ?? input.length));
      return;
    }
  };

  const copyTranscript = async () => {
    const value = history
      .map((item) => {
        const prefix =
          item.kind === "input"
            ? `$ ${item.text}`
            : item.kind === "error"
              ? `! ${item.text}`
              : item.kind === "success"
                ? `✓ ${item.text}`
                : item.kind === "system"
                  ? `› ${item.text}`
                  : item.text;

        return item.meta ? `${prefix}\n  ${item.meta}` : prefix;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const clearTerminal = () => {
    setHistory([
      {
        id: makeId("clear"),
        kind: "system",
        text: "Terminal cleared.",
        meta: "Ready for your next command.",
        timestamp: nowTime(),
      },
    ]);
    setInput("");
  };

  const statusLabel = isRunning ? "Executing" : targetId ? "Connected" : "Standby";

  return (
    <section className={`terminal-page ${darkTheme ? "dark" : ""} ${compact ? "terminal-compact" : ""} ${className}`}>
      <img className="terminal-backdrop" src={glow} alt="" width={1440} height={1200} aria-hidden="true" />
      <div className="terminal-tint" aria-hidden="true" />
      <header className="terminal-header">
        <div className="terminal-brand"><div className="terminal-brand-mark"><TerminalIcon size={25} /></div><span>Obylon<span className="terminal-brand-dot">.</span></span></div>
        <div className="terminal-header-actions">
          <span className="terminal-version">7.0.9-LTS</span>
          <Button variant="ghost" size="icon" className="terminal-icon" onClick={() => setDarkTheme(v => !v)} aria-label={darkTheme ? "Switch to light mode" : "Switch to dark mode"} title={darkTheme ? "Light mode" : "Dark mode"}>{darkTheme ? <Sun /> : <Moon />}</Button>
          <Button variant="ghost" size="icon" className="terminal-icon" onClick={() => setExpandedMobileHeader(v => !v)} aria-label="Open terminal menu" title="Terminal menu"><Menu /></Button>
        </div>
        {expandedMobileHeader && <div className="terminal-menu">
          <div className="terminal-menu-heading">Operator: {username}</div>
          <div className="terminal-menu-target"><Laptop2 size={15} />{targetName}</div>
          <Button variant="ghost" onClick={() => {setInput("/status"); setExpandedMobileHeader(false)}}><Activity />Endpoint status</Button>
          <Button variant="ghost" onClick={() => {setInput("/doctor --deep"); setExpandedMobileHeader(false)}}><Search />Deep diagnostics</Button>
          <Button variant="ghost" onClick={() => {setInput("/logs --deep"); setExpandedMobileHeader(false)}}><History />Boot story</Button>
          <Button variant="ghost" onClick={() => {setShowHelp(v => !v); setExpandedMobileHeader(false)}}><CircleHelp />Command reference</Button>
        </div>}
      </header>
      <main className="terminal-main">
        <div className="terminal-intro">
          <span className="terminal-session"><span className="terminal-status-dot" />Operator session <span className="terminal-session-divider">/</span> {statusLabel}</span>
          <h1>Admin Terminal</h1>
          <p>A little less noise. A little more control.</p>
        </div>
        <div className="terminal-workspace">
          <div className="terminal-transcript-toolbar"><span>{username}@obylon <span className="terminal-path">/ admin</span></span><div>
            <Button variant="ghost" size="icon" className="terminal-icon" onClick={copyTranscript} aria-label="Copy transcript" title="Copy transcript">{copied ? <Check /> : <Copy />}</Button>
            <Button variant="ghost" size="icon" className="terminal-icon" onClick={clearTerminal} aria-label="Clear terminal" title="Clear terminal"><Trash2 /></Button>
          </div></div>
          <div className="terminal-transcript" ref={transcriptRef} role="log" aria-live="polite" aria-label="Admin terminal transcript">
            {history.map(item => <TerminalHistoryRow key={item.id} item={item} />)}
            {isRunning && <div className="terminal-running"><Loader2 className="admin-terminal-spin" size={14} />Awaiting command result…</div>}
          </div>
          {showHelp && <div className="terminal-help"><div><strong>Command reference</strong><p>Remote actions: @freeze, @unfreeze, @lock, @terminate, @kill_task, @set_alias</p><p>CLI: /status, /doctor, /logs, /version, /auth</p></div><Button variant="ghost" size="icon" aria-label="Close command reference" onClick={() => setShowHelp(false)}><X /></Button></div>}
          <div className="terminal-composer-wrap">
            {suggestionTrigger && suggestions.length > 0 && <div className="terminal-suggestions" role="listbox" aria-label={suggestionTrigger === "@" ? "Admin action suggestions" : "obylonc command suggestions"}>
              <div className="terminal-suggestions-heading">{suggestionTrigger === "@" ? "Admin actions" : "Obylon commands"}<span>{suggestions.length}</span></div>
              {suggestions.map((command, index) => <Button variant="ghost" type="button" role="option" aria-selected={index === selectedSuggestion} key={command.id} className={`terminal-suggestion ${index === selectedSuggestion ? "is-selected" : ""}`} onMouseEnter={() => setSelectedSuggestion(index)} onClick={() => insertSuggestion(command)}>
                {command.icon}<span><strong>{command.label}</strong><small>{command.description}</small></span><code>{commandExampleFor(command, suggestionTrigger)}</code>
              </Button>)}
            </div>}
            <form className="terminal-composer" onSubmit={handleSubmit}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="What would you like to run?" aria-label="Admin terminal command" rows={2} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
              <div className="terminal-composer-footer">
                <div className="terminal-composer-left">
                  <Button variant="ghost" size="icon" type="button" className="terminal-plus" onClick={() => {setShowHelp(v => !v); inputRef.current?.focus()}} aria-label="Command reference" title="Command reference"><Plus /></Button>
                  <Button variant="ghost" size="icon" type="button" className="terminal-command-button" onClick={() => {setInput("@"); inputRef.current?.focus()}} aria-label="Show admin actions" title="Admin actions"><AtSign /></Button>
                </div>
                <div className="terminal-composer-right">
                  <label className="terminal-mode"><span className="sr-only">Command mode</span><select value={commandMode} aria-label="Command mode" onChange={e => {const next = e.target.value === "admin" ? "admin" : "cli"; setCommandMode(next); setInput(next === "admin" ? "@" : "/"); inputRef.current?.focus()}}><option value="cli">Run CLI</option><option value="admin">Admin</option></select><ChevronDown size={16} /></label>
                  <Button variant="ghost" size="icon" type="submit" className="terminal-send" disabled={!input.trim() || isRunning} aria-label="Run command" title="Run command">{isRunning ? <Loader2 className="admin-terminal-spin" /> : <ArrowUp />}</Button>
                </div>
              </div>
            </form>
          </div>
          <div className="terminal-bottom"><span><ShieldCheck size={13} />{onExecute ? "Authorization-gated session" : "Preview session"}</span><span>obylonc <span className="terminal-bottom-dot">·</span> 7.0.9-LTS</span></div>
        </div>
      </main>
      <footer className="terminal-page-footer"><span>OBYLON</span><span>Security, without the noise.</span><span><span className="terminal-status-dot" />{targetId ? "Connected" : "No target connected"}</span></footer>
    </section>
  );
}

function TerminalHistoryRow({ item }: { item: TerminalHistoryItem }) {
  const rowClass = [
    "admin-terminal-history-row",
    `history-${item.kind}`,
  ].join(" ");

  if (item.kind === "input") {
    return (
      <div className={rowClass}>
        <div className="admin-terminal-history-prompt">
          <span>$</span>
          <span className="history-user">operator</span>
        </div>
        <div className="admin-terminal-history-content">
          <code>{item.text}</code>
          {item.meta && <span className="history-meta">{item.meta}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={rowClass}>
      <div className="admin-terminal-history-marker">
        {item.kind === "success" ? (
          <Check size={13} />
        ) : item.kind === "error" ? (
          <X size={13} />
        ) : item.kind === "system" ? (
          <ChevronRight size={13} />
        ) : (
          <span className="admin-terminal-history-dot" />
        )}
      </div>

      <div className="admin-terminal-history-content">
        <span className="admin-terminal-history-text">{item.text}</span>
        {item.meta && <span className="history-meta">{item.meta}</span>}
      </div>

      {item.timestamp && (
        <time className="admin-terminal-history-time">
          {item.timestamp}
        </time>
      )}
    </div>
  );
}

function getDemoCliOutput(command: string, args: string[]) {
  switch (command.toLowerCase()) {
    case "status":
      return [
        "release       7.0.9-LTS",
        "authorization technician session",
        "node          ready",
        "heartbeat     reachable",
        "license       active",
      ].join("\n");

    case "doctor":
      return args.includes("--deep")
        ? [
            "doctor mode   deep forensic",
            "scan           complete",
            "evidence      collected",
            "repair        not requested",
          ].join("\n")
        : [
            "doctor mode   health",
            "boot task      ready",
            "vault          ready",
            "logs           readable",
          ].join("\n");

    case "logs":
      return [
        "Broker  → running",
        "Core    → present",
        "Brain   → present",
        "WFP     → reconciled",
      ].join("\n");

    case "version":
      return [
        "OBYLON CLI",
        "Version       7.0.9-LTS",
        "Build date    2026-09-30",
        "Build code    OBY-MC-APP-POLICY-WFP-20260930-02",
      ].join("\n");

    default:
      return `Command '${command}' completed in demo mode.`;
  }
}
