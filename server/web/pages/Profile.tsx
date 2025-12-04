import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { ArrowLeft, Copy, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Profile: React.FC = () => {
    const { user, refreshProfile, logout } = useAuth();
    const { t } = useLanguage();
    const [generating, setGenerating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [showAddKey, setShowAddKey] = useState(false);

    const handleGenerateKey = async () => {
        setGenerating(true);
        try {
            const response = await fetch('/api/auth/apikey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName || 'New Key' })
            });
            if (response.ok) {
                await refreshProfile();
                setShowAddKey(false);
                setNewKeyName('');
            }
        } catch (error) {
            console.error('Failed to generate key', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm('Are you sure you want to delete this API key? Devices using it will stop syncing.')) return;
        try {
            await fetch(`/api/auth/apikey/${id} `, { method: 'DELETE' });
            await refreshProfile();
        } catch (error) {
            console.error('Failed to delete key', error);
        }
    };

    const copyToClipboard = (key: string) => {
        navigator.clipboard.writeText(key);
        alert(t.profile.copied);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <h1 className="text-lg font-semibold text-slate-900">{t.profile.title}</h1>
                    </div>
                    <button
                        onClick={logout}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        {t.auth.logout}
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.profile.accountInfo}</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">{t.auth.username}</label>
                            <div className="text-slate-900 font-medium">{user.username}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">{t.profile.userId}</label>
                            <div className="text-slate-900 font-mono text-sm bg-slate-50 p-2 rounded-lg break-all">
                                {user.id}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">{t.profile.mobileSync}</h2>
                        <button
                            onClick={() => setShowAddKey(true)}
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                            title={t.profile.generate}
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">
                        {t.profile.syncDesc}
                    </p>

                    {showAddKey && (
                        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Key Name (e.g. "My iPhone")</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Device Name"
                                />
                                <button
                                    onClick={handleGenerateKey}
                                    disabled={generating}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {t.profile.generate}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {user.apiKeys && user.apiKeys.map((apiKey: any) => (
                            <div key={apiKey.id} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-slate-900 text-sm">{apiKey.name || 'Unnamed Key'}</span>
                                    <button
                                        onClick={() => handleDeleteKey(apiKey.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs text-slate-700 break-all">
                                        {apiKey.key}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(apiKey.key)}
                                        className="p-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                                        title="Copy"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">
                                    Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                        {(!user.apiKeys || user.apiKeys.length === 0) && (
                            <div className="text-center text-slate-500 text-sm py-4">
                                No API keys found. Generate one to sync your devices.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

