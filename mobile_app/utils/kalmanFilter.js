export class KalmanFilter {
    constructor(processNoise = 1e-5, measurementNoise = 1e-1, estimateError = 1.0) {
        this.processNoise = processNoise;
        this.measurementNoise = measurementNoise;
        this.estimateError = estimateError;
        this.currentEstimate = 0;
        this.currentError = estimateError;
    }

    update(measurement) {
        const prediction = this.currentEstimate;
        const predictionError = this.currentError + this.processNoise;

        const kalmanGain = predictionError / (predictionError + this.measurementNoise);

        this.currentEstimate = prediction + kalmanGain * (measurement - prediction);

        this.currentError = (1 - kalmanGain) * predictionError;

        return this.currentEstimate;
    }
}