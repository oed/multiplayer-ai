import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import ReactList from 'react-list';
import { ethers } from 'ethers';



import blessClubLogo from '../public/icon.png'
import { useCeramicContext } from '../context'
import { authenticateCeramic } from '../utils'
import styles from '../styles/Home.module.css'

interface Blessing {
  text: String
  response: String
  author?: String
}
interface NameMap {
  [name: string]: String
}

const Home: NextPage = () => {
  const clients = useCeramicContext()
  const { ceramic, composeClient } = clients
  const [blessings, setBlessings] = useState<Blessing[]>([])
  const [blessing, setBlessing] = useState<Blessing | undefined>()
  const [cursor, setCursor] = useState<String>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [didLoad, setDidLoad] = useState<boolean>(false)
  const [nameMap, setNameMap] = useState<NameMap>({})

  const handleLogin = async () => {
    setLoading(true)
    await authenticateCeramic(ceramic, composeClient)
    setLoading(false)
  }


  const getBlessings = async () => {
    setLoading(true)
    const { data: { sharedMessageIndex: { 
      pageInfo: { hasPreviousPage },
      edges: rawBlessings
    }}} = await composeClient.executeQuery(`
    query{
      sharedMessageIndex(last:10${cursor ? `, before: "${cursor}"` : ''}){
        edges{
          cursor
          node {
            text
            response
            author {id}
          }
        }
        pageInfo {
          hasPreviousPage
        }
      }
    }
    `) as any;

    if (rawBlessings.length) {
      setCursor(rawBlessings[0].cursor)
    } else {
//      setCursor('')
    }
    
    const toAddress = did => did.slice(17)
    const format = ({ node }) => ({
      text: node.text,
      response: node.response,
      author: toAddress(node.author.id)
    })
    // const bls = rawBlessings.reverse().map(format) 
    const bls = blessings.concat(rawBlessings.reverse().map(format))
    await setBlessings(bls)
    setLoading(false);
  }

  useEffect(() => {
    fillENSNames(blessings)
    const interval = setInterval(() => {
      getBlessings()
    }, 1000);

    return () => clearInterval(interval);
  }, [blessings])

  useEffect(() => {
    if (!didLoad) {
      setDidLoad(true)
      getBlessings()
    }
  }, [didLoad])

  const ensMap = {}
  const fillENSNames = async (bls) => {
    const prov = new ethers.providers.Web3Provider(window.ethereum);

    bls.map(b => {
      const loadData = address => {
        if (address.indexOf('.eth') !== -1) return
        if (ensMap[address]) return
        const promise = prov.lookupAddress(address)
        ensMap[address] = { promise }
      }
      loadData(b.author)
    })
    await Promise.all(Object.entries(ensMap).map(async ([key, value ]) => {
      // @ts-ignore
      if (value.promise) {
        // @ts-ignore
        ensMap[key] = await value.promise || key
        delete ensMap[key].promise
      }
    }))
    setNameMap(ensMap)
  }
  
  const toDID = async (input: string) => {
    const prov = new ethers.providers.Web3Provider(window.ethereum);
    if (input.startsWith('0x')) {
      return 'did:pkh:eip155:1:' + input.toLowerCase()
    } else if (input.indexOf('.eth') !== -1) {
      const address = await prov.resolveName(input)
      if (!address) {
        throw new Error('Incorrect ENS name or address')
      }
      return 'did:pkh:eip155:1:' + address.toLowerCase()
    }
    throw new Error('Incorrect ENS name or address')
  }

  const createBlessing = async () => {
    setLoading(true);
    if (ceramic.did !== undefined) {
      const text = blessing?.text
      // TODO - create the response and add here.
      const response = "This is a fkae response"
      const update = await composeClient.executeQuery(`
        mutation {
          createSharedMessage(input: {
            content: {
              response: "${response}"
              text: "${text}"
            }
          })
          {
            document {
              text
              response
              author { id }
            }
          }
        }
      `);
      blessings.unshift({ 
        text: text as String,
        response: response as String,
        author: ceramic.did.parent.split('did:pkh:eip155:1:')[1]
      })
      setBlessings(blessings)
      setLoading(false);
    }
      // @ts-ignore
    document.getElementById('ensInput').value = ''
      // @ts-ignore
    document.getElementById('textInput').value = ''
  }
  
  /**
   * On load check if there is a DID-Session in local storage.
   * If there is a DID-Session we can immediately authenticate the user.
   * For more details on how we do this check the 'authenticateCeramic function in`../utils`.
   */
  useEffect(() => {
    if(localStorage.getItem('did')) {
      handleLogin()
    }
  }, [ ])

  const renderBlessing = (blessing) => {
    const toName = addrOrName => addrOrName.startsWith('0x') ? nameMap[addrOrName] || addrOrName : addrOrName
    const { author, response, text } = blessing
    return (<div className={styles.item}>
        <div className={styles.itemauthor}>{toName(author)}</div>
        <div className={styles.itembless}>Said</div>
        <div className={styles.itemtext}>{text}</div>
        <hr />
        <div className={styles.itembless}>Bot said:</div>
        <div className={styles.itemtext}>{response}</div>
      </div>);
  }
  return (
    <div className={styles.container}>
      <Head>
        <title>Multiplayer AI</title>
        <meta name="description" content="Chat together"/>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="bless.club" />
        <meta property="og:url" content="https://bless.club" />
        <meta
          property="og:image"
          content="https://bless.club/_next/static/media/icon.12ee4f02.png"
        />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Image
              src={blessClubLogo}
              width="40"
              height="40"
            />
          </div>
          <span className={styles.title}>Multiplayer AI</span>
        </div>
        {blessings.map(renderBlessing)}
        {Boolean(cursor) ? 
          <button onClick={() => {
            getBlessings();
          }}>
            Load more!
          </button>
         : null}
      </main>
      <footer className={styles.footer}>
        {blessing === undefined && ceramic.did === undefined ? (
          <button
            onClick={() => {
              handleLogin();
            }}
          >
            Connect
          </button>
        ) : (
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>Message</label>
              <textarea
                id="textInput"
                placeholder="Type your message here..."
                onChange={(e) => {
                  // @ts-ignore
                  setBlessing({ ...blessing, text: e.target.value });
                }}
              />
            </div>
            <div className={styles.buttonContainer}>
              <button
              onClick={() => {
                createBlessing();
              }}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

export default Home
