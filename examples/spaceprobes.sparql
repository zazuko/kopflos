#Timeline of space probes
CONSTRUCT
{
  ?item a wd:Q26529 .
  ?item rdfs:label ?itemLabel .
  ?item wdt:P619 ?launchdate .
  ?item <http://schema.org/image> ?image .
}
WHERE
{
  ?item wdt:P31 wd:Q26529 .
  ?item wdt:P619 ?launchdate .
  ${typeof from !== 'undefined'? 'FILTER (?launchdate >= xsd:dateTime("'+from+'-01-01T00:00:00Z"))':''}
  ${typeof to !== 'undefined'? 'FILTER (?launchdate <= xsd:dateTime("'+to+'-01-01T00:00:00Z"))':''}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
  OPTIONAL { ?item wdt:P18 ?image }
}
