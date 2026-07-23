import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
}

export default function Notification({ message, type = 'error', onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    error: 'bg-red-900/90 border-red-700 text-red-300',
    success: 'bg-green-900/90 border-green-700 text-green-300',
    info: 'bg-blue-900/90 border-blue-700 text-blue-300',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg border ${colors[type]} shadow-lg z-50 max-w-md`}
      >
        <p className="text-sm font-medium">{message}</p>
      </motion.div>
    </AnimatePresence>
  );
}
