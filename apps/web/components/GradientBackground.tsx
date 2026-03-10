import React from 'react';

interface GradientBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    children,
    className = ''
}) => {
    const desktopBackgroundImage = 'https://vempraconnect.com.br/wp-content/uploads/2024/12/bg_streaming.jpg';
    const mobileBackgroundImage = 'https://vempraconnect.com.br/wp-content/uploads/2024/12/bg_streaming_m.jpg';

    return (
        <div className={`relative min-h-screen overflow-hidden ${className}`}>
            <div
                className="absolute inset-0 hidden bg-cover bg-top md:block"
                style={{ backgroundImage: `url(${desktopBackgroundImage})` }}
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 bg-cover bg-bottom md:hidden"
                style={{ backgroundImage: `url(${mobileBackgroundImage})` }}
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 bg-gradient-to-br from-connect-dark/90 via-connect-blue/80 to-connect-blue-deep/85"
                aria-hidden="true"
            />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default GradientBackground;
