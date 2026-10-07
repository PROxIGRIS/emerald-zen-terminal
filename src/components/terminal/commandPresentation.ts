export interface CommandShape {
  syntax: string;
  kind: "admin" | "cli";
  danger?: "high" | "medium";
  aliases?: string[];
}

export function findInputCommand(value: string, commands: readonly CommandShape[]) {
  const name = value.trimStart().replace(/^obylonc\s+/i, "").split(/\s+/)[0]?.replace(/^[@/]/, "").toLowerCase();
  return commands.find((command) => command.syntax.split(/\s+/)[0] === name);
}

/** Hints are display-only: they never become arguments or execute on Tab. */
export function getArgumentHint(value: string, command?: CommandShape) {
  if (!command) return "";
  const tokens = value.trim().match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  if (tokens[0]?.toLowerCase() === "obylonc") tokens.shift();
  const args = tokens.slice(1);
  const candidates = [command.syntax, ...(command.aliases ?? [])].map((syntax) => syntax.split(/\s+/).slice(1));
  const pattern = candidates.find((parts) => args.every((arg, index) => {
    const part = parts[index];
    return part?.startsWith("<") || part === arg;
  }));
  if (!pattern) return "";
  const remaining = pattern.slice(args.length).map((part) => part === "<workstation>" ? "@workstation_name" : part);
  if (!remaining.length) return "";
  return (/\s$/.test(value) ? "" : " ") + remaining.join(" ");
}

export function getInputTokens(value: string, command?: CommandShape) {
  let wordIndex = 0;
  return (value.match(/\s+|"[^"]*"|[^\s]+/g) ?? []).map((text) => {
    if (/^\s+$/.test(text)) return { text, role: "plain" };
    const index = wordIndex++;
    if (index === 0 && text.toLowerCase() === "obylonc") {
      wordIndex = 0;
      return { text, role: "plain" };
    }
    const role = index === 0 && command ? command.danger ? "danger" : "command"
      : index > 0 && (text.startsWith("@") || (command?.kind === "admin" && index === 1)) ? "target"
      : text.startsWith("-") ? "flag" : "plain";
    return { text, role };
  });
}