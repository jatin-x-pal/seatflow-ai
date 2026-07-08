# AI Prompts & NLP Capabilities

SeatFlow AI uses an embedded Natural Language Interface (NLI) driven by OpenAI's language models. 
The AI assistant endpoint is available under: `POST /api/v1/ai/query`

## Purpose

The AI assistant serves as a smart interface for the organizational data. Instead of digging through multiple tabular directories or filtering UI dropdowns, users can simply type questions regarding seating arrangements, project configurations, and employee locations.

## Base System Prompt Instruction Context

*This is the conceptual prompt sent directly to the model on the backend:*

> "You are an enterprise workspace management assistant named SeatFlow AI. 
> A user requested: '{user_query}'
> 
> You have access to information regarding Seat Allocations, Current Projects, and Employee Statuses. Provide a helpful, professional, and concise text response."

*(Note: In a true production environment, LangChain or OpenAI function calling / RAG would be layered here to perform SQL queries dynamically against the `Dependency` injected database).*

## Supported Query Examples

1. **Employee Search:**
   - *"Where does the employee named Alex sit?"*
   - *"Which department is Sarah in?"*

2. **Workspace Availability:**
   - *"How many available seats are currently on Floor 3?"*
   - *"Is seat 2-045 occupied?"*

3. **Project Mapping:**
   - *"Who is the manager for the Apollo project?"*
   - *"List all employees working on Project Beta."*

4. **Strategic Insights:**
   - *"What is our current overall seat utilization?"*
   - *"Which department has the most employees?"*

## Future Enhancements
During frontend integration, we will be streaming these responses directly into an AI chat overlay interface in the dashboard.
