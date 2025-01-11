import numeric from 'numeric';

// Trilateration function using least squares
function trilaterate(points, distances) {
    const initialGuess = [0, 0];
    const objFunc = (guess) =>
        points.reduce((sum, [x, y], i) => {
            const diff = Math.sqrt((guess[0] - x) ** 2 + (guess[1] - y) ** 2) - distances[i];
            return sum + diff ** 2;
        }, 0);

    const result = numeric.uncmin(objFunc, initialGuess);
    return result.solution;
}

function distanceCalc(rssi, distance_per_pixel) {
    real_distance = Math.pow(10, (-70 - rssi) / (10 * 4));
    pixel_distance = real_distance / distance_per_pixel;
    return pixel_distance;
}

export function positionCalc(beaconsData, distance_per_pixel) {
    if (beaconsData.length >= 3) {
        const points = beaconsData.map((b) => [b.x, b.y]);
        const distances = beaconsData.map((b) => distanceCalc(b.rssi, distance_per_pixel));
        console.log(distances);
        try {
            return trilaterate(points, distances);
        } catch (error) {
            console.error("Error in position calculation: ", error);
            return null;
        }
    }
    else {
        console.log("Only " + beaconsData.length + " beacons detected!");
        return null;
    }
}