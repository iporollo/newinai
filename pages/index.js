import { useState, useEffect } from 'react';
import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import fetch from 'node-fetch';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import { getLinkPreview } from 'link-preview-js';
import styles from '../styles/Home.module.css';

// TODO: rework component to use link-preview-js instead of grabith
// TODO: use react-infinite-scroll-component
// TODO: use import { useInfiniteQuery } from "react-query";

export default function Home({ linkData }) {
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
        <LinksList linkData={linkData} />
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

export const getServerSideProps = async ({ query }) => {
  let linkData = null;
  // const page = query.page || 1;
  const offset = query.offset || null;
  const pageSize = 5;
  const resultingLinks = [];

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${
        process.env.AIRTABLE_BASE_ID
      }/Link%20Aggregator?pageSize=${pageSize}&view=Link%20Aggregation%20List${
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
      const l = await getLinkPreview(records[i].fields['Link']);
      console.log(l);
      // l = {
      //   title: string
      //   description: string
      //   image: string
      //   favicons: []
      // }
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
    }
    linkData = {
      links: resultingLinks,
      // curPage: page,
      // offset: airtableResult.offset || null,
    };
  } catch (err) {
    linkData = { error: { message: err.message } };
  }

  return {
    props: { linkData },
  };
};

const LinksList = ({ linkData }) => {
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

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

  // Router event handler
  useEffect(() => {
    Router.events.on('routeChangeStart', startLoading);
    Router.events.on('routeChangeComplete', stopLoading);
    return () => {
      Router.events.off('routeChangeStart', startLoading);
      Router.events.off('routeChangeComplete', stopLoading);
    };
  }, []);

  // Listen to scroll positions for loading more data on scroll
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  const handleScroll = () => {
    // To get page offset of last user
    const lastLinkLoaded = document.querySelector(
      '.link-list > .link:last-child'
    );
    if (lastLinkLoaded) {
      const lastLinkLoadedOffset =
        lastLinkLoaded.offsetTop + lastLinkLoaded.clientHeight;
      const pageOffset = window.pageYOffset + window.innerHeight;
      if (pageOffset > lastLinkLoadedOffset) {
        // Stops loading
        /* IMPORTANT: Add !loading  */
        if (linkData.offset && !loading) {
          // Trigger fetch
          const query = router.query;
          query.page = linkData.offset;
          router.push({
            pathname: router.pathname,
            query: query,
          });
        }
      }
    }
  };

  if (linkData.error) {
    return <div>{`Error: Couldn't load links`}</div>;
  }

  return (
    <div>
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
      </ul>
      {loading && (
        <h1
          style={{
            textAlign: 'center',
          }}
        >
          Loading ...
        </h1>
      )}
    </div>
  );
};
