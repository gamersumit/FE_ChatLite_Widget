import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';

interface ChatButtonProps {
  isOpen: boolean;
  isLoading: boolean;
  hasUnreadMessages: boolean;
  primaryColor: string;
  size?: 'small' | 'medium' | 'large';
  borderRadius?: string;
  fontFamily?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onClick: () => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({
  isOpen,
  isLoading,
  hasUnreadMessages,
  primaryColor,
  size = 'medium',
  borderRadius = '50%',
  fontFamily,
  position = 'bottom-right',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFaded, setIsFaded] = useState(false);

  // Fade out button after 3 seconds
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFaded(true);
    }, 3000);

    return () => clearTimeout(fadeTimer);
  }, []);
  // Get size dimensions
  const sizeMap = {
    small: { width: '50px', height: '50px', iconSize: 'w-5 h-5' },
    medium: { width: '60px', height: '60px', iconSize: 'w-6 h-6' },
    large: { width: '70px', height: '70px', iconSize: 'w-7 h-7' }
  };
  const buttonSize = sizeMap[size];

  // Calculate position styles based on position prop
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  return (
    <button
      className="widget-button relative"
      style={{
        backgroundColor: primaryColor,
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        width: buttonSize.width,
        height: buttonSize.height,
        borderRadius: borderRadius,
        fontFamily: fontFamily,
        pointerEvents: 'auto',
        opacity: isFaded && !isHovered ? 0.5 : 1,
        transition: 'opacity 0.5s ease-in-out',
        ...getPositionStyles()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      disabled={isLoading}
    >
      {/* Loading spinner */}
      {isLoading && (
        <Loader2
          className={`${buttonSize.iconSize} text-white animate-spin`}
        />
      )}

      {/* Chat icons */}
      {!isLoading && (
        <>
          {isOpen ? (
            <X className={`${buttonSize.iconSize} text-white transition-transform duration-200`} />
          ) : (
            <MessageCircle className={`${buttonSize.iconSize} text-white transition-transform duration-200`} />
          )}
        </>
      )}
      
      {/* Unread message indicator */}
      {hasUnreadMessages && !isOpen && !isLoading && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white">
          <span className="sr-only">Unread messages</span>
        </div>
      )}
      
      {/* Pulse animation for attention */}
      {hasUnreadMessages && !isOpen && (
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: primaryColor }}
        />
      )}
    </button>
  );
};

export default ChatButton;