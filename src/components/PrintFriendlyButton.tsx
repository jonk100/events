import React from 'react';
import { Printer } from 'lucide-react';
import type { EventWithOccurrences, Country } from '../types';

interface PrintFriendlyButtonProps {
  events: EventWithOccurrences[];
  countries: Country[];
}

/**
 * PrintFriendlyButton component that consolidates monthly data and opens print dialog
 * @param {PrintFriendlyButtonProps} props - Component props
 * @returns {JSX.Element} The rendered PrintFriendlyButton component
 */
export const PrintFriendlyButton: React.FC<PrintFriendlyButtonProps> = ({ events, countries }) => {
  // Generate array of month names
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );

  /**
   * Opens a new window with print-friendly content and triggers print dialog
   */
  const handlePrint = () => {
    // Create a new window
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow pop-ups to use the print feature');
      return;
    }

    // Generate HTML content for the print window
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Events Calendar - Print View</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              color: #333;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 30px;
              color: #2563eb;
            }
            h2 {
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              color: #1e40af;
            }
            .month-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 20px;
              margin-bottom: 40px;
            }
            .month-card {
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 15px;
              break-inside: avoid;
            }
            .month-name {
              font-weight: bold;
              font-size: 1.2em;
              margin-bottom: 10px;
              color: #1e40af;
            }
            .event-item {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .event-name {
              font-weight: bold;
            }
            .event-countries {
              font-size: 0.9em;
              color: #555;
            }
            @media print {
              body {
                font-size: 12pt;
              }
              .month-grid {
                page-break-inside: avoid;
              }
              .no-print-break {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <h1>Events Calendar</h1>
          
          <h2>Monthly View</h2>
          <div class="month-grid">
            ${monthNames.map(month => {
              const monthIndex = monthNames.indexOf(month) + 1;
              const monthEvents = events.filter(event =>
                event.occurrences.some(occ =>
                  occ.start_month <= monthIndex && occ.end_month >= monthIndex
                )
              );
              
              return `
                <div class="month-card no-print-break">
                  <div class="month-name">${month}</div>
                  ${monthEvents.length > 0 
                    ? monthEvents.map(event => {
                        const countries = event.occurrences
                          .filter(occ => occ.start_month <= monthIndex && occ.end_month >= monthIndex)
                          .map(occ => occ.country.name)
                          .join(', ');
                          
                        return `
                          <div class="event-item">
                            <div class="event-name">${event.name}</div>
                            <div class="event-countries">${countries}</div>
                          </div>
                        `;
                      }).join('')
                    : '<div>No events</div>'
                  }
                </div>
              `;
            }).join('')}
          </div>
          
          <h2>Country View</h2>
          ${countries.map(country => {
            const countryEvents = events.filter(event =>
              event.occurrences.some(occ => occ.country_id === country.id)
            );
            
            if (countryEvents.length === 0) return '';
            
            return `
              <div class="no-print-break">
                <h3>${country.name}</h3>
                <div class="month-grid">
                  ${monthNames.map(month => {
                    const monthIndex = monthNames.indexOf(month) + 1;
                    const monthEvents = countryEvents.filter(event =>
                      event.occurrences.some(occ =>
                        occ.country_id === country.id &&
                        occ.start_month <= monthIndex &&
                        occ.end_month >= monthIndex
                      )
                    );
                    
                    if (monthEvents.length === 0) return '';
                    
                    return `
                      <div class="month-card">
                        <div class="month-name">${month}</div>
                        ${monthEvents.map(event => `
                          <div class="event-item">
                            <div class="event-name">${event.name}</div>
                          </div>
                        `).join('')}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
          
          <h2>Event View</h2>
          ${events.map(event => {
            return `
              <div class="no-print-break">
                <h3>${event.name}</h3>
                <div class="month-grid">
                  ${monthNames.map(month => {
                    const monthIndex = monthNames.indexOf(month) + 1;
                    const countries = event.occurrences
                      .filter(occ => occ.start_month <= monthIndex && occ.end_month >= monthIndex)
                      .map(occ => occ.country.name);
                    
                    if (countries.length === 0) return '';
                    
                    return `
                      <div class="month-card">
                        <div class="month-name">${month}</div>
                        <div>${countries.join(', ')}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;

    // Write the content to the new window
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      <Printer size={20} className="mr-2" />
      <span>Print Calendar</span>
    </button>
  );
};
