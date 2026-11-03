import React from 'react';

const Logo = ({ size = 24, color = 'currentColor', className = '', noLink = false }) => {
    const style = {
        fontFamily: "'Bauhaus 93', 'ITC Bauhaus', 'Arial Black', sans-serif",
        fontWeight: 800,
        fontSize: size,
        color: color,
        textDecoration: 'none',
        letterSpacing: '-0.5px',
        flexShrink: 0,
        cursor: noLink ? 'default' : 'pointer',
    };

    if (noLink) {
        return (
            <span className={className} style={style}>
                Wii-Co
            </span>
        );
    }

    return (
        <a href="/" className={className} style={style}>
            Wii-Co
        </a>
    );
};

export default Logo;
