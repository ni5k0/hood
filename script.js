// Constants for share counts and EPS (from Q1 2025 10-K filing)
const DILUTED_SHARES = 909241619; // exact share count
const DILUTED_EPS = 0.37; // dollars per share

// DOM elements
const sharesInput = document.getElementById('shares');
const errorDiv = document.getElementById('error');
const dilutedResult = document.getElementById('diluted-result');
const epsResult = document.getElementById('eps-result');

// Initialize chart
let ownershipChart = null;

// Helper function to format percentage with 6 decimal places
function formatPercentage(value) {
    return value.toFixed(10) + '%';
}

// Helper function to format currency
function formatCurrency(value) {
    return '$' + value.toFixed(2);
}

// Helper function to validate input
function validateInput(shares) {
    if (!shares || shares.trim() === '') {
        throw new Error('Please enter the number of shares.');
    }
    
    const numShares = Number(shares);
    
    if (isNaN(numShares)) {
        throw new Error('Please enter a valid number.');
    }
    
    if (numShares < 0) {
        throw new Error('Please enter a positive number of shares.');
    }
    
    if (!Number.isInteger(numShares)) {
        throw new Error('Please enter a whole number of shares.');
    }

    if (numShares > DILUTED_SHARES) {
        throw new Error(`Cannot exceed total diluted shares (${DILUTED_SHARES.toLocaleString()} shares).`);
    }
    
    return numShares;
}

// Calculate ownership percentage and EPS
function calculateMetrics(shares) {
    const dilutedPercentage = (shares / DILUTED_SHARES) * 100;
    const annualEPS = shares * DILUTED_EPS;
    
    return {
        diluted: dilutedPercentage,
        eps: annualEPS
    };
}

// Create or update chart
function updateChart(percentage) {
    // Ensure the slice is visible for small percentages (1 share or more)
    const minVisiblePercentage = 0.5;
    const displayPercentage = percentage > 0 ? Math.max(percentage, minVisiblePercentage) : 0;
    const otherPercentage = percentage > 0 ? 100 - Math.max(percentage, minVisiblePercentage) : 100;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'black',
                    font: {
                        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
                    },
                    generateLabels: (chart) => {
                        const data = chart.data;
                        return [{
                            text: 'Your Ownership' + (percentage < minVisiblePercentage && percentage > 0 ? ' (scaled for visibility)' : ''),
                            fillStyle: '#000000',
                            index: 0
                        }, {
                            text: 'Other Shareholders',
                            fillStyle: '#E5E5E5',
                            index: 1
                        }];
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        if (context.dataIndex === 0) {
                            return `Your Ownership: ${formatPercentage(percentage)}`;
                        }
                        return `Other Shareholders: ${formatPercentage(100 - percentage)}`;
                    }
                }
            }
        }
    };

    const chartData = {
        datasets: [{
            data: [displayPercentage, otherPercentage],
            backgroundColor: ['#000000', '#E5E5E5'],
            borderWidth: 0
        }],
        labels: ['Your Ownership', 'Other Shareholders']
    };

    if (ownershipChart) {
        ownershipChart.data = chartData;
        ownershipChart.options = chartOptions;
        ownershipChart.update();
    } else {
        ownershipChart = new Chart(document.getElementById('ownershipChart'), {
            type: 'pie',
            data: chartData,
            options: chartOptions
        });
    }
}

// Handle the calculation
function handleCalculate() {
    // Clear previous error
    errorDiv.textContent = '';
    
    try {
        const shares = validateInput(sharesInput.value);
        const metrics = calculateMetrics(shares);
        
        dilutedResult.textContent = formatPercentage(metrics.diluted);
        epsResult.textContent = formatCurrency(metrics.eps);
        
        // Update the chart
        updateChart(metrics.diluted);
    } catch (error) {
        errorDiv.textContent = error.message;
        dilutedResult.textContent = '-';
        epsResult.textContent = '-';
        
        // Update chart with 0 ownership
        updateChart(0);
    }
}

// Event listener for input changes
sharesInput.addEventListener('input', handleCalculate);

// Calculate initial values
handleCalculate(); 