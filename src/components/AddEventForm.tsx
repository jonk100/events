import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
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

export function AddEventForm({ countries, onEventAdded }: AddEventFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [countryRanges, setCountryRanges] = useState<CountryEventRange[]>([]);
  const [countryInput, setCountryInput] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      const response = await fetch('https://restcountries.com/v3.1/all');
      const data = await response.json();
      setFilteredCountries(data.map((country: any) => country.name.common));
    };
    fetchCountries();
  }, []);

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
    
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([{ name: eventName }])
        .select()
        .single();

      if (eventError) throw eventError;

      const occurrences = countryRanges.flatMap(({ country_id, ranges }) =>
        ranges.map(range => ({
          event_id: eventData.id,
          country_id,
          start_month: range.start_month,
          end_month: range.end_month
        }))
      );

      const { error: occurrenceError } = await supabase
        .from('event_occurrences')
        .insert(occurrences);

      if (occurrenceError) throw occurrenceError;

      setEventName('');
      setCountryRanges([]);
      setIsOpen(false);
      onEventAdded();
    } catch (error) {
      console.error('Error adding event:', error);
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
              <input
                type="text"
                value={countryInput}
                onChange={handleCountryInputChange}
                placeholder="Select country"
              />
              {filteredCountries.length > 0 && (
                <ul>
                  {filteredCountries.map((country, index) => (
                    <li key={index} onClick={() => selectCountry(country)}>{country}</li>
                  ))}
                </ul>
              )}
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
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}

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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!eventName || countryRanges.length === 0}
            >
              Save Event
            </button>
          </div>
        </form>
      )}
    </div>
  );
}