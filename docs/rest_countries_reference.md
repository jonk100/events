# REST Countries Reference

## Endpoints

### Latest Added Endpoint

#### Independent

Now you can get all independent (or not independent) countries by calling this endpoint:
https://restcountries.com/v3.1/independent?status=true
If you don’t specify the status, true will be taken as default. You can mix it with the fields filter like this:
https://restcountries.com/v3.1/independent?status=true\&fields=languages,capital

### All

https://restcountries.com/v3.1/all

### Name

Search by country name. If you want to get an exact match, use the next endpoint. It can be the common or official value
https://restcountries.com/v3.1/name/{name}
https://restcountries.com/v3.1/name/eesti
https://restcountries.com/v3.1/name/deutschland

### Full Name

Search by country’s full name. It can be the common or official value
https://restcountries.com/v3.1/name/{name}?fullText=true
https://restcountries.com/v3.1/name/aruba?fullText=true

### Code

Search by cca2, ccn3, cca3 or cioc country code (yes, any!)
https://restcountries.com/v3.1/alpha/{code}
https://restcountries.com/v3.1/alpha/co
https://restcountries.com/v3.1/alpha/col
https://restcountries.com/v3.1/alpha/170

### List of codes

Search by cca2, ccn3, cca3 or cioc country code (yes, any!)
https://restcountries.com/v3.1/alpha?codes={code},{code},{code}
https://restcountries.com/v3.1/alpha?codes=170,no,est,pe

### Currency

Search by currency code or name
https://restcountries.com/v3.1/currency/{currency}
https://restcountries.com/v3.1/currency/cop

### Demonym

Now you can search by how a citizen is called.
https://restcountries.com/v3.1/demonym/{demonym}
https://restcountries.com/v3.1/demonym/peruvian

### Language

Search by language code or name
https://restcountries.com/v3.1/lang/{language}
https://restcountries.com/v3.1/lang/cop
https://restcountries.com/v3.1/lang/spanish

### Capital city

Search by capital city
https://restcountries.com/v3.1/capital/{capital}
https://restcountries.com/v3.1/capital/tallinn

### Calling code

In version 3, calling codes are in the idd object. There is no implementation to search by calling codes in V3.

### Region

Search by region (replace X with the version you want to use)
https://restcountries.com/v3.1/region/{region}
https://restcountries.com/v3.1/region/europe

### Subregions

You can search by subregions (replace X with the version you want to use)
https://restcountries.com/v3.1/subregion/{subregion}
https://restcountries.com/v3.1/subregion/Northern Europe

### Translation

You can search by any translation name
https://restcountries.com/v3.1/translation/{translation}
https://restcountries.com/v3.1/translation/germany
https://restcountries.com/v3.1/translation/alemania
https://restcountries.com/v3.1/translation/Saksamaa

### Filter Response

You can filter the output of your request to include only the specified fields.
https://restcountries.com/v3.1/{service}?fields={field},{field},{field}
https://restcountries.com/v3.1/all?fields=name,capital,currencies
