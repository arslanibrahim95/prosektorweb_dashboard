import { BayesianResult } from './types';

export function calculateBayesianAB(
    controlVisitors: number,
    controlConversions: number,
    variantVisitors: number,
    variantConversions: number
): BayesianResult {
    // Basit Monte Carlo simülasyonu
    const samples = 10000
    let wins = 0
    let lossSum = 0

    for (let i = 0; i < samples; i++) {
        // Basit yaklaşım: normal dağılım ile simüle et
        const controlRate = controlConversions / controlVisitors
        const variantRate = variantConversions / variantVisitors

        const controlSE = Math.sqrt(controlRate * (1 - controlRate) / controlVisitors)
        const variantSE = Math.sqrt(variantRate * (1 - variantRate) / variantVisitors)

        const controlSample = controlRate + (Math.random() - 0.5) * controlSE * 2
        const variantSample = variantRate + (Math.random() - 0.5) * variantSE * 2

        if (variantSample > controlSample) {
            wins++
        } else {
            lossSum += controlSample - variantSample
        }
    }

    const probabilityToBeatControl = wins / samples
    const expectedLoss = lossSum / samples
    const riskOfChoosingWrong = 1 - probabilityToBeatControl

    return {
        probabilityToBeatControl,
        expectedLoss,
        riskOfChoosingWrong
    }
}
