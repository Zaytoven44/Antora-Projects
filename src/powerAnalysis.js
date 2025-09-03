const jStat = require('jstat');
const math = require('mathjs');

class PowerAnalysis {
    constructor() {
        this.testTypes = {
            't-test-one-sample': {
                name: 'One-Sample t-test',
                parameters: ['effectSize', 'sampleSize', 'alpha', 'power'],
                description: 'Test if a sample mean differs from a known population mean'
            },
            't-test-two-sample': {
                name: 'Two-Sample t-test',
                parameters: ['effectSize', 'sampleSize1', 'sampleSize2', 'alpha', 'power'],
                description: 'Test if two sample means differ significantly'
            },
            'paired-t-test': {
                name: 'Paired t-test',
                parameters: ['effectSize', 'sampleSize', 'alpha', 'power'],
                description: 'Test if paired observations differ significantly'
            },
            'anova-one-way': {
                name: 'One-Way ANOVA',
                parameters: ['effectSize', 'groups', 'sampleSizePerGroup', 'alpha', 'power'],
                description: 'Test if means of multiple groups differ significantly'
            },
            'anova-two-way': {
                name: 'Two-Way ANOVA',
                parameters: ['effectSizeA', 'effectSizeB', 'effectSizeAB', 'groupsA', 'groupsB', 'sampleSizePerGroup', 'alpha', 'power'],
                description: 'Test main effects and interaction in factorial design'
            },
            'chi-square': {
                name: 'Chi-Square Test',
                parameters: ['effectSize', 'df', 'alpha', 'power'],
                description: 'Test independence or goodness of fit'
            },
            'correlation': {
                name: 'Correlation Test',
                parameters: ['correlation', 'sampleSize', 'alpha', 'power'],
                description: 'Test if correlation differs from zero'
            }
        };
    }

    getAvailableTestTypes() {
        return this.testTypes;
    }

    calculatePower(testType, parameters) {
        if (!this.testTypes[testType]) {
            throw new Error(`Unknown test type: ${testType}`);
        }

        switch (testType) {
            case 't-test-one-sample':
                return this.oneSampleTTestPower(parameters);
            case 't-test-two-sample':
                return this.twoSampleTTestPower(parameters);
            case 'paired-t-test':
                return this.pairedTTestPower(parameters);
            case 'anova-one-way':
                return this.oneWayAnovaPower(parameters);
            case 'anova-two-way':
                return this.twoWayAnovaPower(parameters);
            case 'chi-square':
                return this.chiSquarePower(parameters);
            case 'correlation':
                return this.correlationPower(parameters);
            default:
                throw new Error(`Power calculation not implemented for: ${testType}`);
        }
    }

    calculateSampleSize(testType, parameters) {
        if (!this.testTypes[testType]) {
            throw new Error(`Unknown test type: ${testType}`);
        }

        // For sample size calculation, we need to solve for sample size given power
        const targetPower = parameters.power || 0.8;
        const alpha = parameters.alpha || 0.05;
        
        // Use binary search to find sample size
        let low = 2;
        let high = 10000;
        let bestN = null;
        
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const testParams = { ...parameters, sampleSize: mid, sampleSize1: mid, sampleSize2: mid, sampleSizePerGroup: mid };
            
            try {
                const power = this.calculatePower(testType, testParams);
                if (Math.abs(power - targetPower) < 0.001) {
                    bestN = mid;
                    break;
                } else if (power < targetPower) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                    bestN = mid;
                }
            } catch (error) {
                low = mid + 1;
            }
        }
        
        return {
            sampleSize: bestN,
            actualPower: bestN ? this.calculatePower(testType, { ...parameters, sampleSize: bestN, sampleSize1: bestN, sampleSize2: bestN, sampleSizePerGroup: bestN }) : null,
            targetPower,
            alpha
        };
    }

    generatePowerCurve(testType, parameters) {
        const sampleSizes = [];
        const powers = [];
        
        for (let n = 5; n <= 200; n += 5) {
            try {
                const testParams = { ...parameters, sampleSize: n, sampleSize1: n, sampleSize2: n, sampleSizePerGroup: n };
                const power = this.calculatePower(testType, testParams);
                sampleSizes.push(n);
                powers.push(power);
            } catch (error) {
                // Skip invalid sample sizes
            }
        }
        
        return {
            sampleSizes,
            powers,
            testType: this.testTypes[testType].name
        };
    }

    // One-sample t-test power calculation
    oneSampleTTestPower(params) {
        const { effectSize, sampleSize, alpha = 0.05 } = params;
        const df = sampleSize - 1;
        const tCritical = jStat.studentt.inv(1 - alpha/2, df);
        const ncp = effectSize * Math.sqrt(sampleSize); // non-centrality parameter
        
        const power = 1 - jStat.studentt.cdf(tCritical, df, ncp) + jStat.studentt.cdf(-tCritical, df, ncp);
        return Math.max(0, Math.min(1, power));
    }

    // Two-sample t-test power calculation
    twoSampleTTestPower(params) {
        const { effectSize, sampleSize1, sampleSize2, alpha = 0.05 } = params;
        const df = sampleSize1 + sampleSize2 - 2;
        const tCritical = jStat.studentt.inv(1 - alpha/2, df);
        const ncp = effectSize * Math.sqrt((sampleSize1 * sampleSize2) / (sampleSize1 + sampleSize2));
        
        const power = 1 - jStat.studentt.cdf(tCritical, df, ncp) + jStat.studentt.cdf(-tCritical, df, ncp);
        return Math.max(0, Math.min(1, power));
    }

    // Paired t-test power calculation (same as one-sample)
    pairedTTestPower(params) {
        return this.oneSampleTTestPower(params);
    }

    // One-way ANOVA power calculation
    oneWayAnovaPower(params) {
        const { effectSize, groups, sampleSizePerGroup, alpha = 0.05 } = params;
        const df1 = groups - 1;
        const df2 = groups * (sampleSizePerGroup - 1);
        const fCritical = jStat.centralF.inv(1 - alpha, df1, df2);
        
        // Cohen's f effect size
        const ncp = effectSize * effectSize * groups * sampleSizePerGroup;
        const power = 1 - jStat.noncentralF.cdf(fCritical, df1, df2, ncp);
        return Math.max(0, Math.min(1, power));
    }

    // Two-way ANOVA power calculation (simplified)
    twoWayAnovaPower(params) {
        const { effectSizeA, effectSizeB, effectSizeAB, groupsA, groupsB, sampleSizePerGroup, alpha = 0.05 } = params;
        
        // Calculate power for main effect A
        const df1A = groupsA - 1;
        const df2A = groupsA * groupsB * (sampleSizePerGroup - 1);
        const fCriticalA = jStat.centralF.inv(1 - alpha, df1A, df2A);
        const ncpA = effectSizeA * effectSizeA * groupsA * groupsB * sampleSizePerGroup;
        const powerA = 1 - jStat.noncentralF.cdf(fCriticalA, df1A, df2A, ncpA);
        
        return {
            powerA: Math.max(0, Math.min(1, powerA)),
            powerB: this.calculateMainEffectPower(effectSizeB, groupsB, groupsA, sampleSizePerGroup, alpha),
            powerAB: this.calculateInteractionPower(effectSizeAB, groupsA, groupsB, sampleSizePerGroup, alpha)
        };
    }

    calculateMainEffectPower(effectSize, groups, otherGroups, sampleSizePerGroup, alpha) {
        const df1 = groups - 1;
        const df2 = groups * otherGroups * (sampleSizePerGroup - 1);
        const fCritical = jStat.centralF.inv(1 - alpha, df1, df2);
        const ncp = effectSize * effectSize * groups * otherGroups * sampleSizePerGroup;
        const power = 1 - jStat.noncentralF.cdf(fCritical, df1, df2, ncp);
        return Math.max(0, Math.min(1, power));
    }

    calculateInteractionPower(effectSize, groupsA, groupsB, sampleSizePerGroup, alpha) {
        const df1 = (groupsA - 1) * (groupsB - 1);
        const df2 = groupsA * groupsB * (sampleSizePerGroup - 1);
        const fCritical = jStat.centralF.inv(1 - alpha, df1, df2);
        const ncp = effectSize * effectSize * groupsA * groupsB * sampleSizePerGroup;
        const power = 1 - jStat.noncentralF.cdf(fCritical, df1, df2, ncp);
        return Math.max(0, Math.min(1, power));
    }

    // Chi-square power calculation
    chiSquarePower(params) {
        const { effectSize, df, alpha = 0.05 } = params;
        const chiCritical = jStat.chisquare.inv(1 - alpha, df);
        const ncp = effectSize * effectSize * df; // approximation
        const power = 1 - jStat.noncentralchisquare.cdf(chiCritical, df, ncp);
        return Math.max(0, Math.min(1, power));
    }

    // Correlation power calculation
    correlationPower(params) {
        const { correlation, sampleSize, alpha = 0.05 } = params;
        const df = sampleSize - 2;
        const tCritical = jStat.studentt.inv(1 - alpha/2, df);
        
        // Fisher's z transformation
        const z = 0.5 * Math.log((1 + correlation) / (1 - correlation));
        const se = 1 / Math.sqrt(sampleSize - 3);
        const ncp = z / se;
        
        const power = 1 - jStat.studentt.cdf(tCritical, df, ncp) + jStat.studentt.cdf(-tCritical, df, ncp);
        return Math.max(0, Math.min(1, power));
    }

    // Helper function to calculate effect size from means and standard deviation
    calculateEffectSize(mean1, mean2, pooledSD) {
        return (mean1 - mean2) / pooledSD;
    }

    // Helper function to calculate Cohen's f from eta-squared
    calculateCohensF(etaSquared) {
        return Math.sqrt(etaSquared / (1 - etaSquared));
    }
}

module.exports = new PowerAnalysis();