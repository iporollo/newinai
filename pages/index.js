import { useState, useEffect } from 'react';
import Head from 'next/head';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import styles from '../styles/Home.module.css';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function Home(props) {
  const [linkList, setLinkList] = useState([]);
  const [isError, setIsError] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [offset, setOffset] = useState(null);

  useEffect(() => {
    fetchAirtableData();
  }, []);

  const fetchAirtableData = async () => {
    const res = await fetch(
      `/api/fetchLinks${offset ? `?offset=${offset}` : ''}`
    );
    const data = await res.json();
    if (data.links) {
      if (data.links.error) {
        setIsError(true);
      } else {
        setLinkList([...linkList, ...data.links]);
      }
    }
    setOffset(data.offset);
    console.log(isInitialLoad);
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  };

  if (isError) {
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

      {isInitialLoad ? (
        <div
          className="loader-container"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 40,
          }}
        >
          <div className="loader"></div>
        </div>
      ) : (
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
              loader={<h4>Loading more links...</h4>}
            >
              {linkList?.length > 0 &&
                linkList.map((link, i) => {
                  if (link.link.includes('twitter.com')) {
                    return (
                      <div style={{ margin: 10 }} key={i}>
                        <TwitterTweetEmbed
                          tweetId={link.link.split('/').pop().split('?')[0]}
                          placeholder={
                            <div className="loader-container">
                              <div className="loader"></div>
                            </div>
                          }
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
      )}

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
