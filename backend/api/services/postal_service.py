import requests
import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class PostalLookupService:
    """
    Service to handle global postal code lookups using multiple providers.
    Supports Geoapify and Zippopotamus.
    """

    GEOAPIFY_API_KEY = getattr(settings, 'GEOAPIFY_API_KEY', None)
    CACHE_TIMEOUT = 86400  # 24 hours

    @classmethod
    def lookup(cls, country_code, postal_code):
        """
        Main entry point for postal lookup.
        """
        country_code = country_code.lower().strip()
        postal_code = postal_code.upper().strip()

        # 1. Check Cache
        cache_key = f"postal_lookup_{country_code}_{postal_code}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"Cache hit for {country_code}/{postal_code}")
            return cached_data

        # 2. Try Geoapify if key is available
        if cls.GEOAPIFY_API_KEY:
            result = cls._lookup_geoapify(country_code, postal_code)
            if result:
                cache.set(cache_key, result, cls.CACHE_TIMEOUT)
                return result

        # 3. Fallback to Zippopotamus
        result = cls._lookup_zippopotamus(country_code, postal_code)
        if result:
            cache.set(cache_key, result, cls.CACHE_TIMEOUT)
            return result

        return None

    @classmethod
    def _lookup_geoapify(cls, country_code, postal_code):
        """
        Lookup via Geoapify Geocoding API.
        """
        # Note: Geoapify needs full country name for better accuracy, 
        # but supports ISO codes in some contexts.
        url = "https://api.geoapify.com/v1/geocode/search"
        params = {
            "postcode": postal_code,
            "filter": f"countrycode:{country_code}",
            "apiKey": cls.GEOAPIFY_API_KEY,
            "format": "json"
        }

        try:
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('results'):
                    res = data['results'][0]
                    return {
                        "city": res.get('city') or res.get('town') or res.get('suburb'),
                        "state": res.get('state') or res.get('province'),
                        "country": res.get('country'),
                        "country_code": res.get('country_code'),
                        "postcode": res.get('postcode'),
                        "lat": res.get('lat'),
                        "lon": res.get('lon'),
                        "formatted": res.get('formatted'),
                        "provider": "geoapify"
                    }
        except Exception as e:
            logger.error(f"Geoapify lookup failed: {e}")
        
        return None

    @classmethod
    def _lookup_zippopotamus(cls, country_code, postal_code):
        """
        Lookup via Zippopotamus (Fallback).
        """
        url = f"https://api.zippopotam.us/{country_code}/{postal_code}"
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('places'):
                    place = data['places'][0]
                    return {
                        "city": place.get('place name'),
                        "state": place.get('state'),
                        "country": data.get('country'),
                        "country_code": data.get('country abbreviation'),
                        "postcode": data.get('post code'),
                        "lat": place.get('latitude'),
                        "lon": place.get('longitude'),
                        "formatted": f"{place.get('place name')}, {place.get('state')}, {data.get('country')}",
                        "provider": "zippopotamus"
                    }
        except Exception as e:
            logger.error(f"Zippopotamus lookup failed: {e}")
        
        return None
