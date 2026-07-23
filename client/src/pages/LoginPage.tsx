import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen flex items-center justify-center bg-grow-darker relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="particle absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              backgroundColor: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#a855f7' : '#fbbf24',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-grow p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-grow-green text-shadow-glow mb-2">
            🌿 GREEN EMPIRE
          </h1>
          <p className="text-grow-muted text-sm">Construye tu imperio desde cero</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="stat-label block mb-1.5">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              className="w-full bg-grow-darker border border-grow-border rounded-lg px-4 py-2.5 text-grow-white
                         focus:outline-none focus:border-grow-green focus:ring-1 focus:ring-grow-green/30 transition-colors"
              placeholder="Tu usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="stat-label block mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className="w-full bg-grow-darker border border-grow-border rounded-lg px-4 py-2.5 text-grow-white
                         focus:outline-none focus:border-grow-green focus:ring-1 focus:ring-grow-green/30 transition-colors"
              placeholder="••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg py-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-base"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-grow-muted text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-grow-green hover:text-grow-green-bright transition-colors">
            Regístrate
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
