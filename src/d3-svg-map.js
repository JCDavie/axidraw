import {geoPath, select, line} from 'd3';

import createAxidraw from './lib/axidraw';
import getProjection from './lib/get-projection';
import {optimizeOrder} from './lib/optimize-lines';
import loadLines from './lib/load-lines';
import mergeLines from './lib/merge-lines';
import simplifyLines from './lib/simplify-lines';
import {renderSVGPaths} from './lib/svg-tools';

const height = 100;
const width = 200;
const zoom = 18;
const center = [9.995, 53.565];

async function plotLines(lines) {
  const axidraw = await createAxidraw();
  const project = getProjection({
    width,
    height,
    zoom,
    center
  });

  const projectedLines = lines.map(line => line.map(project));
  const mergedLines = mergeLines(projectedLines);
  const simplifiedLines = simplifyLines(mergedLines);
  const svgPaths = renderSVGPaths(simplifiedLines);

  document.getElementById('map').innerHTML = svgPaths.join('\n');

  console.log(`
    original:
    ${projectedLines.length} lines
    ${projectedLines.reduce((acc, line) => acc + line.length, 0)} points

    merged:
    ${mergedLines.length} lines
    ${mergedLines.reduce((acc, line) => acc + line.length, 0)} points

    simplifiedLines:
    ${simplifiedLines.length} lines
    ${simplifiedLines.reduce((acc, line) => acc + line.length, 0)} points
  `);

  for (const line of simplifiedLines) {
    const relativeLine = line.map(p => [
      p[0] / width * 100,
      p[1] / height * 100
    ]);

    await axidraw.drawPath(relativeLine);
  }
}

(async function() {
  const viewport = {
    width,
    height,
    zoom,
    center
  };
  const projection = getProjection(viewport);
  const geojsonToPath = geoPath(projection);

  const sortedLines = optimizeOrder(await loadLines(viewport));

  plotLines(sortedLines);
})();
