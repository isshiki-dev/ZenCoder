import { create } from 'zustand';
import { Conversation, Message } from '../types';
import DatabaseManager from '../utils/database';
import OpenCodeZenClient from '../api/openCodeZenClient';
import ToolExecutor from '../utils/toolExecutor';
import ToolRegistryManager from '../utils/toolRegistry';

interface ChatState {
  // Data
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  
  // Loading states
  isLoading: boolean;
  isExecutingTool: boolean;
  
  // Configuration
  openCodeZenApiKey: string;
  selectedModel: string;
  
  // Functions
  initializeApp: () => Promise<void>;
  createNewConversation: (title: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setApiKey: (apiKey: string) => void;
  setSelectedModel: (model: string) => void;
}

const useChatStore = create<ChatState>((set, get) => {
  // Initialize services
  let db: DatabaseManager;
  let openCodeZenClient: OpenCodeZenClient | null = null;
  let toolExecutor: ToolExecutor;
  let toolRegistry: ToolRegistryManager;

  return {
    // Initial state
    conversations: [],
    currentConversationId: null,
    messages: [],
    isLoading: false,
    isExecutingTool: false,
    openCodeZenApiKey: '',
    selectedModel: 'MiniMax M2.5 Free',
    
    // Initialize the application
    initializeApp: async () => {
      db = new DatabaseManager();
      toolRegistry = new ToolRegistryManager(db);
      toolExecutor = new ToolExecutor(db, toolRegistry);
      
      set({
        conversations: db.getConversations()
      });
    },
    
    // Create a new conversation
    createNewConversation: async (title: string) => {
      if (!db) {
        console.error('Database not initialized');
        return;
      }
      
      const conversation = db.createConversation(title);
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversationId: conversation.id,
        messages: []
      }));
    },
    
    // Select a conversation
    selectConversation: async (id: string) => {
      if (!db) {
        console.error('Database not initialized');
        return;
      }
      
      const messages = db.getMessagesByConversationId(id);
      set({
        currentConversationId: id,
        messages
      });
    },
    
    // Send a message
    sendMessage: async (content: string) => {
      const { currentConversationId, openCodeZenApiKey, selectedModel } = get();
      
      if (!currentConversationId) {
        console.error('No active conversation');
        return;
      }
      
      if (!openCodeZenApiKey) {
        console.error('OpenCode Zen API key not set');
        return;
      }
      
      // Initialize client if needed
      if (!openCodeZenClient) {
        openCodeZenClient = new OpenCodeZenClient({
          apiKey: openCodeZenApiKey,
          model: selectedModel
        });
      } else if (openCodeZenClient && openCodeZenClient.config.model !== selectedModel) {
        await openCodeZenClient.switchModel(selectedModel);
      }
      
      set({ isLoading: true });
      
      try {
        // Add user message to store and DB
        const userMessage: Omit<Message, 'timestamp'> = {
          id: crypto.randomUUID(),
          conversationId: currentConversationId,
          role: 'user',
          content
        };
        
        const newUserMessage = db.addMessage(userMessage);
        set((state) => ({
          messages: [...state.messages, newUserMessage]
        }));
        
        // Get all messages for context
        const allMessages = db.getMessagesByConversationId(currentConversationId);
        
        // Prepare tools for API
        const tools = toolRegistry.getAllTools().map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        }));
        
        // Send to OpenCode Zen API
        const result = await openCodeZenClient.sendMessage(
          allMessages,
          (chunk) => {
            // Handle streaming response here if needed
          },
          tools
        );
        
        // Process tool calls if any
        if (result.toolCalls) {
          for (const toolCall of result.toolCalls) {
            set({ isExecutingTool: true });
            
            const toolResult = await toolExecutor.executeTool(
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments)
            );
            
            // Add tool response to DB
            const toolResponseMessage: Omit<Message, 'timestamp'> = {
              id: crypto.randomUUID(),
              conversationId: currentConversationId,
              role: 'assistant',
              content: toolResult.success 
                ? `Tool ${toolCall.function.name} executed successfully: ${toolResult.output}`
                : `Tool ${toolCall.function.name} failed: ${toolResult.error}`,
              toolCalls: [toolCall],
              toolResponses: [{
                id: crypto.randomUUID(),
                toolCallId: toolCall.id,
                result: toolResult.output,
                error: toolResult.error
              }]
            };
            
            const newToolResponseMessage = db.addMessage(toolResponseMessage);
            set((state) => ({
              messages: [...state.messages, newToolResponseMessage]
            }));
            
            set({ isExecutingTool: false });
          }
          
          // Follow up with another API call to get final response after tool execution
          const updatedMessages = db.getMessagesByConversationId(currentConversationId);
          const finalResult = await openCodeZenClient.sendMessage(updatedMessages, undefined, tools);
          
          const assistantMessage: Omit<Message, 'timestamp'> = {
            id: crypto.randomUUID(),
            conversationId: currentConversationId,
            role: 'assistant',
            content: finalResult.content
          };
          
          const newAssistantMessage = db.addMessage(assistantMessage);
          set((state) => ({
            messages: [...state.messages, newAssistantMessage]
          }));
        } else {
          // Add assistant message to store and DB
          const assistantMessage: Omit<Message, 'timestamp'> = {
            id: crypto.randomUUID(),
            conversationId: currentConversationId,
            role: 'assistant',
            content: result.content
          };
          
          const newAssistantMessage = db.addMessage(assistantMessage);
          set((state) => ({
            messages: [...state.messages, newAssistantMessage]
          }));
        }
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Add error message to UI
        const errorMessage: Omit<Message, 'timestamp'> = {
          id: crypto.randomUUID(),
          conversationId: currentConversationId,
          role: 'assistant',
          content: `Error: ${(error as Error).message}`
        };
        
        const newErrorMessage = db.addMessage(errorMessage);
        set((state) => ({
          messages: [...state.messages, newErrorMessage]
        }));
      } finally {
        set({ isLoading: false });
      }
    },
    
    // Set API key
    setApiKey: (apiKey: string) => {
      set({ openCodeZenApiKey: apiKey });
      
      // Reinitialize client with new key if needed
      if (apiKey && !openCodeZenClient) {
        openCodeZenClient = new OpenCodeZenClient({
          apiKey,
          model: get().selectedModel
        });
      }
    },
    
    // Set selected model
    setSelectedModel: async (model: string) => {
      set({ selectedModel: model });
      
      if (openCodeZenClient) {
        await openCodeZenClient.switchModel(model);
      }
    }
  };
});

export default useChatStore;