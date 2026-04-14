import { useState } from 'react';
import { AppLogo } from '../components/branding/AppLogo';

type AdminLoginPageProps = {
  onLoginSuccess: () => void;
};

const ADMIN_USERNAME = 'JIP';
const ADMIN_PASSWORD = 'JayengIntiPratama';

export function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setError('');
      onLoginSuccess();
      return;
    }

    setError('Username atau password salah.');
  };

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-[var(--navy)]/10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-[var(--navy)]/10 mb-4">
            <AppLogo className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--navy)]">Admin Login</h1>
          <p className="text-sm text-[var(--dark-text)]/60 mt-1">PT Jayeng Inti Pratama</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full px-4 py-3 border border-[var(--navy)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--navy)] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 border border-[var(--navy)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              placeholder="Masukkan password"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="w-full bg-[var(--navy)] text-white py-3 rounded-lg hover:bg-[var(--gold)] transition-all font-semibold"
          >
            Masuk ke Admin
          </button>
        </form>

        <p className="text-xs text-[var(--dark-text)]/50 mt-5">Default login: JIP / JayengIntiPratama</p>
      </div>
    </div>
  );
}
