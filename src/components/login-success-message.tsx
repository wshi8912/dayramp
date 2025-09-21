'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Mail, UserCheck } from 'lucide-react';

type MessageType = 'welcome' | 'confirmed' | 'email_changed' | null;

const messageConfig = {
  welcome: {
    icon: UserCheck,
    title: 'Welcome back!',
    description: "You've successfully logged in",
  },
  confirmed: {
    icon: Mail,
    title: 'Email confirmed!',
    description: 'Your account is now active',
  },
  email_changed: {
    icon: CheckCircle,
    title: 'Email updated!',
    description: 'Your email address has been changed',
  },
};

export function LoginSuccessMessage() {
  const searchParams = useSearchParams();
  const [messageType, setMessageType] = useState<MessageType>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check for different message types
    let type: MessageType = null;
    
    if (searchParams.get('welcome') === 'true') {
      type = 'welcome';
    } else if (searchParams.get('confirmed') === 'true') {
      type = 'confirmed';
    } else if (searchParams.get('email_changed') === 'true') {
      type = 'email_changed';
    }
    
    if (type) {
      setMessageType(type);
      
      // Remove all message parameters from URL without refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('welcome');
      url.searchParams.delete('confirmed');
      url.searchParams.delete('email_changed');
      window.history.replaceState({}, '', url.toString());

      // Start fade out after 3 seconds (longer for confirmation messages)
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 3000);

      // Hide completely after fade out animation
      const hideTimer = setTimeout(() => {
        setMessageType(null);
      }, 3500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [searchParams]);

  if (!messageType) return null;

  const config = messageConfig[messageType];
  const Icon = config.icon;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl p-6 flex items-center gap-3 pointer-events-auto">
        <Icon className="h-6 w-6 text-green-400" />
        <div>
          <h2 className="text-lg font-semibold text-white">
            {config.title}
          </h2>
          <p className="text-sm text-white/70">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}