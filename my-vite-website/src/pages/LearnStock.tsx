import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';
import LearnStockIcon from '../images/LearnStock.svg';
import LearnVolatilityIcon from '../images/LearnVolatility.svg';
import StopLossCalc from '../images/Stoplosscalc.svg';
import LearnStockText from '../images/LearnStockText.svg';

const LearnStock: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div>
            <div className="blue-background"></div>
            <header className="banner">
                <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>VOLATILITY EXPLAINED</h1>
                <div className="header-icons">
                    <img
                        src={LearnStockIcon}
                        alt="Learn Stock"
                        className="header-icon"
                        onClick={() => navigate('/LearnStock')}
                    />
                    <img
                        src={LearnVolatilityIcon}
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
            <div className="content-rectangle" style={{ marginTop: 0, minHeight: '100vh', paddingTop: '100px' }}>
                <div className="learn-volatility-wrapper">
                    <div className="learn-volatility-card">
                        <img src={LearnStockText} alt="Learn Stock graphic" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearnStock;
