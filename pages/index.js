import { useState, useEffect } from 'react';
import Head from 'next/head';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import styles from '../styles/Home.module.css';
import InfiniteScroll from 'react-infinite-scroll-component';
import { default as nodeFetch } from 'node-fetch';

// props
// links: array of links
// offset: string

export default function Home(props) {
  const [linkList, setLinkList] = useState(props.links);
  const [offset, setOffset] = useState(props.offset);

  const fetchAirtableData = async () => {
    const res = await fetch(
      `/api/fetchLinks${offset ? `?offset=${offset}` : ''}`
    );
    const data = await res.json();
    if (data.links) {
      setLinkList([...linkList, ...data.links]);
    }
    setOffset(data.offset);
  };

  if (props.links.error) {
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
            dataLength={linkList?.length}
            next={() => fetchAirtableData()}
            hasMore={offset ? true : false}
            loader={<h4>Loading...</h4>}
          >
            {linkList?.length > 0 &&
              linkList.map((link, i) => {
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
  const fetchInitialAirtableData = async (offset) => {
    const res = await nodeFetch(
      `${process.env.NEXT_URL}/api/fetchLinks${
        offset ? `&offset=${offset}` : ''
      }`
    );
    const data = await res.json();
    return data;
  };

  const { links, offset } = await fetchInitialAirtableData();
  return {
    props: { links, offset },
  };
};
