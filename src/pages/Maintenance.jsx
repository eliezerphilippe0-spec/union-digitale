import React from 'react';
import { Hammer, Settings, Clock, MessageCircle } from 'lucide-react';

const Maintenance = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
            <div className="max-w-md w-full">
                {/* Visual Header */}
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-indigo-500 blur-[100px] opacity-20 rounded-full animate-pulse" />
                    <div className="relative flex justify-center">
                        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-500">
                            <Settings size={64} className="text-indigo-400 animate-spin-slow" />
                        </div>
                        <div className="absolute -bottom-4 right-1/4 bg-indigo-600 p-4 rounded-2xl shadow-xl transform -rotate-12">
                            <Hammer size={24} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Maintenance en cours</h1>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    Nous mettons à jour **Zabely** pour vous offrir une expérience encore plus exceptionnelle. Nous serons de retour dans quelques instants.
                </p>

                {/* Info Cards */}
                <div className="grid grid-cols-1 gap-4 mb-12">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-3xl flex items-center gap-4 text-left">
                        <div className="bg-indigo-500/10 p-3 rounded-2xl">
                            <Clock size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Temps estimé</p>
                            <p className="font-bold text-slate-200">Moins de 30 minutes</p>
                        </div>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="pt-8 border-t border-slate-800">
                    <p className="text-sm text-slate-500 mb-4">Besoin d'aide urgente ?</p>
                    <a
                        href="https://wa.me/50931234567"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:-translate-y-1"
                    >
                        <MessageCircle size={20} />
                        Contacter le support
                    </a>
                </div>

                <p className="mt-12 text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">
                    © 2026 Zabely - Haiti's Digital Ecosystem
                </p>
            </div>
        </div>
    );
};

export default Maintenance;
