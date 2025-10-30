import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import Globe from './components/Globe';
import PixelatedStock from './images/PixelatedStock.png';
import PixelatedMoney from './images/PixelatedMoney.png';
import PixExcavator from './images/PixExcavator.png';
import CursorArrow from './images/Black-Pixel-Mouse-Cursor-Arow-Fixed.svg';
import HomePageText from './images/HomePageText.svg';
import LearnStock from './images/LearnStock.svg';
import LearnVolatility from './images/LearnVolatility.svg';
import StopLossCalc from './images/Stoplosscalc.svg';

// Constants
const COLOR_GREEN = '#1AB832';
const COLOR_RED = '#FF0000';
const COLOR_TRANSPARENT = 'transparent';
const SCROLL_THRESHOLD = 200;
const PARALLAX_FACTOR = 0.8;
const MARGIN_OFFSET = 100;

// Reusable Learn More Button Component
interface LearnMoreButtonProps {
    onClick?: () => void;
}

const LearnMoreButton = memo(({ onClick }: LearnMoreButtonProps) => (
    <button className="learn-more-btn" onClick={onClick}>
        <svg width="250" height="52" viewBox="0 0 479 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="479" height="100" fill="#1D1D1D"/>
            <rect x="18.5" y="14.5" width="442" height="71" fill="#1D1D1D" stroke="#E5E020" className="btn-stroke"/>
            <path d="M108.05 30H113.55V60H122.6V65H108.05V30ZM133.738 30H148.738V35H139.238V44.25H146.788V49.25H139.238V60H148.738V65H133.738V30ZM164.652 30H172.102L177.802 65H172.302L171.302 58.05V58.15H165.052L164.052 65H158.952L164.652 30ZM170.652 53.4L168.202 36.1H168.102L165.702 53.4H170.652ZM188.97 30H197.12C199.953 30 202.02 30.6667 203.32 32C204.62 33.3 205.27 35.3167 205.27 38.05V40.2C205.27 43.8333 204.07 46.1333 201.67 47.1V47.2C203.003 47.6 203.937 48.4167 204.47 49.65C205.037 50.8833 205.32 52.5333 205.32 54.6V60.75C205.32 61.75 205.353 62.5667 205.42 63.2C205.487 63.8 205.653 64.4 205.92 65H200.32C200.12 64.4333 199.987 63.9 199.92 63.4C199.853 62.9 199.82 62 199.82 60.7V54.3C199.82 52.7 199.553 51.5833 199.02 50.95C198.52 50.3167 197.637 50 196.37 50H194.47V65H188.97V30ZM196.47 45C197.57 45 198.387 44.7167 198.92 44.15C199.487 43.5833 199.77 42.6333 199.77 41.3V38.6C199.77 37.3333 199.537 36.4167 199.07 35.85C198.637 35.2833 197.937 35 196.97 35H194.47V45H196.47ZM217.636 30H224.536L229.886 50.95H229.986V30H234.886V65H229.236L222.636 39.45H222.536V65H217.636V30ZM263.982 30H271.832L275.332 55.05H275.432L278.932 30H286.782V65H281.582V38.5H281.482L277.482 65H272.882L268.882 38.5H268.782V65H263.982V30ZM307.336 65.5C304.636 65.5 302.569 64.7333 301.136 63.2C299.703 61.6667 298.986 59.5 298.986 56.7V38.3C298.986 35.5 299.703 33.3333 301.136 31.8C302.569 30.2667 304.636 29.5 307.336 29.5C310.036 29.5 312.103 30.2667 313.536 31.8C314.969 33.3333 315.686 35.5 315.686 38.3V56.7C315.686 59.5 314.969 61.6667 313.536 63.2C312.103 64.7333 310.036 65.5 307.336 65.5ZM307.336 60.5C309.236 60.5 310.186 59.35 310.186 57.05V37.95C310.186 35.65 309.236 34.5 307.336 34.5C305.436 34.5 304.486 35.65 304.486 37.95V57.05C304.486 59.35 305.436 60.5 307.336 60.5ZM327.905 30H336.055C338.889 30 340.955 30.6667 342.255 32C343.555 33.3 344.205 35.3167 344.205 38.05V40.2C344.205 43.8333 343.005 46.1333 340.605 47.1V47.2C341.939 47.6 342.872 48.4167 343.405 49.65C343.972 50.8833 344.255 52.5333 344.255 54.6V60.75C344.255 61.75 344.289 62.5667 344.355 63.2C344.422 63.8 344.589 64.4 344.855 65H339.255C339.055 64.4333 338.922 63.9 338.855 63.4C338.789 62.9 338.755 62 338.755 60.7V54.3C338.755 52.7 338.489 51.5833 337.955 50.95C337.455 50.3167 336.572 50 335.305 50H333.405V65H327.905V30ZM335.405 45C336.505 45 337.322 44.7167 337.855 44.15C338.422 43.5833 338.705 42.6333 338.705 41.3V38.6C338.705 37.3333 338.472 36.4167 338.005 35.85C337.572 35.2833 336.872 35 335.905 35H333.405V45H335.405ZM356.571 30H371.571V35H362.071V44.25H369.621V49.25H362.071V60H371.571V65H356.571V30Z" fill="#E5E020" className="btn-text"/>
        </svg>
    </button>
));

LearnMoreButton.displayName = 'LearnMoreButton';

const App: React.FC = () => {
    const navigate = useNavigate();
    const [textColor, setTextColor] = useState(COLOR_GREEN);
    const [andDownColor, setAndDownColor] = useState(COLOR_TRANSPARENT);
    const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
    const [rectangleMargin, setRectangleMargin] = useState(1000);
    const [parallaxOffset, setParallaxOffset] = useState(0);
    const [cursorPos1, setCursorPos1] = useState({ x: 0, y: 0 });
    const [cursorPos2, setCursorPos2] = useState({ x: 0, y: 0 });
    const [cursorPos3, setCursorPos3] = useState({ x: 0, y: 0 });
    const [isHovering1, setIsHovering1] = useState(false);
    const [isHovering2, setIsHovering2] = useState(false);
    const [isHovering3, setIsHovering3] = useState(false);
    const backgroundContentRef = useRef<HTMLDivElement>(null);
    const rectangleRef = useRef<HTMLDivElement>(null);
    const imageRef1 = useRef<HTMLDivElement>(null);
    const imageRef2 = useRef<HTMLDivElement>(null);
    const imageRef3 = useRef<HTMLDivElement>(null);
    const [maxScroll, setMaxScroll] = useState<number>(Infinity);

    const calculateMaxScroll = useCallback(() => {
        if (!imageRef3.current) {
            return;
        }
        const rect = imageRef3.current.getBoundingClientRect();
        if (rect.height === 0) {
            return;
        }
        const scrollY = window.scrollY;
        const totalPosition = rect.bottom + scrollY * (1 + PARALLAX_FACTOR);
        const maxScrollValue = Math.max(0, (totalPosition - window.innerHeight + 10) / (1 + PARALLAX_FACTOR));
        setMaxScroll(maxScrollValue);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const newParallaxOffset = scrollY * PARALLAX_FACTOR;

            if (scrollY > maxScroll) {
                window.scrollTo(0, maxScroll);
                return;
            }

            // Update colors based on scroll position
            if (scrollY > SCROLL_THRESHOLD) {
                setTextColor(COLOR_RED);
                if (!hasScrolledOnce) {
                    setHasScrolledOnce(true);
                }
                setAndDownColor(COLOR_RED);
            } else {
                setTextColor(COLOR_GREEN);
                if (hasScrolledOnce) {
                    setAndDownColor(COLOR_GREEN);
                }
            }

            setParallaxOffset(newParallaxOffset);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasScrolledOnce, rectangleMargin, maxScroll]);

    useEffect(() => {
        const updateMargin = () => {
            if (backgroundContentRef.current) {
                const height = backgroundContentRef.current.offsetHeight;
                setRectangleMargin(height + MARGIN_OFFSET);
            }
        };

        updateMargin();
        window.addEventListener('resize', updateMargin);
        return () => window.removeEventListener('resize', updateMargin);
    }, []);

    useEffect(() => {
        calculateMaxScroll();
        window.addEventListener('resize', calculateMaxScroll);
        return () => window.removeEventListener('resize', calculateMaxScroll);
    }, [calculateMaxScroll]);

    useEffect(() => {
        calculateMaxScroll();
    }, [rectangleMargin, calculateMaxScroll]);

    // Memoized mouse handlers
    const handleMouseMove1 = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (imageRef1.current) {
            const rect = imageRef1.current.getBoundingClientRect();
            setCursorPos1({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    }, []);

    const handleMouseMove2 = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (imageRef2.current) {
            const rect = imageRef2.current.getBoundingClientRect();
            setCursorPos2({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    }, []);

    const handleMouseMove3 = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (imageRef3.current) {
            const rect = imageRef3.current.getBoundingClientRect();
            setCursorPos3({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    }, []);

    const handleMouseEnter1 = useCallback(() => setIsHovering1(true), []);
    const handleMouseLeave1 = useCallback(() => setIsHovering1(false), []);
    const handleMouseEnter2 = useCallback(() => setIsHovering2(true), []);
    const handleMouseLeave2 = useCallback(() => setIsHovering2(false), []);
    const handleMouseEnter3 = useCallback(() => setIsHovering3(true), []);
    const handleMouseLeave3 = useCallback(() => setIsHovering3(false), []);

    const handleNavigateToStopLoss = useCallback(() => {
        navigate('/StopLoss');
    }, [navigate]);
    const handleNavigateToLearnVolatility = useCallback(() => {
        navigate('/LearnVolatility');
    }, [navigate]);
    const handleNavigateToLearnStock = useCallback(() => {
        navigate('/LearnStock');
    }, [navigate]);

    return (
        <div>
            <div className="blue-background"></div>
            <header className="banner">
                <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>VOLATILITY EXPLAINED</h1>
                <div className="header-icons">
                    <img
                        src={LearnStock}
                        alt="Learn Stock"
                        className="header-icon"
                        onClick={() => navigate('/LearnStock')}
                    />
                    <img
                        src={LearnVolatility}
                        alt="Learn Volatility"
                        className="header-icon"
                        onClick={() => navigate('/LearnVolatility')}
                    />
                    <img
                        src={StopLossCalc}
                        alt="Stop Loss Calculator"
                        className="header-icon"
                        onClick={() => navigate('/StopLoss')}
                    />
                </div>
            </header>
            <div className="background-content" ref={backgroundContentRef}>
                <div className="hero-section">
                    <div className="hero-text">
                        <p style={{ color: textColor }}>The <em>Market</em></p>
                        <p style={{ color: textColor }}>is <em>always</em> up</p>
                        <p style={{ color: andDownColor }}>and down</p>
                    </div>
                    <div className="globe-container">
                        <Globe color={textColor} />
                    </div>
                </div>
                <div className="subtext">
                    <p><em>Understand</em> what that means...</p>
                </div>
            </div>
            <div className="content-rectangle" ref={rectangleRef} style={{
                marginTop: `${rectangleMargin}px`,
                transform: `translateY(-${parallaxOffset}px)`
            }}>
                <div className="content-wrapper">
                    <img src={HomePageText} alt="Homepage Text" className="homepage-text" />
                    <h2 className="section-header">1.   What is a <u>stock</u>?</h2>
                    <div
                        className="image-container"
                        ref={imageRef1}
                        onMouseMove={handleMouseMove1}
                        onMouseEnter={handleMouseEnter1}
                        onMouseLeave={handleMouseLeave1}
                    >
                        <img src={PixelatedStock} alt="Pixelated Stock" className="stock-image" />
                        <LearnMoreButton onClick={handleNavigateToLearnStock} />
                        {isHovering1 && (
                            <img
                                src={CursorArrow}
                                alt="Cursor"
                                className="cursor-arrow"
                                style={{
                                    left: `${cursorPos1.x}px`,
                                    top: `${cursorPos1.y}px`
                                }}
                            />
                        )}
                    </div>

                    <h2 className="section-header">2.   What is <u>Volatility</u>?</h2>
                    <div
                        className="image-container"
                        ref={imageRef2}
                        onMouseMove={handleMouseMove2}
                        onMouseEnter={handleMouseEnter2}
                        onMouseLeave={handleMouseLeave2}
                    >
                        <img src={PixelatedMoney} alt="Pixelated Money" className="stock-image" />
                        <LearnMoreButton onClick={handleNavigateToLearnVolatility} />
                        {isHovering2 && (
                            <img
                                src={CursorArrow}
                                alt="Cursor"
                                className="cursor-arrow"
                                style={{
                                    left: `${cursorPos2.x}px`,
                                    top: `${cursorPos2.y}px`
                                }}
                            />
                        )}
                    </div>

                    <h2 className="section-header">3.   Understand how to perfect your <u>portfolio</u></h2>
                    <div
                        className="image-container"
                        ref={imageRef3}
                        onMouseMove={handleMouseMove3}
                        onMouseEnter={handleMouseEnter3}
                        onMouseLeave={handleMouseLeave3}
                    >
                        <img
                            src={PixExcavator}
                            alt="Pix Excavator"
                            className="stock-image"
                            onLoad={calculateMaxScroll}
                        />
                        <LearnMoreButton onClick={handleNavigateToStopLoss} />
                        {isHovering3 && (
                            <img
                                src={CursorArrow}
                                alt="Cursor"
                                className="cursor-arrow"
                                style={{
                                    left: `${cursorPos3.x}px`,
                                    top: `${cursorPos3.y}px`
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
