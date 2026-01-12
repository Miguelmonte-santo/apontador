
import React, { useState } from 'react';
import { Search, Download, ExternalLink, Database, AlertCircle, CheckCircle2, LayoutGrid, List } from 'lucide-react';
import { scraperService } from './services/scraperService';
import { ScrapedItem, ScrapeStatus } from './types';
import ProgressBar from './components/ProgressBar';
import ScrapeTable from './components/ScrapeTable';

const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [status, setStatus] = useState<ScrapeStatus>(ScrapeStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<ScrapedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setError(null);
    setResults([]);
    setProgress(0);
    setStatus(ScrapeStatus.SCRAPING);

    try {
      // Connect to the provided Edge Function endpoint
      const response = await scraperService.scrapeUrl(url, (p) => setProgress(p));
      
      if (response.success) {
        setResults(response.data);
        setStatus(ScrapeStatus.COMPLETED);
      } else {
        throw new Error(response.error);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar o scraping.');
      setStatus(ScrapeStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (results.length > 0) {
      scraperService.exportToExcel(results);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6">
      {/* Header */}
      <div className="max-w-4xl w-full text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-brand-purple rounded-2xl shadow-lg mb-6 transform -rotate-2">
          <Database className="text-brand-gold w-10 h-10" />
        </div>
        <h1 className="text-5xl font-extrabold text-brand-purple tracking-tight mb-4 drop-shadow-sm">
          Golden Scraper <span className="text-brand-black">Pro</span>
        </h1>
        <p className="text-lg font-medium text-brand-black/70 max-w-2xl mx-auto">
          Extraia dados de qualquer site em segundos e exporte diretamente para o Excel com nossa tecnologia de Edge Functions.
        </p>
      </div>

      {/* Main Form Section */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 border-b-8 border-brand-purple/20">
        <form onSubmit={handleScrape} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-bold text-brand-purple uppercase tracking-wider mb-2">
              URL do Website
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-brand-purple/50 group-focus-within:text-brand-purple transition-colors" />
              </div>
              <input
                type="url"
                id="url"
                required
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-brand-black placeholder-gray-400 focus:outline-none focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 transition-all text-lg font-medium"
                placeholder="https://exemplo.com/produtos"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === ScrapeStatus.SCRAPING}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === ScrapeStatus.SCRAPING || !url}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
              status === ScrapeStatus.SCRAPING
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-brand-purple text-white hover:bg-brand-purple/90 hover:-translate-y-1 active:translate-y-0'
            }`}
          >
            {status === ScrapeStatus.SCRAPING ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-black border-t-transparent"></div>
                Processando...
              </>
            ) : (
              <>
                <LayoutGrid className="w-6 h-6" />
                Iniciar Captura de Dados
              </>
            )}
          </button>
        </form>

        {/* Status Indicators */}
        {status === ScrapeStatus.SCRAPING && (
          <ProgressBar progress={progress} />
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 text-red-700 font-semibold">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {status === ScrapeStatus.COMPLETED && (
          <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center justify-between gap-3 text-green-800 font-bold">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span>Scraping concluído! {results.length} itens encontrados.</span>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        )}
      </div>

      {/* Results Table Section */}
      {results.length > 0 && (
        <div className="max-w-6xl w-full mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-brand-purple flex items-center gap-2">
              <List className="w-6 h-6" />
              Resultados da Importação
            </h2>
            <button
              onClick={handleDownload}
              className="text-brand-purple font-bold flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-brand-purple hover:bg-brand-purple hover:text-white transition-all"
            >
              <Download className="w-5 h-5" />
              Exportar para Excel (.xlsx)
            </button>
          </div>
          <ScrapeTable items={results} />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 text-brand-black/40 font-bold text-sm text-center">
        <p>© 2024 Golden Scraper Pro - Powered by Supabase Edge Functions</p>
        <p className="mt-1">Interface otimizada para Desktop e Mobile</p>
      </footer>
    </div>
  );
};

export default App;
