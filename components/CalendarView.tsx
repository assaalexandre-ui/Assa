import React, { useState } from 'react';
import { Rental, Vehicle, MaintenanceRecord, RentalStatus } from '../types';
import { CheckCircleIcon } from './icons';

interface CalendarEvent {
  date: Date;
  title: string;
  type: 'rental' | 'maintenance' | 'deadline' | 'reservation' | 'completed';
  isPaid?: boolean;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Adjust so Monday is 0, Sunday is 6
};

const CalendarView: React.FC<{
  rentals: Rental[];
  vehicles: Vehicle[];
  maintenanceRecords: MaintenanceRecord[];
}> = ({ rentals, vehicles, maintenanceRecords }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  const eventsByDate: { [key: string]: CalendarEvent[] } = {};

  // Process Rentals
  rentals.forEach(r => {
      const startDate = new Date(r.startDate);
      const endDate = new Date(r.endDate);
      let iterDate = new Date(startDate);
      const isPaid = r.balanceDue <= 0;
      
      while(iterDate <= endDate) {
        const dateKey = iterDate.toISOString().split('T')[0];
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        
        let eventType: CalendarEvent['type'];
        switch(r.status) {
            case RentalStatus.Active: eventType = 'rental'; break;
            case RentalStatus.Reserved: eventType = 'reservation'; break;
            case RentalStatus.Completed: eventType = 'completed'; break;
            default: eventType = 'rental';
        }
        
        eventsByDate[dateKey].push({
            date: new Date(iterDate),
            title: `${r.customerName} - ${vehicles.find(v => v.id === r.vehicleId)?.model || ''}`,
            type: eventType,
            isPaid,
        });
        iterDate.setDate(iterDate.getDate() + 1);
      }
  });

  // Process Maintenance
  maintenanceRecords.forEach(m => {
      const dateKey = m.date;
      if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push({
          date: new Date(m.date),
          title: `Maintenance ${vehicles.find(v => v.id === m.vehicleId)?.model || ''}`,
          type: 'maintenance'
      });
  });
  
  // Process Vehicle Deadlines
  vehicles.forEach(v => {
      const deadlines = [
          { date: v.insuranceExpiry, type: 'Assurance' },
          { date: v.technicalInspectionExpiry, type: 'Visite Tech.' },
          { date: v.nextMaintenance, type: 'Maintenance Prév.' }
      ];
      deadlines.forEach(d => {
        const dateKey = d.date;
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push({
            date: new Date(d.date),
            title: `${d.type} ${v.model}`,
            type: 'deadline'
        });
      });
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-start-${i}`} className="border-r border-b"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split('T')[0];
    const dayEvents = eventsByDate[dateKey] || [];
    const isToday = new Date().toISOString().split('T')[0] === dateKey;

    cells.push(
      <div key={day} className="relative border-r border-b p-2 min-h-[120px]">
        <span className={`absolute top-2 right-2 text-sm font-semibold ${isToday ? 'bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-600'}`}>
          {day}
        </span>
        <div className="mt-8 space-y-1">
          {dayEvents.slice(0, 3).map((event, index) => {
            const colors = {
              rental: 'bg-blue-100 text-blue-800',
              reservation: 'bg-indigo-100 text-indigo-800',
              maintenance: 'bg-yellow-100 text-yellow-800',
              deadline: 'bg-red-100 text-red-800',
              completed: 'bg-gray-100 text-gray-700'
            };
            return (
              <div key={index} className={`flex items-center p-1 rounded-md text-xs truncate ${colors[event.type]}`} title={event.title}>
                {event.isPaid && <CheckCircleIcon className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />}
                <span className="truncate">{event.title}</span>
              </div>
            );
          })}
          {dayEvents.length > 3 && (
            <div className="text-xs text-gray-500 font-semibold mt-1">
              + {dayEvents.length - 3} de plus
            </div>
          )}
        </div>
      </div>
    );
  }

  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    cells.push(<div key={`empty-end-${i}`} className="border-r border-b"></div>);
  }

  return (
    <div className="p-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800">Calendrier</h1>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
                <button onClick={handlePrevMonth} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">&lt;</button>
                <h2 className="text-xl font-semibold text-gray-700">{monthName}</h2>
                <button onClick={handleNextMonth} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">&gt;</button>
            </div>
            <div className="grid grid-cols-7">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-bold text-gray-600 py-3 border-b border-r">{day}</div>
                ))}
                {cells}
            </div>
        </div>
    </div>
  );
};

export default CalendarView;