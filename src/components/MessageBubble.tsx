import React from 'react';
import { Check, CheckCheck, AlertCircle, Clock } from 'lucide-react';
import type { Message } from '../types/api';

interface MessageBubbleProps {
  message: Message;
  primaryColor?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, primaryColor = '#0066CC' }) => {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(timestamp);
  };

  // Get status icon for user messages
  const getStatusIcon = () => {
    if (!isUser) return null;

    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        paddingLeft: '12px',
        paddingRight: '12px',
        marginBottom: '10px'
      }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '75%'
        }}
      >
        {/* Avatar and message row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            flexDirection: isUser ? 'row-reverse' : 'row'
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '600',
              flexShrink: 0,
              backgroundColor: isUser ? primaryColor : '#E5E7EB',
              border: 'none',
              boxShadow: 'none'
            }}
          >
            {isUser ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            ) : (
              <span style={{ color: '#6B7280' }}>AI</span>
            )}
          </div>

          {/* Message bubble */}
          <div
            className={`relative ${
              message.isTyping ? 'animate-pulse' : ''
            } ${message.status === 'error' ? 'border border-red-200' : ''}`}
            style={{
              backgroundColor: isUser ? primaryColor : '#f3f4f6',
              color: isUser ? 'white' : '#1f2937',
              borderRadius: '16px',
              border: 'none',
              maxWidth: '280px',
              minWidth: '60px',
              boxShadow: 'none',
              padding: '5px 12px'
            }}
          >
            {/* Message content */}
            <p className="text-sm whitespace-pre-wrap break-words" style={{
              textAlign: isUser ? 'left' : 'left',
              marginLeft: isUser ? '0' : '0',
              marginRight: isUser ? '0' : '0',
              lineHeight: '1.4',
              margin: 0
            }}>
              {message.content}
            </p>

            {/* Typing indicator inside message for streaming */}
            {message.isTyping && (
              <div className="flex items-center mt-2 space-x-1">
                <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>

        </div>

        {/* Message metadata */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '4px',
            gap: '6px',
            justifyContent: 'flex-start',
            marginLeft: '40px',
            marginRight: '40px',
            paddingLeft: '12px',
            paddingRight: '0'
          }}>
          {/* Timestamp */}
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
            {formatTime(message.timestamp)}
          </span>

          {/* Status icon for user messages - hide for now */}
          {/* {getStatusIcon()} */}

          {/* Error retry option */}
          {message.status === 'error' && isUser && (
            <button
              className="text-xs text-red-600 hover:text-red-800 underline ml-1 transition-colors"
              onClick={() => {
                // TODO: Implement retry functionality
                console.log('Retry message:', message.id);
              }}
            >
              Retry
            </button>
          )}
        </div>

        {/* Confidence score for assistant messages (debug mode) */}
        {isAssistant && import.meta.env.DEV && (
          <div className="text-xs text-gray-400 mt-1">
            {/* TODO: Add confidence score from API response */}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;