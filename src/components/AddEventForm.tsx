import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Check, AlertCircle } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../lib/supabase';
import { Country, CountryEventRange } from '../types';

interface AddEventFormProps {
  countries: Country[];
  onEventAdded: () => void;
}

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(0, i).toLocaleString('default', { month: 'long' })
}));

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export function AddEventForm({ countries, onEventAdded }: AddEventFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [countryRanges, setCountryRanges] = useState<CountryEventRange[]>([]);
  const [countryInput, setCountryInput] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      const response = await fetch('https://restcountries.com/v3.1/all');
      const data = await response.json();
      setFilteredCountries(data.map((country: any) => country.name.common));
    };
    fetchCountries();
  }, []);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const addCountryRange = () => {
    setCountryRanges([...countryRanges, { country_id: '', ranges: [{ start_month: 1, end_month: 12 }] }]);
  };

  const addMonthRange = (countryIndex: number) => {
    const newRanges = [...countryRanges];
    newRanges[countryIndex].ranges.push({ start_month: 1, end_month: 12 });
    setCountryRanges(newRanges);
  };

  const removeMonthRange = (countryIndex: number, rangeIndex: number) => {
    const newRanges = [...countryRanges];
    newRanges[countryIndex].ranges.splice(rangeIndex, 1);
    setCountryRanges(newRanges);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First, insert the event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([{ name: eventName }])
        .select()
        .single();

      if (eventError) {
        const errorMessage = getErrorMessage(eventError);
        setNotification({ type: 'error', message: `Error adding event: ${errorMessage}` });
        console.error('Error adding event:', eventError);
        setIsSubmitting(false);
        return;
      }

      // Process each country in countryRanges
      for (const countryRange of countryRanges) {
        // Check if country exists in the database
        let countryId = countryRange.country_id;
        
        // If country_id is empty, it means we need to add a new country
        if (!countryId) {
          // Check if the country already exists by name
          const { data: existingCountry } = await supabase
            .from('countries')
            .select('id')
            .eq('name', countryInput)
            .single();
          
          if (existingCountry) {
            countryId = existingCountry.id;
          } else {
            // Insert new country
            const { data: newCountry, error: countryError } = await supabase
              .from('countries')
              .insert([{ name: countryInput }])
              .select()
              .single();
            
            if (countryError) {
              const errorMessage = getErrorMessage(countryError);
              setNotification({ type: 'error', message: `Error adding country: ${errorMessage}` });
              console.error('Error adding country:', countryError);
              setIsSubmitting(false);
              return;
            }
            
            countryId = newCountry.id;
          }
        }

        // Add event occurrences for this country
        const occurrences = countryRange.ranges.map(range => ({
          event_id: eventData.id,
          country_id: countryId,
          start_month: range.start_month,
          end_month: range.end_month
        }));

        const { error: occurrenceError } = await supabase
          .from('event_occurrences')
          .insert(occurrences);

        if (occurrenceError) {
          const errorMessage = getErrorMessage(occurrenceError);
          setNotification({ type: 'error', message: `Error adding event occurrences: ${errorMessage}` });
          console.error('Error adding event occurrences:', occurrenceError);
          setIsSubmitting(false);
          return;
        }
      }

      // Success! Reset form and show success message
      setNotification({ type: 'success', message: 'Event added successfully!' });
      setEventName('');
      setCountryRanges([]);
      setCountryInput('');
      setIsOpen(false);
      onEventAdded(); // Refresh the page data
    } catch (error) {
      console.error('Error adding event:', error);
      setNotification({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorMessage = (error: any) => {
    if (error.details) {
      return error.details.map((detail: any) => detail.message).join(', ');
    } else if (error.message) {
      return error.message;
    } else {
      return 'An unknown error occurred';
    }
  };

  const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCountryInput(value);
    setFilteredCountries(filteredCountries.filter(country => country.toLowerCase().includes(value.toLowerCase())));
  };

  const selectCountry = (country: string) => {
    setCountryInput(country);
    setFilteredCountries([]);
  };

  return (
    <div className="mb-8 border rounded-lg shadow-sm">
      {notification && (
        <div className={`p-4 mb-4 flex items-center ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.type === 'success' ? (
            <Check size={20} className="mr-2" />
          ) : (
            <AlertCircle size={20} className="mr-2" />
          )}
          <span>{notification.message}</span>
        </div>
      )}
      
      <button
        className="w-full p-4 flex items-center justify-between text-lg font-semibold"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Add New Event</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isOpen && (
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="mb-4">
            <label className="block mb-2 font-medium">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {countryRanges.map((countryRange, countryIndex) => (
            <div key={countryIndex} className="mb-4 p-4 border rounded">
              <div className="mb-3">
                <label className="block mb-2 font-medium">Country</label>
                <input
                  type="text"
                  value={countryInput}
                  onChange={handleCountryInputChange}
                  placeholder="Type country name"
                  className="w-full p-2 border rounded"
                  required
                />
                {filteredCountries.length > 0 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto border rounded shadow-sm">
                    {filteredCountries.map((country, index) => (
                      <li 
                        key={index} 
                        onClick={() => selectCountry(country)}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {country}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="mb-2">
                <label className="block mb-2 font-medium">Month Ranges</label>
                {countryRange.ranges.map((range, rangeIndex) => (
                  <div key={rangeIndex} className="flex gap-4 mb-2">
                    <Select
                      options={monthOptions}
                      value={monthOptions.find(m => m.value === range.start_month)}
                      onChange={(option) => {
                        const newRanges = [...countryRanges];
                        newRanges[countryIndex].ranges[rangeIndex].start_month = option?.value || 1;
                        setCountryRanges(newRanges);
                      }}
                      className="flex-1"
                      placeholder="Start month..."
                    />
                    <Select
                      options={monthOptions}
                      value={monthOptions.find(m => m.value === range.end_month)}
                      onChange={(option) => {
                        const newRanges = [...countryRanges];
                        newRanges[countryIndex].ranges[rangeIndex].end_month = option?.value || 12;
                        setCountryRanges(newRanges);
                      }}
                      className="flex-1"
                      placeholder="End month..."
                    />
                    {countryRange.ranges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMonthRange(countryIndex, rangeIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        aria-label="Remove month range"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addMonthRange(countryIndex)}
                className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} className="mr-1" /> Add Month Range
              </button>
            </div>
          ))}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={addCountryRange}
              className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
            >
              <Plus size={20} className="mr-1" /> Add Country
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
              disabled={isSubmitting || !eventName || countryRanges.length === 0 || !countryInput}
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin mr-2">⟳</span>
              ) : null}
              Save Event
            </button>
          </div>
        </form>
      )}
    </div>
  );
}