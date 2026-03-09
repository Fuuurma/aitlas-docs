# OpenSandbox Integration Research

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Source:** https://github.com/alibaba/OpenSandbox
**Date:** 2026-03-08
**Verdict:** ✅ **PERFECT FIT** - Use as Aitlas Execution Layer

---

## What is OpenSandbox?

**General-purpose sandbox platform for AI applications** (Apache 2.0, by Alibaba)

**Key Features:**
- Multi-language SDKs (Python, Java/Kotlin, TypeScript/JS, C#/.NET, Go)
- Docker + Kubernetes runtimes
- Strong isolation (gVisor, Kata Containers, Firecracker microVM)
- Unified sandbox APIs for lifecycle management
- Network policy (ingress/egress controls)

---

## Perfect Fit for Aitlas

### 1. Execution Layer ✅
**Problem:** Aitlas needs safe code/command execution
**Solution:** OpenSandbox provides isolated sandbox environments

```
Aitlas Architecture:
├── Nova (Chat, Code, Memory panels)
├── Orchestration (Memory, Compaction, Planner)
├── LLM Provider (Claude/GPT/Gemini)
└── Execution Layer ← OpenSandbox goes here!
    ├── Command execution
    ├── File operations
    ├── Code interpreter
    └── Browser automation
```

### 2. Built-in Examples for Aitlas Components

| Example | Use Case | Aitlas Component |
|---------|----------|------------------|
| `claude-code` | Claude Code in sandbox | Coding agent |
| `codex-cli` | OpenAI Codex CLI | Coding agent |
| `gemini-cli` | Google Gemini CLI | Coding agent |
| `kimi-cli` | Moonshot Kimi CLI | Coding agent |
| `langgraph` | LangGraph workflows | Orchestration |
| `google-adk` | Google ADK agent | Agent framework |
| `openclaw` | **OpenClaw Gateway** | **Direct integration!** |
| `playwright` | Browser automation | Browser agent |
| `chrome` | Chromium with VNC | Browser agent |
| `vscode` | code-server in sandbox | Code editor |
| `desktop` | Full desktop environment | GUI agent |

### 3. OpenClaw Integration ✅

**They already have OpenClaw example!**

```bash
# Launch OpenClaw Gateway inside a sandbox
examples/openclaw/
```

**This means:**
- Aitlas can run OpenClaw in sandboxed environment
- Each user gets isolated OpenClaw instance
- Secure multi-tenant execution

### 4. Code Interpreter SDK

**Built-in code interpreter for AI coding agents:**

```python
from code_interpreter import CodeInterpreter, SupportedLanguage
from opensandbox import Sandbox

# Create sandbox
sandbox = await Sandbox.create(
    "opensandbox/code-interpreter:v1.0.1",
    timeout=timedelta(minutes=10),
)

# Execute Python code
interpreter = await CodeInterpreter.create(sandbox)
result = await interpreter.codes.run(
    "import sys; print(sys.version)",
    language=SupportedLanguage.PYTHON,
)
```

**Perfect for:**
- Aitlas coding agents
- Safe code execution
- Multi-language support (Python, JavaScript, etc.)

### 5. TypeScript SDK

**Native TypeScript/JavaScript SDK:**

```typescript
import { Sandbox } from 'opensandbox';

// Create sandbox
const sandbox = await Sandbox.create({
  image: 'opensandbox/code-interpreter:v1.0.1',
  timeout: 600,
});

// Execute command
const result = await sandbox.commands.run('echo "Hello"');

// Read/write files
await sandbox.files.writeFiles([
  { path: '/tmp/test.txt', data: 'Hello World', mode: 644 }
]);
```

**Fits Nexus (Next.js/TypeScript stack)**

### 6. Security Features

| Feature | Benefit |
|---------|---------|
| **gVisor** | User-space kernel, strong isolation |
| **Kata Containers** | Lightweight VMs |
| **Firecracker microVM** | Fast boot, strong isolation |
| **Network egress control** | Limit outbound network |
| **Ingress gateway** | Control traffic routing |

**Perfect for multi-tenant Aitlas**

---

## Aitlas Architecture with OpenSandbox

```
┌─────────────────────────────────────────────┐
│                 NEXUS UI                    │
│         (TypeScript + OpenSandbox SDK)     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│           AITLAS ORCHESTRATION              │
│  (Memory, Compaction, Planner, Tool Router)│
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              LLM PROVIDER                  │
│        (Claude/GPT/Gemini - BYOK)          │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│         OPENSANDBOX EXECUTION LAYER        │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Sandbox │  │  Sandbox │  │  Sandbox │ │
│  │  #1      │  │  #2      │  │  #3      │ │
│  │          │  │          │  │          │ │
│  │ • Code   │  │ • Shell  │  │ • Browser│ │
│  │ • Files  │  │ • Docker │  │ • VNC    │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  Runtime: Docker (dev) / Kubernetes (prod) │
└─────────────────────────────────────────────┘
```

---

## Implementation Path

### Phase 1: Local Development (Week 1)

**Use Docker runtime:**

```bash
# Install OpenSandbox server
uv pip install opensandbox-server

# Initialize config
opensandbox-server init-config ~/.sandbox.toml --example docker

# Start server
opensandbox-server
```

**Integrate TypeScript SDK in Nexus:**

```typescript
// lib/opensandbox.ts
import { Sandbox } from 'opensandbox';

export async function executeCode(code: string, language: string) {
  const sandbox = await Sandbox.create({
    image: 'opensandbox/code-interpreter:v1.0.1',
    timeout: 300, // 5 minutes
  });

  const interpreter = await CodeInterpreter.create(sandbox);
  const result = await interpreter.codes.run(code, { language });
  
  await sandbox.kill();
  return result;
}
```

### Phase 2: Production (Month 2)

**Deploy Kubernetes runtime:**

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opensandbox-server
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: opensandbox
          image: opensandbox/server:latest
```

**Benefits:**
- Horizontal scaling
- High availability
- Multi-tenant isolation

### Phase 3: Advanced Features (Month 3)

1. **Browser Agent** - Use Playwright example
2. **Desktop Agent** - Use desktop example for GUI automation
3. **VS Code in Sandbox** - Use vscode example for remote development
4. **OpenClaw Integration** - Use openclaw example

---

## Aitlas Tool Definitions (with OpenSandbox)

### execute_code

```typescript
const executeCodeTool: Tool = {
  name: 'execute_code',
  description: 'Execute code in a sandboxed environment',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to execute' },
      language: { 
        type: 'string', 
        enum: ['python', 'javascript', 'typescript', 'java', 'csharp'],
        description: 'Programming language' 
      },
      timeout: { type: 'number', description: 'Timeout in seconds' },
    },
    required: ['code', 'language'],
  },
  executor: async ({ code, language, timeout = 300 }) => {
    const sandbox = await Sandbox.create({
      image: 'opensandbox/code-interpreter:v1.0.1',
      timeout,
    });
    
    const interpreter = await CodeInterpreter.create(sandbox);
    const result = await interpreter.codes.run(code, { language });
    
    await sandbox.kill();
    return result;
  },
  category: 'execution',
};
```

### run_command

```typescript
const runCommandTool: Tool = {
  name: 'run_command',
  description: 'Execute a shell command in a sandbox',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Command to execute' },
      timeout: { type: 'number', description: 'Timeout in seconds' },
    },
    required: ['command'],
  },
  executor: async ({ command, timeout = 60 }) => {
    const sandbox = await Sandbox.create({
      image: 'opensandbox/base:v1.0.0',
      timeout,
    });
    
    const result = await sandbox.commands.run(command);
    
    await sandbox.kill();
    return result;
  },
  category: 'execution',
  requiresApproval: true,
};
```

### browse_web

```typescript
const browseWebTool: Tool = {
  name: 'browse_web',
  description: 'Browse the web in a sandboxed browser',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to navigate to' },
      action: { 
        type: 'string',
        enum: ['navigate', 'screenshot', 'click', 'type'],
        description: 'Action to perform' 
      },
      selector: { type: 'string', description: 'CSS selector for click/type' },
      text: { type: 'string', description: 'Text to type' },
    },
    required: ['url', 'action'],
  },
  executor: async (params) => {
    const sandbox = await Sandbox.create({
      image: 'opensandbox/playwright:v1.0.0',
      timeout: 300,
    });
    
    // Use Playwright SDK
    const browser = await connectToBrowser(sandbox);
    const page = await browser.newPage();
    
    await page.goto(params.url);
    
    let result;
    switch (params.action) {
      case 'screenshot':
        result = await page.screenshot();
        break;
      case 'click':
        await page.click(params.selector);
        result = { success: true };
        break;
      case 'type':
        await page.type(params.selector, params.text);
        result = { success: true };
        break;
    }
    
    await sandbox.kill();
    return result;
  },
  category: 'browser',
};
```

---

## Comparison: OpenSandbox vs Building Custom

| Aspect | OpenSandbox | Build Custom |
|--------|-------------|--------------|
| **Time to market** | Days | Months |
| **Security** | Battle-tested (gVisor, Kata) | Need to implement |
| **Multi-language SDKs** | ✅ 5 languages | Need to build |
| **Kubernetes support** | ✅ Built-in | Need to build |
| **Examples** | ✅ 15+ examples | Need to create |
| **OpenClaw integration** | ✅ Already exists | Need to build |
| **Community** | ✅ Alibaba-backed | No |
| **License** | Apache 2.0 | N/A |

**Verdict:** Use OpenSandbox. Saves months of work.

---

## Roadmap Integration

### Update Phase 1 (Weeks 1-2)

**Add:**
- Install OpenSandbox server
- Integrate TypeScript SDK in Nexus
- Implement `execute_code` tool
- Implement `run_command` tool

### Update Phase 2 (Weeks 3-4)

**Add:**
- Deploy OpenSandbox on Kubernetes
- Implement sandbox per user isolation
- Add memory persistence in sandbox

### Update Phase 4 (Weeks 7-8)

**Add:**
- Browser automation with Playwright example
- Desktop agent with VNC example
- OpenClaw integration example

---

## Key Benefits for Aitlas

1. **Zero to One in Days** - Don't build execution layer from scratch
2. **Enterprise Security** - gVisor, Kata, Firecracker out of the box
3. **OpenClaw Integration** - Already exists, just use it
4. **Browser Automation** - Playwright + Chrome examples ready
5. **Multi-language** - TypeScript SDK fits Nexus perfectly
6. **Kubernetes Ready** - Production deployment path clear
7. **Apache 2.0** - No licensing concerns

---

## Next Steps

1. ✅ Clone OpenSandbox repo to `/Users/sergi/Projects/opensandbox-reference/`
2. Study `examples/openclaw/` integration
3. Study `sdks/sandbox/javascript/` TypeScript SDK
4. Study `examples/playwright/` for browser automation
5. Study `kubernetes/` for production deployment
6. Update Aitlas architecture doc with OpenSandbox integration
7. Start Phase 1 implementation

---

**Verdict:** OpenSandbox is the missing piece for Aitlas execution layer. Use it.