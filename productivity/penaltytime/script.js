let penalties = JSON.parse(localStorage.getItem('penalties') || '[]');
let countdownInterval;
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let penaltyChart = null;
const DAILY_SNAPSHOT_KEY = 'penaltyTimeSnapshots';
let currentGraphType = localStorage.getItem('penaltyGraphType') || 'bar';
const RECENT_TREND_KEY = 'penaltyTimeRecentTrend';
const TREND_INTERVAL_MINUTES = 15; // Store data point every 15 minutes
let recentTrendChart = null;

// Update display on page load
window.addEventListener('load', () => {
    // Restore saved rate
    const savedRate = localStorage.getItem('penaltyRate');
    if (savedRate) {
        document.getElementById('rate').value = savedRate;
    }
    
    takeDailySnapshot();
    updateHistory();
    updateTotal();
    startCountdown();
    updateGraph();
    updateRecentTrendGraph();
    
    // Start trend tracking
    updateRecentTrend();
    setInterval(updateRecentTrend, TREND_INTERVAL_MINUTES * 60 * 1000);
    
    // Add graph toggle handler and set initial button text
    document.getElementById('toggleGraph').addEventListener('click', toggleGraphType);
    document.getElementById('toggleGraph').textContent = 
        `Switch to ${currentGraphType === 'bar' ? 'Line' : 'Bar'} Graph`;
});

function saveRate() {
    const rate = document.getElementById('rate').value;
    localStorage.setItem('penaltyRate', rate);
}

function calculatePenalty() {
    const amount = parseFloat(document.getElementById('amount').value);
    const rate = parseFloat(document.getElementById('rate').value);

    if (isNaN(amount) || isNaN(rate)) {
        alert('Please enter valid numbers');
        return;
    }

    const penaltyMinutes = amount * rate;
    const hours = Math.floor(penaltyMinutes / 60);
    const minutes = Math.round(penaltyMinutes % 60);

    const resultText = `Penalty: ${hours} hours and ${minutes} minutes`;
    document.getElementById('result').textContent = resultText;

    penalties.push({
        amount: amount,
        minutes: penaltyMinutes,
        timestamp: new Date().toISOString(),
        endTime: new Date(Date.now() + penaltyMinutes * 60 * 1000).toISOString()
    });

    localStorage.setItem('penalties', JSON.stringify(penalties));

    currentPage = 1;
    updateHistory();
    updateTotal();
    startCountdown();
    updateGraph();
    updateRecentTrend();

    document.getElementById('amount').value = '';
}

function startCountdown() {
    clearInterval(countdownInterval);
    
    const countdownElement = document.getElementById('countdown');
    const countdownDisplay = document.getElementById('countdown-display');
    
    function updateCountdown() {
        let totalRemainingSeconds = 0;
        const now = new Date();

        penalties.forEach(penalty => {
            const endTime = new Date(penalty.endTime);
            if (endTime > now) {
                const remainingMs = endTime - now;
                totalRemainingSeconds += remainingMs / 1000;
            }
        });

        if (totalRemainingSeconds <= 0) {
            countdownElement.style.display = 'none';
            return;
        }

        countdownElement.style.display = 'block';
        const hours = Math.floor(totalRemainingSeconds / 3600);
        const minutes = Math.floor((totalRemainingSeconds % 3600) / 60);
        const seconds = Math.floor(totalRemainingSeconds % 60);

        countdownDisplay.textContent = 
            `${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

function updateHistory() {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = '<h2>History</h2>';

    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear History';
    clearButton.style.marginBottom = '10px';
    clearButton.onclick = clearHistory;
    historyDiv.appendChild(clearButton);

    const totalPages = Math.ceil(penalties.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    historyDiv.appendChild(pageInfo);

    penalties.slice().reverse()
        .slice(startIndex, endIndex)
        .forEach((penalty) => {
            const hours = Math.floor(penalty.minutes / 60);
            const minutes = Math.round(penalty.minutes % 60);
            const endTime = new Date(penalty.endTime);
            const isComplete = endTime <= new Date();
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.style.opacity = isComplete ? '0.5' : '1';
            historyItem.innerHTML = `
                <span>₹${penalty.amount.toFixed(2)}</span>
                <span>${hours}h ${minutes}m ${isComplete ? '(Completed)' : ''}</span>
            `;
            historyDiv.appendChild(historyItem);
        });

    if (totalPages > 1) {
        const pagination = document.createElement('div');
        pagination.className = 'pagination';

        const prevButton = document.createElement('button');
        prevButton.textContent = '← Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                updateHistory();
            }
        };
        pagination.appendChild(prevButton);

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next →';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateHistory();
            }
        };
        pagination.appendChild(nextButton);

        historyDiv.appendChild(pagination);
    }
}

function clearHistory() {
    if (confirm('Are you sure you want to clear the history display? (Active penalties will continue)')) {
        const now = new Date();
        penalties = penalties.filter(penalty => {
            const endTime = new Date(penalty.endTime);
            return endTime > now;
        });
        
        localStorage.setItem('penalties', JSON.stringify(penalties));
        currentPage = 1;
        updateHistory();
        updateTotal();
        document.getElementById('result').textContent = 'Your penalty time will appear here';
        updateGraph();
        updateRecentTrend();
    }
}

function updateTotal() {
    const now = new Date();
    const totalMinutes = penalties.reduce((sum, penalty) => {
        const endTime = new Date(penalty.endTime);
        if (endTime > now) {
            const remainingMs = endTime - now;
            return sum + (remainingMs / (60 * 1000));
        }
        return sum;
    }, 0);

    const totalHours = Math.floor(totalMinutes / 60);
    const totalMinutesRemainder = Math.round(totalMinutes % 60);

    document.getElementById('total').textContent = 
        `Total Remaining Time: ${totalHours} hours and ${totalMinutesRemainder} minutes`;
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function takeDailySnapshot() {
    const today = getTodayDate();
    let snapshots = JSON.parse(localStorage.getItem(DAILY_SNAPSHOT_KEY) || '{}');
    
    // Only take one snapshot per day
    if (!snapshots[today]) {
        const now = new Date();
        const totalMinutes = penalties.reduce((sum, penalty) => {
            const endTime = new Date(penalty.endTime);
            if (endTime > now) {
                const remainingMs = endTime - now;
                return sum + (remainingMs / (60 * 1000));
            }
            return sum;
        }, 0);

        snapshots[today] = totalMinutes;
        localStorage.setItem(DAILY_SNAPSHOT_KEY, JSON.stringify(snapshots));
    }
}

function updateGraph() {
    const ctx = document.getElementById('penaltyGraph');
    
    // Get the last 10 days
    const now = new Date();
    const days = Array.from({length: 10}, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    // Get snapshots data
    const snapshots = JSON.parse(localStorage.getItem(DAILY_SNAPSHOT_KEY) || '{}');

    // Get daily penalty times
    const dailyTimes = days.map(day => {
        return snapshots[day] || 0;
    });

    // Destroy existing chart if it exists
    if (penaltyChart) {
        penaltyChart.destroy();
    }

    // Create new chart
    penaltyChart = new Chart(ctx, {
        type: currentGraphType,
        data: {
            labels: days.map(day => {
                const date = new Date(day);
                return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                });
            }),
            datasets: [{
                label: 'Daily Penalty Time (hours)',
                data: dailyTimes.map(minutes => +(minutes / 60).toFixed(1)),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: currentGraphType === 'line' ? 2 : 1,
                tension: 0.1,  // Slight curve for line graph
                fill: currentGraphType === 'line' ? 0.3 : undefined
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (hours)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Penalty Time Snapshots - Last 10 Days'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const hours = context.raw;
                            const minutes = Math.round((hours % 1) * 60);
                            return `${Math.floor(hours)}h ${minutes}m`;
                        }
                    }
                }
            }
        }
    });
}

function toggleGraphType() {
    currentGraphType = currentGraphType === 'bar' ? 'line' : 'bar';
    localStorage.setItem('penaltyGraphType', currentGraphType);
    const button = document.getElementById('toggleGraph');
    button.textContent = `Switch to ${currentGraphType === 'bar' ? 'Line' : 'Bar'} Graph`;
    updateGraph();
}

function updateRecentTrend() {
    const now = new Date();
    let trendData = JSON.parse(localStorage.getItem(RECENT_TREND_KEY) || '[]');
    
    // Remove data points older than 3 hours
    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
    trendData = trendData.filter(point => new Date(point.timestamp) > threeHoursAgo);
    
    // Calculate current total remaining time
    const totalMinutes = penalties.reduce((sum, penalty) => {
        const endTime = new Date(penalty.endTime);
        if (endTime > now) {
            const remainingMs = endTime - now;
            return sum + (remainingMs / (60 * 1000));
        }
        return sum;
    }, 0);

    // Add new data point
    trendData.push({
        timestamp: now.toISOString(),
        minutes: totalMinutes
    });

    localStorage.setItem(RECENT_TREND_KEY, JSON.stringify(trendData));
    updateRecentTrendGraph();
}

function updateRecentTrendGraph() {
    const ctx = document.getElementById('recentTrendGraph');
    
    // Get trend data
    const trendData = JSON.parse(localStorage.getItem(RECENT_TREND_KEY) || '[]');
    
    // Destroy existing chart if it exists
    if (recentTrendChart) {
        recentTrendChart.destroy();
    }

    // Create new chart
    recentTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.map(point => {
                const date = new Date(point.timestamp);
                return date.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                });
            }),
            datasets: [{
                label: 'Remaining Time (hours)',
                data: trendData.map(point => +(point.minutes / 60).toFixed(1)),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (hours)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Penalty Time Trend - Last 3 Hours'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const hours = context.raw;
                            const minutes = Math.round((hours % 1) * 60);
                            return `${Math.floor(hours)}h ${minutes}m`;
                        }
                    }
                }
            }
        }
    });
}

// Update total every minute
setInterval(updateTotal, 60000); 