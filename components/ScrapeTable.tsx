import React from 'react';
import { ScrapedItem } from '../types';

interface ScrapeTableProps {
  items: ScrapedItem[];
}

const ScrapeTable: React.FC<ScrapeTableProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-xl border-2 border-brand-purple bg-white shadow-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-purple/20">
          <thead className="bg-brand-purple">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Título</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Preço</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Link</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-brand-gold/10 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-purple">
                  {item.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-bold uppercase">
                    {item.category || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-black">
                  {item.price || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:underline">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">Ver Origem</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScrapeTable;