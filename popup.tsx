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
      <div id="app" className="w-[800px] box-border p-5 pb-12">
        <div className="py-16">
          <div className="w-[200px] mx-auto mb-2 flex items-center text-base">
            <label className="w-[60px] shrink-0 h-9 flex items-center justify-center text-white px-1.5 bg-amber-400">name</label>
            <input
              className="h-9 flex-1 border-2 border-amber-400 border-l-0 outline-none px-2 text-base text-gray-800"
              type="text"
              ref={cookieNameRef}
              value={addingCookie.name}
              onChange={handleNameInput}
            />
          </div>
          <div className="w-[200px] mx-auto mb-2 flex items-center text-base">
            <label className="w-[60px] shrink-0 h-9 flex items-center justify-center text-white px-1.5 bg-amber-400">value</label>
            <input
              className="h-9 flex-1 border-2 border-amber-400 border-l-0 outline-none px-2 text-base text-gray-800"
              type="text"
              value={addingCookie.value}
              onChange={handleValueInput}
            />
          </div>
          <div className="mt-5 text-center pl-12">
            <button className="px-3 py-2 w-20 text-base text-gray-600 rounded bg-gray-100 hover:bg-gray-200 mr-2" onClick={() => setIsAdding(false)}>cancel</button>
            <button
              disabled={!canAddingCookieSubmit}
              className="px-3 py-2 w-20 text-base text-white rounded bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div id="app" className="w-[800px] box-border p-5 pb-12">
        <div className="sticky top-0 z-20 bg-white pt-2">
          <div className="flex items-center justify-between">
            <a
              className="opacity-40 hover:opacity-70"
              href="https://chris-kin.github.io/cookie-master-doc/"
              target="_blank"
              rel="noopener noreferrer">
              <img className="w-6" title="help documents" src={HelpImg} />
            </a>
            <div className="flex items-center justify-end">
              <button className="ml-2 inline-flex items-center px-2 py-1.5 text-gray-600 rounded bg-gray-100 hover:bg-gray-200" title="Copy all cookies" onClick={onCopy}>
                <img className="w-4 h-4 mr-1" src={CopyImg} />
                copy
              </button>
              <button className="ml-2 inline-flex items-center px-2 py-1.5 text-gray-600 rounded bg-gray-100 hover:bg-gray-200" title="Copy with flat data structure" onClick={onFlatCopy}>
                <img className="w-4 h-4 mr-1" src={CopyImg} />
                flat copy
              </button>
              <button className="ml-2 inline-flex items-center px-2 py-1.5 text-gray-600 rounded bg-gray-100 hover:bg-gray-200" title="Clear all cookies" onClick={onClear}>
                <img className="w-4 h-4 mr-1" src={DeleteImg} />
                clear
              </button>
              <button className="ml-2 inline-flex items-center px-2 py-1.5 text-gray-600 rounded bg-gray-100 hover:bg-gray-200" title="Import cookies in current root domain which in standard structure" onClick={onImport}>
                <img className="w-4 h-4 mr-1" src={ImportImg} />
                import
              </button>
              <button className="ml-2 inline-flex items-center px-2 py-1.5 text-gray-600 rounded bg-gray-100 hover:bg-gray-200" title="create a new cookie in current domain" onClick={() => setIsAdding(true)}>
                <img className="w-4 h-4 mr-1" src={AddImg} />
                add
              </button>
            </div>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1.5fr] sticky top-9 z-10 bg-white py-3 divide-x-2 divide-white">
            <div className="px-2 text-gray-700 font-medium">Name</div>
            <div className="px-2 text-gray-700 font-medium">Value</div>
            <div className="px-2 text-gray-700 font-medium">Domain</div>
            <div className="px-2 text-gray-700 font-medium">Http Only</div>
            <div className="px-2 text-gray-700 font-medium">Secure</div>
          </div>
          {!cookieList.length ? (
            <img className="mx-auto block w-24 mt-5" src={EmptyImg} alt="" />
          ) : (
            cookieList.map((el, i) => {
              return (
                <div className="group relative grid grid-cols-[2fr_2fr_1.5fr_1fr_1.5fr] w-full text-gray-600 my-1 min-h-12 py-2 items-center bg-neutral-50 hover:bg-neutral-100 transition-all duration-200 divide-x-2 divide-white" key={`${el.name}${el.value}`}>
                  <div className="truncate px-2" title={el.name}>{el.name}</div>
                  <div className="truncate px-2" title={el.value}>{el.value}</div>
                  <div className="truncate px-2">{el.domain}</div>
                  <div className="flex items-center justify-start px-2">
                    {el.httpOnly ? (
                      <img
                        className="w-5 cursor-pointer"
                        onClick={() => toggleHttpOnly(i)}
                        src={CheckImg}
                        alt=""
                      />
                    ) : (
                      <img
                        className="w-5 cursor-pointer"
                        onClick={() => toggleHttpOnly(i)}
                        src={UncheckImg}
                        alt=""
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-start px-2">
                    {el.secure ? (
                      <img
                        className="w-5 cursor-pointer"
                        onClick={() => toggleSecure(i)}
                        src={CheckImg}
                        alt=""
                      />
                    ) : (
                      <img
                        className="w-5 cursor-pointer"
                        onClick={() => toggleSecure(i)}
                        src={UncheckImg}
                        alt=""
                      />
                    )}
                  </div>
                  <section className="hidden absolute right-1 top-1/2 -translate-y-1/2 group-hover:flex items-center gap-1 whitespace-nowrap">
                    <img
                      className="w-5 cursor-pointer opacity-30 hover:opacity-100 mr-1"
                      src={CopyImg}
                      title="copy this cookie"
                      onClick={() => onSingleCopy(i)}
                    />
                    <img
                      className="w-5 cursor-pointer opacity-30 hover:opacity-100"
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
