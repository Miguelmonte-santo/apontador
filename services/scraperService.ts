import * as XLSX from 'xlsx';
import { ScrapeResponse, ScrapedItem } from '../types';

/**
 * Utility to safely access environment variables in different contexts.
 */
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Fallback for some bundler configurations
  try {
    const viteEnv = (import.meta as any).env;
    if (viteEnv && viteEnv[key]) return viteEnv[key];
  } catch (e) {}
  return '';
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY'); 
const EDGE_FUNCTION_NAME = 'scraping-apontador';

export const scraperService = {
  /**
   * Dispara a Edge Function do Supabase para fazer o scraping da URL
   */
  async scrapeUrl(url: string, onProgress?: (p: number) => void): Promise<ScrapeResponse> {
    let progressInterval: any = null;
    
    try {
      if (!SUPABASE_URL) {
        throw new Error('Configuração VITE_SUPABASE_URL não encontrada. Verifique suas variáveis de ambiente.');
      }

      if (onProgress) {
        let p = 0;
        progressInterval = setInterval(() => {
          p += Math.random() * 8;
          if (p >= 92) {
            onProgress(92); // Hold at 92% until request actually returns
          } else {
            onProgress(p);
          }
        }, 450);
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.debug("Data received:", data);

      if (onProgress) onProgress(100);
      
      // Ensure all items have a unique ID for React rendering
      const results: ScrapedItem[] = (data.results || []).map((item: any, index: number) => ({
        ...item,
        id: item.id || `item-${index}-${Date.now()}`
      }));
      
      return {
        success: true,
        data: results,
        fileBase64: data.fileBase64 || null
      };
    } catch (error: any) {
      console.error('Scraping error:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Erro inesperado ao processar o scraping.'
      };
    } finally {
      // Robust clearing of the interval in finally block
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  },

  /**
   * Gera e baixa o arquivo Excel (.xlsx) localmente
   */
  exportToExcel(data: ScrapedItem[]) {
    const formattedData = data.map(item => ({
      'ID': item.id,
      'Título': item.title,
      'Categoria': item.category || 'N/A',
      'Preço': item.price || '-',
      'Link': item.link,
      'Captura': new Date(item.timestamp || Date.now()).toLocaleString('pt-BR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scraped Data");
    
    worksheet['!cols'] = [{wch: 20}, {wch: 40}, {wch: 20}, {wch: 15}, {wch: 50}, {wch: 25}];

    XLSX.writeFile(workbook, `scrape_export_${Date.now()}.xlsx`);
  },

  /**
   * Faz o download de um arquivo Excel vindo em Base64
   */
  downloadBase64Excel(base64: string, fileName: string) {
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = fileName;
    link.click();
  }
};