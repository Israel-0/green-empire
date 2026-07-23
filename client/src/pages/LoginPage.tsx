import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 4 === 0 ? '#4ade80' : i % 4 === 1 ? '#a855f7' : i % 4 === 2 ? '#fbbf24' : '#38bdf8',
            opacity: 0.15 + Math.random() * 0.25,
          }}
          animate={{
            y: [0, -30 - Math.random() * 50],
            x: [0, (Math.random() - 0.5) * 40],
            opacity: [0.15 + Math.random() * 0.25, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, setError, token } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/game');
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) navigate('/game');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-grow-darker via-[#0a120a] to-grow-darker relative overflow-hidden">
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="card-grow p-10 w-full max-w-md relative z-10 shadow-[0_0_40px_rgba(74,222,128,0.08)]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl block mb-3"
          >
            🌿
          </motion.span>
          <h1 className="text-3xl font-display font-bold text-grow-green text-shadow-glow">
            GREEN EMPIRE
          </h1>
          <p className="text-grow-muted text-sm mt-2">Construye tu imperio desde cero</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="stat-label block mb-1.5">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              className="w-full bg-grow-darker border border-grow-border rounded-lg px-4 py-3 text-grow-white
                         focus:outline-none focus:border-grow-green focus:ring-2 focus:ring-grow-green/20 transition-all
                         placeholder:text-grow-muted/40"
              placeholder="Tu usuario"
              autoComplete="username"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="stat-label block mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className="w-full bg-grow-darker border border-grow-border rounded-lg px-4 py-3 text-grow-white
                         focus:outline-none focus:border-grow-green focus:ring-2 focus:ring-grow-green/20 transition-all
                         placeholder:text-grow-muted/40"
              placeholder="••••••"
              autoComplete="current-password"
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-red-400 text-sm text-center bg-red-900/30 border border-red-800/40 rounded-lg py-3"
            >
              {error}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🌀</motion.span>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-grow-muted text-sm mt-6"
        >
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-grow-green hover:text-grow-green-bright transition-colors font-medium">
            Regístrate gratis
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
