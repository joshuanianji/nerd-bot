import { ChartCallback, ChartJSNodeCanvas } from 'chartjs-node-canvas';

export interface Canvas {
    width: number;
    height: number;
    chartJSNodeCanvas: ChartJSNodeCanvas;
}

// Creates a custom canvas object, where the width and heights are accessible
export const mkCanvas = (width: number, height: number, chartCallback: ChartCallback): Canvas => ({
    width,
    height,
    chartJSNodeCanvas: new ChartJSNodeCanvas({ width, height, chartCallback })
})
