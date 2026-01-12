
/**
 * Adiciona uma duração (dias, meses ou anos) a uma data no formato DD/MM/AAAA.
 * Retorna a nova data no mesmo formato.
 */
export const addDurationToDate = (baseDate: string, duration: number, unit: 'dia' | 'mes' | 'ano' | string): string => {
    if (!baseDate || !duration) return baseDate;

    try {
        const parts = baseDate.split('/');
        if (parts.length !== 3) return baseDate;

        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        const date = new Date(year, month - 1, day);
        const originalDay = date.getDate();

        if (unit === 'dia' || unit === 'days') {
            date.setDate(date.getDate() + duration);
        } else if (unit === 'mes' || unit === 'months') {
            date.setMonth(date.getMonth() + duration);
            // Ajuste para virada de mês (ex: 31 de Janeiro + 1 mês -> 28/29 de Fevereiro)
            if (date.getDate() !== originalDay) {
                date.setDate(0);
            }
        } else if (unit === 'ano' || unit === 'years') {
            date.setFullYear(date.getFullYear() + duration);
            // Ajuste para anos bissextos
            if (date.getDate() !== originalDay) {
                date.setDate(0);
            }
        }

        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
        console.error("Erro ao calcular data:", e);
        return baseDate;
    }
};

/**
 * Calcula a diferença em dias entre uma data DD/MM/AAAA e hoje.
 */
export const calculateDaysRemaining = (dateStr: string): number => {
    if (!dateStr) return 0;
    try {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return 0;

        const targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
        return 0;
    }
};
