// Constants for share counts and EPS (from Q1 2025 10-K filing)
const DILUTED_SHARES = 909241619; // exact share count
const DILUTED_EPS = 0.37; // dollars per share

// DOM elements
const sharesInput = document.getElementById('shares');
const errorDiv = document.getElementById('error');
const dilutedResult = document.getElementById('diluted-result');
const epsResult = document.getElementById('eps-result');
const downloadButton = document.getElementById('download');

// Initialize chart
let ownershipChart = null;

// Current calculation results
let currentMetrics = {
    shares: 0,
    diluted: 0,
    eps: 0
};

// Helper function to format percentage with 6 decimal places
function formatPercentage(value) {
    return value.toFixed(10) + '%';
}

// Helper function to format currency
function formatCurrency(value) {
    return '$' + value.toFixed(2);
}

// Helper function to format number with commas
function formatNumber(number) {
    return number.toLocaleString();
}

// Helper function to get current date and time
function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleString();
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
    
    // Store current results
    currentMetrics = {
        shares: shares,
        diluted: dilutedPercentage,
        eps: annualEPS
    };
    
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

// Generate and download PDF report
function downloadReport() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set font sizes
    const titleSize = 16;
    const headingSize = 14;
    const normalSize = 12;
    
    // Add title
    doc.setFontSize(titleSize);
    doc.text('Robinhood ($HOOD) Ownership Report', 20, 20);
    
    // Add generation date
    doc.setFontSize(normalSize);
    doc.text(`Generated: ${getCurrentDateTime()}`, 20, 30);

    // Draw a line
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Add Q1 2025 Analysis section
    doc.setFontSize(headingSize);
    doc.text('Q1 2025 Analysis', 20, 45);
    doc.setFontSize(normalSize);
    doc.text([
        `Shares Owned: ${formatNumber(currentMetrics.shares)}`,
        `Diluted Ownership: ${formatPercentage(currentMetrics.diluted)}`,
        `Annual EPS: ${formatCurrency(currentMetrics.eps)}`
    ], 20, 55);

    // Draw a line
    doc.line(20, 75, 190, 75);
    
    // Add Company Data section
    doc.setFontSize(headingSize);
    doc.text('Company Data', 20, 85);
    doc.setFontSize(normalSize);
    doc.text([
        `Total Diluted Shares: ${formatNumber(DILUTED_SHARES)}`,
        `Diluted EPS: ${formatCurrency(DILUTED_EPS)}`
    ], 20, 95);

    // Draw a line
    doc.line(20, 105, 190, 105);
    
    // Add source information
    doc.setFontSize(normalSize);
    doc.text('Source: Robinhood Q1 2025 10-K Filing', 20, 115);
    doc.setTextColor(0, 0, 255);
    doc.text('https://investors.robinhood.com/node/13536/html', 20, 122);
    
    // Save the PDF
    const date = new Date().toISOString().split('T')[0];
    doc.save(`hood-ownership-${date}.pdf`);
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

// Event listeners
sharesInput.addEventListener('input', handleCalculate);
downloadButton.addEventListener('click', downloadReport);

// Calculate initial values
handleCalculate(); 