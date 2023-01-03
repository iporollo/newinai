// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fetch from 'node-fetch';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { link } = JSON.parse(req.body);

    const submitLink = async () => {
      try {
        const res = await fetch(
          `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Link%20Submissions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              records: [
                {
                  fields: {
                    Link: link,
                  },
                },
              ],
            }),
          }
        );
        if (res.status !== 200) {
          throw new Error('Failed to submit');
        }
        return { success: true };
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: { message: err.message } });
      }
    };

    submitLink().then((data) => {
      res.status(200).json(data);
    });
  }
}
