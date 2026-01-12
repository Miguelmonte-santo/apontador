
import * as XLSX from 'xlsx';
import { ScrapeResponse, ScrapedItem } from '../types';

// Em ambientes de execução baseados em Node/Browser polyfill como este, 
// as variáveis de ambiente são injetadas no objeto process.env.
// O uso de import.meta.env é específico para builds Vite locais.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''; 
const EDGE_FUNCTION_NAME = 'scraping-apontador';

export const scraperService = {
  /**
   * Dispara a Edge Function do Supabase para fazer o scraping da URL
   */
  async scrapeUrl(url: string, onProgress?: (p: number) => void): Promise<ScrapeResponse> {
    let progressInterval: any = null;
    
    try {
      if (!SUPABASE_URL) {
        throw new Error('Configuração VITE_SUPABASE_URL não encontrada no process.env. Verifique se as variáveis de ambiente foram configuradas corretamente.');
      }

      if (onProgress) {
        let p = 0;
        progressInterval = setInterval(() => {
          p += Math.random() * 10;
          if (p >= 90) {
            // Mantém em 90% até a resposta chegar de fato
            onProgress(90);
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // LOG DE DEPURAÇÃO
      console.log("Dados recebidos da Edge Function:", data);

      if (onProgress) onProgress(100);
      
      // Ajuste para capturar a chave 'results' e garantir que cada item tenha um ID
      const rawResults = data.results || [];
      const results: ScrapedItem[] = rawResults.map((item: any, index: number) => ({
        ...item,
        id: item.id || `item-${index}-${Date.now()}` // Garante ID único para chaves do React
      }));
      
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
    } finally {
      // Limpeza robusta do intervalo de progresso
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  },

  /**
   * Gera e baixa o arquivo Excel (.xlsx) a partir dos itens capturados (Geração Local)
   */
  exportToExcel(data: ScrapedItem[]) {
    const formattedData = data.map(item => ({
      'ID': item.id,
      'Título': item.title,
      'Categoria': item.category || 'N/A',
      'Preço': item.price || '-',
      'Link de Origem': item.link,
      'Data da Captura': new Date(item.timestamp || Date.now()).toLocaleString('pt-BR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Capturados");
    
    const wscols = [{wch: 15}, {wch: 40}, {wch: 20}, {wch: 15}, {wch: 50}, {wch: 25}];
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
