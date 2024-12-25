const yahooFinance = require('yahoo-finance2').default; // Add .default to get the correct API
const moment = require('moment');

async function calculateMonthlyProfits() {
    try {
        // Get TATASTEEL.NS data for 2024
        const result = await yahooFinance.historical('TATASTEEL.NS', {
            period1: '2024-01-01',
            period2: '2024-12-31', 
            interval: '1d'
        });

        let totalProfit = 0;
        const monthlyProfits = [];

        // Group data by month
        const monthlyData = {};
        result.forEach(record => {
            const month = moment(record.date).format('YYYY-MM');
            if (!monthlyData[month]) {
                monthlyData[month] = [];
            }
            monthlyData[month].push(record);
        });

        // Calculate profit for even months (Feb, Apr, Jun...)
        Object.keys(monthlyData).forEach((month, index) => {
            // Process odd indexed months (1-based index, so 1,3,5... represents Feb,Apr,Jun...)
            if ((index + 1) % 2 === 0) {
                const monthData = monthlyData[month];
                if (monthData.length > 0) {
                    const firstDayPrice = monthData[0].open;
                    const lastDayPrice = monthData[monthData.length - 1].close;
                    const profit = lastDayPrice - firstDayPrice;
                    
                    monthlyProfits.push({
                        month,
                        buyPrice: firstDayPrice,
                        sellPrice: lastDayPrice,
                        profit: profit.toFixed(2)
                    });
                    
                    totalProfit += profit;
                }
            }
        });

        // Print results
        console.log('\nEven Monthly Profit/Loss Breakdown (Feb,Apr,Jun,...):');
        console.log('------------------------------');
        monthlyProfits.forEach(mp => {
            console.log(`${mp.month}:`);
            console.log(`  Buy Price: ₹${mp.buyPrice}`);
            console.log(`  Sell Price: ₹${mp.sellPrice}`);
            console.log(`  Profit/Loss: ₹${mp.profit}`);
            console.log('------------------------------');
        });

        console.log(`\nTotal Profit/Loss for even months in 2024: ₹${totalProfit.toFixed(2)}`);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Run the analysis
calculateMonthlyProfits();
