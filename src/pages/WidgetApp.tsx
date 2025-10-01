import React, { useEffect, useState } from 'react';
import ChatWidget from '../components/ChatWidget';
import StaticBackground from '../components/StaticBackground';
import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import { config } from '../config/env';
import type { WidgetSettings } from '../types/api';

// Simple cache for widget configurations (5 minute TTL)
// Cache disabled for now
// interface CachedConfig {
//   config: any;
//   timestamp: number;
//   version?: string;
// }
// const configCache = new Map<string, CachedConfig>();
// const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const WidgetApp: React.FC = () => {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [widgetStatus, setWidgetStatus] = useState<{
    exists: boolean;
    verified: boolean;
    active: boolean;
    loading: boolean;
    showOffline: boolean;
  }>({ exists: false, verified: false, active: false, loading: true, showOffline: false });

  // Get URL params once
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  // Add embedded class to body for CSS targeting (always run this hook first)
  useEffect(() => {
    if (mode === 'embedded') {
      document.body.classList.add('embedded-mode');
      document.documentElement.classList.add('embedded-mode');
      return () => {
        document.body.classList.remove('embedded-mode');
        document.documentElement.classList.remove('embedded-mode');
      };
    }
  }, [mode]);

  useEffect(() => {
    // Extract widget ID from URL parameters
    const widgetId = urlParams.get('id');

    if (!widgetId) {
      console.error('Widget ID is required');
      setWidgetStatus(prev => ({
        ...prev,
        loading: false,
        exists: false,
        verified: false,
        active: false
      }));
      return;
    }

    // Check widget verification status and fetch configuration
    const initializeWidget = async () => {
      try {
        // For embedded mode, skip API config - wait for script config via postMessage
        if (mode === 'embedded') {
          console.log('🔥 EMBEDDED MODE - WAITING FOR SCRIPT CONFIG (NO API CONFIG)');

          setWidgetStatus({
            exists: true,
            verified: true, // Assume verified for embedded mode
            active: true,
            loading: false
          });

          // Set minimal default settings, script config will override everything
          setSettings({
            widgetId: widgetId,
            position: 'bottom-right',
            primaryColor: '#0066CC',
            apiUrl: `${config.api.baseUrl}/api/v1`,
            welcomeMessage: 'Loading...',
            placeholder: 'Type your message...',
            title: 'Support',
          });

          // Send ready message to parent immediately
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'widget-ready',
              data: {
                widgetId,
                verified: true,
                status: 'loaded'
              }
            }, '*');
          }

          return;
        }

        // For standalone mode, fetch config once and use it
        const statusResponse = await fetch(`${config.api.baseUrl}/api/v1/widget/config/${widgetId}`);

        if (!statusResponse.ok) {
          console.warn('Widget not found in backend, using demo/fallback mode');
          setWidgetStatus({
            exists: true,
            verified: false,
            active: true,
            loading: false
          });

          // Use null config data for fallback mode
          await createWidgetSettingsFromConfig(widgetId, null, false);
          return;
        }

        const statusData = await statusResponse.json();
        const isVerified = statusData.is_verified && statusData.is_active;

        setWidgetStatus({
          exists: true,
          verified: isVerified,
          active: statusData.is_active,
          loading: false
        });

        // Use already fetched config data (no additional API call)
        await createWidgetSettingsFromConfig(widgetId, statusData, isVerified);

      } catch (error) {
        console.error('Widget initialization failed:', error);
        setWidgetStatus({
          exists: false,
          verified: false,
          active: false,
          loading: false,
          showOffline: true
        });
      }
    };


    initializeWidget();
  }, []); // Only run once on mount

  // Helper function to create widget settings from config data
  const createWidgetSettingsFromConfig = async (widgetId: string, configData: any, isVerified: boolean) => {
    let widgetConfig = null;

    if (configData && configData.config) {
      widgetConfig = configData.config;
      console.log('Using fetched widget configuration');
    } else {
      console.warn('No config data available, using defaults');
      widgetConfig = {
        widget_position: 'bottom-right',
        widget_color: '#a08831',
        welcome_message: 'Hi! Ask your queries?',
        placeholder_text: 'Typing...',
        company_name: 'Support',
        is_active: true
      };
    }

    // Create widget settings with fetched config or defaults
    const widgetSettings: WidgetSettings = {
      widgetId: widgetId,
      position: widgetConfig?.widget_position || 'bottom-right',
      primaryColor: widgetConfig?.widget_color || '#a08831',
      apiUrl: `${config.api.baseUrl}/api/v1`,
      welcomeMessage: widgetConfig?.welcome_message || 'Hi! Ask your queries?',
      placeholder: widgetConfig?.placeholder_text || 'Typing...',
      title: widgetConfig?.company_name || 'Support',
    };

    console.log('🔥 WIDGET SETTINGS FROM CONFIG:', widgetSettings);
    setSettings(widgetSettings);

    // Send ready message to parent for embedded mode
    if (mode === 'embedded' && window.parent !== window) {
      window.parent.postMessage({
        type: 'widget-ready',
        data: {
          widgetId,
          verified: isVerified,
          status: 'loaded'
        }
      }, '*');
    }

    // Call verification endpoint only if not already verified
    if (!isVerified) {
      console.log('🔄 Widget not verified, starting verification process...');
      try {
        await fetch(`${config.api.baseUrl}/api/v1/widget/verify/${widgetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_url: window.location.href,
            page_title: document.title,
            installation_time: new Date().toISOString(),
            mode: mode || 'standalone'
          })
        });
        console.log('✅ Widget verification initiated');
      } catch (verifyError) {
        console.warn('❌ Widget verification failed:', verifyError);
      }
    } else {
      console.log('✅ Widget already verified, skipping verification call');
    }
  };

  // Store postMessage config to prevent backend override
  const [, setPostMessageConfig] = useState<any>(null);

  // Handle messages from parent window (for embedded mode)
  useEffect(() => {
    console.log('🔥 SETTING UP MESSAGE LISTENER');
    const handleMessage = (event: MessageEvent) => {
      console.log('🔥 RECEIVED MESSAGE FROM:', event.origin, 'Data:', event.data);
      const { type, data, config: scriptConfig } = event.data || {};

      switch (type) {
        case 'widget-config':
          // Parent script sends full config - map it to our settings format
          console.log('🔥 RECEIVED WIDGET CONFIG FROM PARENT:', scriptConfig);

          // CRITICAL: Only accept config if it matches our widget ID
          const currentWidgetId = urlParams.get('id');
          if (scriptConfig && scriptConfig.widgetId === currentWidgetId) {
            console.log('✅ CONFIG ACCEPTED - Widget ID matches:', currentWidgetId);

            // Check verification status from parent script
            const internalStatus = scriptConfig._internalStatus || { verified: false, active: false };
            console.log('🔐 WIDGET STATUS FROM PARENT:', internalStatus);

            // Create settings directly from script config - no API config to compete with
            const updatedSettings: any = {
              widgetId: scriptConfig.widgetId || currentWidgetId,
              position: scriptConfig.position || 'bottom-right',
              primaryColor: scriptConfig.primaryColor || '#0066CC',
              size: scriptConfig.size || 'medium',
              borderRadius: scriptConfig.borderRadius || '12px',
              fontFamily: scriptConfig.fontFamily || '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
              theme: scriptConfig.theme || 'auto',
              apiUrl: `${config.api.baseUrl}/api/v1`,
              welcomeMessage: scriptConfig.welcomeMessage || 'Hello! How can I help you today?',
              placeholder: scriptConfig.placeholderText || 'Type your message...',
              title: scriptConfig.companyName || 'ChatLite Support',
              offlineMessage: scriptConfig.offlineMessage || "We're currently offline. Please try again later.",
              // Pass verification status to settings so ChatWidget can use it
              _isVerified: internalStatus.verified,
              _isActive: internalStatus.active,
            };
            console.log('🔥 UPDATING WIDGET SETTINGS:', updatedSettings);
            setSettings(updatedSettings);
            // Store postMessage config to prevent backend override
            setPostMessageConfig(updatedSettings);

            // Add welcome message immediately for embedded mode
            if (scriptConfig.welcomeMessage) {
              console.log('🔥 ADDING WELCOME MESSAGE FROM CONFIG:', scriptConfig.welcomeMessage);
              // We'll need to trigger this in the ChatWidget component
            }
          } else if (scriptConfig) {
            console.log('❌ CONFIG REJECTED - Widget ID mismatch. Expected:', currentWidgetId, 'Received:', scriptConfig.widgetId);
          } else {
            console.log('🔥 NO CONFIG IN MESSAGE');
          }
          break;
        case 'widget-config-update':
          if (data && settings) {
            setSettings({ ...settings, ...data });
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // Remove settings dependency to prevent re-setup on settings change

  // Show offline message if widget failed to load
  if (widgetStatus.showOffline) {
    return (
      <StaticBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center" role="status">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Chat Offline</h2>
            <p className="text-gray-600">
              {settings?.config?.offline_message ||
               "We're currently offline. Please try again later."}
            </p>
          </div>
        </div>
      </StaticBackground>
    );
  }

  // Show loading or error states
  if (widgetStatus.loading || !settings) {
    return (
      <StaticBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center" role="status">
            {widgetStatus.loading ? (
              <>
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Loading widget...</p>
              </>
            ) : !widgetStatus.exists ? (
              <>
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Widget Not Found</h2>
                <p className="text-gray-600">The requested widget does not exist or is not available.</p>
              </>
            ) : !widgetStatus.active ? (
              <>
                <div className="text-yellow-500 text-6xl mb-4">⚡</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Widget Inactive</h2>
                <p className="text-gray-600">This widget is currently inactive. Please contact the website owner.</p>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Initializing widget...</p>
              </>
            )}
          </div>
        </div>
      </StaticBackground>
    );
  }

  // For embedded mode, render minimal layout with static background
  if (mode === 'embedded') {

    return (
      <StaticBackground variant="gradient">
        <div
          className="widget-embedded-container"
          style={{
            width: '100vw',
            height: '100vh',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            padding: 0,
            overflow: 'hidden'
          }}
          data-testid="embedded-widget-container"
        >
          <WidgetErrorBoundary>
            <ChatWidget key={`${settings.primaryColor}-${settings.title}-${settings.welcomeMessage}`} settings={settings} />
          </WidgetErrorBoundary>
        </div>
      </StaticBackground>
    );
  }

  // For standalone mode, render full page with isolated widget context
  // Note: This mode is for testing only and should not expose any authenticated routes
  return (
    <StaticBackground variant="solid" color="#f8fafc">
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ChatLite Widget
            </h1>
            <p className="text-gray-600">
              Widget ID: {settings.widgetId}
            </p>
          </header>

          <main className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Widget Test Page
              </h2>
              <p className="text-gray-600 mb-4">
                This page displays the ChatLite widget for testing purposes.
                The widget should appear in the bottom-right corner.
              </p>
              <div className="text-sm text-gray-500">
                <div><strong>Widget ID:</strong> {settings.widgetId}</div>
                <div><strong>API URL:</strong> {settings.apiUrl}</div>
                <div><strong>Mode:</strong> {mode || 'standalone'}</div>
              </div>
            </div>
          </main>
        </div>

        <WidgetErrorBoundary>
          <ChatWidget key={`${settings.primaryColor}-${settings.title}-${settings.welcomeMessage}`} settings={settings} />
        </WidgetErrorBoundary>
      </div>
    </StaticBackground>
  );
};

export default WidgetApp;