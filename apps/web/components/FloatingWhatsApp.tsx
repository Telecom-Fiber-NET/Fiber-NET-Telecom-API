import React from 'react';

/**
 * FloatingWhatsApp Component
 * 
 * Fixed WhatsApp button that floats in the bottom-right corner.
 * Matches the main website's design and provides quick access to customer support.
 */
export const FloatingWhatsApp: React.FC = () => {
    const whatsappNumber = '556434347600';
    const whatsappMessage = encodeURIComponent('Olá! Gostaria de mais informações.');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full px-4 py-2.5 shadow-2xl transition-all duration-300 hover:scale-110 group"
            aria-label="Fale conosco no WhatsApp"
        >
            <i className="fab fa-whatsapp text-3xl"></i>

            {/* Tooltip */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Fale conosco
            </span>

            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
        </a>
    );
};

export default FloatingWhatsApp;
