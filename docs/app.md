# Event Calendar App Specification

## Overview
This app will allow users to manage and view events that occur across various countries. The events are associated with specific months in each country, and users will be able to interact with the calendar in different views and add, edit, or delete events.

---

## Key Features

### 1. **Add Event** (Accordion-style Component)
- At the top of the page, there will be an accordion-style form to add new events.
  - **Fields**:
    - **Event Name**: The name of the event (must be unique).
    - **Country Selection**: Multiple countries can be selected for each event.
    - **Month Range**: Each country can have one or more month ranges for when the event occurs.
      - **Add Month Range** button allows adding multiple ranges (start month, end month).
  
  **Backend Flow**:
  - When the form is submitted, the following operations should happen:
    1. Insert a new record into the `events` table.
    2. Check if the country exists in the `countries` table. If not, insert a new country record.
    3. Insert corresponding records into the `event_occurrences` table for each country and month range combination, with the event ID, country ID, start month, and end month.
    4. Display a success or error notification to the user.
    5. Refresh the page data to show the newly added event.

  **User Experience**:
  - The form will provide visual feedback during submission with a loading indicator.
  - After submission, a success or error notification will be shown to the user.
  - The form will be reset and closed after successful submission.
  - The page data will be refreshed to display the newly added event.

### 2. **Event Views** (Responsive Grid with 3 Views)
- The calendar will display the events in a grid with 3 views.

#### **Default View (Month View)**:
- Displays months (e.g., January, February, etc.) as components.
- For each month, list the events occurring in that month, with each event displaying the countries it occurs in.
  
  **Backend Flow**:
  - Query events from the `events` table and join with `event_occurrences` and `countries` tables.
  - Retrieve events for the selected month:
    ```
    SELECT e.name AS event_name, c.name AS country_name, eo.start_month, eo.end_month
    FROM events e
    JOIN event_occurrences eo ON e.id = eo.event_id
    JOIN countries c ON eo.country_id = c.id
    WHERE eo.start_month <= 'month' AND eo.end_month >= 'month';
    ```

#### **By Country View**:
- Allows the user to select a country from the database.
- Displays events for that country, broken down by month.
  
  **Backend Flow**:
  - Query the `event_occurrences` table for the selected country and join with the `events` table:
    ```
    SELECT e.name AS event_name, eo.start_month, eo.end_month
    FROM event_occurrences eo
    JOIN events e ON eo.event_id = e.id
    WHERE eo.country_id = 'country_id';
    ```

#### **By Event View**:
- Allows the user to select an event from the database.
- Displays the countries that host the event, broken down by month.
  
  **Backend Flow**:
  - Query the `event_occurrences` table for the selected event and join with the `countries` table:
    ```
    SELECT c.name AS country_name, eo.start_month, eo.end_month
    FROM event_occurrences eo
    JOIN countries c ON eo.country_id = c.id
    WHERE eo.event_id = 'event_id';
    ```

### 3. **Event Edit and Delete**:
- Each event in the calendar will have **Edit** and **Delete** buttons.
  - **Edit** button opens a modal where the user can:
    - Add or remove countries associated with the event.
    - Modify month ranges for the event in each country (add, remove, or edit).
  
  **Backend Flow**:
  - **Edit**:
    - Update existing month ranges for a specific country:
      ```
      UPDATE event_occurrences
      SET start_month = 'new_start_month', end_month = 'new_end_month'
      WHERE event_id = 'event_id' AND country_id = 'country_id';
      ```
    - Add a new month range for a specific country:
      ```
      INSERT INTO event_occurrences (event_id, country_id, start_month, end_month)
      VALUES ('event_id', 'country_id', 'start_month', 'end_month');
      ```
    - Delete an existing event occurrence:
      ```
      DELETE FROM event_occurrences
      WHERE event_id = 'event_id' AND country_id = 'country_id';
      ```

  - **Delete**:
    - Delete the event and all associated occurrences:
      ```
      DELETE FROM events WHERE id = 'event_id';
      ```

---

## Database Schema

### Tables:

#### **1. events**
- Stores event details.
    ```
    CREATE TABLE IF NOT EXISTS events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    ```

#### **2. countries**
- Stores country details.
    ```
    CREATE TABLE IF NOT EXISTS countries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    ```

#### **3. event_occurrences**
- Maps events to countries and defines their month ranges.
    ```
    CREATE TABLE IF NOT EXISTS event_occurrences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid REFERENCES events(id) ON DELETE CASCADE,
      country_id uuid REFERENCES countries(id) ON DELETE CASCADE,
      start_month integer NOT NULL CHECK (start_month BETWEEN 1 AND 12),
      end_month integer NOT NULL CHECK (end_month BETWEEN 1 AND 12),
      created_at timestamptz DEFAULT now(),
      CONSTRAINT valid_month_range CHECK (start_month <= end_month)
    );
    ```

### Row-Level Security (RLS) Policies:

- Enable **Row-Level Security (RLS)** for the `events`, `countries`, and `event_occurrences` tables.
- Create policies to ensure authenticated users can **read**, **insert**, **update**, and **delete** records.

    ```
    -- Enable RLS
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
    ALTER TABLE event_occurrences ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Enable read access for all users" ON events FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Enable insert for authenticated users" ON events FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Enable update for authenticated users" ON events FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "Enable delete for authenticated users" ON events FOR DELETE TO authenticated USING (true);

    CREATE POLICY "Enable read access for all users" ON countries FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Enable insert for authenticated users" ON countries FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Enable update for authenticated users" ON countries FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "Enable delete for authenticated users" ON countries FOR DELETE TO authenticated USING (true);

    CREATE POLICY "Enable read access for all users" ON event_occurrences FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Enable insert for authenticated users" ON event_occurrences FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Enable update for authenticated users" ON event_occurrences FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "Enable delete for authenticated users" ON event_occurrences FOR DELETE TO authenticated USING (true);
    ```
  
---

## Recap of App Flow and Database Interaction:

### 1. **Add Event**:
- Insert event into the `events` table.
- Check if the country exists in the `countries` table. If not, insert a new country record.
- Insert corresponding records into `event_occurrences` for selected countries and month ranges.
- Show success or error notification to the user.
- Refresh the page data to display the newly added event.

### 2. **Default View (Month View)**:
- Query events by month from `event_occurrences`, joining with `events` and `countries`.

### 3. **By Country View**:
- Query events for a selected country from `event_occurrences`, joining with `events`.

### 4. **By Event View**:
- Query countries for a selected event from `event_occurrences`, joining with `countries`.

### 5. **Edit Event**:
- Update month ranges or countries in `event_occurrences`.
- Add, remove, or edit records in `event_occurrences`.

### 6. **Delete Event**:
- Delete event and its related records from `events` and `event_occurrences`.

---

This markdown outlines both the **user interface** and the **database interactions** needed to build the Event Calendar app. It includes the necessary flow of data, database schema, and security considerations to ensure the app works smoothly and securely.
