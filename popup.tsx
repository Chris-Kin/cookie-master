import AddImg from "data-base64:~assets/add.svg"
import CheckImg from "data-base64:~assets/check.svg"
import CopyImg from "data-base64:~assets/copy.svg"
import DeleteImg from "data-base64:~assets/delete.svg"
import EmptyImg from "data-base64:~assets/empty.svg"
import HelpImg from "data-base64:~assets/help.svg"
import ImportImg from "data-base64:~assets/import.svg"
import UncheckImg from "data-base64:~assets/uncheck.svg"
import { useCallback, useEffect, useRef, useState } from "react"

import "./popup.css"

import {
  copy,
  generateURL,
  getCookies,
  Loading,
  Message,
  removeCookiesAsync,
  setCookiesAsync
} from "./util/shared.js"

function IndexPopup() {
  const [cookieList, setCookieList] = useState([])
  const cookieNameRef = useRef(null)
  const [isAdding, setIsAdding] = useState(false)
  const [addingCookie, setAddingCookie] = useState({
    name: "",
    value: ""
  })

  const [canAddingCookieSubmit, setCanAddingCookieSubmit] = useState(false)
  useEffect(() => {
    setCanAddingCookieSubmit(Boolean(addingCookie.name && addingCookie.value))
  }, [addingCookie.name, addingCookie.value])

  useEffect(() => {
    getCookies().then((c) => setCookieList(c))
  }, [])

  useEffect(() => {
    if (isAdding === false) {
      setAddingCookie({
        name: "",
        value: ""
      })
    } else {
      setTimeout(() => {
        cookieNameRef.current.focus()
      }, 0)
    }
    // /** enter keyboard listenr */
    // document.addEventListener("keydown", keydownListener, false)
    // return () => {
    //   document.removeEventListener("keydown", keydownListener)
    // }
  }, [isAdding])

  const keydownListener = (e) => {
    if (e.key === "Enter" && isAdding) {
      onAdd()
    }
  }

  const onImport = async () => {
    const loading = Loading()
    const input = document.createElement("input")
    input.style.height = "0px"
    input.style.border = "none"
    input.style.position = "absolute"
    document.body.appendChild(input)
    input.focus()
    document.execCommand("paste")
    try {
      let cookieFromClipBoard = []
      try {
        // json array format
        if (/^\[\{.*\}\]$/.test(input.value)) {
          cookieFromClipBoard = JSON.parse(input.value)
        } else {
          const itemStrArray = input.value.split(/\s*;\s*/)
          itemStrArray.forEach((item) => {
            const [name, value] = item.split("=")
            if (name && value) {
              cookieFromClipBoard.push({
                name: name,
                value: value
              })
            }
          })
        }
      } catch {
        // cookieFromClipBoard = []
      }

      if (!Array.isArray(cookieFromClipBoard) || !cookieFromClipBoard.length) {
        Message({
          type: "warn",
          text: "please paste a cookie array or format like 'foo=bar; bez=qez'"
        })
        return
      }
      await Promise.all(
        cookieFromClipBoard.map((el) => {
          return setCookiesAsync(el, true)
        })
      )
      Message({ type: "success", text: "data imported successfully" })
    } catch (err) {
      Message({ type: "error", text: "some cookie set error" })
    } finally {
      getCookies().then((c) => setCookieList(c))
      ;(loading as any).close()
      document.body.removeChild(input)
    }
  }

  const onCopy = () => {
    copy(JSON.stringify(cookieList))
    Message({ type: "success", text: "cookies have been copied" })
  }

  const onSingleCopy = (i) => {
    copy(JSON.stringify([cookieList[i]]))
    Message({ type: "success", text: "cookie has been copied" })
  }

  const onFlatCopy = () => {
    const text = cookieList.reduce((collect, cur) => {
      return collect + `${cur.name}=${cur.value}; `
    }, "")
    copy(text.replace(/;\s$/, ""))
    Message({ type: "success", text: "cookies has been copied in flat form" })
  }

  const onClear = () => {
    cookieList.forEach((el) => {
      const url = generateURL(el)
      removeCookiesAsync({ name: el.name, url })
    })
    setCookieList([])
    Message({ type: "success", text: `all cookies has been deleted` })
  }

  const onAdd = async () => {
    if (!canAddingCookieSubmit) {
      Message({ type: "warn", text: "please input cookie's name and value" })
      return
    }
    const tabs = await chrome.tabs.query({ currentWindow: true, active: true })
    const host = new URL(tabs?.[0].url).host
    const hostWithoutPort = host.split(":")[0]

    const cookie = {
      name: addingCookie.name,
      value: addingCookie.value,
      domain: hostWithoutPort,
      expirationDate: new Date("2048-10-24").getTime(),
      path: "/"
    }
    setCookiesAsync(cookie, true)
      .then(() => {
        Message({ type: "success", text: "success" })
        getCookies().then((c) => setCookieList(c))
        setIsAdding(false)
      })
      .catch(() => {
        Message({ type: "error", text: "failed" })
      })
  }

  const onDelete = async (i) => {
    const cookie = cookieList[i]
    const url = generateURL(cookie)
    await removeCookiesAsync({ name: cookie.name, url })
    getCookies().then((c) => setCookieList(c))
    Message({ type: "success", text: `${cookie.name} has been deleted` })
  }

  const toggleSecure = async (i) => {
    const cookie = cookieList[i]

    // fixed: can not set a secure cookie to unsecure tab, so delete it first
    if (cookie.secure) {
      const url = generateURL(cookie)
      await removeCookiesAsync({ name: cookie.name, url })
    }

    cookie.secure = !cookie.secure

    setCookiesAsync(cookie)
      .then(() => {
        Message({ type: "success", text: "success" })
      })
      .catch(() => {
        Message({ type: "error", text: "failed" })
      })
      .finally(() => {
        getCookies().then((c) => setCookieList(c))
      })
  }

  const toggleHttpOnly = async (i) => {
    const cookie = cookieList[i]
    cookie.httpOnly = !cookie.httpOnly

    setCookiesAsync(cookie)
      .then(() => {
        Message({ type: "success", text: "success" })
      })
      .catch(() => {
        Message({ type: "error", text: "failed" })
      })
      .finally(() => {
        getCookies().then((c) => setCookieList(c))
      })
  }

  const handleNameInput = (e: any) => {
    setAddingCookie({
      ...addingCookie,
      name: e.target.value
    })
  }

  const handleValueInput = (e: any) => {
    setAddingCookie({
      ...addingCookie,
      value: e.target.value
    })
  }

  if (isAdding) {
    return (
      <div id="app">
        <div className="add-box">
          <div className="add-item">
            <label>name</label>
            <input
              type="text"
              ref={cookieNameRef}
              value={addingCookie.name}
              onChange={handleNameInput}
            />
          </div>
          <div className="add-item">
            <label>value</label>
            <input
              type="text"
              value={addingCookie.value}
              onChange={handleValueInput}
            />
          </div>
          <div className="footer">
            <button onClick={() => setIsAdding(false)}>cancel</button>
            <button
              disabled={!canAddingCookieSubmit}
              className="positive"
              onClick={onAdd}>
              ok
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div id="app">
        <div className="operation">
          <a
            className="help"
            href="https://chris-kin.github.io/cookie-master-doc/"
            target="_blank"
            rel="noopener noreferrer">
            <img title="help documents" src={HelpImg} />
          </a>
          <button title="Copy all cookies" onClick={onCopy}>
            <img src={CopyImg} />
            copy
          </button>
          <button title="Copy with flat data structure" onClick={onFlatCopy}>
            <img src={CopyImg} />
            flat copy
          </button>
          <button title="Clear all cookies" onClick={onClear}>
            <img src={DeleteImg} />
            clear
          </button>
          <button
            title="Import cookies in current root domain which in standard structure"
            onClick={onImport}>
            <img src={ImportImg} />
            import
          </button>
          <button
            title="create a new cookie in current domain"
            onClick={() => setIsAdding(true)}>
            <img src={AddImg} />
            add
          </button>
        </div>
        <div className="cookie">
          <div className="cookie-item">
            <div>Name</div>
            <div>Value</div>
            <div>Domain</div>
            <div className="cookie-item-http">Http Only</div>
            <div className="cookie-item-secure">Secure</div>
          </div>
          {!cookieList.length ? (
            <img className="empty-img" src={EmptyImg} alt="" />
          ) : (
            cookieList.map((el, i) => {
              return (
                <div className="cookie-item" key={`${el.name}${el.value}`}>
                  <div title={el.name}>{el.name}</div>
                  <div title={el.value}>{el.value}</div>
                  <div>{el.domain}</div>
                  <div className="cookie-item-http">
                    {el.httpOnly ? (
                      <img
                        onClick={() => toggleHttpOnly(i)}
                        src={CheckImg}
                        alt=""
                      />
                    ) : (
                      <img
                        onClick={() => toggleHttpOnly(i)}
                        src={UncheckImg}
                        alt=""
                      />
                    )}
                  </div>
                  <div className="cookie-item-secure">
                    {el.secure ? (
                      <img
                        onClick={() => toggleSecure(i)}
                        src={CheckImg}
                        alt=""
                      />
                    ) : (
                      <img
                        onClick={() => toggleSecure(i)}
                        src={UncheckImg}
                        alt=""
                      />
                    )}
                  </div>
                  <section className="cookie-item-delete">
                    <img
                      src={CopyImg}
                      title="copy this cookie"
                      onClick={() => onSingleCopy(i)}
                    />
                    <img
                      src={DeleteImg}
                      title="delete this cookie"
                      onClick={() => onDelete(i)}
                    />
                  </section>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

export default IndexPopup
