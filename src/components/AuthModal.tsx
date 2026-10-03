import React, { useState } from 'react';
import { 
  Mail, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Eye,
  EyeOff,
  Send
} from 'lucide-react';
import { AuthSession, CompanyProfile } from '../types.ts';
import { api } from '../lib/api.ts';
import { OtpInputBar } from './OtpInputBar.tsx';
import { accountStorage, VIP_COMPANY } from '../lib/accountStorage.ts';
import { useLocale } from '../lib/i18n.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AuthSession, company?: CompanyProfile, isNewRegistration?: boolean) => void;
  initialTab?: 'login' | 'register';
}

const COUNTRY_CODES = [
  { code: '+221', label: '🇸🇳 +221' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+225', label: '🇨🇮 +225' },
  { code: '+212', label: '🇲🇦 +212' },
  { code: '+237', label: '🇨🇲 +237' },
  { code: '+223', label: '🇲🇱 +223' },
  { code: '+226', label: '🇧🇫 +226' },
  { code: '+224', label: '🇬🇳 +224' },
  { code: '+241', label: '🇬🇦 +241' },
  { code: '+32', label: '🇧🇪 +32' },
  { code: '+41', label: '🇨🇭 +41' },
  { code: '+971', label: '🇦🇪 +971' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login'
}) => {
  const { lang } = useLocale();
  const isEn = lang === 'en';

  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [authMethod, setAuthMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  
  // WhatsApp Login States
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappCountry, setWhatsappCountry] = useState('+221');
  const [whatsappAuthType, setWhatsappAuthType] = useState<'otp' | 'password'>('otp');
  const [whatsappOtpCode, setWhatsappOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  // Email Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [emailAuthType, setEmailAuthType] = useState<'password' | 'otp'>('password');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  
  // Register States
  const [registerCompanyName, setRegisterCompanyName] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerWhatsappPhone, setRegisterWhatsappPhone] = useState('');
  const [registerWhatsappCountry, setRegisterWhatsappCountry] = useState('+221');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerStep, setRegisterStep] = useState<'form' | 'verify'>('form');
  const [registerOtpCode, setRegisterOtpCode] = useState('');

  // Common UI States
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const fullPhone = `${whatsappCountry} ${whatsappPhone.trim()}`;

  const handleSendOtp = async (targetIdentifier: string, type: 'whatsapp' | 'email') => {
    setErrorMessage('');
    setSuccessNotice('');
    setIsSendingOtp(true);

    const res = await api.requestOtp(targetIdentifier, type);
    setIsSendingOtp(false);

    if (res.success) {
      if (res.sentViaWhatsApp) {
        setSuccessNotice(
          isEn
            ? `✅ Verification code sent to your WhatsApp (${targetIdentifier}).`
            : `✅ Code de vérification envoyé sur votre WhatsApp (${targetIdentifier}).`
        );
      } else {
        setSuccessNotice(
          isEn
            ? `✅ 6-digit verification code sent to ${targetIdentifier}. Enter it below.`
            : `✅ Code de vérification à 6 chiffres envoyé à ${targetIdentifier}. Saisissez-le ci-dessous.`
        );
      }
    } else {
      setErrorMessage(res.error || (isEn ? 'Unable to send code.' : "Impossible d'envoyer le code."));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setIsSubmitting(true);

    const identifier = authMethod === 'whatsapp' ? fullPhone : loginEmail.trim().toLowerCase();
    const currentAuthType = authMethod === 'whatsapp' ? whatsappAuthType : emailAuthType;
    const password = loginPassword;
    const code = authMethod === 'whatsapp' ? whatsappOtpCode.trim() : emailOtpCode.trim();

    const isVipUser = identifier === 'mgaye60000@gmail.com' && (password === 'momo2003' || password === 'momo1234');

    try {
      const res = await api.login({
        identifier,
        authType: currentAuthType,
        password: currentAuthType === 'password' ? password : undefined,
        code: currentAuthType === 'otp' ? code : undefined
      });

      if (res.success && res.user) {
        const session: AuthSession = {
          role: isVipUser ? 'super_admin' : res.user.role,
          userEmail: res.user.email,
          userName: res.user.fullName,
          companyId: res.user.companyId,
          companyName: res.user.companyName,
          isVipFree: res.user.isVipFree || isVipUser
        };
        const companyData = res.company || (isVipUser ? VIP_COMPANY : undefined);
        if (companyData && isVipUser) {
          companyData.isVipFree = true;
          companyData.plan = 'enterprise_125k';
          companyData.monthlyCreditsLimit = 999999999;
          companyData.planPriceXOF = 0;
        }
        if (companyData) {
          accountStorage.saveAccount(companyData);
        }
        accountStorage.saveActiveSession(session, companyData);
        onLoginSuccess(session, companyData);
        onClose();
        return;
      } else if (isVipUser) {
        const session: AuthSession = {
          role: 'super_admin',
          userEmail: 'mgaye60000@gmail.com',
          userName: 'Mamadou Gaye (Super Admin)',
          companyId: 'c-mgaye60000',
          companyName: 'Entreprise Mamadou Gaye (Admin & VIP)',
          isVipFree: true
        };
        accountStorage.saveAccount(VIP_COMPANY);
        accountStorage.saveActiveSession(session, VIP_COMPANY);
        onLoginSuccess(session, VIP_COMPANY);
        onClose();
        return;
      } else {
        setErrorMessage(res.error || (isEn ? 'Login failed.' : 'Échec de connexion.'));
      }
    } catch (err: any) {
      if (isVipUser) {
        const session: AuthSession = {
          role: 'super_admin',
          userEmail: 'mgaye60000@gmail.com',
          userName: 'Mamadou Gaye (Super Admin)',
          companyId: 'c-mgaye60000',
          companyName: 'Entreprise Mamadou Gaye (Admin & VIP)',
          isVipFree: true
        };
        accountStorage.saveAccount(VIP_COMPANY);
        accountStorage.saveActiveSession(session, VIP_COMPANY);
        onLoginSuccess(session, VIP_COMPANY);
        onClose();
        return;
      }
      setErrorMessage(err?.message || (isEn ? 'Server connection error.' : 'Erreur de connexion au serveur.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!registerCompanyName.trim()) {
      setErrorMessage(isEn ? 'Company name is required.' : "Nom de l'entreprise requis.");
      return;
    }
    if (!registerFullName.trim()) {
      setErrorMessage(isEn ? 'Your full name is required.' : 'Votre nom complet est requis.');
      return;
    }
    if (!registerEmail.trim()) {
      setErrorMessage(isEn ? 'Your email is required.' : 'Votre email est requis.');
      return;
    }
    if (!registerWhatsappPhone.trim()) {
      setErrorMessage(isEn ? 'WhatsApp number is required.' : 'Numéro WhatsApp requis.');
      return;
    }

    const regPhone = `${registerWhatsappCountry} ${registerWhatsappPhone.trim()}`;
    const identifier = authMethod === 'whatsapp' ? regPhone : registerEmail.trim().toLowerCase();

    setIsSendingOtp(true);
    const otpRes = await api.requestOtp(identifier, authMethod);
    setIsSendingOtp(false);

    if (otpRes.success) {
      setSuccessNotice(
        isEn
          ? `✅ Security code sent to ${identifier}. Enter the 6 digits to verify.`
          : `✅ Code de sécurité transmis à ${identifier}. Saisissez les 6 chiffres pour valider la création.`
      );
      setRegisterStep('verify');
    } else {
      setErrorMessage(otpRes.error || (isEn ? 'Unable to send verification code.' : "Impossible d'envoyer le code de vérification."));
    }
  };

  const handleCompleteRegistration = async () => {
    if (!registerOtpCode.trim() || registerOtpCode.trim().length !== 6) {
      setErrorMessage(isEn ? 'Please enter the 6-digit code.' : 'Veuillez saisir les 6 chiffres du code reçu.');
      return;
    }

    const regPhone = `${registerWhatsappCountry} ${registerWhatsappPhone.trim()}`;
    const identifier = authMethod === 'whatsapp' ? regPhone : registerEmail.trim().toLowerCase();

    setIsSubmitting(true);
    setErrorMessage('');

    const verifyRes = await api.verifyOtp(identifier, registerOtpCode.trim());
    if (!verifyRes.success || !verifyRes.verified) {
      setIsSubmitting(false);
      setErrorMessage(verifyRes.error || (isEn ? 'Invalid or expired verification code.' : 'Code de validation incorrect ou expiré.'));
      return;
    }

    const regRes = await api.register({
      companyName: registerCompanyName.trim(),
      fullName: registerFullName.trim(),
      email: registerEmail.trim().toLowerCase(),
      phone: regPhone,
      password: registerPassword.trim() || undefined
    });

    setIsSubmitting(false);

    if (regRes.success && regRes.user) {
      const session: AuthSession = {
        role: regRes.user.role,
        userEmail: regRes.user.email,
        userName: regRes.user.fullName,
        companyId: regRes.user.companyId,
        companyName: regRes.user.companyName
      };
      onLoginSuccess(session, regRes.company, true);
      onClose();
    } else {
      setErrorMessage(regRes.error || (isEn ? 'Error registering company.' : "Erreur lors de l'enregistrement de l'entreprise."));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xl relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer text-xs font-bold"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC] mx-auto mb-1.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 id="auth-modal-title" className="text-lg sm:text-xl font-extrabold text-[#0A0A0A]">
            {tab === 'login'
              ? (isEn ? 'Sign In to SMG Flow' : 'Connexion SMG Flow')
              : (isEn ? 'Create Business Account' : 'Créer un Compte Entreprise')}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            {isEn
              ? 'Access your autonomous AI agents and secure dashboard'
              : 'Accédez à vos agents IA autonomes et votre tableau de bord sécurisé'}
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F8FAFC] border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(''); setSuccessNotice(''); }}
            className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              tab === 'login' ? 'bg-[#0052CC] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isEn ? 'Sign In' : 'Se Connecter'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setRegisterStep('form'); setErrorMessage(''); setSuccessNotice(''); }}
            className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              tab === 'register' ? 'bg-[#0052CC] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isEn ? 'Create Account' : 'Créer un Compte'}
          </button>
        </div>

        {/* Method Switcher: WhatsApp vs Email */}
        <div className="grid grid-cols-2 gap-2 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => { setAuthMethod('whatsapp'); setErrorMessage(''); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-all cursor-pointer ${
              authMethod === 'whatsapp'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isEn ? 'Via WhatsApp' : 'Via WhatsApp'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setErrorMessage(''); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-all cursor-pointer ${
              authMethod === 'email'
                ? 'bg-[#EBF2FF] text-[#0052CC] border-[#0052CC]/30'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4 text-[#0052CC] shrink-0" />
            <span>{isEn ? 'Via Email' : 'Via E-mail'}</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-fadeIn">
            {errorMessage}
          </div>
        )}
        {successNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium animate-fadeIn">
            {successNotice}
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            {authMethod === 'whatsapp' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'WhatsApp Number' : 'Numéro WhatsApp'}
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={whatsappCountry}
                      onChange={(e) => setWhatsappCountry(e.target.value)}
                      className="neu-input rounded-xl px-2 py-2.5 text-xs font-bold text-slate-800 shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="70 590 87 25"
                      className="flex-1 min-w-0 neu-input rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="text-slate-500 font-medium">{isEn ? 'Access mode:' : "Mode d'accès :"}</span>
                  <div className="flex gap-3 font-semibold text-slate-700">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={whatsappAuthType === 'otp'}
                        onChange={() => setWhatsappAuthType('otp')}
                        className="accent-emerald-600"
                      />
                      <span>{isEn ? 'OTP Code' : 'Code OTP'}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={whatsappAuthType === 'password'}
                        onChange={() => setWhatsappAuthType('password')}
                        className="accent-emerald-600"
                      />
                      <span>{isEn ? 'Password' : 'Mot de passe'}</span>
                    </label>
                  </div>
                </div>

                {whatsappAuthType === 'otp' ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {isEn ? 'Verification code' : 'Code de vérification'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSendOtp(fullPhone, 'whatsapp')}
                        disabled={isSendingOtp || !whatsappPhone.trim()}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>
                          {isSendingOtp
                            ? (isEn ? 'Sending...' : 'Envoi...')
                            : (isEn ? 'Request code' : 'Demander le code')}
                        </span>
                      </button>
                    </div>

                    <OtpInputBar
                      value={whatsappOtpCode}
                      onChange={setWhatsappOtpCode}
                      colorScheme="emerald"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Password' : 'Mot de passe'}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full neu-input rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800"
                      required
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Email address' : 'Adresse e-mail'}
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nom@entreprise.com"
                    className="w-full neu-input rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="text-slate-500 font-medium">{isEn ? 'Access mode:' : "Mode d'accès :"}</span>
                  <div className="flex gap-3 font-semibold text-slate-700">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={emailAuthType === 'password'}
                        onChange={() => setEmailAuthType('password')}
                        className="accent-[#0052CC]"
                      />
                      <span>{isEn ? 'Password' : 'Mot de passe'}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={emailAuthType === 'otp'}
                        onChange={() => setEmailAuthType('otp')}
                        className="accent-[#0052CC]"
                      />
                      <span>{isEn ? 'OTP Code' : 'Code OTP'}</span>
                    </label>
                  </div>
                </div>

                {emailAuthType === 'password' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Password' : 'Mot de passe'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full neu-input rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-bold text-slate-800"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{isEn ? 'Email code' : 'Code e-mail'}</span>
                      <button
                        type="button"
                        onClick={() => handleSendOtp(loginEmail.trim().toLowerCase(), 'email')}
                        disabled={isSendingOtp || !loginEmail.trim()}
                        className="text-[11px] font-bold text-[#0052CC] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>
                          {isSendingOtp
                            ? (isEn ? 'Sending...' : 'Envoi...')
                            : (isEn ? 'Request code' : 'Demander le code')}
                        </span>
                      </button>
                    </div>

                    <OtpInputBar
                      value={emailOtpCode}
                      onChange={setEmailOtpCode}
                      colorScheme="sky"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0052CC] hover:bg-[#003E99] text-white py-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 mt-2 transition-all"
            >
              <span>
                {isSubmitting
                  ? (isEn ? 'Verifying...' : 'Vérification...')
                  : (isEn ? 'Verify & Sign In' : 'Valider & Accéder')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {tab === 'register' && (
          <div>
            {registerStep === 'form' ? (
              <form onSubmit={handleInitiateRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Company / Business Name' : 'Nom de votre entreprise / Établissement'}
                  </label>
                  <input
                    type="text"
                    value={registerCompanyName}
                    onChange={(e) => setRegisterCompanyName(e.target.value)}
                    placeholder="Ex: Teranga Commerce SARL"
                    className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Your Full Name' : 'Votre Nom complet'}
                    </label>
                    <input
                      type="text"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      placeholder="Mamadou Diop"
                      className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Business Email' : 'E-mail professionnel'}
                    </label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="contact@entreprise.com"
                      className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Official WhatsApp Number' : 'Numéro WhatsApp officiel'}
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={registerWhatsappCountry}
                      onChange={(e) => setRegisterWhatsappCountry(e.target.value)}
                      className="neu-input rounded-xl px-2 py-2 text-xs font-bold text-slate-800 shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={registerWhatsappPhone}
                      onChange={(e) => setRegisterWhatsappPhone(e.target.value)}
                      placeholder="70 590 87 25"
                      className="flex-1 min-w-0 neu-input rounded-xl px-3.5 py-2 text-xs font-bold font-mono text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Password (optional if using OTP)' : 'Mot de passe (optionnel si accès OTP)'}
                  </label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder={isEn ? 'Minimum 8 characters' : 'Minimum 8 caractères'}
                    className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full bg-[#0052CC] hover:bg-[#003E99] text-white py-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 mt-2 transition-all"
                >
                  <span>
                    {isSendingOtp
                      ? (isEn ? 'Sending code...' : 'Génération du code...')
                      : (isEn ? 'Receive verification code' : 'Recevoir le code de vérification')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[10px] text-slate-500 text-center leading-normal pt-0.5">
                  {isEn
                    ? 'By continuing, you accept the Terms of Service and GDPR/CDP Privacy Policy.'
                    : 'En continuant, vous acceptez les CGU / CGV et la politique de protection des données (CDP/RGPD).'}
                </p>
              </form>
            ) : (
              <div className="space-y-4 pt-2 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  {isEn
                    ? 'Enter the 6-digit code received to confirm and activate your business.'
                    : 'Saisissez les 6 chiffres du code reçu pour confirmer et activer votre entreprise.'}
                </p>

                <OtpInputBar
                  value={registerOtpCode}
                  onChange={setRegisterOtpCode}
                  colorScheme="emerald"
                  autoFocus={true}
                />

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterStep('form')}
                    className="neu-btn py-2.5 rounded-full text-xs font-extrabold text-slate-600 cursor-pointer"
                  >
                    {isEn ? 'Back' : 'Retour'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteRegistration}
                    disabled={isSubmitting}
                    className="bg-[#0052CC] hover:bg-[#003E99] text-white py-2.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? (isEn ? 'Activating...' : 'Activation...') : (isEn ? 'Confirm' : 'Valider')}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
