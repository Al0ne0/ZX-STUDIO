import React, { useState, useRef } from 'react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, sendPasswordReset } from '../services/firebaseService';
import Logo from './Logo';

const Auth: React.FC = () => {
    const [formType, setFormType] = useState<'login' | 'register' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            if (formType === 'register') {
                if (!profilePic) throw new Error("Please select a profile picture.");
                await signUpWithEmail(email, password, username, profilePic);
                // The onAuthChange listener in App.tsx will handle the redirect
            } else if (formType === 'login') {
                await signInWithEmail(email, password);
                // The onAuthChange listener will handle the redirect
            } else if (formType === 'forgot') {
                await sendPasswordReset(email);
                setMessage('Password reset email sent! Check your inbox.');
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const switchForm = (type: 'login' | 'register' | 'forgot') => {
        setFormType(type);
        setError('');
        setMessage('');
        setEmail('');
        setPassword('');
        setUsername('');
        setProfilePic(null);
    };

    const renderForm = () => {
        if (formType === 'forgot') {
            return (
                <>
                    <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--primary-color)' }}>Reset Password</h1>
                    <p className="text-sm text-center text-slate-400 mb-6">Enter your email to receive a reset link.</p>
                    <div className="mb-4">
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors" />
                    </div>
                </>
            );
        }

        return (
            <>
                <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--primary-color)' }}>
                    {formType === 'login' ? 'Welcome to ZX STUDIO' : 'Create Your Account'}
                </h1>
                {formType === 'register' && (
                    <div className="flex flex-col items-center mb-4">
                        <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center cursor-pointer mb-2 bg-slate-800/50 hover:border-[var(--primary-color)] transition-colors">
                            {profilePic ? (
                                <img src={URL.createObjectURL(profilePic)} alt="Preview" className="w-full h-full object-cover rounded-full"/>
                            ) : (
                                <span className="text-xs text-slate-400 text-center">Profile Picture</span>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={e => e.target.files && setProfilePic(e.target.files[0])} accept="image/*" className="hidden" required />
                         <div className="mb-4 w-full">
                            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors" />
                        </div>
                    </div>
                )}
                <div className="mb-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors" />
                </div>
                <div className="mb-4">
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors" />
                </div>
            </>
        );
    };

    return (
        <main className="h-screen w-screen flex items-center justify-center p-4 bg-slate-900">
            <div className="w-full max-w-sm">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <div className="backdrop-blur-md border rounded-lg p-8" style={{ backgroundColor: 'rgba(var(--background-rgb), 0.5)', borderColor: 'rgba(var(--primary-rgb), 0.2)'}}>
                    <form onSubmit={handleAuthAction}>
                        {renderForm()}
                        {error && <p className="text-red-400 text-xs text-center mb-4">{error}</p>}
                        {message && <p className="text-green-400 text-xs text-center mb-4">{message}</p>}
                        <button type="submit" disabled={isLoading} className="w-full text-base font-bold py-2 rounded transition-all duration-300 disabled:opacity-50 flex justify-center items-center" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--background-color)'}}>
                           {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[var(--background-color)]"></div> : (formType === 'login' ? 'Login' : formType === 'register' ? 'Sign Up' : 'Send Reset Link')}
                        </button>
                    </form>
                    
                    <div className="flex items-center my-6">
                        <div className="flex-grow border-t border-slate-600"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-xs">OR</span>
                        <div className="flex-grow border-t border-slate-600"></div>
                    </div>

                    <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-slate-700/50 border border-slate-600 text-sm font-bold py-2 rounded hover:bg-slate-700 transition-colors disabled:opacity-50">
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="m24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.483-11.139-8.162l-6.69 5.309C9.135 39.522 15.989 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.991 35.631 44 29.825 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                        Continue with Google
                    </button>
                    
                    <div className="text-center mt-6 text-xs">
                        {formType === 'login' && (
                            <>
                                <a href="#" onClick={() => switchForm('forgot')} className="text-slate-400 hover:text-[var(--primary-color)]">Forgot Password?</a>
                                <span className="mx-2 text-slate-500">|</span>
                                <a href="#" onClick={() => switchForm('register')} className="text-slate-400 hover:text-[var(--primary-color)]">Don't have an account?</a>
                            </>
                        )}
                        {formType === 'register' && (
                            <a href="#" onClick={() => switchForm('login')} className="text-slate-400 hover:text-[var(--primary-color)]">Already have an account? Sign In</a>
                        )}
                         {formType === 'forgot' && (
                            <a href="#" onClick={() => switchForm('login')} className="text-slate-400 hover:text-[var(--primary-color)]">Back to Login</a>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Auth;
