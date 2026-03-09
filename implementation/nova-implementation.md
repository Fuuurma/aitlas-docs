# Nova Implementation Summary

**Product:** Nova - User Interface for Aitlas  
**Foundation:** Fork of Mission Control (builderz-labs/mission-control)  
**Stack:** React/Next.js + TypeScript

---

## Key Patterns Extracted

### 1. Chat-Centric Interface

From AutoGen Studio, crewAI Studio, and Pi:

```
┌─────────────────────────────────────────────────────────────┐
│                        Nova UI                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │  Sidebar    │  │          Main Chat Area             │  │
│  │  ───────    │  │                                     │  │
│  │  • Agents   │  │   [User] Run analysis on AAPL       │  │
│  │  • Actions  │  │                                     │  │
│  │  • History  │  │   [Agent] Running f.research...     │  │
│  │  • Credits  │  │   ████████████░░░░ Analyzing...     │  │
│  │             │  │                                     │  │
│  │             │  │   [Result] Analysis complete!       │  │
│  │             │  │   📊 View Report  📥 Export         │  │
│  └─────────────┘  └─────────────────────────────────────┘  │
│                        ┌─────────────────────────────┐      │
│                        │   Input: Ask anything...    │      │
│                        └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Agent Activation Panel

From Agency Agents + sanyuan-skills:

```typescript
// Agent Panel Component
interface AgentPanelProps {
  agent: Agent;
  onActivate: (agentId: string) => void;
  credits: number;
}

// Agent card in sidebar
<AgentCard>
  <Avatar src={agent.avatar} />
  <Name>{agent.name}</Name>
  <Specialty>{agent.specialty}</Specialty>
  <Credits>{agent.creditsPerUse} credits/use</Credits>
  <ActivateButton onClick={() => onActivate(agent.id)}>
    Activate
  </ActivateButton>
</AgentCard>
```

### 3. Real-Time Progress Streaming

From trigger.dev, Mastra:

```typescript
// SSE for real-time updates
const eventSource = new EventSource(`/api/runs/${runId}/stream`);

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch (update.type) {
    case 'progress':
      setProgress(update.progress);
      break;
    case 'tool_call':
      addToolCall(update.tool, update.args);
      break;
    case 'result':
      setFinalResult(update.result);
      break;
  }
};
```

### 4. Tool/Action Selection UI

From MCP Inspector patterns:

```typescript
// Tool selector component
<ToolSelector>
  {actions.map(action => (
    <ToolCard key={action.id} selected={selected === action.id}>
      <Icon>{action.icon}</Icon>
      <Name>{action.name}</Name>
      <Description>{action.description}</Description>
      <Credits>{action.credits}</Credits>
    </ToolCard>
  ))}
</ToolSelector>
```

### 5. Credit Display

Unique to Aitlas:

```typescript
// Credit balance component
<CreditDisplay>
  <Balance>
    <Icon>💰</Icon>
    <Amount>{user.credits}</Amount>
    <Label>credits</Label>
  </Balance>
  <BuyCredits>Buy More</BuyCredits>
</CreditDisplay>
```

---

## Recommended Approach

### Phase 1: Core Chat Interface

```typescript
// src/components/Chat.tsx
export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  
  return (
    <div className="flex h-screen">
      <Sidebar>
        <AgentList onSelect={setActiveAgent} />
        <ActionList />
        <CreditBalance />
      </Sidebar>
      
      <Main>
        <MessageList messages={messages} />
        <ChatInput 
          onSend={handleSend}
          activeAgent={activeAgent}
        />
      </Main>
    </div>
  );
}
```

### Phase 2: Agent Selection

```typescript
// src/components/AgentList.tsx
export function AgentList({ onSelect }) {
  const { data: agents } = useAgents(); // From Agents Store
  
  return (
    <div className="space-y-2">
      {agents.map(agent => (
        <AgentCard 
          key={agent.id}
          agent={agent}
          onClick={() => onSelect(agent)}
        />
      ))}
    </div>
  );
}
```

### Phase 3: Action Integration

```typescript
// src/components/ActionSelector.tsx
export function ActionSelector({ onSelect }) {
  const { data: actions } = useActions(); // From f.xyz
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {actions.map(action => (
        <ActionCard 
          key={action.id}
          action={action}
          onClick={() => onSelect(action)}
        />
      ))}
    </div>
  );
}
```

---

## UI Components

### From Research: Essential Components

| Component | Source | Description |
|-----------|--------|-------------|
| `ChatWindow` | AutoGen Studio | Main conversation area |
| `MessageBubble` | crewAI Studio | User/agent messages |
| `ToolCallDisplay` | Mastra | Show tool execution |
| `ProgressBar` | trigger.dev | Real-time progress |
| `AgentCard` | Agency Agents | Agent selection |
| `CreditDisplay` | Aitlas unique | Credit balance |
| `Sidebar` | Pi TUI | Navigation |
| `SettingsPanel` | MCP Inspector | Configuration |

### Component Hierarchy

```
Nova/
├── Layout/
│   ├── Sidebar.tsx
│   ├── Main.tsx
│   └── Header.tsx
├── Chat/
│   ├── ChatWindow.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   └── ChatInput.tsx
├── Agent/
│   ├── AgentList.tsx
│   ├── AgentCard.tsx
│   └── AgentDetail.tsx
├── Action/
│   ├── ActionList.tsx
│   ├── ActionCard.tsx
│   └── ActionResult.tsx
├── Credits/
│   ├── CreditDisplay.tsx
│   ├── CreditPurchase.tsx
│   └── CreditHistory.tsx
└── Common/
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    └── Modal.tsx
```

---

## Integration Points

### With Nexus Runtime

```typescript
// API call to Nexus runtime
async function executeAgent(agentId: string, prompt: string) {
  const response = await fetch('/api/nexus/execute', {
    method: 'POST',
    body: JSON.stringify({ agentId, prompt }),
  });
  
  return response.json(); // Returns runId for SSE streaming
}
```

### With Agents Store

```typescript
// Fetch agents from store
const { data: agents } = useQuery({
  queryKey: ['agents'],
  queryFn: () => fetch('/api/agents/store').then(r => r.json()),
});
```

### With Actions (f.xyz)

```typescript
// Execute action via Nexus
async function executeAction(actionId: string, params: any) {
  const response = await fetch(`/api/actions/${actionId}/execute`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  
  return response.json();
}
```

---

## State Management

From AutoGen patterns:

```typescript
// Zustand store for Nova
interface NovaStore {
  // Agent state
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent) => void;
  
  // Chat state
  messages: Message[];
  addMessage: (message: Message) => void;
  
  // Action state
  selectedAction: Action | null;
  setSelectedAction: (action: Action) => void;
  
  // Credit state
  credits: number;
  deductCredits: (amount: number) => void;
}
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| React + TypeScript | Same stack as Mission Control, Mastra |
| SSE for streaming | Real-time updates from Nexus |
| Zustand for state | Lightweight, fast |
| Tailwind CSS | Rapid styling |
| Shadcn/ui components | Production-ready |

---

## Next Steps

1. **Fork Mission Control** - Clone and customize
2. **Build core components** - Chat, AgentList, ActionList
3. **Connect to Nexus** - API integration
4. **Add credit system** - Unique Aitlas feature
5. **Polish UX** - Match design system

---

*Implementation Status: 🔵 Ready for development*