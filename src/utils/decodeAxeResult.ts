export function decodeAxeResults(result: any, pageUrl: string): any[] {
  return result?.violations || [];
}
