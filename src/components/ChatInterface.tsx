import React, { useState, useEffect, useRef } from 'react';
import useChatStore from '../stores/chatStore';
import { Message } from '../types';

const ChatInterface: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    isExecutingTool,
    openCodeZenApiKey,
    selectedModel,
    initializeApp,
    createNewConversation,
    selectConversation,
    sendMessage,
    setApiKey,
    setSelectedModel
  } = useChatStore();
  
  const [inputValue, setInputValue] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(openCodeZenApiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      await sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleCreateNewConversation = async () => {
    const title = `Conversation ${conversations.length + 1}`;
    await createNewConversation(title);
  };

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
  };

  const renderMessageContent = (message: Message) => {
    if (message.toolResponses && message.toolResponses.length > 0) {
      return (
        <div className="tool-response">
          <div className="tool-call-info">
            {message.toolCalls?.map(tc => (
              <div key={tc.id} className="tool-call-name">Tool: {tc.name}</div>
            ))}
          </div>
          <div className="tool-result">
            {message.toolResponses.map(tr => (
              <div key={tr.id}>
                {tr.error ? (
                  <span className="error">Error: {tr.error}</span>
                ) : (
                  <pre>{tr.result}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return <div className="message-content">{message.content}</div>;
  };

  return (
    <div className="chat-interface">
      <div className="sidebar">
        <button onClick={handleCreateNewConversation} className="new-conversation-btn">
          New Conversation
        </button>
        <div className="conversations-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv.id)}
            >
              {conv.title}
            </div>
          ))}
        </div>
        
        <div className="api-key-section">
          <h3>API Key</h3>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter OpenCode Zen API key"
          />
          <button onClick={handleSaveApiKey}>Save</button>
        </div>
        
        <div className="model-selector">
          <h3>Model</h3>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="MiniMax M2.5 Free">MiniMax M2.5 Free</option>
            <option value="Kimi K2.5 Free">Kimi K2.5 Free</option>
            <option value="Big Pickle">Big Pickle</option>
          </select>
        </div>
      </div>
      
      <div className="chat-area">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h2>Welcome to Zen AI Agent Platform</h2>
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.role}`}
              >
                <div className="message-header">
                  <strong>{message.role.charAt(0).toUpperCase() + message.role.slice(1)}</strong>
                  <span className="timestamp">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="message-body">
                  {renderMessageContent(message)}
                </div>
              </div>
            ))
          )}
          {(isLoading || isExecutingTool) && (
            <div className="loading-indicator">
              {isExecutingTool ? 'Executing tool...' : 'Thinking...'}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !inputValue.trim()}>
            Send
          </button>
        </form>
      </div>
      
      <style jsx>{`
        .chat-interface {
          display: flex;
          height: 100vh;
          font-family: Arial, sans-serif;
        }
        
        .sidebar {
          width: 250px;
          background-color: #f5f5f5;
          padding: 20px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #ddd;
        }
        
        .new-conversation-btn {
          width: 100%;
          padding: 10px;
          margin-bottom: 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .conversations-list {
          flex-grow: 1;
          overflow-y: auto;
          margin-bottom: 20px;
        }
        
        .conversation-item {
          padding: 8px;
          margin-bottom: 5px;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .conversation-item:hover {
          background-color: #e9ecef;
        }
        
        .conversation-item.active {
          background-color: #007bff;
          color: white;
        }
        
        .api-key-section, .model-selector {
          margin-top: auto;
        }
        
        .api-key-section h3, .model-selector h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        .api-key-section input {
          width: 100%;
          padding: 5px;
          margin-bottom: 5px;
          box-sizing: border-box;
        }
        
        .chat-area {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        
        .messages-container {
          flex-grow: 1;
          overflow-y: auto;
          padding: 20px;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: #6c757d;
        }
        
        .message {
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 8px;
          max-width: 80%;
        }
        
        .message.user {
          background-color: #e3f2fd;
          margin-left: auto;
        }
        
        .message.assistant {
          background-color: #f5f5f5;
        }
        
        .message.system {
          background-color: #fff3e0;
          font-size: 0.8em;
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 0.9em;
        }
        
        .timestamp {
          color: #6c757d;
        }
        
        .tool-response {
          border-left: 3px solid #007bff;
          padding-left: 10px;
        }
        
        .tool-call-name {
          font-weight: bold;
          color: #007bff;
        }
        
        .tool-result pre {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          margin-top: 5px;
        }
        
        .error {
          color: #dc3545;
        }
        
        .loading-indicator {
          padding: 10px;
          color: #6c757d;
          font-style: italic;
        }
        
        .input-form {
          padding: 20px;
          border-top: 1px solid #ddd;
          display: flex;
        }
        
        .input-form input {
          flex-grow: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px 0 0 4px;
        }
        
        .input-form button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
        }
        
        .input-form button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;