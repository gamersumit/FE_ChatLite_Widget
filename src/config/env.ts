/**
 * Type-safe environment configuration for the ChatLite widget frontend
 */

interface WidgetConfig {
  api: {
    baseUrl: string;
    wsUrl: string;
    timeout: number;
  };
  widget: {
    origin: string;
    allowedOrigins: string[];
    defaultTheme: 'light' | 'dark' | 'auto';
    defaultPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    title: string;
  };
  app: {
    environment: string;
    enableDebug: boolean;
  };
}

function validateConfig(): void {
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_WS_URL'
  ];

  const missingVars = requiredVars.filter(varName =>
    !import.meta.env[varName] || import.meta.env[varName].trim() === ''
  );

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Validate configuration on module load in production
if (import.meta.env.MODE === 'production') {
  validateConfig();
}

export const config: WidgetConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8002',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  },
  widget: {
    origin: import.meta.env.VITE_WIDGET_ORIGIN || 'http://localhost:5174',
    allowedOrigins: (import.meta.env.VITE_ALLOWED_ORIGINS || '').split(',').filter(Boolean),
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME as 'light' | 'dark' | 'auto' || 'auto',
    defaultPosition: import.meta.env.VITE_DEFAULT_POSITION as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' || 'bottom-right',
    title: import.meta.env.VITE_WIDGET_TITLE || 'ChatLite Widget',
  },
  app: {
    environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development',
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  },
};

// Log configuration in development
if (config.app.enableDebug && config.app.environment === 'development') {
  console.log('Widget configuration:', config);
}

export default config;