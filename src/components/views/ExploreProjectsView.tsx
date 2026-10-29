import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ArrowUpRight, Terminal } from 'lucide-react';
import { useRealtimeStore } from '../../lib/realtimeStore';
import { AutonomoProject, NETWORK_COUNTS } from '../../lib/data';
import { filterAndSortProjects } from '../../lib/math';

interface ExploreProjectsViewProps {
  initialCategory?: string;
  initialNetwork?: string;
  initialQuery?: string;
  onInspectProject: (project: AutonomoProject) => void;
  onTryInPlayground: (queryPrompt: string) => void;
}

export const ExploreProjectsView: React.FC<ExploreProjectsViewProps> = ({
  initialCategory = 'all',
  initialNetwork = 'any',
  initialQuery = '',
  onInspectProject,
  onTryInPlayground,
}) => {
  const { projects } = useRealtimeStore();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [network, setNetwork] = useState(initialNetwork);
  const [sort, setSort] = useState<'popular' | 'new' | 'price' | 'name'>('popular');

  const filteredProjects = useMemo(
    () =>
      filterAndSortProjects(projects, {
        query,
        category,
        network,
        sort,
      }),
    [projects, query, category, network, sort]
  );

  const categories = [
    { id: 'all', label: 'All', count: '3,742' },
    { id: 'service', label: 'Paid services', count: '3,711' },
    { id: 'facilitator', label: 'Facilitators', count: '16' },
    { id: 'sdk', label: 'SDKs', count: '4' },
    { id: 'extension', label: 'Extensions', count: '6' },
    { id: 'explorer', label: 'Explorers & directories', count: '5' },
  ];

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-6 bg-[#0d0e12] border border-white/10 rounded-2xl p-5">
          <div>
            <label
              htmlFor="catalog-search"
              className="block text-xs font-mono text-[#a1a1aa] mb-2"
            >
              Search Catalog
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b8b97] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="catalog-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search APIs, facilitators..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12141b] border border-white/12 text-sm text-[#f4f4f6] placeholder:text-[#8b8b97] focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <h2 className="text-xs font-mono text-[#a1a1aa] uppercase tracking-wider">
              Category
            </h2>
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      category === cat.id
                        ? 'bg-white text-[#070709] font-semibold'
                        : 'text-[#d4d4d8] hover:bg-[#161820]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`font-mono tabular-nums ${
                        category === cat.id ? 'text-[#070709]' : 'text-[#8b8b97]'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Network Filter */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h2 className="text-xs font-mono text-[#a1a1aa] uppercase tracking-wider">
              Network
            </h2>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setNetwork('any')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    network === 'any'
                      ? 'bg-[#00C805] text-[#070709] font-semibold'
                      : 'text-[#d4d4d8] hover:bg-[#161820]'
                  }`}
                >
                  <span>Any network</span>
                  <span className="font-mono tabular-nums">All</span>
                </button>
              </li>
              {NETWORK_COUNTS.map((net) => (
                <li key={net.slug}>
                  <button
                    type="button"
                    onClick={() => setNetwork(net.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      network.toLowerCase() === net.slug.toLowerCase()
                        ? 'bg-[#00C805] text-[#070709] font-semibold'
                        : 'text-[#d4d4d8] hover:bg-[#161820]'
                    }`}
                  >
                    <span>{net.name}</span>
                    <span
                      className={`font-mono tabular-nums ${
                        network.toLowerCase() === net.slug.toLowerCase()
                          ? 'text-[#070709]'
                          : 'text-[#8b8b97]'
                      }`}
                    >
                      {net.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Projects Directory */}
        <div className="lg:col-span-9 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0e12] border border-white/10 rounded-2xl p-5">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
                {category === 'all'
                  ? 'All projects'
                  : categories.find((c) => c.id === category)?.label || 'Projects'}
              </h1>
              <p className="text-xs font-mono text-[#a1a1aa] mt-1 tabular-nums">
                Showing {filteredProjects.length} indexed resources
                {network !== 'any' ? ` on ${network}` : ''} · Updated from Coinbase
                CDP, PayAI &amp; Robinhood Chain facilitators
              </p>
            </div>

            {/* Sort Controls */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#12141b] border border-white/10 self-start sm:self-auto"
              role="group"
              aria-label="Sort projects"
            >
              {(
                [
                  { id: 'popular', label: 'Most used' },
                  { id: 'new', label: 'Newest' },
                  { id: 'price', label: 'Cheapest' },
                  { id: 'name', label: 'A–Z' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    sort === s.id
                      ? 'bg-white text-[#070709] font-semibold'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {filteredProjects.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0d0e12] border border-white/10 text-center space-y-3">
              <SlidersHorizontal className="w-8 h-8 text-[#8b8b97] mx-auto" />
              <h3 className="font-display text-lg font-semibold text-[#f4f4f6]">
                No matching x402 projects found
              </h3>
              <p className="text-sm text-[#a1a1aa] max-w-md mx-auto">
                No endpoints matched &ldquo;{query}&rdquo; with the current category
                and network filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                  setNetwork('any');
                }}
                className="px-4 py-2 rounded-xl bg-white text-[#070709] text-xs font-semibold hover:bg-[#d4d4d8] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0d0e12] border border-white/10 divide-y divide-white/10">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 hover:bg-[#12141b] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div
                    onClick={() => onInspectProject(proj)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onInspectProject(proj);
                      }
                    }}
                    className="space-y-1.5 flex-1 cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#a1a1aa]">
                      <span className="font-display text-base font-semibold text-[#f4f4f6]">
                        {proj.name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="uppercase font-mono text-[11px] text-[#d4d4d8]">
                        {proj.category}
                      </span>
                      {proj.officialRobinhood && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#00C805] font-mono">
                            Official Robinhood Chain API
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[#8b8b97]">{proj.host}</span>
                    </div>

                    <p className="text-sm text-[#a1a1aa] leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-[#8b8b97]">
                      <span>Networks: {proj.networks.join(', ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>Facilitator: {proj.facilitator}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                    <div className="text-left sm:text-right">
                      <div className="font-mono text-sm font-semibold text-[#f4f4f6] tabular-nums">
                        {proj.priceLabel}
                      </div>
                      <div className="text-xs font-mono text-[#00C805] tabular-nums">
                        {(proj.calls30d / 1000).toFixed(1)}K calls / 30d
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {proj.category === 'service' && (
                        <button
                          type="button"
                          onClick={() =>
                            onTryInPlayground(
                              `Call ${proj.name} (${proj.host}) and summarize its live response.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#161820] hover:bg-[#20232b] border border-white/10 text-xs font-mono text-[#d4d4d8] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          <Terminal className="w-3.5 h-3.5 text-[#00C805]" />
                          <span>Playground</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onInspectProject(proj)}
                        className="px-3 py-1.5 rounded-lg bg-white text-[#070709] text-xs font-semibold hover:bg-[#d4d4d8] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <span>Inspect 402</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
