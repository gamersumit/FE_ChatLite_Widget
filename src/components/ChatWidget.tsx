import React, { useEffect } from 'react';
import { useWidget } from '../hooks/useWidget';
import type { WidgetSettings } from '../types/api';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';

interface ChatWidgetProps {
  settings: WidgetSettings;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ settings }) => {
  const {
    widgetState,
    chatState,
    config,
    sendMessage,
    toggleWidget,
  } = useWidget(settings);

  // Set CSS custom properties for theming
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--widget-primary', settings.primaryColor);
  }, [settings.primaryColor]);

  // Don't render if widget failed to initialize
  if (widgetState.hasError && !config) {
    console.error('Widget failed to initialize:', widgetState.errorMessage);
    return null;
  }

  // Check if we're in embedded mode
  const isEmbedded = new URLSearchParams(window.location.search).get('mode') === 'embedded';
  const positionClass = `widget-position-${settings.position}`;

  return (
    <div className={`widget-root ${!isEmbedded ? positionClass : ''}`}>
      {/* Chat Button - Only show when chat is closed */}
      {!widgetState.isOpen && (
        <ChatButton
          isOpen={widgetState.isOpen}
          isLoading={widgetState.isLoading}
          hasUnreadMessages={false} // TODO: Implement unread message tracking
          primaryColor={settings.primaryColor}
          size={settings.size}
          borderRadius={settings.borderRadius}
          fontFamily={settings.fontFamily}
          position={settings.position}
          onClick={toggleWidget}
        />
      )}

      {/* Chat Window - Only shown when open */}
      {widgetState.isOpen && (
        <ChatWindow
          chatState={chatState}
          widgetState={widgetState}
          config={config}
          onSendMessage={sendMessage}
          onClose={toggleWidget}
          settings={settings}
        />
      )}
    </div>
  );
};

export default ChatWidget;