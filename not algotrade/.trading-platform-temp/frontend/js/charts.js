function initializeCharts() {
    console.log('Initializing charts...');
    
    // Portfolio Performance Line Chart
    const portfolioCanvas = document.getElementById('portfolioChart');
    if (portfolioCanvas) {
        new Chart(portfolioCanvas, {
            type: 'line',
            data: {
                labels: ['9:15', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:15', '15:30'],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [
                        500000,    // Opening balance
                        499200,    // Small initial drawdown
                        501500,    // Recovery
                        504200,    // Morning momentum
                        503100,    // Small pullback
                        505800,    // Pre-lunch rally
                        504900,    // Lunch hour consolidation
                        504700,    // Lunch hour dip
                        506300,    // Early afternoon momentum
                        508900,    // Trend continuation
                        507200,    // Small profit booking
                        509500,    // Fresh buying
                        512800,    // Late day rally
                        514200,    // Final push
                        515600     // Closing balance
                    ],
                    borderColor: '#1a237e',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(26, 35, 126, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const profit = context.raw - 500000;
                                const profitText = profit >= 0 ? 
                                    `+₹${profit.toLocaleString('en-IN')}` : 
                                    `-₹${Math.abs(profit).toLocaleString('en-IN')}`;
                                return [
                                    `Value: ₹${context.raw.toLocaleString('en-IN')}`,
                                    `P&L: ${profitText} (${((profit/500000)*100).toFixed(2)}%)`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 495000,
                        max: 520000,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value/1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }

    // Strategy Distribution Pie Chart
    const strategyCanvas = document.getElementById('strategyPieChart');
    if (strategyCanvas) {
        new Chart(strategyCanvas, {
            type: 'doughnut',
            data: {
                labels: [
                    'Nifty Options',
                    'Bank Nifty Options',
                    'Index Futures',
                    'Stock Options',
                    'Stock Futures'
                ],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#1a237e',  // Deep blue
                        '#283593',  // Royal blue
                        '#3949ab',  // Medium blue
                        '#5c6bc0',  // Light blue
                        '#7986cb'   // Pale blue
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 11,
                                family: "'Inter', sans-serif"
                            },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                const capital = (value / 100 * 500000).toLocaleString('en-IN');
                                return [
                                    `${context.label}: ${percentage}%`,
                                    `Capital: ₹${capital}`
                                ];
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    // Daily P&L Bar Chart
    const pnlCanvas = document.getElementById('dailyPnlChart');
    if (pnlCanvas) {
        new Chart(pnlCanvas, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    label: 'P&L',
                    data: [12500, -8200, 15400, 9800, -4800],
                    backgroundColor: function(context) {
                        return context.raw >= 0 ? '#00c853' : '#ff1744';
                    }
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const sign = context.raw >= 0 ? '+' : '';
                                return 'P&L: ' + sign + '₹' + context.raw.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value/1000).toFixed(1) + 'k';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Risk Metrics Radar Chart
    const riskCanvas = document.getElementById('riskMetricsChart');
    if (riskCanvas) {
        new Chart(riskCanvas, {
            type: 'radar',
            data: {
                labels: ['Win Rate', 'Risk/Reward', 'Max DD', 'Sharpe', 'ROI'],
                datasets: [{
                    label: 'Current Month',
                    data: [72, 65, 85, 78, 82],
                    borderColor: '#1a237e',
                    backgroundColor: 'rgba(26, 35, 126, 0.2)'
                }, {
                    label: 'Last Month',
                    data: [65, 58, 75, 71, 73],
                    borderColor: '#3949ab',
                    backgroundColor: 'rgba(57, 73, 171, 0.2)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        },
                        pointLabels: {
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Backtest Performance Chart
    const backtestPerformanceCanvas = document.getElementById('backtestPerformanceChart');
    if (backtestPerformanceCanvas) {
        new Chart(backtestPerformanceCanvas, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Strategy Returns',
                    data: [0, 2.5, 4.8, 7.2],
                    borderColor: '#1a237e',
                    backgroundColor: 'rgba(26, 35, 126, 0.1)',
                    fill: true
                }, {
                    label: 'Benchmark',
                    data: [0, 1.2, 2.1, 3.5],
                    borderColor: '#757575',
                    borderDash: [5, 5],
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Backtest Distribution Chart
    const backtestDistributionCanvas = document.getElementById('backtestDistributionChart');
    if (backtestDistributionCanvas) {
        new Chart(backtestDistributionCanvas, {
            type: 'bar',
            data: {
                labels: ['< -2%', '-2% to -1%', '-1% to 0%', '0% to 1%', '1% to 2%', '> 2%'],
                datasets: [{
                    label: 'Trade Distribution',
                    data: [5, 12, 18, 25, 15, 8],
                    backgroundColor: function(context) {
                        const value = context.raw;
                        const index = context.dataIndex;
                        if (index < 3) return '#ff1744';  // Red for losses
                        return '#00c853';  // Green for profits
                    }
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Trades: ' + context.raw;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Trades'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Return Range'
                        }
                    }
                }
            }
        });
    }

    // Monthly Performance Chart
    const monthlyPerformanceCanvas = document.getElementById('monthlyPerformanceChart');
    if (monthlyPerformanceCanvas) {
        new Chart(monthlyPerformanceCanvas, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Monthly Returns',
                    data: [3.2, -1.8, 4.5, 2.8, 5.2, 3.9],
                    borderColor: '#1a237e',
                    backgroundColor: 'rgba(26, 35, 126, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Return: ' + context.raw + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Strategy-wise P&L Chart
    const strategyPnLCanvas = document.getElementById('strategyPnLChart');
    if (strategyPnLCanvas) {
        new Chart(strategyPnLCanvas, {
            type: 'bar',
            data: {
                labels: ['Delta Neutral', 'Strangle BNF', 'Momentum', 'Options Writing'],
                datasets: [{
                    label: 'P&L',
                    data: [28500, 15200, -8400, 17150],
                    backgroundColor: function(context) {
                        return context.raw >= 0 ? '#00c853' : '#ff1744';
                    }
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const sign = context.raw >= 0 ? '+' : '';
                                return 'P&L: ' + sign + '₹' + context.raw.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value/1000).toFixed(1) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }
} 