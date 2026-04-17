import * as ort from 'onnxruntime-node';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

export interface ScalerParams {
  mean: number[];
  scale: number[];
  feature_names: string[];
}

export interface KlineData {
  close: number;
  timestamp: number;
}

export class VolatilityPredictor {
  private session: ort.InferenceSession | null = null;
  private scaler: ScalerParams | null = null;
  private readonly windowSize = 1440; // 30 days of 30m candles
  private readonly modelDir: string;

  constructor(modelDir: string = 'volatility-calculator') {
    this.modelDir = path.isAbsolute(modelDir) ? modelDir : path.join(process.cwd(), modelDir);
  }

  async load(symbol: string) {
    const symbol_lower = symbol.toLowerCase().replace('usdt', '');
    const modelPath = path.join(this.modelDir, `${symbol_lower}_volatility_model.onnx`);
    const scalerPath = path.join(this.modelDir, `${symbol_lower}_scaler.json`);

    try {
      this.session = await ort.InferenceSession.create(modelPath);
      const scalerData = fs.readFileSync(scalerPath, 'utf8');
      this.scaler = JSON.parse(scalerData);
      console.log(`[VolatilityPredictor] Loaded model and scaler for ${symbol}`);
    } catch (err) {
      console.error(`[VolatilityPredictor] Error loading assets for ${symbol}:`, err);
      throw err;
    }
  }

  async fetchLatestKlines(symbol: string, interval: string = '30m', days: number = 33): Promise<KlineData[]> {
    const baseSymbol = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);
    
    console.log(`[VolatilityPredictor] Fetching ${days} days of ${interval} data for ${baseSymbol}...`);
    
    let allKlines: any[] = [];
    let currentStart = startTime;

    while (currentStart < endTime) {
      const url = `https://api.binance.com/api/v3/klines?symbol=${baseSymbol}&interval=${interval}&startTime=${currentStart}&limit=1000`;
      const response = await axios.get(url);
      const klines = response.data as any[][];
      
      if (!klines || klines.length === 0) break;
      
      allKlines.push(...klines);
      currentStart = klines[klines.length - 1][6] + 1;
      
      if (klines.length < 1000) break;
    }

    return allKlines.map(k => ({
      timestamp: k[0],
      close: parseFloat(k[4])
    }));
  }

  private calculateLogReturns(closes: number[]): number[] {
    const returns: number[] = [0]; // First element is 0 or NaN, we'll handle NaNs by dropping
    for (let i = 1; i < closes.length; i++) {
      returns.push(Math.log(closes[i] / closes[i - 1]));
    }
    return returns;
  }

  private rollingStd(data: number[], window: number): number[] {
    const stds: number[] = new Array(data.length).fill(NaN);
    for (let i = window - 1; i < data.length; i++) {
      const slice = data.slice(i - window + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / window;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (window - 1);
      stds[i] = Math.sqrt(variance);
    }
    return stds;
  }

  private rollingSum(data: number[], window: number): number[] {
    const sums: number[] = new Array(data.length).fill(NaN);
    for (let i = window - 1; i < data.length; i++) {
      const slice = data.slice(i - window + 1, i + 1);
      sums[i] = slice.reduce((a, b) => a + b, 0);
    }
    return sums;
  }

  async predict(symbol: string, klines: KlineData[]): Promise<number> {
    if (!this.session || !this.scaler) {
      await this.load(symbol);
    }

    if (klines.length < 1540) { // Same threshold as predict.py
      throw new Error(`Not enough data. Need at least 1540 klines, got ${klines.length}`);
    }

    const closes = klines.map(k => k.close);
    const returns = this.calculateLogReturns(closes);
    
    const vol30 = this.rollingStd(returns, 30);
    const vol100 = this.rollingStd(returns, 100);
    const ret1h = this.rollingSum(returns, 2);
    const ret4h = this.rollingSum(returns, 8);
    const ret24h = this.rollingSum(returns, 48);

    // Preprocessing: Drop NaNs (first 99 indices will have NaNs from vol100)
    const features: number[][] = [];
    for (let i = 100; i < returns.length; i++) {
      const featureSet = [
        returns[i],
        vol30[i],
        vol100[i],
        ret1h[i],
        ret4h[i],
        ret24h[i]
      ];
      
      // Scale features
      const scaledFeatures = featureSet.map((v, idx) => {
        return (v - this.scaler!.mean[idx]) / this.scaler!.scale[idx];
      });
      
      features.push(scaledFeatures);
    }

    // Take the last windowSize samples
    if (features.length < this.windowSize) {
      throw new Error(`Not enough data after preprocessing. Need ${this.windowSize} windows, got ${features.length}`);
    }

    const window = features.slice(-this.windowSize);
    
    // Convert to Float32Array for ONNX
    const flattened = new Float32Array(this.windowSize * 6);
    for (let i = 0; i < this.windowSize; i++) {
      for (let j = 0; j < 6; j++) {
        flattened[i * 6 + j] = window[i][j];
      }
    }

    const tensorInput = new ort.Tensor('float32', flattened, [1, this.windowSize, 6]);
    
    const feeds: Record<string, ort.Tensor> = {};
    feeds[this.session!.inputNames[0]] = tensorInput;

    const results = await this.session!.run(feeds);
    const output = results[this.session!.outputNames[0]];
    const predictedVol30m = (output.data as Float32Array)[0];

    return predictedVol30m;
  }

  // Utility to scale to daily/annualized
  public static scaleVolatility(vol30m: number, timeframe: 'daily' | 'ann' = 'daily'): number {
    const volDay = vol30m * Math.sqrt(48); // 48 intervals of 30m in 24h
    if (timeframe === 'daily') return volDay;
    return volDay * Math.sqrt(365);
  }
}
