import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/apiService';

export const AIChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([
        { role: 'bot', content: 'Olá! Sou a assistente virtual da Connect. Como posso te ajudar hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await apiService.sendChatMessage(userMessage);
            const botMessage = response.reply || response.message || 'Desculpe, não consegui entender.';
            setMessages(prev => [...prev, { role: 'bot', content: botMessage }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Ops! Ocorreu um erro ao processar sua mensagem.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 sm:w-96 h-[450px] flex flex-col overflow-hidden mb-4 animate-scaleIn origin-bottom-right">
                    <div className="bg-gradient-to-r from-[#002D72] to-[#0047BA] p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <i className="fas fa-robot"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Suporte Inteligente</h3>
                                <p className="text-[10px] text-blue-100">Online agora</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                                msg.role === 'user' 
                                ? 'bg-connect-blue text-white self-end rounded-tr-sm' 
                                : 'bg-white border border-gray-100 text-gray-700 self-start rounded-tl-sm shadow-sm'
                            }`}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="bg-white border border-gray-100 text-gray-700 self-start rounded-2xl rounded-tl-sm p-3 text-sm shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 ring-connect-blue/20"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 rounded-full bg-connect-blue text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
                        >
                            <i className="fas fa-paper-plane text-xs relative -left-0.5"></i>
                        </button>
                    </form>
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-connect-blue hover:bg-[#002D72] text-white rounded-full w-14 h-14 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
                    aria-label="Abrir Chat de Suporte"
                >
                    <i className="fas fa-comments text-2xl"></i>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-connect-orange border-2 border-white"></span>
                    </span>
                </button>
            )}
        </div>
    );
};

export default AIChatWidget;
