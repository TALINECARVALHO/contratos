import { jsPDF } from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { Contract, Minute, EnrichedFiscalizationReport, UserProfile, FiscalizationReport } from "../types";

// Helper para desenhar o Cabeçalho em todas as páginas
const addHeader = (doc: jsPDF, departmentTitle: string) => {
  try {
    const pageWidth = doc.internal.pageSize.width;

    // Título Principal (Nome da Prefeitura)
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont("helvetica", "bold");
    doc.text("PREFEITURA MUNICIPAL DE SÃO FRANCISCO DE PAULA", pageWidth / 2, 15, { align: 'center' });

    // Subtítulo (Secretaria / Setor)
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.setFont("helvetica", "bold"); // Bold para destacar a secretaria
    doc.text((departmentTitle || 'RELATÓRIO').toUpperCase(), pageWidth / 2, 22, { align: 'center' });

    // Linha Divisória
    doc.setDrawColor(59, 130, 246); // Blue-500
    doc.setLineWidth(0.5);
    doc.line(14, 28, pageWidth - 14, 28);
  } catch (err) {
    console.error("Erro ao adicionar cabeçalho:", err);
  }
};

// Helper para desenhar o Rodapé com numeração e usuário
const addFooter = (doc: jsPDF, userName: string) => {
  try {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR');

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Linha Fina no Rodapé
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

      // Texto de Emissão (Esquerda)
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Emitido por: ${userName || 'Sistema'} em ${dateStr} às ${timeStr}`, 14, pageHeight - 10);

      // Numeração (Direita)
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }
  } catch (err) {
    console.error("Erro ao adicionar rodapé:", err);
  }
};

export const exportToPDF = (contracts: Contract[], departmentName: string, userName: string) => {
  try {
    // Usamos orientação paisagem (landscape) se houver muitos dados, mas para contratos manteremos 'p' por enquanto
    // Se quiser automático: const orientation = contracts.length > 0 ? 'l' : 'p';
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

    // Definição das colunas
    const tableColumn = [
      "ID",
      "Secretaria",
      "Objeto",
      "Fornecedor",
      "Início",
      "Vencimento",
      "Situação"
    ];

    // Mapeamento dos dados
    const tableRows = contracts.map((contract) => {
      let statusText = "Vigente";
      if (contract.status === 'expired') statusText = "VENCIDO";
      if (contract.status === 'warning') statusText = "A VENCER";
      if (contract.status === 'executed') statusText = "EXECUTADO";
      if (contract.status === 'rescinded') statusText = "RESCINDIDO";

      return [
        contract.contractId || '',
        contract.department || '',
        contract.object || '',
        contract.supplier || '',
        contract.startDate || '',
        contract.endDate || '',
        statusText
      ];
    });

    // Configuração da Tabela
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 7, // Reduzi um pouco a fonte para caber em paisagem com margem
        cellPadding: 2,
        font: "helvetica",
        textColor: [51, 65, 85],
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold', halign: 'center' }, // ID
        1: { cellWidth: 30, halign: 'center' }, // Secretaria
        2: { cellWidth: 'auto' }, // Objeto
        3: { cellWidth: 50 }, // Fornecedor
        4: { cellWidth: 20, halign: 'center' }, // Início
        5: { cellWidth: 20, halign: 'center' }, // Vencimento
        6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }  // Status
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 6) {
          const text = String(data.cell.raw);
          if (text === 'VENCIDO') data.cell.styles.textColor = [239, 68, 68];
          else if (text === 'A VENCER') data.cell.styles.textColor = [245, 158, 11];
          else if (text === 'EXECUTADO') data.cell.styles.textColor = [100, 116, 139];
          else if (text === 'RESCINDIDO') data.cell.styles.textColor = [30, 41, 59];
          else data.cell.styles.textColor = [22, 163, 74];
        }
      },
      didDrawPage: function (data) {
        addHeader(doc, departmentName);
      },
      margin: { top: 35, left: 10, right: 10 }
    });

    addFooter(doc, userName);

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`relatorio_contratos_${dateStr}.pdf`);
  } catch (err: any) {
    console.error("Erro ao exportar PDF de contratos:", err);
    alert("Erro ao gerar PDF de contratos: " + err.message);
  }
};


export const exportMinutesToPDF = (minutes: Minute[], departmentName: string, userName: string) => {
  try {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

    const tableColumn = [
      "Ata Nº",
      "Secretaria",
      "Objeto",
      "Início",
      "Vencimento",
      "Situação"
    ];

    const tableRows = minutes.map((minute) => {
      let statusText = "Vigente";
      if (minute.status === 'expired') statusText = "VENCIDA";
      if (minute.status === 'warning') statusText = "A VENCER";
      if (minute.status === 'executed') statusText = "EXECUTADA";
      if (minute.status === 'rescinded') statusText = "RESCINDIDA";

      return [
        minute.minuteId || '',
        minute.department || '',
        minute.object || '',
        minute.startDate || '',
        minute.endDate || '',
        statusText
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: "helvetica",
        textColor: [51, 65, 85],
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [124, 58, 237], // Violet-600
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold', halign: 'center' }, // ID
        1: { cellWidth: 35, halign: 'center' }, // Secretaria
        2: { cellWidth: 'auto' }, // Objeto
        3: { cellWidth: 25, halign: 'center' }, // Início
        4: { cellWidth: 25, halign: 'center' }, // Vencimento
        5: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }  // Status
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 5) {
          const text = String(data.cell.raw);
          if (text === 'VENCIDA') data.cell.styles.textColor = [239, 68, 68];
          else if (text === 'A VENCER') data.cell.styles.textColor = [245, 158, 11];
          else if (text === 'EXECUTADA') data.cell.styles.textColor = [100, 116, 139];
          else if (text === 'RESCINDIDA') data.cell.styles.textColor = [30, 41, 59];
          else data.cell.styles.textColor = [22, 163, 74];
        }
      },
      didDrawPage: function (data) {
        addHeader(doc, departmentName);
      },
      margin: { top: 35, left: 10, right: 10 }
    });

    addFooter(doc, userName);

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`relatorio_atas_${dateStr}.pdf`);
  } catch (err: any) {
    console.error("Erro ao exportar PDF de atas:", err);
    alert("Erro ao gerar PDF de atas: " + err.message);
  }
};

export const exportFiscalizationReportToPDF = (
  reports: EnrichedFiscalizationReport[],
  period: { start: string, end: string },
  userName: string
) => {
  try {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const departmentName = "Relatório de Fiscalização";

    const tableColumn = [
      "Mês Ref.",
      "Documento",
      "Objeto",
      "Secretaria",
      "Status",
      "Última Assinatura"
    ];

    const tableRows = reports.map((report) => {
      const isSigned = report.manager_signed_at && report.tech_fiscal_signed_at && report.adm_fiscal_signed_at;
      const statusText = isSigned ? "ASSINADO" : "PENDENTE";

      const lastSignatureDate = [
        report.manager_signed_at,
        report.tech_fiscal_signed_at,
        report.adm_fiscal_signed_at,
      ]
        .filter(Boolean)
        .map(d => new Date(d!))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const lastSigFormatted = lastSignatureDate ? lastSignatureDate.toLocaleDateString('pt-BR') : 'N/A';

      const monthFormatted = report.reference_month?.split('-').reverse().join('/') || 'N/A';

      return [
        monthFormatted,
        report.documentIdentifier || '',
        report.documentObject || '',
        report.documentDepartment || '',
        statusText,
        lastSigFormatted
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: "helvetica",
        textColor: [51, 65, 85],
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [15, 23, 42], // Slate-900
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // Mês
        1: { cellWidth: 30, fontStyle: 'bold' }, // Documento
        2: { cellWidth: 'auto' }, // Objeto
        3: { cellWidth: 30 }, // Secretaria
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }, // Status
        5: { cellWidth: 25, halign: 'center' } // Data
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          const text = data.cell.raw as string;
          if (text === 'PENDENTE') {
            data.cell.styles.textColor = [245, 158, 11]; // Amber-500
          } else {
            data.cell.styles.textColor = [22, 163, 74]; // Green-600
          }
        }
      },
      didDrawPage: function (data) {
        addHeader(doc, departmentName);
      },
      margin: { top: 35, left: 10, right: 10 }
    });

    addFooter(doc, userName);

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`relatorio_fiscalizacao_${dateStr}.pdf`);
  } catch (err: any) {
    console.error("Erro ao exportar PDF de fiscalização:", err);
    alert("Erro ao gerar PDF de fiscalização: " + err.message);
  }
};

interface DashboardData {
  kpis: { total: number; active: number; warning: number; emergency: number; };
  statusData: { name: string; value: number; }[];
  deptData: { name: string; value: number; }[];
  supplierData: { name: string; value: number; }[];
  nextExpiring: (Contract | Minute)[];
}

export const exportDashboardToPDF = (data: DashboardData, userProfile: UserProfile, departmentFilter: string) => {
  try {
    const doc = new jsPDF();
    const userName = userProfile?.email || 'Usuário';
    const title = `Relatório do Dashboard - ${departmentFilter || 'Geral'}`;
    let finalY = 35; // Posição Y inicial após o cabeçalho

    addHeader(doc, title);

    // Seção 1: KPIs
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Resumo dos Indicadores Principais (KPIs)", 14, finalY);
    finalY += 8;
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`• Total de Documentos: ${data.kpis?.total || 0}`, 20, finalY);
    finalY += 7;
    doc.text(`• Documentos Vigentes: ${data.kpis?.active || 0}`, 20, finalY);
    finalY += 7;
    doc.text(`• Documentos em Atenção (A Vencer): ${data.kpis?.warning || 0}`, 20, finalY);
    finalY += 7;
    doc.text(`• Contratos Emergenciais Ativos: ${data.kpis?.emergency || 0}`, 20, finalY);
    finalY += 12;

    const generateTable = (titleText: string, head: string[][], body: any[][], columnStyles = {}) => {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      // Verifica se cabe na página antes de desenhar título
      if (finalY > 260) {
        doc.addPage();
        addHeader(doc, title);
        finalY = 35;
      }
      doc.text(titleText, 14, finalY);
      finalY += 2;

      autoTable(doc, {
        head, body,
        startY: finalY,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105] },
        columnStyles,
        didDrawPage: () => addHeader(doc, title),
        margin: { top: 35 }
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    };

    if (data.statusData && data.statusData.length > 0) generateTable("Situação Geral", [['Situação', 'Quantidade']], data.statusData.map(d => [d.name || '', d.value || 0]));
    if (data.deptData && data.deptData.length > 0) generateTable("Top 5 Secretarias (Documentos Ativos)", [['Secretaria', 'Quantidade']], data.deptData.map(d => [d.name || '', d.value || 0]));
    if (data.supplierData && data.supplierData.length > 0) generateTable("Top 5 Fornecedores (Contratos Ativos)", [['Fornecedor', 'Quantidade']], data.supplierData.map(d => [d.name || '', d.value || 0]));

    if (data.nextExpiring && data.nextExpiring.length > 0) {
      generateTable(
        "Atenção Imediata (Vencimento em ≤ 30 dias)",
        [['Documento', 'Objeto', 'Vencimento', 'Dias']],
        data.nextExpiring.map(d => [
          ('contractId' in d ? d.contractId : d.minuteId) || '',
          d.object || '',
          d.endDate || '',
          (d.daysRemaining || 0) <= 0 ? 'HOJE/VENCIDO' : `${d.daysRemaining}d`
        ]),
        { 1: { cellWidth: 'auto' } }
      );
    }

    addFooter(doc, userName);
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`dashboard_relatorio_${dateStr}.pdf`);
  } catch (err: any) {
    console.error("Erro ao exportar PDF do dashboard:", err);
    alert("Erro ao gerar PDF do dashboard: " + err.message);
  }
};

export const exportSingleFiscalizationReportToPDF = (
  report: FiscalizationReport,
  content: any,
  document: Contract | Minute,
  docType: 'contract' | 'minute',
  userProfile: UserProfile
) => {
  try {
    const doc = new jsPDF();
    const userName = userProfile?.email || 'N/A';
    const title = `Relatório de Fiscalização - Mês ${report.reference_month?.split('-').reverse().join('/') || 'N/A'}`;
    let finalY = 35;

    addHeader(doc, title);

    // Seção 1: Detalhes do Documento
    autoTable(doc, {
      body: [
        ['Documento:', docType === 'contract' ? (document as Contract).contractId || '' : (document as Minute).minuteId || ''],
        ['Objeto:', document.object || ''],
        ['Secretaria:', document.department || ''],
        ['Gestor:', report.manager_name || ''],
        ['Fiscal Técnico:', report.tech_fiscal_name || ''],
        ['Fiscal ADM:', report.adm_fiscal_name || ''],
      ],
      startY: finalY,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: 'bold', textColor: [71, 85, 105] } },
      didDrawPage: () => addHeader(doc, title),
      margin: { top: 35 }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // Seção 2: Conteúdo do Formulário
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    if (finalY > 260) { // Check if content will fit on current page
      doc.addPage();
      addHeader(doc, title);
      finalY = 35;
    }
    doc.text("Conteúdo do Relatório", 14, finalY);
    finalY += 2;

    const reportBody = (content?.sections || []).flatMap((section: any) => {
      const sectionTitle = [{ content: section.title || 'Seção', colSpan: 2, styles: { fontStyle: 'bold', fillColor: '#f1f5f9' } }];
      const fields = (section.fields || []).map((field: any) => {
        let valueText = field.value;
        if (field.type === 'checkbox') valueText = field.value ? 'Sim' : 'Não';
        return [field.label || '', valueText || ''];
      });
      return [sectionTitle, ...fields];
    });

    autoTable(doc, {
      body: reportBody,
      startY: finalY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' } },
      didDrawPage: () => addHeader(doc, title),
      margin: { top: 35 }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // Seção 3: Assinaturas
    const sigTableBody = [
      ['Fiscal Técnico', report.tech_fiscal_signed_at ? 'ASSINADO' : 'PENDENTE', report.tech_fiscal_signed_at ? new Date(report.tech_fiscal_signed_at).toLocaleString('pt-BR') : ''],
      ['Fiscal Administrativo', report.adm_fiscal_signed_at ? 'ASSINADO' : 'PENDENTE', report.adm_fiscal_signed_at ? new Date(report.adm_fiscal_signed_at).toLocaleString('pt-BR') : ''],
      ['Gestor do Contrato', report.manager_signed_at ? 'ASSINADO' : 'PENDENTE', report.manager_signed_at ? new Date(report.manager_signed_at).toLocaleString('pt-BR') : ''],
    ];

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    if (finalY > 260) { // Check if content will fit on current page
      doc.addPage();
      addHeader(doc, title);
      finalY = 35;
    }
    doc.text("Assinaturas Digitais (Registradas no Sistema)", 14, finalY);
    finalY += 2;

    autoTable(doc, {
      head: [['Responsável', 'Status', 'Data da Assinatura']],
      body: sigTableBody,
      startY: finalY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      headStyles: { fillColor: [71, 85, 105] },
      didDrawPage: () => addHeader(doc, title),
      margin: { top: 35 }
    });

    addFooter(doc, userName);
    const docId = docType === 'contract' ? (document as Contract).contractId : (document as Minute).minuteId;
    doc.save(`fiscalizacao_${(docId || 'Doc').replace('/', '_')}_${report.reference_month || 'Ref'}.pdf`);
  } catch (err: any) {
    console.error("Erro ao exportar PDF único de fiscalização:", err);
    alert("Erro ao gerar PDF de fiscalização: " + err.message);
  }
};

export const exportCustomReportToPDF = (
  documents: (Contract | Minute)[],
  title: string,
  userName: string
) => {
  try {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

    const tableColumn = ["ID", "Tipo", "Secretaria", "Objeto", "Vencimento", "Situação"];

    const tableRows = documents.map((doc) => {
      let statusText = "Vigente";
      if (doc.status === 'expired') statusText = "Vencido";
      if (doc.status === 'warning') statusText = "A Vencer";
      if (doc.status === 'executed') statusText = "Executado";
      if (doc.status === 'rescinded') statusText = "Rescindido";

      const isContract = 'contractId' in doc;

      return [
        (isContract ? doc.contractId : doc.minuteId) || '',
        isContract ? "Contrato" : "Ata",
        doc.department || '',
        doc.object || '',
        doc.endDate || '',
        statusText
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: "helvetica",
        textColor: [51, 65, 85],
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 5) {
          const text = String(data.cell.raw);
          if (text === 'Vencido') data.cell.styles.textColor = [239, 68, 68];
          else if (text === 'A Vencer') data.cell.styles.textColor = [245, 158, 11];
          else if (text === 'Executado') data.cell.styles.textColor = [100, 116, 139];
          else if (text === 'Rescindido') data.cell.styles.textColor = [30, 41, 59];
          else data.cell.styles.textColor = [22, 163, 74];
        }
      },
      didDrawPage: (data) => addHeader(doc, title),
      margin: { top: 35, left: 10, right: 10 }
    });

    addFooter(doc, userName);
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`relatorio_personalizado_${dateStr}.pdf`);
  } catch (err: any) {
    console.error("Erro ao exportar relatório personalizado:", err);
    alert("Erro ao gerar PDF do relatório: " + err.message);
  }
};

interface IncompleteDocument {
  doc: Contract | Minute;
  missingFields: string[];
}

export const exportIncompleteDataToPDF = (
  documents: IncompleteDocument[],
  userName: string
) => {
  try {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const title = "Relatório Rápido - Dados Incompletos";

    const tableColumn = ["ID", "Tipo", "Objeto", "Secretaria", "Dados Faltantes"];

    const tableRows = documents.map(({ doc, missingFields }) => {
      const isContract = 'contractId' in doc;
      return [
        (isContract ? doc.contractId : doc.minuteId) || '',
        isContract ? "Contrato" : "Ata",
        doc.object || '',
        doc.department || '',
        (missingFields || []).join(', ')
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: "helvetica",
        textColor: [51, 65, 85],
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [220, 38, 38], // Red-600
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: { fillColor: [254, 242, 242] }, // Red-50
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 40, halign: 'center' },
        4: { cellWidth: 60, fontStyle: 'bold' }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = [199, 24, 54]; // Red-700
        }
      },
      didDrawPage: (data) => addHeader(doc, title),
      margin: { top: 35, left: 10, right: 10 }
    });

    addFooter(doc, userName);
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`relatorio_dados_incompletos_${dateStr}.pdf`);
  } catch (err: any) {
    console.error("Erro ao exportar relatório de dados incompletos:", err);
    alert("Erro ao gerar PDF: " + err.message);
  }
};

export const exportDailyAllowanceToPDF = (
  allowance: any, // Using any for flexibility or DailyAllowance
  userProfile: UserProfile
) => {
  try {
    const doc = new jsPDF();
    const userName = userProfile?.name || userProfile?.email || 'Sistema';
    const title = "SOLICITAÇÃO DE DIÁRIAS";

    addHeader(doc, title);

    let finalY = 40;

    // Cabeçalho / Informações Básicas
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Solicitante", 14, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    finalY += 6;
    doc.text(`Beneficiário: ${allowance.beneficiaryName || '-'}`, 14, finalY);
    finalY += 5;
    doc.text(`Cargo/Função: ${allowance.beneficiaryRole || '-'}`, 14, finalY);
    finalY += 5;
    doc.text(`Secretaria/Departamento: ${allowance.department || '-'}`, 14, finalY);

    finalY += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dados da Viagem", 14, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    finalY += 6;
    doc.text(`Destino: ${allowance.destination || '-'}`, 14, finalY);
    finalY += 5;
    doc.text(`Período: ${allowance.startDate ? new Date(allowance.startDate).toLocaleDateString() : '-'} até ${allowance.endDate ? new Date(allowance.endDate).toLocaleDateString() : '-'}`, 14, finalY);
    finalY += 5;
    doc.text(`Objetivo/Missão:`, 14, finalY);
    finalY += 5;

    // Multi-line text for mission description
    const splitDescription = doc.splitTextToSize(allowance.missionDescription || '-', 180);
    doc.text(splitDescription, 14, finalY);
    finalY += (splitDescription.length * 5) + 5;

    // Dados Bancários e Valor
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dados para Pagamento", 14, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    finalY += 6;
    doc.text(`Banco: ${allowance.bankName || '-'}`, 14, finalY);
    doc.text(`Agência: ${allowance.agency || '-'}`, 80, finalY);
    doc.text(`Conta: ${allowance.accountNumber || '-'}`, 140, finalY);

    finalY += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Valor Estimado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(allowance.totalValue || 0)}`, 14, finalY);

    // Campos de Assinatura
    finalY += 40;
    doc.setLineWidth(0.5);
    doc.line(20, finalY, 90, finalY); // Line 1
    doc.line(110, finalY, 180, finalY); // Line 2

    finalY += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Assinatura do Beneficiário", 55, finalY, { align: 'center' });
    doc.text("Assinatura do Responsável (Secretário)", 145, finalY, { align: 'center' });

    addFooter(doc, userName);
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`solicitacao_diaria_${allowance.beneficiaryName?.replace(/\s+/g, '_')}_${dateStr}.pdf`);
  } catch (err: any) {
    console.error("Erro ao exportar PDF de diária:", err);
    alert("Erro ao gerar PDF de diária: " + err.message);
  }
};