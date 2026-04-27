/**
 * Tappable interest picker. Selected items show as chips at the top
 * (tap to remove). Below: a search input that filters the catalogue,
 * with an "Add custom" button surfaced when the typed value isn't
 * already in the catalogue or selection.
 */

import { useState } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { getAllCatalogInterests, INTEREST_CATALOG } from './interestsCatalog';

const ALL_CATALOG = getAllCatalogInterests();

export function InterestPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const q = search.trim();
  const ql = q.toLowerCase();

  const toggleCategory = (cat: string) =>
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));

  // While searching, force every matching category open so the user
  // sees the hits without an extra tap.
  const isOpen = (cat: string) => (q.length > 0 ? true : !!expanded[cat]);

  const isSelected = (item: string) =>
    selected.some((s) => s.toLowerCase() === item.toLowerCase());

  const toggle = (item: string) => {
    if (isSelected(item)) {
      onChange(selected.filter((s) => s.toLowerCase() !== item.toLowerCase()));
    } else {
      onChange([...selected, item]);
    }
  };

  const addCustom = () => {
    if (!q) return;
    if (isSelected(q)) {
      setSearch('');
      return;
    }
    onChange([...selected, q]);
    setSearch('');
  };

  const filteredCategories = q
    ? Object.entries(INTEREST_CATALOG)
        .map(([cat, list]) => [cat, list.filter((i) => i.toLowerCase().includes(ql))] as const)
        .filter(([, list]) => list.length > 0)
    : Object.entries(INTEREST_CATALOG);

  const customAvailable =
    q.length > 0 &&
    !ALL_CATALOG.some((i) => i.toLowerCase() === ql) &&
    !isSelected(q);

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className="bg-blue-600 text-white pl-3 pr-2 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-blue-700"
            >
              {item}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (customAvailable) addCustom();
              }
            }}
            placeholder="Search or add a custom interest…"
            className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>
        {customAvailable && (
          <button
            type="button"
            onClick={addCustom}
            className="px-3 h-9 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 border-y border-gray-100">
        {filteredCategories.map(([category, list]) => {
          const selectedInCat = list.filter((i) => isSelected(i)).length;
          const open = isOpen(category);
          return (
            <div key={category}>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between py-2.5 text-left hover:bg-gray-50 -mx-1 px-1 rounded"
              >
                <span className="text-[13px] font-semibold text-gray-800">
                  {category}
                  {selectedInCat > 0 && (
                    <span className="ml-2 text-[11px] font-medium text-blue-600">
                      {selectedInCat} picked
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <div className="flex flex-wrap gap-1.5 pb-3">
                  {list.map((item) => {
                    const sel = isSelected(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggle(item)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          sel
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {sel ? '✓ ' : ''}
                        {item}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {q && filteredCategories.length === 0 && !customAvailable && (
          <p className="text-sm text-gray-400 italic py-3">No matches.</p>
        )}
      </div>
    </div>
  );
}
