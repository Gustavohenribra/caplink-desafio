export function calculateECGBaseline(x: number): number {
    return (
      -0.06366 +
      0.12613 * Math.cos((Math.PI * x) / 500) +
      0.12258 * Math.cos((Math.PI * x) / 250) +
      0.01593 * Math.sin((Math.PI * x) / 500) +
      0.03147 * Math.sin((Math.PI * x) / 250)
    );
  }
  