import axios from 'axios';

const externalApi = axios.create(); 

export async function reverseGeocodeNominatim(lat, lng) {
    const { data } = await externalApi.get(
        'https://nominatim.openstreetmap.org/reverse',
        {
            params: {
                format: 'jsonv2',
                lat,
                lon: lng
            },
            headers: {
                'Accept-Language': 'vi'
            }
        }
    );

    return data?.display_name || '';
}