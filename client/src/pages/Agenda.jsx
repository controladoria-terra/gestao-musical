import React, { useState, useEffect, useMemo } from 'react';
import { getEventos } from '../api';
import StatusBadge from '../components/StatusBadge';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, DollarSign, Music } from 'lucide-react';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const statusColors = { pendente: 'bg-amber-500', confirmado: 'bg-blue-500', realizado: 'bg-emerald-500', cancelado: 'bg-rose-500' };

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function Agenda() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    getEventos().then(data => { setEventos(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filteredEventos = useMemo(() => {
    if (statusFilter === 'all') return eventos;
    return eventos.filter(e => e.status === statusFilter);
  }, [eventos, statusFilter]);

  const eventosByDate = useMemo(() => {
    const map = {};
    filteredEventos.forEach(e => {
      if (!e.data) return;
      const d = new Date(e.data);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [filteredEventos]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentMonth, currentYear]);

  const monthEventos = useMemo(() => {
    return filteredEventos
      .filter(e => {
        if (!e.data) return false;
        const d = new Date(e.data);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [filteredEventos, currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const today = new Date();
  const isToday = (day) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div className="space-y-6">
      {/* Header with month navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl">
            <Calendar className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{monthNames[currentMonth]} {currentYear}</h2>
            <p className="text-sm text-slate-500">{monthEventos.length} eventos no mês</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <button onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }} className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors">
            Hoje
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ k: 'all', l: 'Todos' }, { k: 'pendente', l: 'Pendentes' }, { k: 'confirmado', l: 'Confirmados' }, { k: 'realizado', l: 'Realizados' }, { k: 'cancelado', l: 'Cancelados' }].map(f => (
          <button key={f.k} onClick={() => setStatusFilter(f.k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${statusFilter === f.k ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {dayNames.map(d => (
            <div key={d} className="p-3 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={idx} className="min-h-20 border-b border-r border-slate-100 bg-slate-50/50" />;
            const key = `${currentYear}-${currentMonth}-${day}`;
            const dayEvents = eventosByDate[key] || [];
            return (
              <div key={idx} onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                className={`min-h-20 border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors hover:bg-emerald-50 ${selectedDay === day ? 'bg-emerald-50 ring-2 ring-emerald-400 ring-inset' : ''} ${isToday(day) ? 'bg-amber-50' : ''}`}>
                <div className={`text-xs font-semibold mb-1 ${isToday(day) ? 'text-amber-600' : 'text-slate-600'}`}>{day}</div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <div key={i} className={`flex items-center gap-1 px-1 py-0.5 rounded text-xs truncate ${statusColors[e.status] || 'bg-slate-400'} text-white`}>
                      <span className="truncate">{e.artista_nome || e.titulo}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-xs text-slate-400 px-1">+{dayEvents.length - 3} mais</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">{selectedDay} de {monthNames[currentMonth]} de {currentYear}</h3>
          {(eventosByDate[`${currentYear}-${currentMonth}-${selectedDay}`] || []).map((e, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <Music className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-medium text-slate-800">{e.titulo}</p>
                  <p className="text-sm text-slate-500">{e.artista_nome} • {e.local}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">{e.horario}</span>
                <span className="text-sm font-semibold text-slate-700">{formatCurrency(e.valor)}</span>
                <StatusBadge status={e.status} size="sm" />
              </div>
            </div>
          ))}
          {!(eventosByDate[`${currentYear}-${currentMonth}-${selectedDay}`] || []).length && <p className="text-slate-400 text-sm">Nenhum evento neste dia.</p>}
        </div>
      )}

      {/* Month events list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Eventos de {monthNames[currentMonth]}</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando eventos...</div>
        ) : monthEventos.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum evento neste mês.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {monthEventos.map((e, i) => {
              const d = new Date(e.data);
              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-lg font-bold text-emerald-700 leading-none">{d.getDate()}</span>
                      <span className="text-[10px] text-emerald-500 uppercase">{dayNames[d.getDay()]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{e.artista_nome || e.titulo}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        {e.local && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.local}</span>}
                        {e.horario && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.horario}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(e.valor)}</span>
                    <StatusBadge status={e.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
