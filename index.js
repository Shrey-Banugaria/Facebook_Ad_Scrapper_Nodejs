const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const express = require('express');
const PORT = process.env.PORT || 3000;

const accessToken = 'EAALPPwyxYzYBO6zZBPy1689G9sUywLHUvj5jfiDzgZBAYiYiZBicFa2kML87yzWGp1UkH0q9dLATUmVjE6G2lPuK1xuzB0sIRcO4VPet1kgmSYZCxcbZA82IcoxBZCIlxAZB1UDzfV5IDwBUhEuRelOXXLBsfQxSbCxdfZA3zNw6JS6BKu1vgA4fOHbbRy4fHLPpL2zGkPtQzUIAP7f0bn0ZAqIOgSJOeagZDZD';
const version = 'v19.0';
// const baseUrl = `https://graph.facebook.com/${version}/async`;
const baseUrl = `https://graph.facebook.com/${version}/ads_archive`;
// const baseUrl = `https://graph.facebook.com/v19.0`;
const projectName = format(new Date(), 'yyyyMMddHHmmss');

const fetchData = async (url, params, pageIds = null, pageNumber = 1) => {
  
  try {
    const response = await axios.get(url, { params });
    const data = response.data;
    console.log('Data', data);
    if (!data.data || data.data.length === 0) {
      return;
    }

    const folderPath = path.join('output', projectName, 'json');
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `ad.json`;
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    if (data.paging && data.paging.next) {
      // await fetchData(data.paging.next, params, pageIds, pageNumber + 1);
    }
    return data
  } catch (error) {
    console.error(`Error fetching data on page ${pageNumber}:`, error.response);
  }
};

let currentParameters = {};
const getFields = (adType) => {
    if (adType === 'ALL') {
      return 'id,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,beneficiary_payers,languages,page_id,page_name,target_ages,target_gender,target_locations,eu_total_reach,age_country_gender_reach_breakdown';
    } else {
      return 'id,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,bylines,currency,delivery_by_region,demographic_distribution,estimated_audience_size,impressions,languages,spend,page_id,page_name,target_ages,target_gender,target_locations';
    }
};

const addParameters = (fields = null, countries = 'ALL', startDate = '', endDate = '', pageIds = null, searchTerms = null, adType = 'ALL', ...kwargs) => {
  const params = {
    fields: fields || getFields(adType),
    ad_reached_countries: countries,
    ad_type: adType,
    search_page_ids: [],
    search_terms: { id: 1408800003074460 } ,
    ad_delivery_date_min: startDate,
    ad_delivery_date_max: endDate,
    access_token: accessToken,
    
    limit: '10',
    queryString: '1408800003074460',
    ...kwargs,
  };

  if (pageIds) params.search_page_ids = pageIds;
  else if (searchTerms) params.search_terms = searchTerms;
  else console.log('You need to specify either page IDs or search terms.');
  currentParameters = params;
  return params;
};

const startDownload = async (params) => {
  if (params.search_terms) {
    await fetchData(baseUrl, params, null, 1);
  } else if (params.search_page_ids) {
    const pageIdsList = params.search_page_ids;
    for (let i = 0; i < pageIdsList.length; i += 10) {
      const endIndex = Math.min(i + 9, pageIdsList.length - 1);
      console.log(`Fetching data starting for indexes [${i},${endIndex}]`);
      params.search_page_ids = pageIdsList.slice(i, endIndex + 1).join(',');
      await fetchData(baseUrl, params, `[${i},${endIndex}]`, 1);
    }
  }
};

const getParameters = () => {
    return currentParameters;
};
const app = express();
app.get('/', async (req, res) => {
  getParameters
  return res.status(200).json(currentParameters);

});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const clearParameters = () => {
    currentParameters = {};
};

// const currentParams = getParameters();
// clearParameters()



// Example usage
const params = addParameters(null, 'NL', '2023-01-01', null, null, 'search_terms', 'ALL');
startDownload(params);
