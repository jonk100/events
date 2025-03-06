import React from 'react';
import { FileDown } from 'lucide-react';
import { formatDataForCsv, downloadCsv } from '../utils/csvExport';
import { EventWithOccurrences, Country } from '../types';

interface ExportButtonProps {
  viewMode: 'month' | 'country' | 'event';
  events: EventWithOccurrences[];
  countries: Country[];
  selectedCountry: string;
  selectedEvent: string;
}

/**
 * Button component that exports the current view data as a CSV file
 * @param {ExportButtonProps} props - The component props
 * @returns {JSX.Element} The ExportButton component
 */
export function ExportButton({ 
  viewMode, 
  events, 
  countries, 
  selectedCountry, 
  selectedEvent 
}: ExportButtonProps) {
  /**
   * Handles the export button click
   */
  const handleExport = () => {
    // Format the data for CSV export
    const csvContent = formatDataForCsv(
      viewMode,
      events,
      countries,
      selectedCountry,
      selectedEvent
    );
    
    // Generate a filename based on the current view
    let filename = 'events-export.csv';
    
    switch (viewMode) {
      case 'month':
        filename = 'events-by-month.csv';
        break;
      case 'country':
        if (selectedCountry) {
          const countryName = countries.find(c => c.id === selectedCountry)?.name || 'unknown-country';
          filename = `events-in-${countryName.toLowerCase().replace(/\s+/g, '-')}.csv`;
        } else {
          filename = 'events-by-country.csv';
        }
        break;
      case 'event':
        if (selectedEvent) {
          const eventName = events.find(e => e.id === selectedEvent)?.name || 'unknown-event';
          filename = `${eventName.toLowerCase().replace(/\s+/g, '-')}-occurrences.csv`;
        } else {
          filename = 'event-occurrences.csv';
        }
        break;
    }
    
    // Download the CSV file
    downloadCsv(csvContent, filename);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      title="Export as CSV"
    >
      <FileDown size={20} className="mr-2" />
      <span className="whitespace-nowrap">Export CSV</span>
    </button>
  );
}
