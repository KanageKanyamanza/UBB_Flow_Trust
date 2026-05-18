import dotenv from 'dotenv';

dotenv.config();

export class OcrService {
  private static API_KEY = process.env.GOOGLE_VISION_API_KEY;

  /**
   * Scans an image using Google Vision API and returns the full text
   */
  static async scanImage(base64Image: string): Promise<string> {
    if (!this.API_KEY) {
      throw new Error('Google Vision API Key not configured');
    }

    // Clean base64 prefix if present
    const content = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    try {
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content },
              features: [{ type: 'TEXT_DETECTION' }]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Google Vision Error Details:', errorBody);
        throw new Error(`Vision API Error: ${errorBody.error?.message || response.statusText}`);
      }

      const result = await response.json();
      const text = result.responses[0]?.fullTextAnnotation?.text || '';
      
      return text;
    } catch (error) {
      console.error('OcrService.scanImage error:', error);
      throw error;
    }
  }

  /**
   * Helper to extract data based on specific patterns (similar to frontend logic)
   */
  static extractData(text: string, mode: 'vehicule' | 'person' = 'person') {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    const data: any = {};

    if (mode === 'vehicule') {
      const plateRegex = /([0-9]{1,4}\s?[A-Z]{1,3}\s?[0-9]{1,2})|([A-Z]{2}-[0-9]{3}-[A-Z]{2})/i;
      const plateMatch = text.match(plateRegex);
      data.immatriculation = plateMatch ? plateMatch[0].toUpperCase() : '';
      const brands = ['TOYOTA', 'MERCEDES', 'BMW', 'RENAULT', 'PEUGEOT', 'HYUNDAI', 'KIA', 'VOLKSWAGEN', 'FORD'];
      data.marque = brands.find(b => text.toUpperCase().includes(b)) || '';
    } else {
      // Identity data extraction
      const nomMatch = text.match(/(?:NOM|SURNAME|LAST NAME)[(S)]*[\s:]+([A-Z\s.-]{2,})/i);
      data.nom = nomMatch?.[1]?.trim().split('\n')[0] ?? '';

      const prenomMatch = text.match(/(?:PRÉ?NOMS?|GIVEN NAMES?|FIRST NAME)[(S)]*[\s:]+([A-Z\s.-]{2,})/i);
      data.prenom = prenomMatch?.[1]?.trim().split('\n')[0] ?? '';

      const pieceMatch = text.match(/(?:N°|NO|NUMÉ?RO|ID|IDENTITY|PIÈ?CE|CONSULAIRE|DOCUMENT|PASSPORT)[\s:]+([A-Z0-9\s-]{4,})/i);
      data.numeroPiece = pieceMatch?.[1]?.trim().split('\n')[0] ?? '';

      const dateMatch = text.match(/(\d{2})[/.-](\d{2})[/.-](\d{4})/);
      if (dateMatch?.[1] && dateMatch?.[2] && dateMatch?.[3]) {
        data.dateNaissance = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      }

      if (!data.nom || !data.prenom) {
        const uppercaseLines = lines.filter(l => /^[A-Z\s.-]{3,}$/.test(l) && !l.includes('REPUBLIQUE') && !l.includes('CARTE'));
        if (!data.nom && uppercaseLines[0]) data.nom = uppercaseLines[0];
        if (!data.prenom && uppercaseLines[1]) data.prenom = uppercaseLines[1];
      }
    }

    // Final cleanup
    Object.keys(data).forEach(k => {
      if (typeof data[k] === 'string') {
        data[k] = data[k].replace(/^(NOM|PRENOM|SURNAME|GIVEN NAMES|DATE|ID|NO|NUMERO|DOCUMENT|PASSPORT)S?[:\s]*/i, '').trim();
      }
    });

    return data;
  }
}
