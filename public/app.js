// DOE Power Testing Application - Frontend JavaScript

class DOEPowerApp {
    constructor() {
        this.testTypes = {};
        this.currentTestType = null;
        this.powerCurveChart = null;
        this.init();
    }

    async init() {
        await this.loadTestTypes();
        this.setupEventListeners();
        this.initializeChart();
    }

    async loadTestTypes() {
        try {
            const response = await fetch('/api/test-types');
            const data = await response.json();
            this.testTypes = data.testTypes;
            this.populateTestTypeSelect();
        } catch (error) {
            console.error('Error loading test types:', error);
            this.showError('Failed to load test types');
        }
    }

    populateTestTypeSelect() {
        const select = document.getElementById('testType');
        select.innerHTML = '<option value="">Select a test type...</option>';
        
        Object.entries(this.testTypes).forEach(([key, testType]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = testType.name;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        document.getElementById('testType').addEventListener('change', (e) => {
            this.onTestTypeChange(e.target.value);
        });

        document.getElementById('powerAnalysisForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculatePower();
        });

        document.getElementById('calculateSampleSize').addEventListener('click', () => {
            this.calculateSampleSize();
        });

        document.getElementById('generatePowerCurve').addEventListener('click', () => {
            this.generatePowerCurve();
        });
    }

    onTestTypeChange(testType) {
        this.currentTestType = testType;
        const testInfo = this.testTypes[testType];
        
        if (testInfo) {
            document.getElementById('testDescription').textContent = testInfo.description;
            this.createParameterInputs(testInfo.parameters);
            this.showTestExplanation(testType);
        } else {
            document.getElementById('testDescription').textContent = '';
            document.getElementById('parameterInputs').innerHTML = '';
            document.getElementById('resultsContainer').innerHTML = this.getEmptyResultsHTML();
        }
    }

    createParameterInputs(parameters) {
        const container = document.getElementById('parameterInputs');
        container.innerHTML = '';

        const parameterConfigs = {
            effectSize: { label: 'Effect Size (Cohen\'s d/f)', type: 'number', step: '0.01', min: '0', help: 'The standardized difference you want to detect' },
            effectSizeA: { label: 'Effect Size A (Cohen\'s f)', type: 'number', step: '0.01', min: '0', help: 'Effect size for factor A' },
            effectSizeB: { label: 'Effect Size B (Cohen\'s f)', type: 'number', step: '0.01', min: '0', help: 'Effect size for factor B' },
            effectSizeAB: { label: 'Effect Size AB (Cohen\'s f)', type: 'number', step: '0.01', min: '0', help: 'Effect size for interaction' },
            sampleSize: { label: 'Sample Size', type: 'number', step: '1', min: '2', help: 'Number of participants in your study' },
            sampleSize1: { label: 'Sample Size Group 1', type: 'number', step: '1', min: '2', help: 'Number of participants in group 1' },
            sampleSize2: { label: 'Sample Size Group 2', type: 'number', step: '1', min: '2', help: 'Number of participants in group 2' },
            sampleSizePerGroup: { label: 'Sample Size per Group', type: 'number', step: '1', min: '2', help: 'Number of participants in each group' },
            groups: { label: 'Number of Groups', type: 'number', step: '1', min: '2', help: 'Total number of groups in your study' },
            groupsA: { label: 'Groups in Factor A', type: 'number', step: '1', min: '2', help: 'Number of levels in factor A' },
            groupsB: { label: 'Groups in Factor B', type: 'number', step: '1', min: '2', help: 'Number of levels in factor B' },
            df: { label: 'Degrees of Freedom', type: 'number', step: '1', min: '1', help: 'Degrees of freedom for the test' },
            correlation: { label: 'Correlation Coefficient', type: 'number', step: '0.01', min: '-1', max: '1', help: 'Expected correlation coefficient' }
        };

        parameters.forEach(param => {
            const config = parameterConfigs[param];
            if (config) {
                const group = document.createElement('div');
                group.className = 'parameter-group';
                
                group.innerHTML = `
                    <div class="parameter-label">${config.label}</div>
                    <input type="${config.type}" 
                           class="form-control" 
                           id="${param}" 
                           name="${param}"
                           step="${config.step || '1'}"
                           min="${config.min || ''}"
                           max="${config.max || ''}"
                           ${param === 'effectSize' ? 'value="0.5"' : ''}
                           ${param === 'sampleSize' ? 'value="30"' : ''}
                           ${param === 'sampleSize1' ? 'value="30"' : ''}
                           ${param === 'sampleSize2' ? 'value="30"' : ''}
                           ${param === 'sampleSizePerGroup' ? 'value="20"' : ''}
                           ${param === 'groups' ? 'value="3"' : ''}
                           ${param === 'groupsA' ? 'value="2"' : ''}
                           ${param === 'groupsB' ? 'value="3"' : ''}
                           ${param === 'df' ? 'value="1"' : ''}
                           ${param === 'correlation' ? 'value="0.3"' : ''}
                           required>
                    <div class="help-text">${config.help}</div>
                `;
                
                container.appendChild(group);
            }
        });
    }

    showTestExplanation(testType) {
        const explanations = {
            't-test-one-sample': {
                title: 'One-Sample t-test',
                description: 'Tests whether the mean of a single group differs from a known population mean.',
                equation: 't = (x̄ - μ₀) / (s/√n)',
                interpretation: 'Use this when you have one group and want to compare it to a known value (like a population mean).'
            },
            't-test-two-sample': {
                title: 'Two-Sample t-test',
                description: 'Tests whether the means of two independent groups differ significantly.',
                equation: 't = (x̄₁ - x̄₂) / √(s²₁/n₁ + s²₂/n₂)',
                interpretation: 'Use this when comparing two separate groups (e.g., treatment vs. control).'
            },
            'paired-t-test': {
                title: 'Paired t-test',
                description: 'Tests whether paired observations differ significantly (before/after, matched pairs).',
                equation: 't = d̄ / (s_d/√n)',
                interpretation: 'Use this when you have related measurements (same subjects measured twice).'
            },
            'anova-one-way': {
                title: 'One-Way ANOVA',
                description: 'Tests whether means of three or more groups differ significantly.',
                equation: 'F = MS_between / MS_within',
                interpretation: 'Use this when comparing three or more independent groups.'
            },
            'anova-two-way': {
                title: 'Two-Way ANOVA',
                description: 'Tests main effects and interactions in factorial designs.',
                equation: 'F = MS_effect / MS_error',
                interpretation: 'Use this when you have two factors and want to test both main effects and their interaction.'
            },
            'chi-square': {
                title: 'Chi-Square Test',
                description: 'Tests independence between categorical variables or goodness of fit.',
                equation: 'χ² = Σ(O - E)² / E',
                interpretation: 'Use this when working with categorical data and testing relationships.'
            },
            'correlation': {
                title: 'Correlation Test',
                description: 'Tests whether a correlation coefficient differs significantly from zero.',
                equation: 't = r√(n-2) / √(1-r²)',
                interpretation: 'Use this when testing the strength of linear relationships between variables.'
            }
        };

        const explanation = explanations[testType];
        if (explanation) {
            const explanationHTML = `
                <div class="card mt-3">
                    <div class="card-header">
                        <h6><i class="fas fa-lightbulb me-2"></i>Test Explanation</h6>
                    </div>
                    <div class="card-body">
                        <h6>${explanation.title}</h6>
                        <p>${explanation.description}</p>
                        <div class="equation-box">
                            <strong>Formula:</strong> <code>${explanation.equation}</code>
                        </div>
                        <div class="interpretation-box">
                            <strong>When to use:</strong> ${explanation.interpretation}
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('parameterInputs').insertAdjacentHTML('afterend', explanationHTML);
        }
    }

    async calculatePower() {
        if (!this.currentTestType) {
            this.showError('Please select a test type');
            return;
        }

        this.showLoading();
        
        try {
            const parameters = this.getFormParameters();
            const response = await fetch('/api/power-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testType: this.currentTestType, parameters })
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                this.displayPowerResults(data.result);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to calculate power: ' + error.message);
        }
    }

    async calculateSampleSize() {
        if (!this.currentTestType) {
            this.showError('Please select a test type');
            return;
        }

        this.showLoading();
        
        try {
            const parameters = this.getFormParameters();
            const response = await fetch('/api/sample-size', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testType: this.currentTestType, parameters })
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                this.displaySampleSizeResults(data.result);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to calculate sample size: ' + error.message);
        }
    }

    async generatePowerCurve() {
        if (!this.currentTestType) {
            this.showError('Please select a test type');
            return;
        }

        this.showLoading();
        
        try {
            const parameters = this.getFormParameters();
            const response = await fetch('/api/power-curve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testType: this.currentTestType, parameters })
            });

            const data = await response.json();
            this.hideLoading();

            if (data.success) {
                this.updatePowerCurveChart(data.result);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to generate power curve: ' + error.message);
        }
    }

    getFormParameters() {
        const parameters = {};
        const form = document.getElementById('powerAnalysisForm');
        const formData = new FormData(form);
        
        for (let [key, value] of formData.entries()) {
            if (key !== 'testType') {
                parameters[key] = parseFloat(value);
            }
        }
        
        parameters.alpha = parseFloat(document.getElementById('alpha').value);
        parameters.power = parseFloat(document.getElementById('targetPower').value);
        
        return parameters;
    }

    displayPowerResults(result) {
        const power = typeof result === 'object' ? result.powerA || result : result;
        const powerPercent = (power * 100).toFixed(1);
        
        let resultHTML = `
            <div class="results-card results-animate">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="power-value">${powerPercent}%</div>
                        <div class="power-label">Statistical Power</div>
                    </div>
                    <div class="col-md-6">
                        <div class="power-interpretation">
                            ${this.getPowerInterpretation(power)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (typeof result === 'object' && result.powerA) {
            resultHTML += `
                <div class="row mt-3">
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Factor A Power</h6>
                                <h4 class="text-primary">${(result.powerA * 100).toFixed(1)}%</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Factor B Power</h6>
                                <h4 class="text-success">${(result.powerB * 100).toFixed(1)}%</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <h6>Interaction Power</h6>
                                <h4 class="text-info">${(result.powerAB * 100).toFixed(1)}%</h4>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        resultHTML += this.getEffectSizeGuidance();
        resultHTML += this.getExportButtons();

        document.getElementById('resultsContainer').innerHTML = resultHTML;
    }

    displaySampleSizeResults(result) {
        const resultHTML = `
            <div class="results-card results-animate">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="power-value">${result.sampleSize}</div>
                        <div class="power-label">Required Sample Size</div>
                    </div>
                    <div class="col-md-6">
                        <div class="power-interpretation">
                            <p><strong>Target Power:</strong> ${(result.targetPower * 100).toFixed(1)}%</p>
                            <p><strong>Actual Power:</strong> ${(result.actualPower * 100).toFixed(1)}%</p>
                            <p><strong>Significance Level:</strong> ${result.alpha}</p>
                        </div>
                    </div>
                </div>
            </div>
            ${this.getExportButtons()}
        `;

        document.getElementById('resultsContainer').innerHTML = resultHTML;
    }

    getPowerInterpretation(power) {
        if (power >= 0.8) {
            return '<span class="badge bg-success">Excellent Power</span><br>Your study has sufficient power to detect the effect.';
        } else if (power >= 0.6) {
            return '<span class="badge bg-warning">Moderate Power</span><br>Consider increasing sample size for better power.';
        } else {
            return '<span class="badge bg-danger">Low Power</span><br>Your study may not detect the effect. Increase sample size.';
        }
    }

    getEffectSizeGuidance() {
        return `
            <div class="card mt-3">
                <div class="card-header">
                    <h6><i class="fas fa-info-circle me-2"></i>Effect Size Interpretation</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <span class="effect-size-badge effect-small">Small Effect (0.2)</span>
                            <p class="mt-2 small">Minimal practical significance</p>
                        </div>
                        <div class="col-md-4">
                            <span class="effect-size-badge effect-medium">Medium Effect (0.5)</span>
                            <p class="mt-2 small">Moderate practical significance</p>
                        </div>
                        <div class="col-md-4">
                            <span class="effect-size-badge effect-large">Large Effect (0.8)</span>
                            <p class="mt-2 small">Strong practical significance</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getExportButtons() {
        return `
            <div class="export-buttons">
                <button class="btn btn-outline-primary btn-sm" onclick="app.exportResults('pdf')">
                    <i class="fas fa-file-pdf me-1"></i>Export PDF
                </button>
                <button class="btn btn-outline-success btn-sm" onclick="app.exportResults('csv')">
                    <i class="fas fa-file-csv me-1"></i>Export CSV
                </button>
                <button class="btn btn-outline-info btn-sm" onclick="app.copyResults()">
                    <i class="fas fa-copy me-1"></i>Copy Results
                </button>
            </div>
        `;
    }

    initializeChart() {
        const ctx = document.getElementById('powerCurveChart').getContext('2d');
        this.powerCurveChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Statistical Power',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Sample Size'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Power'
                        },
                        min: 0,
                        max: 1
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Power Curve'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updatePowerCurveChart(data) {
        this.powerCurveChart.data.labels = data.sampleSizes;
        this.powerCurveChart.data.datasets[0].data = data.powers;
        this.powerCurveChart.data.datasets[0].label = `${data.testType} Power`;
        this.powerCurveChart.update();
    }

    showLoading() {
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
    }

    hideLoading() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (modal) modal.hide();
    }

    showError(message) {
        const errorHTML = `
            <div class="alert alert-danger alert-custom" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
        document.getElementById('resultsContainer').innerHTML = errorHTML;
    }

    getEmptyResultsHTML() {
        return `
            <div class="text-center text-muted">
                <i class="fas fa-chart-line fa-3x mb-3"></i>
                <p>Configure your test parameters and click "Calculate Power" to see results.</p>
            </div>
        `;
    }

    exportResults(format) {
        // Placeholder for export functionality
        alert(`Export to ${format.toUpperCase()} functionality will be implemented.`);
    }

    copyResults() {
        const results = document.getElementById('resultsContainer').innerText;
        navigator.clipboard.writeText(results).then(() => {
            alert('Results copied to clipboard!');
        });
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DOEPowerApp();
});