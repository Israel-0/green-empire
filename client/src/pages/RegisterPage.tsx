import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { register, loading, error, setError, token } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/game');
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const success = await register(username, email, password);
    if (success) navigate('/game');
  };

  const displayError = localError || error;

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
          <p className="text-grow-muted text-sm">Crea tu cuenta y empieza a cultivar</p>
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
              placeholder="Elige un nombre"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="stat-label block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="w-full bg-grow-darker border border-grow-border rounded-lg px-4 py-2.5 text-grow-white
                         focus:outline-none focus:border-grow-green focus:ring-1 focus:ring-grow-green/30 transition-colors"
              placeholder="tu@email.com"
              autoComplete="email"
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
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="stat-label block mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setLocalError(null); }}
              className="w-full bg-grow-darker border border-grow-border rounded-lg px-4 py-2.5 text-grow-white
                         focus:outline-none focus:border-grow-green focus:ring-1 focus:ring-grow-green/30 transition-colors"
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
          </div>

          {displayError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg py-2"
            >
              {displayError}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-base"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-grow-muted text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-grow-green hover:text-grow-green-bright transition-colors">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
