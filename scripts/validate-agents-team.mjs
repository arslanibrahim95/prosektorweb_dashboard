#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, ".gemini", "agents.json");

const expectedAgents = [
  { name: "UX Agent", tool: "OpenCode", model: "Kimi 2.5", trigger: "/ux-agent", phase: "planning" },
  { name: "UI Agent", tool: "OpenCode", model: "Kimi 2.5", trigger: "/ui-agent", phase: "planning" },
  { name: "CSS/Design System Agent", tool: "OpenCode", model: "GLM5", trigger: "/css-agent", phase: "planning" },
  { name: "Frontend Agent", tool: "OpenCode", model: "Kimi 2.5", trigger: "/frontend-agent", phase: "execution" },
  { name: "Backend Agent", tool: "Codex", model: "5.3 High", trigger: "/backend-agent", phase: "execution" },
  { name: "Code Reviewer", tool: "OpenCode", model: "Kimi 2.5", trigger: "/code-reviewer", phase: "verification" },
  { name: "Test Engineer", tool: "Codex", model: "5.3 High", trigger: "/test-engineer", phase: "verification" },
  { name: "QA Agent", tool: "Opus", model: "4.6", trigger: "/qa-agent", phase: "verification" },
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function parseConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fail(`Missing config: ${path.relative(ROOT, CONFIG_PATH)}`);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON at .gemini/agents.json: ${error.message}`);
  }
  return parsed;
}

function ensureRequiredAgentFields(agent) {
  const required = ["name", "description", "tool", "model", "workflow", "scope", "trigger"];
  for (const key of required) {
    assert(agent[key] !== undefined && agent[key] !== null, `Agent "${agent.name ?? "UNKNOWN"}" missing field "${key}"`);
  }
  assert(Array.isArray(agent.scope), `Agent "${agent.name}" field "scope" must be array`);
}

function readWorkflowFrontmatter(workflowPath) {
  const fullPath = path.join(ROOT, workflowPath);
  assert(fs.existsSync(fullPath), `Missing workflow file: ${workflowPath}`);

  const content = fs.readFileSync(fullPath, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const meta = {};
  const lines = match[1].split("\n");
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
    meta[key] = value;
  }
  return meta;
}

function validateAgents(agents) {
  assert(Array.isArray(agents), `"agents" must be an array`);
  assert(agents.length === expectedAgents.length, `Expected ${expectedAgents.length} agents, got ${agents.length}`);

  const seenNames = new Set();
  const seenTriggers = new Set();

  for (const agent of agents) {
    ensureRequiredAgentFields(agent);
    assert(!seenNames.has(agent.name), `Duplicate agent name: ${agent.name}`);
    assert(!seenTriggers.has(agent.trigger), `Duplicate trigger: ${agent.trigger}`);
    seenNames.add(agent.name);
    seenTriggers.add(agent.trigger);

    const workflowMeta = readWorkflowFrontmatter(agent.workflow);
    if (workflowMeta.tool) {
      assert(workflowMeta.tool === agent.tool, `Tool mismatch for "${agent.name}" (${agent.tool} != ${workflowMeta.tool})`);
    }
    if (workflowMeta.model) {
      const normalizedModel = String(workflowMeta.model).replace(/^"(.*)"$/, "$1");
      assert(normalizedModel === String(agent.model), `Model mismatch for "${agent.name}" (${agent.model} != ${normalizedModel})`);
    }
  }

  for (const expected of expectedAgents) {
    const actual = agents.find((agent) => agent.name === expected.name);
    assert(actual, `Missing agent: ${expected.name}`);
    assert(actual.tool === expected.tool, `Agent "${expected.name}" tool mismatch`);
    assert(String(actual.model) === expected.model, `Agent "${expected.name}" model mismatch`);
    assert(actual.trigger === expected.trigger, `Agent "${expected.name}" trigger mismatch`);
  }
}

function validatePipeline(config) {
  assert(config.pipeline && typeof config.pipeline === "object", `Missing "pipeline" object`);
  assert(Array.isArray(config.pipeline.stages), `"pipeline.stages" must be an array`);
  assert(config.pipeline.stages.length === expectedAgents.length, `Expected ${expectedAgents.length} stages, got ${config.pipeline.stages.length}`);

  for (let i = 0; i < expectedAgents.length; i += 1) {
    const expected = expectedAgents[i];
    const stage = config.pipeline.stages[i];
    assert(stage.agent === expected.name, `Pipeline order mismatch at index ${i}: expected "${expected.name}", got "${stage.agent}"`);
    assert(stage.phase === expected.phase, `Pipeline phase mismatch for "${expected.name}"`);
    assert(stage.tool === expected.tool, `Pipeline tool mismatch for "${expected.name}"`);
    assert(String(stage.model) === expected.model, `Pipeline model mismatch for "${expected.name}"`);
  }
}

function main() {
  const config = parseConfig();
  validateAgents(config.agents);
  validatePipeline(config);
  console.log("Agents team validation passed.");
}

main();
