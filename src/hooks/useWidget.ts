import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../services/api';
import type { 
  WidgetSettings, 
  WidgetState, 
  ChatState, 
  Message, 
  WidgetConfig 
} from '../types/api';

export function useWidget(settings: WidgetSettings) {
  // Widget state
  const [widgetState, setWidgetState] = useState<WidgetState>({
    isOpen: false, // Default closed
    isMinimized: false,
    isLoading: true,
    isConnected: false,
    hasError: false,
  });

  // Chat state
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
  });

  // Widget configuration
  const [config, setConfig] = useState<WidgetConfig | null>(null);

  // Services
  const [apiService] = useState(() => {
    console.log('🔗 Creating ApiService with URL:', settings.apiUrl);
    return new ApiService(settings.apiUrl);
  });

  /**
   * Initialize the widget
   */
  const initializeWidget = useCallback(async () => {
    try {
      setWidgetState(prev => ({ ...prev, isLoading: true, hasError: false }));

      // Check if we're in embedded mode
      const isEmbedded = new URLSearchParams(window.location.search).get('mode') === 'embedded';

      if (isEmbedded) {
        console.log('🔥 USEHOOK: EMBEDDED MODE - SKIP BACKEND CONFIG');

        // Check verification status from settings
        const isVerified = (settings as any)._isVerified;
        const isActive = (settings as any)._isActive;
        const isOnline = isVerified && isActive;

        console.log('🔐 VERIFICATION STATUS IN HOOK:', { isVerified, isActive, isOnline });

        // For embedded mode, skip backend API and wait for postMessage config
        let visitorId = localStorage.getItem('litechat_visitor_id');
        if (!visitorId) {
          visitorId = `visitor_${Math.random().toString(36).substr(2, 16)}`;
          localStorage.setItem('litechat_visitor_id', visitorId);
        }

        setChatState(prev => ({ ...prev, visitorId }));
        setWidgetState(prev => ({
          ...prev,
          isLoading: false,
          isConnected: isOnline
        }));
        return;
      }

      // Get widget configuration (only for standalone mode)
      const widgetConfig = await apiService.getWidgetConfig(settings.widgetId);
      
      // Generate visitor ID for session tracking
      let visitorId = localStorage.getItem('litechat_visitor_id');
      if (!visitorId) {
        visitorId = `visitor_${Math.random().toString(36).substr(2, 16)}`;
        localStorage.setItem('litechat_visitor_id', visitorId);
      }

      setConfig(widgetConfig);
      setChatState(prev => ({ ...prev, visitorId }));

      // Add welcome message if provided
      const welcomeText = widgetConfig.config?.welcome_message || settings.welcomeMessage;
      if (welcomeText) {
        const welcomeMessage: Message = {
          id: 'welcome',
          content: welcomeText,
          type: 'assistant',
          timestamp: new Date(),
          status: 'delivered',
        };
        setChatState(prev => ({
          ...prev,
          messages: [welcomeMessage]
        }));
      }

      setWidgetState(prev => ({ 
        ...prev, 
        isLoading: false,
        isConnected: true 
      }));

    } catch (error) {
      console.error('Failed to initialize widget:', error);
      setWidgetState(prev => ({ 
        ...prev, 
        isLoading: false, 
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Failed to initialize widget'
      }));
    }
  }, [apiService, settings.widgetId]);

  // Update welcome message when settings change (for embedded mode)
  useEffect(() => {
    console.log('🔄 WELCOME MESSAGE EFFECT TRIGGERED:', settings.welcomeMessage);

    // Check if widget is offline (for embedded mode)
    const isVerified = (settings as any)._isVerified;
    const isActive = (settings as any)._isActive;
    const isOffline = isVerified === false || isActive === false;

    // Use offline message if widget is not verified/active
    const messageContent = isOffline
      ? (settings as any).offlineMessage || "We're currently offline. Please try again later."
      : settings.welcomeMessage;

    if (messageContent) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: messageContent,
        type: 'assistant',
        timestamp: new Date(),
        status: 'delivered',
      };

      console.log('💬 CREATING WELCOME/OFFLINE MESSAGE:', welcomeMessage, 'isOffline:', isOffline);

      setChatState(prev => {
        // Replace existing welcome message or add new one
        const nonWelcomeMessages = prev.messages.filter(msg => msg.id !== 'welcome');
        const newMessages = [welcomeMessage, ...nonWelcomeMessages];
        console.log('📝 SETTING NEW MESSAGES:', newMessages);
        return {
          ...prev,
          messages: newMessages
        };
      });
    }
  }, [settings.welcomeMessage]);

  // Socket functionality removed - using HTTP API only

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!chatState.visitorId || !content.trim()) return;

    // Check if we're in embedded mode
    const isEmbedded = new URLSearchParams(window.location.search).get('mode') === 'embedded';

    // For standalone mode, we need config. For embedded mode, we can proceed without config
    if (!isEmbedded && !config) {
      console.warn('No config available for standalone mode');
      return;
    }

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      type: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setChatState(prev => ({ 
      ...prev, 
      messages: [...prev.messages, userMessage],
      isTyping: true,
    }));

    try {
      // Create session if we don't have one
      let currentSessionId = chatState.sessionId;
      if (!currentSessionId) {
        const sessionResponse = await apiService.createSession(settings.widgetId, {
          visitor_id: chatState.visitorId!,
          page_url: window.location.href,
          page_title: document.title,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
        });
        currentSessionId = sessionResponse.session_id;
        setChatState(prev => ({ ...prev, sessionId: currentSessionId }));
      }

      // Send message using HTTP API
      console.log('🚀 Sending message to API:', {
        widgetId: settings.widgetId,
        sessionId: currentSessionId,
        visitorId: chatState.visitorId,
        message: content.trim()
      });

      const httpResponse = await apiService.sendMessage(settings.widgetId, {
        message: content.trim(),
        session_id: currentSessionId!,
        visitor_id: chatState.visitorId!,
        page_url: window.location.href,
        page_title: document.title,
        user_agent: navigator.userAgent,
      });

      console.log('✅ Received response from API:', httpResponse);

      // Update user message status
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        ),
        isTyping: false,
      }));

      // Add assistant response
      const assistantMessage: Message = {
        id: httpResponse.message_id || Date.now().toString(),
        content: httpResponse.response,
        type: 'assistant',
        timestamp: new Date(),
        status: 'delivered',
      };

      setChatState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, assistantMessage]
      }));

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update user message status to error
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' }
            : msg
        ),
        isTyping: false,
      }));

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        type: 'assistant',
        timestamp: new Date(),
        status: 'error',
      };

      setChatState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, errorMessage]
      }));
    }
  }, [chatState.sessionId, chatState.visitorId, config, apiService, settings.widgetId]);

  /**
   * Toggle widget open/closed
   */
  const toggleWidget = useCallback(() => {
    const newOpenState = !widgetState.isOpen;
    setWidgetState(prev => ({
      ...prev,
      isOpen: newOpenState
    }));

    // Notify parent script about toggle state for container styling
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'widget-toggle',
        isOpen: newOpenState
      }, '*');
    }
  }, [widgetState.isOpen]);

  /**
   * Close widget
   */
  const closeWidget = useCallback(() => {
    setWidgetState(prev => ({ 
      ...prev, 
      isOpen: false 
    }));
  }, []);

  /**
   * Minimize/maximize widget
   */
  const toggleMinimize = useCallback(() => {
    setWidgetState(prev => ({ 
      ...prev, 
      isMinimized: !prev.isMinimized 
    }));
  }, []);

  // Initialize widget on mount
  useEffect(() => {
    initializeWidget();
  }, [initializeWidget]);

  return {
    widgetState,
    chatState,
    config,
    sendMessage,
    toggleWidget,
    closeWidget,
    toggleMinimize,
  };
}