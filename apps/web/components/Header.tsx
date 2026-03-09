import React, { useEffect, useState } from 'react';

interface HeaderProps {
    onInvoiceClick?: () => void;
    hideSecondaryAction?: boolean;
    hidePrimaryAction?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onInvoiceClick, hideSecondaryAction = false, hidePrimaryAction = false }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const menuItems = [
        { label: 'Quem somos', href: 'https://vempraconnect.com.br/quem-somos/' },
        { label: 'Planos residenciais', href: 'https://vempraconnect.com.br/planos-residenciais/' },
        { label: 'Planos empresariais', href: 'https://vempraconnect.com.br/planos-empresariais/' },
        { label: 'Clube de vantagens', href: 'https://vempraconnect.com.br/clube-de-vantagens/' },
        { label: 'Fale conosco', href: 'https://vempraconnect.com.br/contato/' },
        { label: 'Embaixador', href: 'https://vempraconnect.com.br/embaixador/' },
    ];

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 12);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white shadow-[0_12px_30px_rgba(3,48,163,0.14)]'
                : 'bg-gradient-to-r from-white/90 via-white/80 to-white/90 backdrop-blur border-b border-slate-200/80'
                }`}
        >
            <div className="hidden h-1 w-full bg-gradient-to-r from-[#0330A3] via-[#3BB1FF] to-[#F05828] sm:block" />

            <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
                <div className="flex h-[96px] items-center justify-between gap-3">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <a href="https://vempraconnect.com.br/" aria-label="Connect Telecom">
                            <img
                                src="https://vempraconnect.com.br/wp-content/uploads/2023/10/Logo-01.png"
                                alt="Connect Telecom"
                                className="h-14 w-auto sm:h-16"
                            />
                        </a>
                    </div>

                    {/* Menu desktop */}
                    <nav className="hidden flex-1 items-center justify-center xl:flex">
                        {menuItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-medium text-[#0330A3] transition-colors hover:text-[#F05828] 2xl:text-[15px]"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    {/* CTAs */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        {/* WhatsApp */}
                        {!hidePrimaryAction && (
                            <a
                                href="https://wa.me/556434347600"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden md:inline-flex items-center gap-2 px-6 py-3 min-h-[44px] whitespace-nowrap rounded-full bg-[#F05828] text-base font-semibold text-white shadow-[0_6px_14px_rgba(240,88,40,0.35)] transition-colors hover:bg-[#d84f24]"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                                    <i className="fab fa-whatsapp text-sm"></i>
                                </span>
                                <span>Assine agora</span>
                            </a>
                        )}

                        {/* 2ª Via */}
                        {!hideSecondaryAction && onInvoiceClick && (
                            <button
                                onClick={() => {
                                    onInvoiceClick();
                                    closeMobileMenu();
                                }}
                                className="hidden md:inline-flex items-center gap-2 px-6 py-3 min-h-[44px] whitespace-nowrap rounded-full bg-[#3BB1FF] text-base font-semibold text-white shadow-[0_6px_14px_rgba(59,177,255,0.35)] transition-colors hover:bg-[#2b9ae0]"
                            >
                                <i className="fas fa-file-invoice text-base"></i>
                                <span>2ª Via de boleto</span>
                            </button>
                        )}

                        {/* Área do cliente */}
                        {!hideSecondaryAction && !onInvoiceClick && (
                            <a
                                href="https://vempraconnect.com.br/"
                                onClick={closeMobileMenu}
                                className="hidden md:inline-flex items-center gap-2 px-6 py-3 min-h-[44px] whitespace-nowrap rounded-full bg-[#3BB1FF] text-base font-semibold text-white shadow-[0_6px_14px_rgba(59,177,255,0.35)] transition-colors hover:bg-[#2b9ae0]"
                            >
                                <i className="far fa-user text-base"></i>
                                <span>Página inicial</span>
                            </a>
                        )}

                        {/* Botão menu mobile */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className="inline-flex xl:hidden items-center justify-center rounded-lg p-4 text-[#0330A3] transition-colors hover:bg-blue-50"
                            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                            aria-expanded={isMobileMenuOpen}
                        >
                            <i
                                className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-align-justify'
                                    } text-xl`}
                            ></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Menu mobile */}
            {isMobileMenuOpen && (
                <div className="xl:hidden border-t border-slate-200 bg-white shadow-lg">
                    <div className="mx-auto max-w-[1140px] px-4 py-4 sm:px-6">
                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <a
                                    key={`mobile-${item.label}`}
                                    href={item.href}
                                    onClick={closeMobileMenu}
                                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#0330A3] transition-colors hover:bg-blue-50 hover:text-[#F05828]"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        {(!hidePrimaryAction || !hideSecondaryAction) && (
                            <div className="mt-4 grid gap-2">
                                {!hidePrimaryAction && (
                                    <a
                                        href="https://wa.me/556434347600"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={closeMobileMenu}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F05828] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d84f24]"
                                    >
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                                            <i className="fab fa-whatsapp text-sm"></i>
                                        </span>
                                        <span>Assine agora</span>
                                    </a>
                                )}

                                {!hideSecondaryAction && (onInvoiceClick ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onInvoiceClick();
                                            closeMobileMenu();
                                        }}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3BB1FF] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2b9ae0]"
                                    >
                                        <i className="fas fa-file-invoice text-sm"></i>
                                        <span>2ª Via de boleto</span>
                                    </button>
                                ) : (
                                    <a
                                        href="https://vempraconnect.com.br/"
                                        onClick={closeMobileMenu}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3BB1FF] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2b9ae0]"
                                    >
                                        <i className="far fa-user text-sm"></i>
                                        <span>Página inicial</span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
