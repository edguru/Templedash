# Multi-Task Handling Examples

## How Our System Handles Complex Prompts with Multiple Tasks

### Example 1: Simple Multi-Task Request
**User Input:** "Check my CAMP balance and then send 10 tokens to 0x123..."

**System Processing:**
1. **CompanionHandler** detects multiple tasks via conjunctions and task keywords
2. **PromptEngineer** segments prompt into:
   - Task 1: "Check my CAMP balance" → `balance_check`
   - Task 2: "send 10 tokens to 0x123" → `token_transfer`
3. **TaskOrchestrator** creates sequential execution (balance check before transfer)
4. **Execution:** Balance check first, then transfer (dependency-aware)

### Example 2: Parallel Multi-Task Request  
**User Input:** "Check my balance and also show me the current gas price"

**System Processing:**
1. **PromptEngineer** identifies two independent read operations
2. **Execution Order:** `parallel` (both are read-only operations)
3. **Result:** Both tasks execute simultaneously for faster response

### Example 3: Complex Dependency Chain
**User Input:** "Deploy a new NFT contract, mint 5 tokens, and list them on the marketplace"

**System Processing:**
1. **Task Segmentation:**
   - Task 1: "Deploy a new NFT contract" → `contract_deployment`
   - Task 2: "mint 5 tokens" → `nft_operations` 
   - Task 3: "list them on the marketplace" → `marketplace_operations`

2. **Dependency Analysis:**
   - Task 2 depends on Task 1 (need contract address)
   - Task 3 depends on Task 2 (need token IDs)

3. **Execution:** Sequential with automatic parameter passing between tasks

### Example 4: Mixed Execution Strategy
**User Input:** "Check my CAMP and ETH balances, then deploy a contract and mint an NFT"

**System Processing:**
1. **Parallel Phase:** Balance checks execute simultaneously
2. **Sequential Phase:** Contract deployment followed by NFT minting
3. **Execution Order:** `mixed`

## Key Features

### 1. Intelligent Task Segmentation
- Analyzes conjunctions: "and", "then", "also", "after that"
- Identifies multiple task keywords in single prompt
- Preserves context and parameters across task boundaries

### 2. Dependency Detection
- Logical dependencies: balance checks before transfers
- Technical dependencies: contract deployment before interaction
- Resource dependencies: shared gas requirements

### 3. Execution Strategies
- **Parallel:** Independent read operations
- **Sequential:** Dependent operations with data flow
- **Mixed:** Combination based on dependency graph

### 4. Error Handling
- Failed tasks don't block independent tasks
- Dependency failures stop dependent task chain
- Comprehensive error reporting with recovery suggestions

### 5. Performance Optimization
- Parallel execution where possible
- Intelligent batching of similar operations
- Resource sharing across related tasks

## Message Flow

```
User: "Check balance and send tokens"
    ↓
CompanionHandler (detects multi-task)
    ↓
PromptEngineer (analyzes and segments)
    ↓
TaskOrchestrator (creates execution plan)
    ↓
GoatMCP/NebulaMCP (executes individual tasks)
    ↓
CompanionHandler (aggregates results)
    ↓
User receives comprehensive response
```

## Benefits

1. **Natural Language Processing:** Users can express complex workflows naturally
2. **Efficiency:** Parallel execution where possible reduces total time
3. **Safety:** Dependency analysis prevents logical errors
4. **Transparency:** Clear feedback on multi-step operations
5. **Scalability:** System handles 2-10 tasks in single prompt effectively