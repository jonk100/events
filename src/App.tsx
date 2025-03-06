import React, { useEffect, useState } from 'react';
import { Calendar, Globe, ListChecks, Pencil, Trash2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AddEventForm } from './components/AddEventForm';
import { EditEventModal } from './components/EditEventModal';
import Auth from "./components/SignIn";
import { getUser, signOut } from "./lib/auth";
import type { Country, EventWithOccurrences } from './types';

type ViewMode = 'month' | 'country' | 'event';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<EventWithOccurrences[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<EventWithOccurrences | null>(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );

  const fetchData = async () => {
    try {
      const [eventsResponse, countriesResponse] = await Promise.all([
        supabase
          .from('events')
          .select(`
            *,
            occurrences:event_occurrences(
              *,
              country:countries(*)
            )
          `),
        supabase
          .from('countries')
          .select('*')
          .order('name')
      ]);

      if (eventsResponse.error) throw eventsResponse.error;
      if (countriesResponse.error) throw countriesResponse.error;

      setEvents(eventsResponse.data as EventWithOccurrences[]);
      setCountries(countriesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setSession(user);
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      await fetchData();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const renderMonthView = () => {
    return monthNames.map(month => {
      const monthIndex = monthNames.indexOf(month) + 1;
      const monthEvents = events.filter(event =>
        event.occurrences.some(occ =>
          occ.start_month <= monthIndex && occ.end_month >= monthIndex
        )
      );

      return (
        <div key={month} className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">{month}</h3>
          {monthEvents.map(event => (
            <div key={event.id} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{event.name}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingEvent(event)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {event.occurrences
                  .filter(occ => occ.start_month <= monthIndex && occ.end_month >= monthIndex)
                  .map(occ => occ.country.name)
                  .join(', ')}
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  const renderCountryView = () => {
    if (!selectedCountry) {
      return (
        <div className="col-span-full p-4 text-center">
          Please select a country to view its events
        </div>
      );
    }

    return monthNames.map(month => {
      const monthIndex = monthNames.indexOf(month) + 1;
      const monthEvents = events.filter(event =>
        event.occurrences.some(occ =>
          occ.country_id === selectedCountry &&
          occ.start_month <= monthIndex &&
          occ.end_month >= monthIndex
        )
      );

      return (
        <div key={month} className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">{month}</h3>
          {monthEvents.map(event => (
            <div key={event.id} className="mb-2 flex items-center justify-between">
              <span>{event.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingEvent(event)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  const renderEventView = () => {
    if (!selectedEvent) {
      return (
        <div className="col-span-full p-4 text-center">
          Please select an event to view its occurrences
        </div>
      );
    }

    const event = events.find(e => e.id === selectedEvent);
    if (!event) return null;

    return monthNames.map(month => {
      const monthIndex = monthNames.indexOf(month) + 1;
      const countries = event.occurrences
        .filter(occ => occ.start_month <= monthIndex && occ.end_month >= monthIndex)
        .map(occ => occ.country.name);

      return (
        <div key={month} className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">{month}</h3>
          {countries.length > 0 ? (
            <div className="text-sm text-gray-600">
              {countries.join(', ')}
            </div>
          ) : (
            <div className="text-sm text-gray-400">No occurrences</div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Events</h1>
          <button onClick={signOut}>Sign Out</button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto">
        <AddEventForm
          countries={countries}
          onEventAdded={fetchData}
        />

        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center px-4 py-2 rounded ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <Calendar size={20} className="mr-2" />
            By Month
          </button>
          <button
            onClick={() => setViewMode('country')}
            className={`flex items-center px-4 py-2 rounded ${
              viewMode === 'country'
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <Globe size={20} className="mr-2" />
            By Country
          </button>
          <button
            onClick={() => setViewMode('event')}
            className={`flex items-center px-4 py-2 rounded ${
              viewMode === 'event'
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <ListChecks size={20} className="mr-2" />
            By Event
          </button>

          {viewMode === 'country' && (
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="flex-1 px-4 py-2 border rounded"
            >
              <option value="">Select a country...</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          )}

          {viewMode === 'event' && (
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="flex-1 px-4 py-2 border rounded"
            >
              <option value="">Select an event...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'country' && renderCountryView()}
          {viewMode === 'event' && renderEventView()}
        </div>

        {editingEvent && (
          <EditEventModal
            event={editingEvent}
            countries={countries}
            onClose={() => setEditingEvent(null)}
            onEventUpdated={fetchData}
          />
        )}
      </div>
    </div>
  );
}

export default App;