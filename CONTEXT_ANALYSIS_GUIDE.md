# Context Analysis System Guide

## Overview

The Context Analysis System leverages Gemini to help compile salient facts and manage context length for the My Pocket Sister AI companion platform. This system ensures that the AI maintains continuity while operating within token limits.

## Key Components

### 1. Context Analyzer (`server/context-analyzer.ts`)

The Context Analyzer is a specialized system that communicates with Gemini as the **APPLICATION**, not as a child user. It has two main functions:

#### Fact Extraction
- Analyzes conversations between the AI companion and children
- Identifies salient facts that should be stored for future reference
- Uses Gemini's function calling to save important information
- Categories: personal, interest, relationship, achievement, preference, concern

#### Context Length Management
- Monitors current context size and token usage
- Estimates percentage of context window used
- Recommends optimization when approaching limits (75% threshold)
- Suggests context spawning when critical (85% threshold)

### 2. System Instructions

The Context Analyzer uses clear system instructions that identify it as an internal system component:

```
IMPORTANT: You are NOT talking to a child. You are an internal system component 
helping the application manage conversation context and memory.
```

This ensures Gemini understands it's communicating with the application infrastructure, not the end user.

### 3. Integration with Gemini Chat

The Context Analyzer is integrated into the main Gemini chat flow:

1. **After each conversation**, the system:
   - Extracts salient facts from the interaction
   - Checks context length status
   - Stores important information for future reference
   - Provides optimization recommendations

2. **Context Length Monitoring**:
   - Estimates current token usage
   - Calculates percentage of context window used
   - Determines if optimization or new context spawning is needed

## API Endpoints

### Context Management Routes (`/api/context/`)

1. **POST /api/context/check-length**
   - Checks current context length for a child
   - Returns token estimates and optimization recommendations

2. **POST /api/context/analyze-conversation**
   - Analyzes a conversation to extract salient facts
   - Automatically stores important information

3. **POST /api/context/optimize**
   - Optimizes context for a specific child
   - Provides recommendations for context management

4. **GET /api/context/status/:childId**
   - Returns current context status for monitoring
   - Shows optimization and spawning recommendations

## Salient Fact Extraction

The system identifies and stores important facts with:

- **Content**: The actual fact to remember
- **Importance Score**: 0.1-1.0 rating for prioritization
- **Memory Type**: personal, interest, relationship, achievement, preference, concern
- **Related Topics**: Keywords for future search and retrieval

### Importance Scoring Guidelines

- **0.9-1.0**: Critical facts (pet names, major life events, core interests)
- **0.7-0.8**: Important details (preferences, achievements, ongoing activities)
- **0.5-0.6**: Useful context (casual mentions, temporary interests)
- **0.3-0.4**: Minor details (one-time events, passing comments)

## Context Length Management

### Token Limits and Thresholds

- **Gemini 1.5 Flash**: ~1M token context window
- **Warning Threshold**: 85% (should spawn new context)
- **Optimization Threshold**: 75% (should compress/optimize)
- **Operational Limit**: ~30,000 tokens (space for new messages)

### Optimization Process

1. **Monitor**: Continuously track context size
2. **Analyze**: Estimate token usage and percentage
3. **Recommend**: Suggest optimization or new context creation
4. **Optimize**: Compress or prioritize existing context
5. **Spawn**: Create new context when necessary

## Example Workflow

### Conversation Analysis

```typescript
// After each conversation
const analysisResult = await contextAnalyzer.analyzeConversation(
  childId,
  userMessage,
  aiResponse,
  contextData
);

console.log(`Context analysis: ${analysisResult.factsExtracted} facts extracted`);

if (analysisResult.shouldOptimize) {
  console.log('Context optimization recommended');
}
```

### Context Length Check

```typescript
// Periodic context monitoring
const contextStatus = await contextAnalyzer.checkContextLength(contextData);

if (contextStatus.shouldSpawn) {
  // Create new optimized context
  await contextOptimizer.createOptimizedNewContext(childId, contextData);
}
```

## Benefits

1. **Intelligent Memory Management**: Automatically identifies and stores important facts
2. **Context Optimization**: Prevents token limit issues through proactive monitoring
3. **Application-Level Communication**: Clear separation between system operations and user interactions
4. **Scalable Architecture**: Supports long-term conversations without degradation
5. **Performance Monitoring**: Tracks context usage and optimization effectiveness

## Integration Points

- **Gemini Chat Manager**: Integrated into main conversation flow
- **Storage System**: Automatically saves extracted facts to database
- **Context Manager**: Works with existing context management system
- **API Routes**: Provides endpoints for monitoring and manual optimization

This system ensures that the AI companion maintains rich, personalized context while operating efficiently within Gemini's token limits.