import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, ChefHat, Users } from 'lucide-react';
import { UserSession } from '../../types';
import { STAFF_USERS } from '../../data';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [role, setRole] = useState('mesero');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!role || !password) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('El PIN debe tener al menos 4 caracteres.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const match = STAFF_USERS.find(
        u => u.role === role && u.pin === password
      );

      if (match) {
        onLoginSuccess({
          email: match.email,
          name: match.name,
          role: match.role as any
        });
      } else {
        setErrorMsg('PIN incorrecto para el rol seleccionado.');
      }
      setIsSubmitting(false);
    }, 600);
  };

  const handleQuickLogin = (user: typeof STAFF_USERS[0]) => {
    setRole(user.role);
    setPassword(user.pin);
    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess({
        email: user.email,
        name: user.name,
        role: user.role as any
      });
      setIsSubmitting(false);
    }, 450);
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'administrador': return ChefHat;
      case 'mesero': return Users;
      default: return Sparkles;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'administrador': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'mesero': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const quickUsers = [STAFF_USERS[0], STAFF_USERS[2]];

  return (
    <div className="min-h-screen bg-pandora-dark flex items-center justify-center p-4 sm:p-6 md:p-8 selection:bg-pandora-gold selection:text-pandora-title font-sans overflow-y-auto">

      <motion.div
        id="login_container"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl bg-surface-card/95 backdrop-blur-md rounded-2xl border border-border-default overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[580px]"
      >

        <div
          id="login_visual_panel"
          className="w-full md:w-1/2 relative flex flex-col justify-between p-8 text-white min-h-[250px] md:min-h-auto border-b md:border-b-0 md:border-r border-pandora-border overflow-hidden"
          style={{
            backgroundColor: '#0D1B2A'
          }}
        >
          <div className="absolute inset-0 z-0 overflow-hidden bg-pandora-dark flex items-center justify-center p-2">
            <img
              src="https://i.imgur.com/ARe5rPr.jpeg"
              alt="Logo Café Pandora"
              className="w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 object-cover rounded-full shadow-2xl border-2 border-pandora-gold/30 animate-pulse-slow"
              referrerPolicy="no-referrer"
            />
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(13, 27, 42, 0.3) 0%, rgba(13, 27, 42, 0.1) 60%, rgba(13, 27, 42, 0.7) 100%)'
              }}
            ></div>
          </div>

          <div id="visual_top" className="relative z-10 flex items-center gap-2">
          </div>

          <div id="visual_bottom" className="relative z-10 pt-12 md:pt-0 mt-auto">
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Café Pandora
            </h1>
            <p className="mt-1 text-sm text-pandora-gold font-serif font-medium uppercase tracking-wider">
              Bistro Cafe Bar
            </p>
          </div>
        </div>

        <div id="login_form_panel" className="w-full md:w-1/2 flex flex-col justify-center p-6 sm:p-8 lg:p-12 bg-pandora-dark">

          <div id="form_header" className="mb-6 text-center md:text-left">
            <h2 className="font-sans text-2xl font-bold text-text-primary">Acceso Administrativo</h2>
            <p className="text-xs text-text-muted mt-1 font-light">
              Seleccione su rol e ingrese su PIN
            </p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-pandora-error-bg border border-pandora-danger/30 rounded-lg text-pandora-danger text-xs text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Rol de Empleado</label>
              <div className="relative">
                <select
                  id="role_select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-text-primary bg-surface-input border border-border-default rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-pandora-gold focus:ring-1 focus:ring-pandora-gold/30 transition-all cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="administrador" className="bg-surface-card text-text-primary">Administrador / Gerente</option>
                  <option value="mesero" className="bg-surface-card text-text-primary">Mesero / Servicio de Mesa</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-text-muted">Contraseña (PIN)</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password_input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-text-primary bg-surface-input border border-border-default rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-pandora-gold focus:ring-1 focus:ring-pandora-gold/30 transition-all placeholder:text-text-muted/50 font-mono tracking-widest"
                  placeholder="PIN Numérico"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              id="login_submit_btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-pandora-success hover:bg-pandora-success-hover text-white rounded-lg py-3 text-sm font-semibold shadow-lg shadow-black/10 transition-all hover:-translate-y-[1px] active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Iniciando Sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {quickUsers[0] && quickUsers[1] && (
            <div id="quick_login_area" className="mt-8 pt-6 border-t border-border-default">
              <span className="block text-[11px] font-semibold text-pandora-gold uppercase tracking-wider mb-3">
                Acceso Rápido de Prueba (1-Click)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 max-w-xl gap-2">
                {quickUsers.map((u) => {
                  if (!u) return null;
                  const Icon = getRoleIcon(u.role);
                  const colors = getRoleColor(u.role);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs hover:bg-pandora-hover transition-all outline-none cursor-pointer ${colors}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold truncate text-text-primary leading-tight">{u.name}</p>
                        <p className="text-[10px] text-text-muted capitalize truncate">{u.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
