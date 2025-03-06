/**
 * Utility functions for exporting data to CSV format
 */

import { EventWithOccurrences, Country } from '../types';

/**
 * Formats data for CSV export based on the current view mode
 * @param viewMode The current view mode ('month', 'country', or 'event')
 * @param events List of events with their occurrences
 * @param countries List of countries
 * @param selectedCountry ID of the selected country (for country view)
 * @param selectedEvent ID of the selected event (for event view)
 * @returns CSV content as a string
 */
export function formatDataForCsv(
  viewMode: 'month' | 'country' | 'event',
  events: EventWithOccurrences[],
  countries: Country[],
  selectedCountry: string = '',
  selectedEvent: string = ''
): string {
  // Get month names for headers and data processing
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );

  // Function to escape CSV field values
  const escapeField = (field: string): string => {
    // If the field contains commas, quotes, or newlines, wrap it in quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      // Double any quotes within the field
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  let csvContent = '';

  switch (viewMode) {
    case 'month':
      // Headers: Event Name, Countries (for each month)
      csvContent = 'Month,Event Name,Countries\n';
      
      // For each month, list all events and their countries
      monthNames.forEach((month, monthIndex) => {
        const monthNum = monthIndex + 1;
        
        // Filter events that occur in this month
        const monthEvents = events.filter(event =>
          event.occurrences.some(occ =>
            occ.start_month <= monthNum && occ.end_month >= monthNum
          )
        );
        
        // If no events in this month, add a row with just the month
        if (monthEvents.length === 0) {
          csvContent += `${escapeField(month)},,\n`;
        } else {
          // For each event in this month, add a row
          monthEvents.forEach(event => {
            // Get countries where this event occurs in this month
            const countriesForEvent = event.occurrences
              .filter(occ => occ.start_month <= monthNum && occ.end_month >= monthNum)
              .map(occ => occ.country.name)
              .join(', ');
            
            csvContent += `${escapeField(month)},${escapeField(event.name)},${escapeField(countriesForEvent)}\n`;
          });
        }
      });
      break;

    case 'country':
      if (!selectedCountry) {
        csvContent = 'Please select a country to export data';
        break;
      }
      
      // Get the selected country name
      const countryName = countries.find(c => c.id === selectedCountry)?.name || 'Unknown Country';
      
      // Headers: Month, Event Name
      csvContent = `Country: ${countryName}\nMonth,Event Name\n`;
      
      // For each month, list events that occur in the selected country
      monthNames.forEach((month, monthIndex) => {
        const monthNum = monthIndex + 1;
        
        // Filter events that occur in this month for the selected country
        const monthEvents = events.filter(event =>
          event.occurrences.some(occ =>
            occ.country_id === selectedCountry &&
            occ.start_month <= monthNum &&
            occ.end_month >= monthNum
          )
        );
        
        // If no events in this month, add a row with just the month
        if (monthEvents.length === 0) {
          csvContent += `${escapeField(month)},\n`;
        } else {
          // For each event in this month, add a row
          monthEvents.forEach(event => {
            csvContent += `${escapeField(month)},${escapeField(event.name)}\n`;
          });
        }
      });
      break;

    case 'event':
      if (!selectedEvent) {
        csvContent = 'Please select an event to export data';
        break;
      }
      
      // Find the selected event
      const event = events.find(e => e.id === selectedEvent);
      if (!event) {
        csvContent = 'Event not found';
        break;
      }
      
      // Headers: Month, Countries
      csvContent = `Event: ${event.name}\nMonth,Countries\n`;
      
      // For each month, list countries where the event occurs
      monthNames.forEach((month, monthIndex) => {
        const monthNum = monthIndex + 1;
        
        // Get countries where this event occurs in this month
        const countries = event.occurrences
          .filter(occ => occ.start_month <= monthNum && occ.end_month >= monthNum)
          .map(occ => occ.country.name);
        
        // If no countries in this month, add a row with just the month
        if (countries.length === 0) {
          csvContent += `${escapeField(month)},\n`;
        } else {
          // Add a row with the month and countries
          csvContent += `${escapeField(month)},${escapeField(countries.join(', '))}\n`;
        }
      });
      break;
  }

  return csvContent;
}

/**
 * Triggers a download of a CSV file with the provided content
 * @param csvContent The CSV content to download
 * @param filename The name of the file to download
 */
export function downloadCsv(csvContent: string, filename: string): void {
  // Create a blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add the link to the document
  document.body.appendChild(link);
  
  // Click the link to trigger the download
  link.click();
  
  // Remove the link from the document
  document.body.removeChild(link);
}
