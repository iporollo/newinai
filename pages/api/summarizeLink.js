// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Configuration, OpenAIApi } from 'openai';
import Airtable from 'airtable';

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.AIRTABLE_API_KEY,
});

const airtableBase = Airtable.base(process.env.AIRTABLE_BASE_ID);
const linkTable = process.env.AIRTABLE_LINK_AGGRETOR_TABLE_ID;

const openaiConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(openaiConfiguration);

export default async function handler(req, res) {
  if (req.headers['x-api-key'] !== process.env.API_KEY) {
    res.status(401).json({ error: { message: 'Unauthorized' } });
    return;
  }

  if (req.method === 'POST') {
    const { link, description, airtableRecordId } = req.body;

    const createSummary = async () => {
      try {
        const res = await openai.createCompletion({
          model: 'text-davinci-003',
          prompt: `Write a title and 3 sentences about the following to include in a section of a newsletter in markdown format.\nDescription:${description}\nSection:\n##`,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 1.0,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
        const openaiResult = await res?.data;
        return openaiResult.choices[0].text;
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: { message: err.message } });
      }
    };

    const createQuestion = async () => {
      try {
        const res = await openai.createCompletion({
          model: 'text-davinci-003',
          prompt: `Given the following description, write a question for the reader to ponder on.\n\nDescription:${description}\nQuestion:`,
          temperature: 0.7,
          max_tokens: 256,
          top_p: 1.0,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
        const openaiResult = await res?.data;
        return openaiResult.choices[0].text;
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: { message: err.message } });
      }
    };

    const [summary, question] = await Promise.all([
      createSummary(),
      createQuestion(),
    ]);

    const formattedSummary = `
      
      ## ${summary}
      ${link}
      ${question}

      `;

    const updateAirtableRecord = async () => {
      return new Promise((resolve, reject) => {
        airtableBase(linkTable).update(
          [
            {
              id: airtableRecordId,
              fields: {
                'Generated Link Description': formattedSummary,
              },
            },
          ],
          function (err, records) {
            if (err) {
              console.error(err);
              reject(err);
            }
            resolve(records);
          }
        );
      });
    };

    await updateAirtableRecord();

    const data = {
      formattedSummary,
    };

    res.status(200).json(data);
  }
}
