// aqiCalculator.js

const breakpoints = {
    co: [
        { low: 0, high: 4.4, aqiLow: 0, aqiHigh: 50 },
        { low: 4.5, high: 9.4, aqiLow: 51, aqiHigh: 100 },
        { low: 9.5, high: 12.4, aqiLow: 101, aqiHigh: 150 },
        { low: 12.5, high: 15.4, aqiLow: 151, aqiHigh: 200 },
        { low: 15.5, high: 30.4, aqiLow: 201, aqiHigh: 300 },
        { low: 30.5, high: 50.4, aqiLow: 301, aqiHigh: 500 },
    ],
    no2: [
        { low: 0, high: 53, aqiLow: 0, aqiHigh: 50 },
        { low: 54, high: 100, aqiLow: 51, aqiHigh: 100 },
        { low: 101, high: 360, aqiLow: 101, aqiHigh: 150 },
        { low: 361, high: 649, aqiLow: 151, aqiHigh: 200 },
        { low: 650, high: 1249, aqiLow: 201, aqiHigh: 300 },
        { low: 1250, high: 2049, aqiLow: 301, aqiHigh: 500 },
    ],
    o3: [
        { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
        { low: 55, high: 70, aqiLow: 51, aqiHigh: 100 },
        { low: 71, high: 85, aqiLow: 101, aqiHigh: 150 },
        { low: 86, high: 105, aqiLow: 151, aqiHigh: 200 },
        { low: 106, high: 200, aqiLow: 201, aqiHigh: 300 },
        { low: 201, high: 300, aqiLow: 301, aqiHigh: 500 },
    ],
    so2: [
        { low: 0, high: 35, aqiLow: 0, aqiHigh: 50 },
        { low: 36, high: 75, aqiLow: 51, aqiHigh: 100 },
        { low: 76, high: 185, aqiLow: 101, aqiHigh: 150 },
        { low: 186, high: 304, aqiLow: 151, aqiHigh: 200 },
        { low: 305, high: 604, aqiLow: 201, aqiHigh: 300 },
        { low: 605, high: 804, aqiLow: 301, aqiHigh: 500 },
    ],
    pm2_5: [
        { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },
        { low: 13, high: 35.4, aqiLow: 51, aqiHigh: 100 },
        { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },
        { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },
        { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },
        { low: 250.5, high: 500.4, aqiLow: 301, aqiHigh: 500 },
    ],
    pm10: [
        { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
        { low: 55, high: 154, aqiLow: 51, aqiHigh: 100 },
        { low: 155, high: 254, aqiLow: 101, aqiHigh: 150 },
        { low: 255, high: 354, aqiLow: 151, aqiHigh: 200 },
        { low: 355, high: 424, aqiLow: 201, aqiHigh: 300 },
        { low: 425, high: 604, aqiLow: 301, aqiHigh: 500 },
    ]
};

function getSubIndex(pollutant, value) {
    const pollutantBreakpoints = breakpoints[pollutant];
    for (let i = 0; i < pollutantBreakpoints.length; i++) {
        const bp = pollutantBreakpoints[i];
        if (value >= bp.low && value <= bp.high) {
            return ((value - bp.low) / (bp.high - bp.low)) * (bp.aqiHigh - bp.aqiLow) + bp.aqiLow;
        }
    }
    return 0;
}

function calculateAQI(airQuality) {
    const pollutants = ['co', 'no2', 'o3', 'so2', 'pm2_5', 'pm10'];
    let maxAqi = 0;

    pollutants.forEach(p => {
        const value = airQuality[p];
        if (value !== undefined) {
            const subIndex = getSubIndex(p, value);
            maxAqi = Math.max(maxAqi, subIndex);
        }
    });

    return Math.round(maxAqi);
}

export default calculateAQI;
