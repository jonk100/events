import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../lib/supabase';
import { Country, EventWithOccurrences, MonthRange } from '../types';

interface EditEventModalProps {
  event: EventWithOccurrences;
  countries: Country[];
  onClose: () => void;
  onEventUpdated: () => void;
}

export function EditEventModal({ event, countries, onClose, onEventUpdated }: EditEventModalProps) {
  const [eventName, setEventName] = useState(event.name);
  const [countryRanges, setCountryRanges] = useState<Map<string, MonthRange[]>>(new Map());

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('default', { month: 'long' })
  }));

  useEffect(() => {
    const rangesByCountry = new Map<string, MonthRange[]>();
    event.occurrences.forEach(occurrence => {
      const ranges = rangesByCountry.get(occurrence.country_id) || [];
      ranges.push({
        start_month: occurrence.start_month,
        end_month: occurrence.end_month
      });
      rangesByCountry.set(occurrence.country_id, ranges);
    });
    setCountryRanges(rangesByCountry);
  }, [event]);

  const addCountry = (countryId: string) => {
    setCountryRanges(new Map(countryRanges.set(countryId, [{ start_month: 1, end_month: 12 }])));
  };

  const addMonthRange = (countryId: string) => {
    const ranges = [...(countryRanges.get(countryId) || [])];
    ranges.push({ start_month: 1, end_month: 12 });
    setCountryRanges(new Map(countryRanges.set(countryId, ranges)));
  };

  const removeMonthRange = (countryId: string, rangeIndex: number) => {
    const ranges = [...(countryRanges.get(countryId) || [])];
    ranges.splice(rangeIndex, 1);
    if (ranges.length === 0) {
      const newRanges = new Map(countryRanges);
      newRanges.delete(countryId);
      setCountryRanges(newRanges);
    } else {
      setCountryRanges(new Map(countryRanges.set(countryId, ranges)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update event name if changed
      if (eventName !== event.name) {
        const { error: eventError } = await supabase
          .from('events')
          .update({ name: eventName })
          .eq('id', event.id);

        if (eventError) throw eventError;
      }

      // Delete all existing occurrences
      const { error: deleteError } = await supabase
        .from('event_occurrences')
        .delete()
        .eq('event_id', event.id);

      if (deleteError) throw deleteError;

      // Insert new occurrences
      const occurrences = Array.from(countryRanges.entries()).flatMap(([countryId, ranges]) =>
        ranges.map(range => ({
          event_id: event.id,
          country_id: countryId,
          start_month: range.start_month,
          end_month: range.end_month
        }))
      );

      const { error: insertError } = await supabase
        .from('event_occurrences')
        .insert(occurrences);

      if (insertError) throw insertError;

      onEventUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

          {Array.from(countryRanges.entries()).map(([countryId, ranges]) => (
            <div key={countryId} className="mb-4 p-4 border rounded">
              <div className="font-medium mb-2">
                {countries.find(c => c.id === countryId)?.name}
              </div>

              {ranges.map((range, rangeIndex) => (
                <div key={rangeIndex} className="flex gap-4 mb-2">
                  <Select
                    options={monthOptions}
                    value={monthOptions.find(m => m.value === range.start_month)}
                    onChange={(option) => {
                      const newRanges = [...ranges];
                      newRanges[rangeIndex].start_month = option?.value || 1;
                      setCountryRanges(new Map(countryRanges.set(countryId, newRanges)));
                    }}
                    className="flex-1"
                  />
                  <Select
                    options={monthOptions}
                    value={monthOptions.find(m => m.value === range.end_month)}
                    onChange={(option) => {
                      const newRanges = [...ranges];
                      newRanges[rangeIndex].end_month = option?.value || 12;
                      setCountryRanges(new Map(countryRanges.set(countryId, newRanges)));
                    }}
                    className="flex-1"
                  />
                  {ranges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMonthRange(countryId, rangeIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => addMonthRange(countryId)}
                className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} className="mr-1" /> Add Month Range
              </button>
            </div>
          ))}

          <div className="mb-4">
            <Select
              options={countries
                .filter(c => !countryRanges.has(c.id))
                .map(c => ({ value: c.id, label: c.name }))}
              onChange={(option) => option && addCountry(option.value)}
              placeholder="Add country..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}