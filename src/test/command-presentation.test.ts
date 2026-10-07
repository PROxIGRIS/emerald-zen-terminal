import { describe, expect, it } from "vitest";
import { findInputCommand, getArgumentHint, getInputTokens } from "../components/terminal/commandPresentation";

const commands = [
  { syntax: "terminate <workstation>", kind: "admin" as const, danger: "high" as const },
  { syntax: "kill_task <workstation> <task>", kind: "admin" as const },
  { syntax: "set_alias <workstation> <alias>", kind: "admin" as const },
  { syntax: "activate <LICENSE_KEY>", kind: "cli" as const, aliases: ["activate --key-file <path>"] },
  { syntax: "status", kind: "cli" as const },
];
describe("command-aware arguments", () => {
  it("links slash and at command names to the same registry", () => {
    expect(findInputCommand("/terminate", commands)).toBe(commands[0]);
    expect(findInputCommand("@terminate", commands)).toBe(commands[0]);
    expect(findInputCommand("/term", commands)).toBeUndefined();
  });
  it("hints workstation targets without inserting them", () => {
    expect(getArgumentHint("/terminate", commands[0])).toBe(" @workstation_name");
    expect(getArgumentHint("/terminate ", commands[0])).toBe("@workstation_name");
    expect(getArgumentHint("/terminate @studio", commands[0])).toBe("");
  });
  it("advances to task and alias arguments after the workstation", () => {
    expect(getArgumentHint("/kill_task @studio ", commands[1])).toBe("<task>");
    expect(getArgumentHint("@set_alias @studio", commands[2])).toBe(" <alias>");
    expect(getArgumentHint('@set_alias @studio "Studio One"', commands[2])).toBe("");
  });
  it("uses license and flag-specific path hints, not workstation hints", () => {
    expect(getArgumentHint("/activate", commands[3])).toBe(" <LICENSE_KEY>");
    expect(getArgumentHint("/activate --key-file ", commands[3])).toBe("<path>");
    expect(getArgumentHint("/status", commands[4])).toBe("");
  });
  it("retains the exact typed text while distinguishing command and target", () => {
    const value = '/terminate @studio';
    const tokens = getInputTokens(value, commands[0]);
    expect(tokens.map((token) => token.text).join("")).toBe(value);
    expect(tokens[0]?.role).toBe("danger");
    expect(tokens[2]?.role).toBe("target");
  });
});