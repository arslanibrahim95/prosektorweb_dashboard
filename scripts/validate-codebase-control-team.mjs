#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, ".gemini", "agents-codebase-control.json");

const expectedAgents = [
  { name: "Codebase Map Agent", tool: "Gemini CLI", model: "Gemini 2.5 Pro", trigger: "/cb-map", phase: "discovery" },
  { name: "Codebase Risk Agent", tool: "OpenCode", model: "Kimi 2.5", trigger: "/cb-risk", phase: "analysis" },
  { name: "Codebase Security Agent", tool: "z.ai", model: "glm-4.5", trigger: "/cb-security", phase: "analysis" },
  { name: "Codebase Test Gap Agent", tool: "MiniMax", model: "MiniMax-M1", trigger: "/cb-tests", phase: "analysis" },
  { name: "Codebase Triage Agent", tool: "OpenCode", model: "GLM5", trigger: "/cb-triage", phase: "verification" }
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function parseConfig() {
  if (!fs.existsSync(CONFIG_PATH)) fail(`Missing config: ${path.relative(ROOT, CONFIG_PATH)}`);
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (error) {
    fail(`Invalid JSON at .gemini/agents-codebase-control.json: ${error.message}`);
  }
}

function readWorkflowFrontmatter(workflowPath) {
  const fullPath = path.join(ROOT, workflowPath);
  assert(fs.existsSync(fullPath), `Missing workflow file: ${workflowPath}`);

  const content = fs.readFileSync(fullPath, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const meta = {};
  for (const line of match[1].split("\n")) {
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
    for (const key of ["name", "description", "tool", "model", "workflow", "scope", "trigger"]) {
      assert(agent[key] !== undefined && agent[key] !== null, `Agent "${agent.name ?? "UNKNOWN"}" missing field "${key}"`);
    }
    assert(Array.isArray(agent.scope), `Agent "${agent.name}" field "scope" must be array`);
    assert(!seenNames.has(agent.name), `Duplicate agent name: ${agent.name}`);
    assert(!seenTriggers.has(agent.trigger), `Duplicate trigger: ${agent.trigger}`);
    seenNames.add(agent.name);
    seenTriggers.add(agent.trigger);

    const workflowMeta = readWorkflowFrontmatter(agent.workflow);
    if (workflowMeta.tool) {
      assert(workflowMeta.tool === agent.tool, `Tool mismatch for "${agent.name}" (${agent.tool} != ${workflowMeta.tool})`);
    }
    if (workflowMeta.model) {
      assert(String(workflowMeta.model) === String(agent.model), `Model mismatch for "${agent.name}" (${agent.model} != ${workflowMeta.model})`);
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
  console.log("Codebase control agents team validation passed.");
}

main();
