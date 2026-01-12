
import * as XLSX from 'xlsx';
import { ScrapeResponse, ScrapedItem } from '../types';

// Endpoint fornecido pelo usuário: https://aivwdcopudjzrrrbuquf.supabase.co/functions/v1/scraping-apontador
const SUPABASE_URL = 'https://aivwdcopudjzrrrbuquf.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here'; 
const EDGE_FUNCTION_NAME = 'scraping-apontador';

export const scraperService = {
  /**
   * Dispara a Edge Function do Supabase para fazer o scraping da URL
   */
  async scrapeUrl(url: string, onProgress?: (p: number) => void): Promise<ScrapeResponse> {
    try {
      if (onProgress) {
        let p = 0;
        const interval = setInterval(() => {
          p += Math.random() * 15;
          if (p >= 90) {
            clearInterval(interval);
            onProgress(95);
          } else {
            onProgress(p);
          }
        }, 400);
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
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (onProgress) onProgress(100);
      
      // Ajuste conforme sugerido: captura resultados do objeto e também o fileBase64 se existir
      const results = data.results || (Array.isArray(data) ? data : []);
      const fileBase64 = data.fileBase64 || null;
      
      return {
        success: true,
        data: results,
        fileBase64: fileBase64
      };
    } catch (error: any) {
      console.error('Scraping falhou:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Erro desconhecido ao processar scraping.'
      };
    }
  },

  /**
   * Gera e baixa o arquivo Excel (.xlsx) a partir dos itens capturados (Geração Local)
   */
  exportToExcel(data: ScrapedItem[]) {
    const formattedData = data.map(item => ({
      'Título': item.title,
      'Categoria': item.category || 'N/A',
      'Preço': item.price || '-',
      'Link de Origem': item.link,
      'Data da Captura': new Date(item.timestamp || Date.now()).toLocaleString('pt-BR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Capturados");
    
    const wscols = [{wch: 40}, {wch: 20}, {wch: 15}, {wch: 50}, {wch: 25}];
    worksheet['!cols'] = wscols;

    const timestamp = new Date().getTime();
    const fileName = `scraping_resultado_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Faz o download de um arquivo Excel vindo em Base64 da Edge Function
   */
  downloadBase64Excel(base64: string, fileName: string) {
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    link.download = fileName;
    link.click();
  }
};
