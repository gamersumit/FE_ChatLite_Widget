import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ChatState, WidgetState, WidgetConfig, WidgetSettings } from '../types/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  chatState: ChatState;
  widgetState: WidgetState;
  config: WidgetConfig | null;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  settings: WidgetSettings;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatState,
  widgetState,
  config,
  onSendMessage,
  onClose,
  settings,
}) => {
  console.log('🎨 CHATWINDOW CURRENT SETTINGS:', settings);

  // Force re-render when settings change
  useEffect(() => {
    console.log('🔄 CHATWINDOW SETTINGS CHANGED:', settings);
  }, [settings]);

  // Ensure consistent layout on mount and state changes
  useEffect(() => {
    const isEmbedded = new URLSearchParams(window.location.search).get('mode') === 'embedded';
    if (isEmbedded) {
      // Force layout recalculation
      document.body.style.height = '100vh';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    }
  }, [widgetState.isOpen]);

  // For embedded mode, fill entire container. For standalone, use responsive dimensions
  const isEmbedded = new URLSearchParams(window.location.search).get('mode') === 'embedded';

  const windowHeight = isEmbedded
    ? 'h-full'
    : widgetState.isMinimized
    ? 'h-12'
    : 'h-[50vh] sm:h-80 md:h-[400px] max-h-[500px]';

  const windowWidth = isEmbedded
    ? 'w-full'
    : 'w-[90vw] sm:w-72 md:w-80 lg:w-[340px] max-w-[360px]';

  return (
    <div
      className={`chat-window ${windowWidth} ${windowHeight} flex flex-col bg-white ${
        isEmbedded ? '' : 'transition-all duration-300 animate-slide-up rounded-xl shadow-lg border border-gray-200'
      }`}
      style={{
        margin: isEmbedded ? 0 : undefined,
        padding: isEmbedded ? 0 : undefined,
        boxShadow: isEmbedded ? 'none' : undefined,
        borderRadius: isEmbedded ? 0 : '12px',
        position: isEmbedded ? 'absolute' : undefined,
        top: isEmbedded ? 0 : undefined,
        left: isEmbedded ? 0 : undefined,
        right: isEmbedded ? 0 : undefined,
        bottom: isEmbedded ? 0 : undefined,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-gray-200 relative"
        style={{
          backgroundColor: settings.primaryColor,
          backdropFilter: 'blur(10px)',
          padding: '14px 16px',
          minHeight: '68px',
          borderTopLeftRadius: isEmbedded ? '0' : '12px',
          borderTopRightRadius: isEmbedded ? '0' : '12px'
        }}
      >
        <div className="flex items-center" style={{ gap: '12px' }}>
          {/* Avatar/Logo */}
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <div className="w-5 h-5 bg-white rounded-full"></div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-white font-semibold text-sm leading-tight mb-1">
              {config?.config.company_name || settings.title || 'Chat Support'}
            </h3>

            {/* Status line */}
            <div className="flex items-center text-xs text-white/90" style={{ gap: '6px' }}>
              {widgetState.isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Online now</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {/* Close button only */}
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/20 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Chat content (hidden when minimized) */}
      {!widgetState.isMinimized && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0
          }}
        >
          {/* Error state */}
          {widgetState.hasError && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-red-600 text-sm">
                {widgetState.errorMessage || 'Something went wrong. Please try again.'}
              </p>
            </div>
          )}

          {/* Loading state */}
          {widgetState.isLoading && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading...</p>
              </div>
            </div>
          )}

          {/* Chat interface */}
          {!widgetState.isLoading && (
            <>
              {/* Messages */}
              <MessageList
                messages={chatState.messages}
                isTyping={chatState.isTyping}
                isConnected={widgetState.isConnected}
                primaryColor={settings.primaryColor}
              />

              {/* Message input */}
              <MessageInput
                onSendMessage={onSendMessage}
                disabled={widgetState.isLoading || !widgetState.isConnected}
                placeholder={settings.placeholder || 'Type your message...'}
                isTyping={chatState.isTyping}
                primaryColor={settings.primaryColor}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;