import Database from 'better-sqlite3';
import { Conversation, Message, ToolExecutionResult } from '../types';

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    this.db = new Database('./zen_ai_agent.db');

    // Create tables if they don't exist
    this.initTables();
  }

  private initTables(): void {
    // Conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        tool_calls TEXT,
        tool_responses TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      )
    `);

    // Tools table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tools (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        definition TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Execution logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id TEXT PRIMARY KEY,
        tool_name TEXT NOT NULL,
        arguments TEXT,
        result TEXT,
        error TEXT,
        execution_time REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Conversation methods
  createConversation(title: string): Conversation {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO conversations (id, title) VALUES (?, ?)
    `);
    stmt.run(id, title);

    return {
      id,
      title,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  getConversations(): Conversation[] {
    const stmt = this.db.prepare(`
      SELECT id, title, created_at as createdAt, updated_at as updatedAt
      FROM conversations
      ORDER BY updated_at DESC
    `);
    return stmt.all() as Conversation[];
  }

  getConversationById(id: string): Conversation | undefined {
    const stmt = this.db.prepare(`
      SELECT id, title, created_at as createdAt, updated_at as updatedAt
      FROM conversations
      WHERE id = ?
    `);
    return stmt.get(id) as Conversation;
  }

  // Message methods
  addMessage(message: Omit<Message, 'timestamp'>): Message {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO messages (
        id, 
        conversation_id, 
        role, 
        content,
        tool_calls,
        tool_responses
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      message.conversationId,
      message.role,
      message.content,
      message.toolCalls ? JSON.stringify(message.toolCalls) : null,
      message.toolResponses ? JSON.stringify(message.toolResponses) : null
    );

    return {
      ...message,
      id,
      timestamp: new Date()
    } as Message;
  }

  getMessagesByConversationId(conversationId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT 
        id, 
        conversation_id as conversationId, 
        role, 
        content, 
        timestamp,
        tool_calls as toolCalls,
        tool_responses as toolResponses
      FROM messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
    `);
    
    const rows = stmt.all(conversationId) as any[];
    
    return rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      toolCalls: row.toolCalls ? JSON.parse(row.toolCalls) : undefined,
      toolResponses: row.toolResponses ? JSON.parse(row.toolResponses) : undefined
    }));
  }

  // Tool methods
  registerTool(name: string, description: string, definition: any): void {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tools (id, name, description, definition)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, name, description, JSON.stringify(definition));
  }

  getToolByName(name: string): any {
    const stmt = this.db.prepare(`
      SELECT definition FROM tools WHERE name = ?
    `);
    const row: any = stmt.get(name);
    return row ? JSON.parse(row.definition) : null;
  }

  getAllTools(): any[] {
    const stmt = this.db.prepare(`
      SELECT name, description, definition FROM tools
    `);
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      name: row.name,
      description: row.description,
      definition: JSON.parse(row.definition)
    }));
  }

  // Execution log methods
  logToolExecution(toolName: string, argumentsData: any, result: ToolExecutionResult): void {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO execution_logs (
        id,
        tool_name,
        arguments,
        result,
        error,
        execution_time
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      toolName,
      JSON.stringify(argumentsData),
      result.success ? JSON.stringify(result.output) : null,
      result.error || null,
      result.executionTime
    );
  }

  getExecutionLogs(limit: number = 50): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        tool_name as toolName,
        arguments,
        result,
        error,
        execution_time as executionTime,
        created_at as createdAt
      FROM execution_logs
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    const rows = stmt.all(limit) as any[];
    
    return rows.map(row => ({
      ...row,
      arguments: JSON.parse(row.arguments),
      result: row.result ? JSON.parse(row.result) : null,
      createdAt: new Date(row.createdAt)
    }));
  }

  close(): void {
    this.db.close();
  }
}

export default DatabaseManager;