import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder: string;
  isTyping: boolean;
  primaryColor?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  placeholder,
  isTyping,
  primaryColor = '#0066CC',
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled && !isTyping) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const canSend = message.trim() && !disabled && !isTyping;

  return (
    <div
      className="border-t border-gray-200 bg-white"
      style={{
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        padding: '8px 12px',
        margin: 0,
        minHeight: 'auto',
        flexShrink: 0
      }}
    >
      <form onSubmit={handleSubmit} style={{ margin: 0, padding: 0 }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={disabled ? 'Connecting...' : placeholder}
              disabled={disabled}
              rows={1}
              className="w-full resize-none rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500 bg-white text-gray-900 scrollbar-hide"
              style={{
                height: '38px',
                minHeight: '38px',
                maxHeight: '100px',
                padding: '9px 12px',
                display: 'block',
                visibility: 'visible',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                lineHeight: '1.4',
                margin: 0
              }}
              onFocus={(e) => {
                e.target.style.borderColor = primaryColor;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />
          </div>

          <button type="submit" disabled={!canSend} className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${canSend ? 'text-white shadow-sm hover:shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} style={canSend ? { backgroundColor: primaryColor, filter: 'brightness(1)', height: '38px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : { height: '38px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Send message">
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;