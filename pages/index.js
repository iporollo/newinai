import { useState, useEffect } from 'react';
import Head from 'next/head';
import fetch from 'node-fetch';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import { getLinkPreview } from 'link-preview-js';
import styles from '../styles/Home.module.css';
import InfiniteScroll from 'react-infinite-scroll-component';

const PAGE_SIZE = 5;

const fetchAirtableData = async (offset) => {
  const resultingLinks = [];
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${
        process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
      }/Link%20Aggregator?pageSize=${PAGE_SIZE}&view=Link%20Aggregation%20List${
        offset ? `&offset=${offset}` : ''
      }`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIRTABLE_API_KEY}`,
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

export default function Home({ linkData }) {
  const [links, setLinks] = useState([]);

  // Set up user data
  useEffect(() => {
    if (linkData) {
      // Error check
      if (linkData.error) {
        // Handle error
      } else {
        setLinks(linkData.links);
      }
    }
  }, [linkData]);

  if (linkData.error) {
    return <div>{`Error: Couldn't load links`}</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{"What's New In AI"}</title>
      </Head>

      <div className={styles.header}>
        <h2>{"What's New In AI"}</h2>
        <a href="https://newinai.substack.com/">
          <p style={{ textDecoration: 'underline', color: 'blue' }}>
            Newsletter
          </p>
        </a>
      </div>

      <main className={styles.main}>
        <ul
          className="link-list"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            textAlign: 'center',
            maxWidth: 570,
          }}
        >
          <InfiniteScroll
            dataLength={links.length}
            next={(offset = linkData.offset || null) => {
              return fetchAirtableData(offset);
            }}
            hasMore={true}
            loader={<h4>Loading...</h4>}
          >
            {links.length > 0 &&
              links.map((link, i) => {
                if (link.link.includes('twitter.com')) {
                  return (
                    <div style={{ margin: 10 }} key={i}>
                      <TwitterTweetEmbed
                        tweetId={link.link.split('/').pop().split('?')[0]}
                        placeholder={<h1>Loading ...</h1>}
                      />
                    </div>
                  );
                }
                return (
                  <li className="link" key={i}>
                    <a href={link.link} target="_blank" rel="noreferrer">
                      <div className="card">
                        {link.image && (
                          <img src={link.image} alt={link.description} />
                        )}
                        <div>
                          <h2>{link.title}</h2>
                          <p>{link.description}</p>
                        </div>
                      </div>
                    </a>
                  </li>
                );
              })}
          </InfiniteScroll>
        </ul>
      </main>

      <footer className={styles.footer}>
        Built with ❤️ by
        <a
          href={'https://twitter.com/iporollo'}
          style={{ color: 'blue', paddingLeft: 5 }}
          target="_blank"
          rel="noreferrer"
        >
          @iporollo
        </a>
      </footer>
    </div>
  );
}

export const getServerSideProps = async () => {
  const linkData = await fetchAirtableData();
  return {
    props: { linkData },
  };
};
