import React, { useState, useEffect } from 'react';
import { X, Plus, Check, AlertCircle, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../lib/supabase';
import { Country, EventWithOccurrences, MonthRange, CountryEventRange } from '../types';

interface EditEventModalProps {
  event: EventWithOccurrences;
  countries: Country[];
  onClose: () => void;
  onEventUpdated: () => void;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface DeleteConfirmation {
  countryIndex: number;
  rangeIndex: number;
  countryName: string;
  monthRange: string;
}

/**
 * Modal component for editing an existing event
 * @param {EditEventModalProps} props - The component props
 * @returns {JSX.Element} The EditEventModal component
 */
export function EditEventModal({ event, countries, onClose, onEventUpdated }: EditEventModalProps) {
  const [eventName, setEventName] = useState(event.name);
  const [countryRanges, setCountryRanges] = useState<CountryEventRange[]>([]);
  const [allCountries, setAllCountries] = useState<string[]>([]);
  const [filteredCountriesByIndex, setFilteredCountriesByIndex] = useState<{[key: number]: string[]}>({});
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('default', { month: 'long' })
  }));

  // Initialize country ranges from event data, preserving occurrence IDs for stable updates
  useEffect(() => {
    const countryMap = new Map<string, { country_name: string, ranges: MonthRange[] }>();
    
    event.occurrences.forEach(occurrence => {
      const countryId = occurrence.country_id;
      const countryName = countries.find(c => c.id === countryId)?.name || '';
      
      if (!countryMap.has(countryId)) {
        countryMap.set(countryId, { 
          country_name: countryName,
          ranges: [] 
        });
      }
      
      countryMap.get(countryId)?.ranges.push({
        start_month: occurrence.start_month,
        end_month: occurrence.end_month,
        occurrence_id: occurrence.id,
      });
    });
    
    const formattedRanges: CountryEventRange[] = Array.from(countryMap.entries()).map(([countryId, data]) => ({
      country_id: countryId,
      country_name: data.country_name,
      ranges: data.ranges
    }));
    
    setCountryRanges(formattedRanges);
  }, [event, countries]);

  // Fetch all countries for autocomplete
  useEffect(() => {
    const fetchCountries = async () => {
      const response = await fetch('https://restcountries.com/v3.1/all');
      const data = await response.json();
      setAllCountries(data.map((country: any) => country.name.common));
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

  /**
   * Add a new country to the form
   */
  const addCountryRange = () => {
    setCountryRanges([...countryRanges, { country_id: '', country_name: '', ranges: [{ start_month: 1, end_month: 12 }] }]);
  };

  /**
   * Add a new month range to a specific country
   * @param {number} countryIndex - The index of the country to add a range to
   */
  const addMonthRange = (countryIndex: number) => {
    const newRanges = [...countryRanges];
    newRanges[countryIndex].ranges.push({ start_month: 1, end_month: 12 });
    setCountryRanges(newRanges);
  };

  /**
   * Show confirmation dialog before removing a month range
   * @param {number} countryIndex - The index of the country
   * @param {number} rangeIndex - The index of the range to remove
   */
  const confirmRemoveMonthRange = (countryIndex: number, rangeIndex: number) => {
    const countryName = countryRanges[countryIndex].country_name;
    const range = countryRanges[countryIndex].ranges[rangeIndex];
    const startMonth = monthOptions.find(m => m.value === range.start_month)?.label || range.start_month;
    const endMonth = monthOptions.find(m => m.value === range.end_month)?.label || range.end_month;
    const monthRange = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;
    
    setDeleteConfirmation({
      countryIndex,
      rangeIndex,
      countryName,
      monthRange
    });
  };

  /**
   * Cancel the delete confirmation dialog
   */
  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  /**
   * Remove a month range from a specific country
   * @param {number} countryIndex - The index of the country
   * @param {number} rangeIndex - The index of the range to remove
   */
  const removeMonthRange = () => {
    if (!deleteConfirmation) return;
    
    const { countryIndex, rangeIndex } = deleteConfirmation;
    const newRanges = [...countryRanges];
    newRanges[countryIndex].ranges.splice(rangeIndex, 1);
    
    // If all ranges are removed, remove the country
    if (newRanges[countryIndex].ranges.length === 0) {
      newRanges.splice(countryIndex, 1);
    }
    
    setCountryRanges(newRanges);
    setDeleteConfirmation(null);
  };

  /**
   * Handle country input changes and filter available countries
   * @param {number} countryIndex - The index of the country being modified
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
   */
  const handleCountryInputChange = (countryIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Update the country name in the countryRanges
    const newCountryRanges = [...countryRanges];
    newCountryRanges[countryIndex].country_name = value;
    // Clear the country_id since we're changing the country
    newCountryRanges[countryIndex].country_id = '';
    setCountryRanges(newCountryRanges);
    
    // Filter countries for this specific index
    const filtered = allCountries.filter(country => 
      country.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredCountriesByIndex({
      ...filteredCountriesByIndex,
      [countryIndex]: filtered
    });
  };

  /**
   * Select a country from the filtered list
   * @param {number} countryIndex - The index of the country being selected
   * @param {string} country - The selected country name
   */
  const selectCountry = (countryIndex: number, country: string) => {
    // Update the country name in the countryRanges
    const newCountryRanges = [...countryRanges];
    newCountryRanges[countryIndex].country_name = country;
    // Clear the country_id since this is potentially a new country
    newCountryRanges[countryIndex].country_id = '';
    setCountryRanges(newCountryRanges);
    
    // Clear filtered countries for this index
    const newFilteredCountries = {...filteredCountriesByIndex};
    delete newFilteredCountries[countryIndex];
    setFilteredCountriesByIndex(newFilteredCountries);
  };

  /**
   * Extract a user-friendly error message from the error object
   * @param {any} error - The error object from Supabase
   * @returns {string} A formatted error message
   */
  const getErrorMessage = (error: any) => {
    if (error.details) {
      return error.details.map((detail: any) => detail.message).join(', ');
    } else if (error.message) {
      return error.message;
    } else {
      return 'An unknown error occurred';
    }
  };

  /**
   * Merge overlapping or adjacent month ranges. If multiple ranges merge, prefer keeping the first
   * defined occurrence_id and mark others for reassignment/deletion.
   * @param {MonthRange[]} ranges - list of ranges for a country
   * @returns {{ merged: MonthRange[]; mergedFrom: Array<{ kept?: string; removed: string[]; start: number; end: number }>; }}
   */
  const mergeRanges = (ranges: MonthRange[]) => {
    const sorted = [...ranges].sort((a, b) => a.start_month - b.start_month || a.end_month - b.end_month);
    const merged: MonthRange[] = [];
    const mergedFrom: Array<{ kept?: string; removed: string[]; start: number; end: number }> = [];

    for (const r of sorted) {
      const last = merged[merged.length - 1];
      if (!last) {
        merged.push({ ...r });
        mergedFrom.push({ kept: r.occurrence_id, removed: [], start: r.start_month, end: r.end_month });
        continue;
      }
      // Overlap or adjacency (e.g., end 2 and start 3) => merge
      if (r.start_month <= last.end_month + 1) {
        const prev = mergedFrom[mergedFrom.length - 1];
        // Expand bounds
        last.end_month = Math.max(last.end_month, r.end_month);
        last.start_month = Math.min(last.start_month, r.start_month);
        // Keep existing kept id if present, otherwise take this one
        if (!last.occurrence_id && r.occurrence_id) {
          last.occurrence_id = r.occurrence_id;
          prev.kept = r.occurrence_id;
        }
        // Track removed occurrence ids
        if (r.occurrence_id) prev.removed.push(r.occurrence_id);
        // Update recorded merged span
        prev.start = Math.min(prev.start, r.start_month);
        prev.end = Math.max(prev.end, r.end_month);
      } else {
        merged.push({ ...r });
        mergedFrom.push({ kept: r.occurrence_id, removed: [], start: r.start_month, end: r.end_month });
      }
    }

    return { merged, mergedFrom };
  };

  /**
   * Handle form submission to update the event without deleting all occurrences.
   * Strategy:
   * - Update existing occurrences in-place (preserves occurrence IDs and attached comments)
   * - Insert new occurrences
   * - Delete only occurrences that were removed by the user
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update event name if changed
      if (eventName !== event.name) {
        const { error: eventError } = await supabase
          .from('events')
          .update({ name: eventName })
          .eq('id', event.id);

        if (eventError) {
          const errorMessage = getErrorMessage(eventError);
          setNotification({ type: 'error', message: `Error updating event: ${errorMessage}` });
          console.error('Error updating event:', eventError);
          setIsSubmitting(false);
          return;
        }
      }
      // Normalize/merge overlapping ranges per country to avoid duplicate rows in month view
      const normalizedCountryRanges: CountryEventRange[] = countryRanges.map((cr) => {
        const { merged, mergedFrom } = mergeRanges(cr.ranges);
        console.debug('[EditEventModal] Merged ranges for country', { country_id: cr.country_id, before: cr.ranges, after: merged, mergedFrom });
        return { ...cr, ranges: merged };
      });

      // Build lists for updates, inserts, and track kept IDs
      console.debug('[EditEventModal] Preparing diff for event_occurrences update', { eventId: event.id });
      const existingOccurrenceIds = new Set(event.occurrences.map(o => o.id));
      const keptOccurrenceIds = new Set<string>();

      // We will batch inserts for efficiency
      const inserts: Array<{ event_id: string; country_id: string; start_month: number; end_month: number }> = [];

      // Process each country in countryRanges
      for (const countryRange of normalizedCountryRanges) {
        // Check if country exists in the database
        let countryId = countryRange.country_id;
        
        // If country_id is empty, it means we need to add a new country or find an existing one
        if (!countryId) {
          // Check if the country already exists by name
          const { data: existingCountry } = await supabase
            .from('countries')
            .select('id')
            .eq('name', countryRange.country_name)
            .single();
          
          if (existingCountry) {
            countryId = existingCountry.id;
          } else {
            // Insert new country
            const { data: newCountry, error: countryError } = await supabase
              .from('countries')
              .insert([{ name: countryRange.country_name }])
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

        // For each range decide update vs insert
        for (const range of countryRange.ranges) {
          if (range.occurrence_id) {
            // Update existing occurrence in place, but first check for collision with another existing occurrence
            const collision = event.occurrences.find(o =>
              o.id !== range.occurrence_id &&
              o.country_id === countryId &&
              o.start_month === range.start_month &&
              o.end_month === range.end_month
            );
            if (collision) {
              // Move comments to the collision occurrence and delete the current one to avoid duplicates
              console.debug('[EditEventModal] Resolving occurrence collision by reassigning comments and deleting duplicate', {
                fromId: range.occurrence_id,
                toId: collision.id,
              });
              const { error: reassignErr } = await supabase
                .from('comments')
                .update({ event_occurrence_id: collision.id })
                .eq('event_occurrence_id', range.occurrence_id);
              if (reassignErr) {
                const errorMessage = getErrorMessage(reassignErr);
                setNotification({ type: 'error', message: `Error reassigning comments: ${errorMessage}` });
                console.error('Error reassigning comments:', reassignErr);
                setIsSubmitting(false);
                return;
              }
              const { error: deleteDupErr } = await supabase
                .from('event_occurrences')
                .delete()
                .eq('id', range.occurrence_id);
              if (deleteDupErr) {
                const errorMessage = getErrorMessage(deleteDupErr);
                setNotification({ type: 'error', message: `Error removing duplicate occurrence: ${errorMessage}` });
                console.error('Error removing duplicate occurrence:', deleteDupErr);
                setIsSubmitting(false);
                return;
              }
              keptOccurrenceIds.add(collision.id);
              range.occurrence_id = collision.id;
            } else {
              keptOccurrenceIds.add(range.occurrence_id);
              console.debug('[EditEventModal] Updating occurrence', {
                id: range.occurrence_id,
                country_id: countryId,
                start_month: range.start_month,
                end_month: range.end_month,
              });
              const { error: updateError } = await supabase
                .from('event_occurrences')
                .update({
                  country_id: countryId,
                  start_month: range.start_month,
                  end_month: range.end_month,
                })
                .eq('id', range.occurrence_id);
              if (updateError) {
                const errorMessage = getErrorMessage(updateError);
                setNotification({ type: 'error', message: `Error updating occurrence: ${errorMessage}` });
                console.error('Error updating occurrence:', updateError);
                setIsSubmitting(false);
                return;
              }
            }
          } else {
            // If an identical occurrence already exists, reuse it instead of inserting
            const match = event.occurrences.find(o =>
              o.event_id === event.id &&
              o.country_id === countryId &&
              o.start_month === range.start_month &&
              o.end_month === range.end_month
            );
            if (match) {
              console.debug('[EditEventModal] Reusing existing matching occurrence instead of insert', { id: match.id });
              keptOccurrenceIds.add(match.id);
              // Also set it on the range so future interactions keep linkage
              range.occurrence_id = match.id;
            } else {
              // Queue insert for new occurrence
              inserts.push({
                event_id: event.id,
                country_id: countryId,
                start_month: range.start_month,
                end_month: range.end_month,
              });
            }
          }
        }
      }

      // Perform batch inserts if any
      if (inserts.length > 0) {
        console.debug('[EditEventModal] Inserting new occurrences', { count: inserts.length });
        const { error: insertError } = await supabase
          .from('event_occurrences')
          .upsert(inserts, { onConflict: 'event_id,country_id,start_month,end_month', ignoreDuplicates: true });
        if (insertError) {
          const errorMessage = getErrorMessage(insertError);
          setNotification({ type: 'error', message: `Error adding event occurrences: ${errorMessage}` });
          console.error('Error adding event occurrences:', insertError);
          setIsSubmitting(false);
          return;
        }
      }

      // Delete occurrences that were removed by the user
      const idsToDelete = Array.from(existingOccurrenceIds).filter(id => !keptOccurrenceIds.has(id));
      if (idsToDelete.length > 0) {
        console.debug('[EditEventModal] Deleting removed occurrences (will cascade delete their comments)', { idsToDelete });
        const { error: deleteRemovedError } = await supabase
          .from('event_occurrences')
          .delete()
          .in('id', idsToDelete);
        if (deleteRemovedError) {
          const errorMessage = getErrorMessage(deleteRemovedError);
          setNotification({ type: 'error', message: `Error deleting removed occurrences: ${errorMessage}` });
          console.error('Error deleting removed occurrences:', deleteRemovedError);
          setIsSubmitting(false);
          return;
        }
      }

      // Success! Show success message and close modal
      setNotification({ type: 'success', message: 'Event updated successfully!' });
      
      // Wait for the notification to be visible before closing
      setTimeout(() => {
        onEventUpdated(); // Refresh the page data
        onClose(); // Close the modal
      }, 1000);
      
    } catch (error) {
      console.error('Error updating event:', error);
      setNotification({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
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

        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
              <p className="mb-6">
                Are you sure you want to delete the event occurrence for <strong>{deleteConfirmation.countryName}</strong> during <strong>{deleteConfirmation.monthRange}</strong>?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={removeMonthRange}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

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

          {countryRanges.map((countryRange, countryIndex) => (
            <div key={countryIndex} className="mb-4 p-4 border rounded">
              <div className="mb-3">
                <label className="block mb-2 font-medium">Country</label>
                <input
                  type="text"
                  value={countryRange.country_name}
                  onChange={(e) => handleCountryInputChange(countryIndex, e)}
                  placeholder="Type country name"
                  className="w-full p-2 border rounded"
                  required
                />
                {filteredCountriesByIndex[countryIndex]?.length > 0 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto border rounded shadow-sm">
                    {filteredCountriesByIndex[countryIndex].map((country, index) => (
                      <li 
                        key={index} 
                        onClick={() => selectCountry(countryIndex, country)}
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
                    <button
                      type="button"
                      onClick={() => confirmRemoveMonthRange(countryIndex, rangeIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      aria-label="Delete occurrence"
                    >
                      <Trash2 size={20} />
                    </button>
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

          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={addCountryRange}
              className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
            >
              <Plus size={20} className="mr-1" /> Add Country
            </button>
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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
              disabled={isSubmitting || !eventName || countryRanges.length === 0 || countryRanges.some(range => !range.country_name)}
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin mr-2">⟳</span>
              ) : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}