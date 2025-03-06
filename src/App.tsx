import React, { useEffect, useState } from 'react'; // Importing React and hooks for state and lifecycle management
import { supabase } from './lib/supabase'; // Importing supabase client for database interactions
import Auth from "./components/SignIn"; // Importing authentication component
import { getUser, signOut } from "./lib/auth"; // Importing user management functions
import { AddEventForm } from './components/AddEventForm'; // Importing form to add new events
import { EditEventModal } from './components/EditEventModal'; // Importing modal for editing events
import { PrintFriendlyButton } from './components/PrintFriendlyButton'; // Importing print-friendly button component
import { Calendar, Globe, ListChecks, Pencil, Trash2 } from 'lucide-react'; // Importing icons for UI
import type { Country, EventWithOccurrences } from './types'; // Importing types for TypeScript

// Defining possible view modes
type ViewMode = 'month' | 'country' | 'event'; // Enum for view modes

/**
 * Main App component that manages application state and renders the appropriate views
 * @returns {JSX.Element} The rendered App component
 */
function App() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('month'); // State for current view mode
  const [selectedCountry, setSelectedCountry] = useState<string>(''); // State for selected country
  const [selectedEvent, setSelectedEvent] = useState<string>(''); // State for selected event
  
  // Data state
  const [events, setEvents] = useState<EventWithOccurrences[]>([]); // State for storing events
  const [countries, setCountries] = useState<Country[]>([]); // State for storing countries
  const [editingEvent, setEditingEvent] = useState<EventWithOccurrences | null>(null); // State for currently editing event
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null); // State for delete confirmation
  
  // Auth state
  const [session, setSession] = useState(null); // State for user session
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Generate array of month names
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' }) // Generating month names
  );

  /**
   * Fetches events and countries data from the database
   */
  const fetchData = async () => {
    try {
      // Fetching events and countries data in parallel
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

      // Handling errors
      if (eventsResponse.error) throw eventsResponse.error;
      if (countriesResponse.error) throw countriesResponse.error;

      // Setting events and countries state
      setEvents(eventsResponse.data as EventWithOccurrences[]);
      setCountries(countriesResponse.data);
    } catch (error) {
      // Logging errors
      console.error('Error fetching data:', error);
    }
  };

  /**
   * Shows confirmation dialog before deleting an event
   * @param {string} eventId - The ID of the event to delete
   * @param {string} eventName - The name of the event to delete
   */
  const confirmDeleteEvent = (eventId: string, eventName: string) => {
    setDeleteConfirmation({ id: eventId, name: eventName });
  };

  /**
   * Cancels the delete confirmation
   */
  const cancelDeleteEvent = () => {
    setDeleteConfirmation(null);
  };

  /**
   * Deletes an event from the database
   */
  const handleDeleteEvent = async () => {
    if (!deleteConfirmation) return;
    
    try {
      // Deleting event by ID
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteConfirmation.id);

      // Handling errors
      if (error) throw error;
      
      // Refreshing data after deletion
      await fetchData();
      
      // Close the confirmation dialog
      setDeleteConfirmation(null);
    } catch (error) {
      // Logging errors
      console.error('Error deleting event:', error);
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      // Fetching user data
      const user = await getUser();
      // Setting session state
      setSession(user);
      // Setting loading state to false
      setIsLoading(false);
    };

    // Invoking fetchUser function
    fetchUser();
  }, []);

  // Fetch event and country data on component mount
  useEffect(() => {
    // Invoking fetchData function
    fetchData();
  }, []);

  // View rendering functions
  /**
   * Renders the month view, displaying events for each month
   */
  const renderMonthView = () => {
    // Mapping over month names to render events for each month
    return monthNames.map(month => {
      // Getting month index
      const monthIndex = monthNames.indexOf(month) + 1;
      // Filtering events by month
      const monthEvents = events.filter(event =>
        event.occurrences.some(occ =>
          occ.start_month <= monthIndex && occ.end_month >= monthIndex
        )
      );

      // Rendering events for the month
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
                    onClick={() => confirmDeleteEvent(event.id, event.name)}
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

  /**
   * Renders the country view, displaying events for a selected country
   */
  const renderCountryView = () => {
    // Checking if a country is selected
    if (!selectedCountry) {
      // Rendering message if no country is selected
      return (
        <div className="col-span-full p-4 text-center">
          Please select a country to view its events
        </div>
      );
    }

    // Mapping over month names to render events for each month
    return monthNames.map(month => {
      // Getting month index
      const monthIndex = monthNames.indexOf(month) + 1;
      // Filtering events by selected country
      const monthEvents = events.filter(event =>
        event.occurrences.some(occ =>
          occ.country_id === selectedCountry &&
          occ.start_month <= monthIndex &&
          occ.end_month >= monthIndex
        )
      );

      // Rendering events for the month
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

  /**
   * Renders the event view, displaying occurrences for a selected event
   */
  const renderEventView = () => {
    // Checking if an event is selected
    if (!selectedEvent) {
      // Rendering message if no event is selected
      return (
        <div className="col-span-full p-4 text-center">
          Please select an event to view its occurrences
        </div>
      );
    }

    // Finding the selected event
    const event = events.find(e => e.id === selectedEvent);
    if (!event) return null;

    // Mapping over month names to render occurrences for each month
    return monthNames.map(month => {
      // Getting month index
      const monthIndex = monthNames.indexOf(month) + 1;
      // Filtering occurrences by month
      const countries = event.occurrences
        .filter(occ => occ.start_month <= monthIndex && occ.end_month >= monthIndex)
        .map(occ => occ.country.name);

      // Rendering occurrences for the month
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

  // Checking if the app is still loading
  if (isLoading) {
    // Rendering loading message
    return <div>Loading...</div>;
  }

  // Checking if the user is authenticated
  if (!session) {
    // Rendering authentication component
    return <Auth onSignIn={(user) => {
      setSession(user);
      // Fetch data immediately after sign-in
      fetchData();
    }} />;
  }

  // Rendering the main app component
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Events</h1>
            <button 
              onClick={async () => {
                await signOut();
                setSession(null);
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto">
        {/* Form to add new events */}
        <AddEventForm
          countries={countries}
          onEventAdded={fetchData}
        />

        {/* View mode buttons - responsive for mobile */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center px-4 py-2 rounded ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              <Calendar size={20} className="mr-2" />
              <span className="whitespace-nowrap">By Month</span>
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
              <span className="whitespace-nowrap">By Country</span>
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
              <span className="whitespace-nowrap">By Event</span>
            </button>
            
            {/* Print-friendly button */}
            <PrintFriendlyButton events={events} countries={countries} />
          </div>

          {/* Country selector for country view */}
          {viewMode === 'country' && (
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full sm:flex-1 px-4 py-2 border rounded"
            >
              <option value="">Select a country...</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          )}

          {/* Event selector for event view */}
          {viewMode === 'event' && (
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full sm:flex-1 px-4 py-2 border rounded"
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

        {/* Rendering the selected view */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'country' && renderCountryView()}
          {viewMode === 'event' && renderEventView()}
        </div>

        {/* Modal for editing events */}
        {editingEvent && (
          <EditEventModal
            event={editingEvent}
            countries={countries}
            onClose={() => setEditingEvent(null)}
            onEventUpdated={fetchData}
          />
        )}
        
        {/* Confirmation dialog for deleting events */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
              <p className="mb-6">
                Are you sure you want to delete the event <strong>{deleteConfirmation.name}</strong>? This will remove all occurrences of this event.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={cancelDeleteEvent}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;