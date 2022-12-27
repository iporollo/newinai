// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fetch from 'node-fetch';
import { getLinkPreview } from 'link-preview-js';

const PAGE_SIZE = 5;

export default function handler(req, res) {
  if (req.method === 'GET') {
    const fetchAirtableData = async (offset) => {
      const resultingLinks = [];
      try {
        const res = await fetch(
          `https://api.airtable.com/v0/${
            process.env.AIRTABLE_BASE_ID
          }/Link%20Aggregator?pageSize=${PAGE_SIZE}&view=Link%20Aggregation%20List${
            offset ? `&offset=${offset}` : ''
          }`,
          {
            headers: {
              Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            },
          }
        );
        if (res.status !== 200) {
          throw new Error('Failed to fetch');
        }
        const airtableResult = await res.json();

        const records = airtableResult.records;
        for (let i = 0; i < records.length; i++) {
          try {
            const l = await getLinkPreview(records[i].fields['Link']);
            // l = {
            //   title: string
            //   description: string
            //   image: string
            //   favicons: []
            // }
            // transform data
            Object.keys(l).forEach((key) => {
              if (!l[key]) {
                l[key] = null;
              }
              if (l.images && l.images.length > 0) {
                l.image = l.images[0];
              }
            });

            const result = {
              ...l,
              link: records[i].fields['Link'],
              date: records[i].fields['created_at'],
            };
            resultingLinks.push(result);
          } catch {
            // do nothing
          }
        }
        return {
          links: resultingLinks,
          offset: airtableResult?.offset ? airtableResult.offset : null,
        };
      } catch (err) {
        console.log(err);
        return { error: { message: err.message } };
      }
    };

    const { offset } = req.query;

    fetchAirtableData(offset).then((data) => {
      res.status(200).json(data);
    });
  }
}
