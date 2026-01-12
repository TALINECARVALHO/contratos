
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createTransport } from "npm:nodemailer@6.9.7";

declare const Deno: any;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SMTP_EMAIL = Deno.env.get('SMTP_EMAIL')
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 465;
const SENDER_NAME = "Setor de Contratos (PM SFP)";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const normalizeText = (text: string) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const cleanEmail = (email: string) => email?.toLowerCase().trim() || "";

const getDayDetails = (dateStr: string) => {
    try {
        const parts = dateStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dayOfWeek = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
        const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return `${capitalizedDay} - ${isWeekend ? 'Final de Semana' : 'Dia Útil'}`;
    } catch (e) { return ""; }
};

const calculateDays = (dateStr: string) => {
    if (!dateStr) return Infinity;
    try {
        const parts = dateStr.split('-');
        const targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e) { return Infinity; }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    let action = 'check_and_notify';
    let force = false;
    try {
        const body = await req.json();
        if (body) { action = body.action || action; force = body.force || false; }
    } catch (e) {}
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === 'get_pending_list') {
        const { data: settings } = await supabase.from('notification_settings').select('*').single();
        const TARGET_DAYS = settings?.thresholds || [180, 150, 120, 90, 60, 30, 7];
        const { data: contracts } = await supabase.from('contracts').select('*');
        const { data: minutes } = await supabase.from('minutes').select('*');
        const pending = [];
        const allDocs = [...(contracts || []).map(c => ({...c, identifier: c.contract_id})), ...(minutes || []).map(m => ({...m, identifier: m.minute_id}))];

        for (const doc of allDocs) {
            if (doc.manual_status === 'executed' || doc.manual_status === 'rescinded') continue;
            const days = calculateDays(doc.end_date);
            if (TARGET_DAYS.includes(days)) {
                pending.push({ identifier: doc.identifier, object: doc.object, daysRemaining: days, alertReason: `Alerta de ${days} dias` });
            }
        }
        return new Response(JSON.stringify({ pending: pending.sort((a,b) => a.daysRemaining - b.daysRemaining) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const transporter = createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: true, auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD } });
    const { data: settings } = await supabase.from('notification_settings').select('*').single();
    const TARGET_DAYS = settings?.thresholds || [180, 150, 120, 90, 60, 30, 7];
    const EXTRA_EMAILS = (settings?.additional_emails || []).map((e: string) => cleanEmail(e));
    const { data: profiles } = await supabase.from('profiles').select('email, department, role');
    const { data: contracts } = await supabase.from('contracts').select('*');
    const { data: minutes } = await supabase.from('minutes').select('*');
    
    const allDocs = [
        ...(contracts || []).map(c => ({...c, docKind: 'CONTRATO', identifier: c.contract_id || `${c.number}/${c.year}`})),
        ...(minutes || []).map(m => ({...m, docKind: 'ATA', identifier: m.minute_id || `${m.number}/${m.year}`}))
    ];

    let emailsSentCount = 0;
    const notificationsToCreate = [];

    for (const doc of allDocs) {
        if (doc.manual_status === 'executed' || doc.manual_status === 'rescinded') continue;
        const daysRemaining = calculateDays(doc.end_date);
        
        if (TARGET_DAYS.includes(daysRemaining) || (force && daysRemaining >= 0)) {
            const dateFormatted = new Date(doc.end_date).toLocaleDateString('pt-BR');
            const dayDetail = getDayDetails(doc.end_date);
            const deptUpper = normalizeText(doc.department);
            const isAta = doc.docKind === 'ATA';

            // Conteúdo dinâmico baseado no tipo de documento (Contrato vs Ata)
            const introSentence = isAta 
                ? `A Ata de Registro de Preços nº <strong>${doc.identifier}</strong>, referente a <strong>${normalizeText(doc.type || 'DOCUMENTO')}</strong>`
                : `Informamos que o contrato <strong>${doc.identifier}</strong>, referente à <strong>${normalizeText(doc.type || 'DOCUMENTO')}</strong>`;
            
            const docListTitle = isAta 
                ? `Documentação necessária para renovação:`
                : `Caso haja necessidade de renovação, prorrogação ou outras providências, seguem os documentos necessários:`;

            const docListItems = isAta 
                ? `
                    <li style="margin-bottom: 5px;">Nº da Ata</li>
                    <li style="margin-bottom: 5px;">Pesquisa de preços atualizada</li>
                    <li style="margin-bottom: 5px;">Justificativa para renovação</li>
                    <li style="margin-bottom: 5px;">Cadastro de fornecedor atualizado</li>
                `
                : `
                    <li style="margin-bottom: 5px;">Nº do Contrato</li>
                    <li style="margin-bottom: 5px;">Período a ser prorrogado</li>
                    <li style="margin-bottom: 5px;">Justificativa</li>
                    <li style="margin-bottom: 5px;">Pedido de Compra autorizado</li>
                    <li style="margin-bottom: 5px;">Ateste da vantajosidade (para serviços contínuos)</li>
                    <li style="margin-bottom: 5px;">Cadastro do fornecedor atualizado</li>
                `;

            const emailHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; line-height: 1.6; max-width: 600px;">
                    <p>Olá, <strong>${deptUpper}</strong></p>
                    
                    <p>${introSentence}, vencerá no dia <span style="color: #ef4444; font-weight: bold;">${dateFormatted}</span> (<span style="color: #2563eb;">${dayDetail}</span>).</p>
                    
                    <p>Faltam <strong>${daysRemaining}</strong> dias para o vencimento.</p>
                    
                    <p>${docListTitle}</p>
                    
                    <div style="background-color: #f8fafc; border-left: 4px solid ${isAta ? '#7c3aed' : '#3b82f6'}; padding: 15px; margin: 20px 0;">
                        <ol style="margin: 0; padding-left: 20px; font-size: 14px;">
                            ${docListItems}
                        </ol>
                    </div>
                    
                    <p style="margin-top: 30px;">Atenciosamente,</p>
                    <p style="margin-top: 0; line-height: 1.2;">
                        <strong>Setor de Contratos</strong><br/>
                        Prefeitura Municipal de São Francisco de Paula
                    </p>
                </div>
            `;

            const recipients = (profiles || [])
                .filter((p: any) => normalizeText(p.department) === deptUpper && p.role !== 'admin' && p.role !== 'super_admin')
                .map((p: any) => cleanEmail(p.email));
            
            const allRecipients = [...new Set([...recipients, ...EXTRA_EMAILS])].filter(Boolean);

            if (allRecipients.length > 0) {
                try {
                    await transporter.sendMail({
                        from: `"${SENDER_NAME}" <${SMTP_EMAIL}>`,
                        to: allRecipients,
                        subject: `AVISO DE VENCIMENTO: ${doc.docKind} ${doc.identifier}`,
                        html: emailHtml,
                    });
                    emailsSentCount++;
                    notificationsToCreate.push({
                        department: doc.department,
                        title: `E-mail enviado: ${doc.identifier}`,
                        message: `Alerta de ${daysRemaining} dias enviado para ${allRecipients.length} destinatários.`,
                        is_read: false
                    });
                } catch (e) { console.error(`Erro ao enviar para ${doc.identifier}:`, e); }
            }
        }
    }

    if (notificationsToCreate.length > 0) await supabase.from('notifications').insert(notificationsToCreate);

    return new Response(JSON.stringify({ success: true, message: `Processado. ${emailsSentCount} e-mails enviados.`, version: 'v23' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
})
