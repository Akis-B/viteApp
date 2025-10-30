import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import '../styles.css';

interface DataPoint {
    timestamp: string;
    portfolio_value: string;
    holding?: string;
    price?: string;
}

interface ChartData {
    buyHold: DataPoint[];
    strategy: DataPoint[];
}

const StopLoss: React.FC = () => {
    const navigate = useNavigate();
    const chartRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ticker, setTicker] = useState('SPY');
    const [inputTicker, setInputTicker] = useState('SPY');
    const [stopLoss, setStopLoss] = useState(-3); // -3% default
    const [reEntry, setReEntry] = useState(2); // +2% default

    useEffect(() => {
        const fetchDataAndRender = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch data from API with ticker and strategy parameters
                const response = await fetch(`http://localhost:3001/api/run-stoploss?ticker=${ticker}&stopLoss=${Math.abs(stopLoss)}&reEntry=${reEntry}`);
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to fetch data');
                }

                const data: ChartData = result.data;
                renderChart(data);
                setLoading(false);
            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        fetchDataAndRender();
    }, [ticker, stopLoss, reEntry]);

    const renderChart = (data: ChartData) => {
        if (!chartRef.current) return;

        // Clear previous chart
        d3.select(chartRef.current).selectAll('*').remove();

        const margin = { top: 60, right: 120, bottom: 80, left: 80 };
        const width = 850 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Parse data
        const buyHoldData = data.buyHold.map(d => ({
            date: new Date(d.timestamp),
            value: parseFloat(d.portfolio_value)
        }));

        const strategyData = data.strategy.map(d => ({
            date: new Date(d.timestamp),
            value: parseFloat(d.portfolio_value),
            holding: parseInt(d.holding || '0')
        }));

        // Create scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(buyHoldData, d => d.date) as [Date, Date])
            .range([0, width]);

        const allValues = [...buyHoldData.map(d => d.value), ...strategyData.map(d => d.value)];
        const yScale = d3.scaleLinear()
            .domain([d3.min(allValues)! * 0.98, d3.max(allValues)! * 1.02])
            .range([height, 0]);

        // Create line generators
        const buyHoldLine = d3.line<{ date: Date; value: number }>()
            .x(d => xScale(d.date))
            .y(d => yScale(d.value));

        const strategyLine = d3.line<{ date: Date; value: number; holding: number }>()
            .x(d => xScale(d.date))
            .y(d => yScale(d.value));

        // Add gridlines
        svg.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat(() => ''));

        // Add X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .style('color', 'white')
            .selectAll('text')
            .style('fill', 'white');

        // Add Y axis
        svg.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d => `$${d3.format(',.0f')(d as number)}`))
            .style('color', 'white')
            .selectAll('text')
            .style('fill', 'white');

        // Add Strategy line (render first so it's behind)
        svg.append('path')
            .datum(strategyData)
            .attr('fill', 'none')
            .attr('stroke', '#E5E020')
            .attr('stroke-width', 3)
            .attr('d', strategyLine);

        // Add Buy & Hold line (render second so it's on top)
        svg.append('path')
            .datum(buyHoldData)
            .attr('fill', 'none')
            .attr('stroke', '#1AB832')
            .attr('stroke-width', 3)
            .attr('d', buyHoldLine);

        // Add title with ticker
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -30)
            .attr('text-anchor', 'middle')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text(`${ticker} - Stop-Loss Strategy vs Buy & Hold`);

        // Add legend with transparent background (bottom right)
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 180}, ${height - 80})`);

        // Add legend background (transparent)
        legend.append('rect')
            .attr('x', -10)
            .attr('y', -15)
            .attr('width', 170)
            .attr('height', 65)
            .attr('fill', 'transparent')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('rx', 5);

        // Buy & Hold legend item
        legend.append('line')
            .attr('x1', 0)
            .attr('x2', 40)
            .attr('y1', 5)
            .attr('y2', 5)
            .attr('stroke', '#1AB832')
            .attr('stroke-width', 3);

        legend.append('text')
            .attr('x', 50)
            .attr('y', 10)
            .style('fill', 'white')
            .style('font-size', '14px')
            .text('Buy & Hold');

        // Strategy legend item
        legend.append('line')
            .attr('x1', 0)
            .attr('x2', 40)
            .attr('y1', 35)
            .attr('y2', 35)
            .attr('stroke', '#E5E020')
            .attr('stroke-width', 3);

        legend.append('text')
            .attr('x', 50)
            .attr('y', 40)
            .style('fill', 'white')
            .style('font-size', '14px')
            .text('Stop-Loss Strategy');

        // Add axis labels
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-size', '16px')
            .text('Portfolio Value ($)');

        svg.append('text')
            .attr('y', height + 50)
            .attr('x', width / 2)
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-size', '16px')
            .text('Date');
    };

    return (
        <div>
            <div className="blue-background"></div>
            <header className="banner">
                <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>VOLATILITY EXPLAINED</h1>
            </header>
            <div className="content-rectangle" style={{ marginTop: 0, minHeight: '100vh', paddingTop: '100px' }}>
                <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '850px', margin: '0 auto' }}>
                    {/* Ticker Input */}
                    <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label style={{ color: 'white', fontSize: '18px', fontFamily: 'PT Serif, serif' }}>
                            Ticker:
                        </label>
                        <input
                            type="text"
                            value={inputTicker}
                            onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setTicker(inputTicker);
                                }
                            }}
                            style={{
                                padding: '8px 12px',
                                fontSize: '16px',
                                border: '2px solid white',
                                borderRadius: '4px',
                                backgroundColor: 'transparent',
                                color: 'white',
                                width: '120px',
                                textTransform: 'uppercase'
                            }}
                            placeholder="SPY"
                        />
                        <button
                            onClick={() => setTicker(inputTicker)}
                            style={{
                                padding: '8px 20px',
                                fontSize: '16px',
                                border: '2px solid #E5E020',
                                borderRadius: '4px',
                                backgroundColor: 'transparent',
                                color: '#E5E020',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#E5E020';
                                e.currentTarget.style.color = '#4E45FF';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#E5E020';
                            }}
                        >
                            Calculate
                        </button>
                    </div>

                    {/* Sliders */}
                    <div style={{ width: '100%', maxWidth: '700px', marginBottom: '40px', display: 'flex', gap: '30px' }}>
                        {/* Stop Loss Slider */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ color: 'white', fontSize: '16px', fontFamily: 'PT Serif, serif' }}>
                                    Sell when...
                                </label>
                                <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', fontFamily: 'PT Serif, serif' }}>
                                    {stopLoss}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-5"
                                max="5"
                                step="0.5"
                                value={stopLoss}
                                onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: '8px',
                                    borderRadius: '5px',
                                    outline: 'none',
                                    background: `linear-gradient(to right, white 0%, white ${((stopLoss + 5) / 10) * 100}%, #666 ${((stopLoss + 5) / 10) * 100}%, #666 100%)`,
                                    cursor: 'pointer'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '12px', marginTop: '4px' }}>
                                <span>-5%</span>
                                <span>+5%</span>
                            </div>
                        </div>

                        {/* Re-entry Slider */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ color: 'white', fontSize: '16px', fontFamily: 'PT Serif, serif' }}>
                                    Buy again...
                                </label>
                                <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', fontFamily: 'PT Serif, serif' }}>
                                    +{reEntry}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-5"
                                max="5"
                                step="0.5"
                                value={reEntry}
                                onChange={(e) => setReEntry(parseFloat(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: '8px',
                                    borderRadius: '5px',
                                    outline: 'none',
                                    background: `linear-gradient(to right, white 0%, white ${((reEntry + 5) / 10) * 100}%, #666 ${((reEntry + 5) / 10) * 100}%, #666 100%)`,
                                    cursor: 'pointer'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '12px', marginTop: '4px' }}>
                                <span>-5%</span>
                                <span>+5%</span>
                            </div>
                        </div>
                    </div>

                    {loading && (
                        <div style={{ color: 'white', fontSize: '24px', padding: '50px' }}>
                            Loading data and generating chart...
                        </div>
                    )}
                    {error && (
                        <div style={{ color: '#FF0000', fontSize: '18px', padding: '50px' }}>
                            Error: {error}
                        </div>
                    )}
                    <div ref={chartRef} style={{ marginTop: '20px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default StopLoss;
