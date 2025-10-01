// ChatLite Widget Loader Script
(function() {
    'use strict';

    // Prevent multiple initialization
    if (window.ChatLite && window.ChatLite.initialized) {
        return;
    }

    // Configuration from parent page
    const widgetConfig = window.chatLiteConfig || {};
    const baseUrl = widgetConfig.frontendBase || 'http://localhost:5175';
    const apiBase = widgetConfig.apiBase || 'http://localhost:8002/api/v1/widget';

    // Get position styles for offline message
    function getPositionStyles() {
        const position = widgetConfig.position || 'bottom-right';
        if (position === 'bottom-right') return 'bottom: 20px; right: 20px;';
        if (position === 'bottom-left') return 'bottom: 20px; left: 20px;';
        if (position === 'top-right') return 'top: 20px; right: 20px;';
        return 'top: 20px; left: 20px;';
    }

    // Show offline message when widget is unavailable
    function showOfflineMessage(message) {
        // Don't show if already displayed
        if (document.getElementById('chatlite-offline')) return;

        const offlineMessage = message || widgetConfig.offlineMessage ||
            "We're currently offline. Please try again later.";

        const container = document.createElement('div');
        container.id = 'chatlite-offline';
        container.innerHTML = `
            <div style="position:fixed;${getPositionStyles()};
                        background:#f3f4f6;border:2px solid #d1d5db;
                        border-radius:12px;padding:16px;max-width:300px;
                        font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;
                        box-shadow:0 4px 16px rgba(0,0,0,0.1);z-index:10000;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-size:24px;">💬</div>
                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5;">
                        ${offlineMessage}
                    </p>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    }

    // Check widget status before loading
    async function checkWidgetStatus() {
        if (!widgetConfig.widgetId) {
            console.error('ChatLite: widgetId is required');
            return false;
        }

        try {
            const statusUrl = `${apiBase}/${widgetConfig.widgetId}/status`;
            const response = await fetch(statusUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                console.error('ChatLite: Status check failed', response.status);
                return false;
            }

            const statusData = await response.json();

            // Check verification status first
            if (statusData.verification_status === 'verified' && statusData.status === 'active') {
                console.log('ChatLite: Widget verified and active, loading...');
                return true;
            }

            // If not verified or inactive, attempt verification
            if (statusData.verification_status !== 'verified') {
                console.log('ChatLite: Widget not verified, attempting verification...');
                const verifyResponse = await verifyWidget();

                if (!verifyResponse) {
                    console.warn('ChatLite: Verification failed');
                    return false;
                }

                // After successful verification, check widget status from verify response
                // The verify API returns widget_status field
                console.log('ChatLite: Verification successful, widget is now active');
                return true; // Verification succeeded, widget should be active
            }

            // If verified but inactive
            if (statusData.status !== 'active') {
                console.warn('ChatLite: Widget is inactive');
                return false;
            }

            return true;

        } catch (error) {
            console.error('ChatLite: Status check error', error);
            return false;
        }
    }

    // Verify widget installation
    async function verifyWidget() {
        try {
            const verifyUrl = `${apiBase}/verify/${widgetConfig.widgetId}`;
            const response = await fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: window.location.hostname,
                    mode: 'embedded',
                    page_url: window.location.href,
                    user_agent: navigator.userAgent
                })
            });

            if (!response.ok) {
                console.error('ChatLite: Verification failed', response.status);
                return false;
            }

            const verifyData = await response.json();

            if (verifyData.verified) {
                console.log('ChatLite: Verification successful');
                return true;
            }

            console.warn('ChatLite: Verification unsuccessful');
            return false;

        } catch (error) {
            console.error('ChatLite: Verification error', error);
            return false;
        }
    }

    // Create widget container
    function createWidget() {
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'chatlite-widget-container';

        // Position container based on config
        let positionStyle = '';
        const position = widgetConfig.position || 'bottom-right';
        const size = widgetConfig.size || 'medium';

        // Calculate dimensions based on size
        let width = '380px', height = '600px';
        if (size === 'small') {
            width = '320px';
            height = '500px';
        } else if (size === 'large') {
            width = '420px';
            height = '650px';
        }

        // Position the container
        if (position === 'bottom-right') {
            positionStyle = 'bottom: 20px; right: 20px;';
        } else if (position === 'bottom-left') {
            positionStyle = 'bottom: 20px; left: 20px;';
        } else if (position === 'top-right') {
            positionStyle = 'top: 20px; right: 20px;';
        } else {
            positionStyle = 'top: 20px; left: 20px;';
        }

        widgetContainer.style.cssText = `
            position: fixed;
            ${positionStyle}
            z-index: 10000;
            width: ${width};
            height: ${height};
            font-family: ${widgetConfig.fontFamily || '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'};
        `;

        // Create iframe (fills entire container)
        const iframe = document.createElement('iframe');
        iframe.src = `${baseUrl}/widget?id=${widgetConfig.widgetId}&mode=embedded&theme=${widgetConfig.theme || 'auto'}`;
        // Start with minimal styling - transparent background, no border
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 0;
            box-shadow: none;
            display: block;
            background: transparent;
            overflow: visible;
        `;

        widgetContainer.appendChild(iframe);
        document.body.appendChild(widgetContainer);

        // Functions to toggle iframe styling based on chat state
        function showChatContainer() {
            iframe.style.border = `3px solid ${widgetConfig.primaryColor || '#0066CC'}`;
            iframe.style.borderRadius = `${widgetConfig.borderRadius || '12px'}`;
            iframe.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
            iframe.style.background = 'white';
            iframe.style.overflow = 'hidden';
        }

        function hideChatContainer() {
            iframe.style.border = 'none';
            iframe.style.borderRadius = '0';
            iframe.style.boxShadow = 'none';
            iframe.style.background = 'transparent';
            iframe.style.overflow = 'visible';
        }

        return {
            container: widgetContainer,
            iframe: iframe,
            showContainer: showChatContainer,
            hideContainer: hideChatContainer
        };
    }

    // Initialize ChatLite API
    window.ChatLite = {
        initialized: true,
        init: async function(config) {
            // Update configuration
            Object.assign(widgetConfig, config);

            // Don't create if already exists
            if (document.getElementById('chatlite-widget-container')) {
                return;
            }

            // Check widget status (don't block on failure, but wait for result)
            let widgetStatus = { verified: false, active: false };
            try {
                const isReady = await checkWidgetStatus();
                widgetStatus.verified = isReady;
                widgetStatus.active = isReady;
                console.log('ChatLite: Status check completed:', isReady ? 'ready' : 'not ready');
            } catch (error) {
                console.warn('ChatLite: Status check failed, will show offline', error);
            }

            // Store status in config BEFORE creating widget
            widgetConfig._internalStatus = widgetStatus;
            console.log('ChatLite: Final widget status:', widgetStatus);

            // Always create widget (chat button will be visible)
            const widget = createWidget();

            // Handle iframe communication
            window.addEventListener('message', function(event) {
                if (event.origin !== baseUrl) return;

                // Handle widget events
                switch (event.data.type) {
                    case 'widget-toggle':
                        // Toggle container styling based on chat open/close state
                        if (event.data.isOpen) {
                            widget.showContainer();
                        } else {
                            widget.hideContainer();
                        }
                        break;
                    case 'widget-resize':
                        if (event.data.height) {
                            widget.iframe.style.height = event.data.height + 'px';
                        }
                        break;
                    case 'widget-ready':
                        console.log('ChatLite widget ready');
                        break;
                }
            });

            // Send configuration to iframe
            widget.iframe.onload = function() {
                // Add delay to ensure iframe is fully ready
                setTimeout(function() {
                    console.log('ChatLite: Sending config to iframe', widgetConfig);
                    widget.iframe.contentWindow.postMessage({
                        type: 'widget-config',
                        config: widgetConfig
                    }, baseUrl);
                }, 100);
            };
        },

        destroy: function() {
            const container = document.getElementById('chatlite-widget-container');
            if (container) {
                container.remove();
            }
            // Also remove offline message if present
            const offlineMsg = document.getElementById('chatlite-offline');
            if (offlineMsg) {
                offlineMsg.remove();
            }
        },

        open: function() {
            const container = document.getElementById('chatlite-widget-container');
            if (container) {
                container.style.display = 'block';
            }
        },

        close: function() {
            const container = document.getElementById('chatlite-widget-container');
            if (container) {
                container.style.display = 'none';
            }
        },

        toggle: function() {
            const container = document.getElementById('chatlite-widget-container');
            if (container) {
                const isVisible = container.style.display !== 'none';
                container.style.display = isVisible ? 'none' : 'block';
            }
        }
    };

    // Auto-initialize if config is already present
    if (widgetConfig.widgetId) {
        window.ChatLite.init(widgetConfig);
    }
})();
