const url = 'https://hmnbcfmpvkzbpjtrmmwt.supabase.co/rest/v1/materials?select=*';
const key = 'sb_publishable_AZqf0D2FtL6uPExMNblzkw_RTI-A1wP';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
}).then(res => res.text()).then(text => console.log('RESPONSE:', text)).catch(err => console.error(err));
