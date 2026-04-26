import { X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';

interface MatchOverlayProps {
  show: boolean;
  onClose: () => void;
  user: {
    id?: string;
    name: string;
    position: string;
    company: string;
    image: string;
  };
  currentUser: {
    name: string;
    position: string;
    company: string;
    image: string;
  };
}

export function MatchOverlay({ show, onClose, user, currentUser }: MatchOverlayProps) {
  const navigate = useNavigate();
  const { eventId } = useParams();

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-400 z-50 flex flex-col items-center justify-center p-6"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white"
      >
        <X className="w-6 h-6" />
      </button>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-white font-bold text-5xl mb-2 text-center whitespace-nowrap">New Connection</h1>
        <p className="text-white/90 text-center text-lg mb-12">
          You and {user.name} showed mutual interest
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-8 mb-12"
      >
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl">
            <img src={currentUser.image} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1">
            <p className="text-xs font-semibold text-gray-700">You</p>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
            <span className="text-4xl">🤝</span>
          </div>
        </motion.div>

        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl">
            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1">
            <p className="text-xs font-semibold text-gray-700">{user.name}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm space-y-3"
      >
        <p className="text-white/80 text-center text-sm mb-2">
          Now is the best time to reach out
        </p>
        <button
          onClick={() => {
            onClose();
            navigate(`/event/${eventId}/chat/${user.id ?? 'sarah-johnson'}`);
          }}
          className="w-full bg-white text-blue-600 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform"
        >
          Start conversation
        </button>
        <button
          onClick={onClose}
          className="w-full bg-white/20 backdrop-blur text-white py-4 rounded-full font-semibold border-2 border-white hover:bg-white/30 transition-colors"
        >
          Continue browsing
        </button>
      </motion.div>
    </motion.div>
  );
}