import { Injectable } from '@angular/core';

export interface PrintData {
  refNo: string;
  recipientType: 'HOSP' | 'PH';
  questions: Array<{ text: string, lines: number }>;
  date?: Date;
  patientName?: string;
  hospitalName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MqPrintService {
  constructor() {}

  /**
   * Print Medical Questionnaire
   * Creates a dedicated print layout and triggers the browser's print dialog
   */
  print(data: PrintData): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const formattedDate = (data.date || new Date()).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });

    const questionsHtml = data.questions.map((q, i) => `
      <div class="question-block">
        <div class="question-text">
          <span class="q-num">${i + 1}.</span>
          <span class="q-content">${q.text}</span>
        </div>
        <div class="response-lines">
          ${Array(q.lines || 3).fill(0).map(() => '<div class="line"></div>').join('')}
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Questionnaire - ${data.refNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1a202c; 
              margin: 0; 
              padding: 40px; 
              background: #fff;
            }
            
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 60px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e2e8f0;
            }
            
            .title-section h1 {
              font-size: 24px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 4px;
              margin: 0;
              color: #1a202c;
            }
            
            .meta-section {
              text-align: right;
            }
            
            .ref-chip {
              display: inline-block;
              background: #f1f5f9;
              padding: 4px 12px;
              border-radius: 6px;
              font-family: monospace;
              font-weight: bold;
              font-size: 14px;
              color: #475569;
              border: 1px solid #e2e8f0;
            }
            
            .date-text {
              font-size: 12px;
              color: #94a3b8;
              font-weight: bold;
              margin-top: 8px;
              text-transform: uppercase;
            }
            
            .recipient-alert {
              margin-bottom: 40px;
              padding: 120px 0 20px;
              border-bottom: 1px solid #f1f5f9;
            }
            
            .recipient-tag {
              display: inline-block;
              padding: 6px 20px;
              background: ${data.recipientType === 'HOSP' ? '#1e40af' : '#7e22ce'};
              color: white;
              border-radius: 99px;
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 30px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .patient-info {
              margin-bottom: 40px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #f1f5f9;
            }

            .info-label {
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              color: #94a3b8;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }

            .info-value {
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
            }

            .questions-section {
              margin-top: 40px;
            }
            
            .question-block {
              margin-bottom: 32px;
              padding: 24px;
              background: #fff;
              border: 1px solid #f1f5f9;
              border-radius: 12px;
              page-break-inside: avoid;
            }
            
            .question-text {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              display: flex;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            
            .q-num { 
              color: #3b82f6;
              margin-right: 12px;
              min-width: 20px;
            }
            
            .response-lines {
              margin-top: 16px;
            }
            
            .line {
              height: 0;
              border-bottom: 1px dotted #cbd5e1;
              margin-bottom: 28px;
            }
            
            @media print {
              body { padding: 0; }
              .container { max-width: 100%; border: none; padding: 0; }
              .question-block { border: none; padding: 24px 0; border-bottom: 1px solid #f1f5f9; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title-section">
                <h1>Medical Query</h1>
                <div style="font-size: 10px; color: #64748b; font-weight: bold; margin-top: 4px; letter-spacing: 1px;">CENTRAL CASE MANAGEMENT SYSTEM</div>
              </div>
              <div class="meta-section">
                <div class="ref-chip">${data.refNo}</div>
                <div class="date-text">DATE: ${formattedDate}</div>
              </div>
            </div>

            ${(data.patientName || data.hospitalName) ? `
              <div class="patient-info">
                <div style="display: flex; gap: 40px;">
                  ${data.patientName ? `
                    <div>
                      <div class="info-label">Patient Name</div>
                      <div class="info-value">${data.patientName}</div>
                    </div>
                  ` : ''}
                  ${data.hospitalName ? `
                    <div>
                      <div class="info-label">Hospital Name</div>
                      <div class="info-value">${data.hospitalName}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            <div class="recipient-tag">FOR: ${data.recipientType === 'HOSP' ? 'HOSPITAL USE' : 'POLICY HOLDER'}</div>

            <div class="questions-section">
              ${questionsHtml}
            </div>
            
            <div style="margin-top: 80px; text-align: center; color: #94a3b8; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
              This is a computer-generated document. No signature required.
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              // Note: Close back after printing (Safari compatibility variant might be needed)
              // window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}
