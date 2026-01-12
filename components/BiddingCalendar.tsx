import React, { useState, useMemo } from 'react';
import { Bidding, BiddingStatus } from '../types';
import { getModalityLabel, getStatusLabel } from '../services/biddingService';
import { ChevronLeft, ChevronRight, List, X } from 'lucide-react';

interface BiddingCalendarProps {
    biddings: Bidding[];
    onClose: () => void;
    onEditBidding: (bidding: Bidding) => void;
}

interface CalendarEvent {
    bidding: Bidding;
    date: Date;
    type: 'publication' | 'opening' | 'homologation' | 'signature';
    label: string;
    color: string;
}

export const BiddingCalendar: React.FC<BiddingCalendarProps> = ({
    biddings,
    onClose,
    onEditBidding
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterDepartment, setFilterDepartment] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<BiddingStatus | 'all'>('all');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Extrair departamentos únicos
    const uniqueDepartments = useMemo(() => {
        const depts = [...new Set(biddings.map(b => b.department))];
        return depts.sort();
    }, [biddings]);

    // Gerar eventos do calendário
    const calendarEvents = useMemo(() => {
        const events: CalendarEvent[] = [];

        biddings.forEach(bidding => {
            // Filtros
            if (filterDepartment !== 'all' && bidding.department !== filterDepartment) return;
            if (filterStatus !== 'all' && bidding.status !== filterStatus) return;

            // Publicação
            if (bidding.publicationDate) {
                events.push({
                    bidding,
                    date: new Date(bidding.publicationDate + 'T00:00:00'),
                    type: 'publication',
                    label: 'Publicação',
                    color: 'bg-blue-500'
                });
            }

            // Abertura
            if (bidding.openingDate) {
                events.push({
                    bidding,
                    date: new Date(bidding.openingDate + 'T00:00:00'),
                    type: 'opening',
                    label: 'Abertura',
                    color: 'bg-green-500'
                });
            }

            // Homologação
            if (bidding.homologationDate) {
                events.push({
                    bidding,
                    date: new Date(bidding.homologationDate + 'T00:00:00'),
                    type: 'homologation',
                    label: 'Homologação',
                    color: 'bg-purple-500'
                });
            }

            // Assinatura
            if (bidding.signatureDate) {
                events.push({
                    bidding,
                    date: new Date(bidding.signatureDate + 'T00:00:00'),
                    type: 'signature',
                    label: 'Assinatura',
                    color: 'bg-orange-500'
                });
            }
        });

        return events;
    }, [biddings, filterDepartment, filterStatus]);

    // Gerar dias do calendário
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();

        const days: Array<{ date: Date | null; events: CalendarEvent[] }> = [];

        // Dias vazios antes do primeiro dia do mês
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ date: null, events: [] });
        }

        // Dias do mês
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dayEvents = calendarEvents.filter(event => {
                return event.date.getFullYear() === year &&
                    event.date.getMonth() === month &&
                    event.date.getDate() === day;
            });
            days.push({ date, events: dayEvents });
        }

        return days;
    }, [currentDate, calendarEvents]);

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Calendário de Licitações</h2>
                        <p className="text-sm text-slate-600">{calendarEvents.length} eventos encontrados</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filters and Navigation */}
                <div className="px-6 py-4 border-b border-slate-200 space-y-4">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={previousMonth}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-slate-800 capitalize">{monthName}</h3>
                            <button
                                onClick={goToToday}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                Hoje
                            </button>
                        </div>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todas as secretarias</option>
                            {uniqueDepartments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as BiddingStatus | 'all')}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todos os status</option>
                            <option value="em_preparacao">Em Preparação</option>
                            <option value="publicada">Publicada</option>
                            <option value="aberta">Aberta</option>
                            <option value="em_analise">Em Análise</option>
                            <option value="homologada">Homologada</option>
                            <option value="adjudicada">Adjudicada</option>
                            <option value="contrato_assinado">Contrato Assinado</option>
                            <option value="ata_assinada">Ata Assinada</option>
                            <option value="deserta">Deserta</option>
                            <option value="fracassada">Fracassada</option>
                            <option value="revogada">Revogada</option>
                            <option value="anulada">Anulada</option>
                        </select>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-slate-700">Publicação</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-700">Abertura</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-slate-700">Homologação</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-slate-700">Assinatura</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                    <div className="grid grid-cols-7 gap-2">
                        {/* Week days header */}
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="text-center font-semibold text-slate-600 text-sm py-2">
                                {day}
                            </div>
                        ))}

                        {/* Calendar days */}
                        {calendarDays.map((day, index) => {
                            const isToday = day.date &&
                                day.date.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[100px] border border-slate-200 rounded-lg p-2 ${day.date ? 'bg-white hover:bg-slate-50' : 'bg-slate-50'
                                        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                    {day.date && (
                                        <>
                                            <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-700'
                                                }`}>
                                                {day.date.getDate()}
                                            </div>
                                            <div className="space-y-1">
                                                {day.events.slice(0, 3).map((event, eventIndex) => (
                                                    <button
                                                        key={eventIndex}
                                                        onClick={() => setSelectedEvent(event)}
                                                        className={`w-full text-left px-2 py-1 rounded text-xs ${event.color} text-white hover:opacity-90 transition-opacity truncate`}
                                                        title={`${event.bidding.biddingId} - ${event.label}`}
                                                    >
                                                        {event.bidding.biddingId}
                                                    </button>
                                                ))}
                                                {day.events.length > 3 && (
                                                    <div className="text-xs text-slate-500 text-center">
                                                        +{day.events.length - 3} mais
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Event Detail Modal */}
                {selectedEvent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedEvent.color} text-white mb-2`}>
                                        {selectedEvent.label}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedEvent.bidding.biddingId}</h3>
                                    <p className="text-sm text-slate-600">
                                        {selectedEvent.date.toLocaleDateString('pt-BR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-semibold text-slate-600">Modalidade</label>
                                    <p className="text-slate-800">{getModalityLabel(selectedEvent.bidding.modality)}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-600">Objeto</label>
                                    <p className="text-slate-800">{selectedEvent.bidding.object}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-600">Secretaria</label>
                                    <p className="text-slate-800">{selectedEvent.bidding.department}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-600">Status</label>
                                    <p className="text-slate-800">{getStatusLabel(selectedEvent.bidding.status)}</p>
                                </div>

                                {selectedEvent.bidding.winner && (
                                    <div>
                                        <label className="text-sm font-semibold text-slate-600">Vencedor</label>
                                        <p className="text-slate-800">{selectedEvent.bidding.winner}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={() => {
                                            setSelectedEvent(null);
                                            onEditBidding(selectedEvent.bidding);
                                        }}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Ver Detalhes
                                    </button>
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
