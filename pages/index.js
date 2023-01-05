import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Head from 'next/head';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import InfiniteScroll from 'react-infinite-scroll-component';
import styles from '../styles/Home.module.css';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

Modal.setAppElement('#__next');

export default function Home(props) {
  const [linkList, setLinkList] = useState([]);
  const [isError, setIsError] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [offset, setOffset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputLink, setInputLink] = useState('');

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

    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  };

  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  const submitLink = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/submitLink', {
      method: 'POST',
      body: JSON.stringify({ link: inputLink }),
    });
    if (res.ok) {
      setInputLink('');
      closeModal();
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
        <div style={{ display: 'flex' }}>
          <a href="https://newinai.substack.com/">
            <p
              style={{
                textDecoration: 'underline',
                color: 'blue',
                marginRight: 24,
              }}
            >
              Newsletter
            </p>
          </a>

          <a href="https://discord.gg/ujsecxAw">
            <p
              style={{
                textDecoration: 'underline',
                color: 'blue',
                marginRight: 24,
              }}
            >
              Discord
            </p>
          </a>

          <button
            onClick={openModal}
            style={{
              padding: 10,
              width: '100%',
              borderRadius: 5,
              border: 'none',
              background: '#000',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Submit Link
          </button>
        </div>
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

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Input Link Modal"
        preventScroll
      >
        <h2>Submit Link</h2>
        <p>
          {`Submit a link for this page. We'll review the submission and add it to
          the list accordingly.`}
        </p>

        <button
          onClick={closeModal}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            border: 'none',
            background: 'none',
            padding: 6,
            cursor: 'pointer',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#000"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#000"
            className="w-6 h-6"
            width={24}
            height={24}
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <form onSubmit={submitLink}>
          <input
            type="url"
            style={{
              padding: 10,
              width: '100%',
              marginBottom: 10,
              borderRadius: 5,
              border: '1px solid #ccc',
            }}
            placeholder="https://example.com"
            id="link"
            name="link"
            value={inputLink}
            onChange={(e) => setInputLink(e.target.value)}
          />
          <button
            type="submit"
            style={{
              padding: 10,
              width: '100%',
              borderRadius: 5,
              border: 'none',
              background: '#000',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Submit
          </button>
        </form>
      </Modal>

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
