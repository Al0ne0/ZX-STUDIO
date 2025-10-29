import React from 'react';

const Logo: React.FC = () => {
    return (
        <div className="w-48 h-48">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <style>
                    {`
                        .glow {
                            filter: drop-shadow(0 0 5px var(--primary-color)) drop-shadow(0 0 10px var(--primary-color));
                        }
                        .line {
                            stroke: var(--primary-color);
                            stroke-width: 4;
                            stroke-linecap: round;
                            fill: none;
                        }
                        .eye-outline {
                            animation: pulse 4s ease-in-out infinite;
                        }
                        .zx-logo {
                             stroke: var(--text-color);
                             stroke-width: 6;
                             filter: drop-shadow(0 0 3px var(--text-color));
                             animation: flicker 3s linear infinite;
                        }
                        @keyframes pulse {
                            0%, 100% { stroke-opacity: 0.8; transform: scale(1); }
                            50% { stroke-opacity: 1; transform: scale(1.02); }
                        }
                         @keyframes flicker {
                            0%, 19.9%, 22%, 62.9%, 64%, 64.9%, 70%, 100% {
                                opacity: 0.99;
                                text-shadow: -1px -1px 0 var(--primary-color), 1px -1px 0 var(--primary-color), -1px 1px 0 var(--primary-color), 1px 1px 0 var(--primary-color), 0 0 3px var(--primary-color), 0 0 6px var(--primary-color), 0 0 9px var(--primary-color);
                            }
                            20%, 21.9%, 63%, 63.9%, 65%, 69.9% {
                                opacity: 0.4;
                                text-shadow: none;
                            }
                        }
                    `}
                </style>
                <g className="glow" transform="translate(100, 100)">
                    <path 
                        className="line eye-outline"
                        d="M -90 0 C -40 -60, 40 -60, 90 0 C 40 60, -40 60, -90 0 Z"
                        transform-origin="center"
                    />
                    <path
                        className="zx-logo"
                        d="M -45 -30 L -15 30 M -45 30 L -15 -30 M 15 -30 L 45 30 L 15 30 L 45 -30"
                    />
                </g>
            </svg>
        </div>
    );
};

export default Logo;