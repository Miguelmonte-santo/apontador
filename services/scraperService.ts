
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
      
      const results = Array.isArray(data) ? data : (data.results || []);
      
      return {
        success: true,
        data: results
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
   * Gera e baixa o arquivo Excel (.xlsx) a partir dos itens capturados
   */
  exportToExcel(data: ScrapedItem[]) {
    // Mapeia os dados para ter cabeçalhos bonitos em português no Excel
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
    
    // Define a largura das colunas para melhor visualização
    const wscols = [
      {wch: 40}, // Título
      {wch: 20}, // Categoria
      {wch: 15}, // Preço
      {wch: 50}, // Link
      {wch: 25}  // Data
    ];
    worksheet['!cols'] = wscols;

    // Gera o nome do arquivo com timestamp para evitar duplicatas
    const timestamp = new Date().getTime();
    const fileName = `scraping_resultado_${timestamp}.xlsx`;
    
    // Dispara o download nativo do navegador
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Mock para demonstração caso o endpoint não responda
   */
  async mockScrape(url: string, onProgress: (p: number) => void): Promise<ScrapeResponse> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve({
            success: true,
            data: [
              { id: 1, title: 'Item Exemplo 1', link: url, price: 'R$ 100,00', category: 'Geral', timestamp: new Date().toISOString() },
              { id: 2, title: 'Item Exemplo 2', link: url, price: 'R$ 250,00', category: 'Premium', timestamp: new Date().toISOString() }
            ]
          });
        }
      }, 200);
    });
  }
};
