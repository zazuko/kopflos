"""Generate report.html with embedded Matplotlib SVGs; no browser dependencies.

Run with a Python environment containing matplotlib:
    python labs/pages/benchmark/render-report.py
"""
import io
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter, NullFormatter

ROOT = Path(__file__).parent
report = json.loads((ROOT / 'results.json').read_text())
rows = report['summary']
COLORS = {'legacy': '#267975', 'modern': '#7451c8'}
METRICS = {
    'warmMs': ('Warmed request latency', 'ms', 'Nine measured requests per implementation and workload, across three fresh application processes. Whiskers show the observed 10th–90th percentile range, not a confidence interval.'),
    'coldMs': ('First request latency', 'ms', 'Median first request across three fresh application processes. Common dependencies are already loaded; the new path includes its lazy Comunica import and engine initialization.'),
    'afterGcHeapMiB': ('Retained application heap', 'MiB', 'Median Node heap at request end, after releasing the result and forcing garbage collection. Explicit GC is outside the timed interval. Endpoint memory is excluded.'),
    'sampledPeakHeapMiB': ('Sampled peak application heap', 'MiB', 'Median of per-request peak heap samples, collected every 5 ms and every 512 output quads. Brief peaks may be missed. Endpoint memory is excluded.'),
    'sampledPeakRssMiB': ('Sampled peak application RSS', 'MiB', 'Median of per-request peak RSS samples. RSS includes resident code and non-heap allocations, and is sensitive to operating-system memory management. Endpoint memory is excluded.'),
    'appCpuMs': ('Application CPU time', 'ms', 'Median CPU time used by the Node application process during query execution. CPU time can exceed elapsed time when work runs on multiple threads.'),
    'endpointCpuMs': ('Endpoint CPU time', 'ms', 'Median native Oxigraph CPU time for query execution and serialization in a separate process. This excludes application CPU time.'),
    'responseKiB': ('Uncompressed response size', 'KiB', 'Median SPARQL response bytes sent by Oxigraph. Legacy CONSTRUCT results are deduplicated RDF; the new path receives solution bindings as JSON. Control and metadata requests are excluded.'),
}
plt.rcParams.update({
    'font.family': 'DejaVu Sans', 'font.size': 11, 'svg.fonttype': 'none',
    'axes.edgecolor': '#dedbd3', 'axes.labelcolor': '#53565c',
    'xtick.color': '#696d72', 'ytick.color': '#222a30',
    'figure.facecolor': '#ffffff', 'axes.facecolor': '#ffffff',
})


def number(value, unit):
    return f'{value:,.1f}' if unit == 'MiB' or value < 10 else f'{value:,.0f}'


def chart(metric, scale, mobile):
    title, unit, _ = METRICS[metric]
    size = (4.5, 5.4) if mobile else (10.6, 4.4)
    with plt.rc_context({'svg.hashsalt': f'{metric}-{scale}-{mobile}'}):
        fig, ax = plt.subplots(figsize=size)
        fig.subplots_adjust(left=0.29 if mobile else 0.22, right=0.86, top=0.97, bottom=0.15)
        maximum = 0
        minimum = float('inf')
        for index, row in enumerate(rows):
            for kind, offset in [('legacy', -0.18), ('modern', 0.18)]:
                value = row[kind][metric]
                y = index + offset
                low, high = (row[kind]['warmP10Ms'], row[kind]['warmP90Ms']) if metric == 'warmMs' else (value, value)
                maximum = max(maximum, high)
                minimum = min(minimum, low)
                if scale == 'linear':
                    ax.barh(y, value, height=0.28, color=COLORS[kind], zorder=3)
                else:
                    ax.scatter(value, y, color=COLORS[kind], s=43, zorder=4)
                if metric == 'warmMs':
                    ax.errorbar(value, y, xerr=[[value - low], [high - value]], fmt='none', ecolor=COLORS[kind], capsize=3, linewidth=1.2, zorder=5)
                ax.annotate(number(value, unit), (high, y), xytext=(7, 0), textcoords='offset points', va='center', fontsize=10 if mobile else 11, color=COLORS[kind])
        labels = [f"{r['resources']:,} resources\n{r['routes']} {'route' if r['routes'] == 1 else 'routes'} · {r['properties']} properties" for r in rows]
        ax.set_yticks(range(len(rows)), labels, fontsize=9.5 if mobile else 11)
        ax.set_ylim(len(rows) - 0.5, -0.6)
        if scale == 'log':
            ax.set_xscale('log')
            ax.set_xlim(minimum * 0.55, maximum * 2.4)
            ax.xaxis.set_minor_formatter(NullFormatter())
        else:
            ax.set_xlim(0, maximum * (1.44 if mobile else 1.25))
            ax.locator_params(axis='x', nbins=3 if mobile else 6)
        ax.xaxis.set_major_formatter(FuncFormatter(lambda value, _pos: f'{value / 1000:g}k' if value >= 1000 else f'{value:g}'))
        ax.tick_params(axis='y', length=0, pad=12)
        ax.tick_params(axis='x', labelsize=10)
        ax.set_xlabel(f'{title} ({unit})', labelpad=12, fontsize=10 if mobile else 11)
        ax.grid(axis='x', color='#eeede8', zorder=0)
        for spine in ['top', 'right', 'left']:
            ax.spines[spine].set_visible(False)
        buffer = io.StringIO()
        fig.savefig(buffer, format='svg', metadata={'Date': None})
        plt.close(fig)
        svg = buffer.getvalue()
        svg = svg[svg.index('<svg'):]
        svg = svg.replace("font-family: 'DejaVu Sans'", 'font-family: system-ui, sans-serif')
        # Each embedded SVG needs a distinct ID namespace in the HTML document.
        prefix = f'chart-{metric}-{scale}-{"mobile" if mobile else "desktop"}-'
        svg = svg.replace('id="', f'id="{prefix}').replace('href="#', f'href="#{prefix}').replace('url(#', f'url(#{prefix}')
        svg = svg.replace('<svg ', f'<svg role="img" aria-label="{title}, {scale} scale" ', 1)
        return svg


figures = []
for metric in METRICS:
    for scale in ['linear', 'log']:
        visible = metric == 'warmMs' and scale == 'linear'
        figures.append(f'<div class="plot" data-metric="{metric}" data-scale="{scale}" {"" if visible else "hidden"}><div class="plot-wide">{chart(metric, scale, False)}</div><div class="plot-narrow">{chart(metric, scale, True)}</div></div>')

payload = json.dumps({'report': report, 'metrics': {key: {'label': value[0], 'unit': value[1], 'note': value[2]} for key, value in METRICS.items()} }).replace('</', '<\\/')
html = (ROOT / 'report-template.html').read_text()
html = html.replace('<!-- EMBEDDED_PLOTS -->', '\n'.join(figures)).replace('/* EMBEDDED_DATA */', payload)
(ROOT / 'report.html').write_text(html)
print(f'Wrote {ROOT / "report.html"} ({len(html.encode()) / 1024:.0f} KiB, fully self-contained)')
